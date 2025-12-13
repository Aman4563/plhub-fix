/**
 * AI Chatbot Controller
 * Handles conversational movie/TV recommendations with Vercel AI SDK streaming
 * Supports multi-agent supervisor pattern for improved accuracy
 * 
 * FIXES APPLIED:
 * - HITL support in streaming endpoint
 * - Checkpoint cleanup scheduling
 * - Improved error handling
 */

import { 
  createChatStream, 
  generateChatResponse, 
  handleConfirmAction,
  isConfirmation,
  isCancellation,
  isRateLimitError,
  handleProviderFailure,
  getProviderInfo
} from "../agents/chatbot.agent.js";
import { confirmAction as confirmToolAction } from "../agents/chatbot.tools.js";
import { runSupervisor, classifyQuery } from "../agents/chatbot.supervisor.js";
import { getCheckpointStats, cleanupOldCheckpoints } from "../agents/checkpointer.js";
import ChatHistory from "../models/chatHistory.model.js";
import tmdbApi from "../tmdb/tmdb.api.js";
import responseHandler from "../handlers/response.handler.js";
import logger from "../config/logger.config.js";
import ChatbotLogger from "../config/chatbot.logger.js";

// Disable multi-agent supervisor for now (direct approach provides better media recommendations)
// Set USE_MULTI_AGENT=true in env to re-enable
const USE_MULTI_AGENT = process.env.USE_MULTI_AGENT === "true";

// Schedule checkpoint cleanup every hour to prevent memory leaks
const CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour
const CHECKPOINT_MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours

let cleanupIntervalId = null;

function startCheckpointCleanup() {
  if (cleanupIntervalId) return; // Already running
  
  cleanupIntervalId = setInterval(async () => {
    try {
      const stats = await cleanupOldCheckpoints(CHECKPOINT_MAX_AGE);
      if (stats.cleaned > 0) {
        logger.info("Checkpoint cleanup completed", stats);
      }
    } catch (error) {
      logger.warn("Checkpoint cleanup failed", { error: error.message });
    }
  }, CLEANUP_INTERVAL);
  
  logger.info("Checkpoint cleanup scheduler started", { 
    intervalMs: CLEANUP_INTERVAL, 
    maxAgeMs: CHECKPOINT_MAX_AGE 
  });
}

// Start cleanup on module load
startCheckpointCleanup();

/**
 * Main streaming chat endpoint - uses Vercel AI SDK data stream
 * Compatible with useChat hook on frontend
 * Now with HITL support for pending actions
 */
const chatStream = async (req, res) => {
  try {
    const { messages, chatHistoryId, sessionId } = req.body;
    const userId = req.user ? (req.user._id?.toString() || req.user.id) : null;

    logger.info("Streaming chat request received", { 
      hasUser: !!req.user, 
      userId,
      messageCount: messages?.length,
      chatHistoryId,
    });

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Messages array is required" });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "AI service not configured" });
    }

    // Get the last user message for HITL checking
    const lastUserMessage = messages.filter(m => m.role === "user").pop();
    const lastMessageContent = lastUserMessage?.content || "";

    // Check for pending action in chat history (for HITL flow)
    let existingPendingAction = null;
    if (chatHistoryId) {
      try {
        const chatSession = await ChatHistory.findById(chatHistoryId);
        if (chatSession) {
          const lastAssistantMsg = [...chatSession.messages]
            .reverse()
            .find((m) => m.role === "assistant" && m.pendingAction?.type);
          
          if (lastAssistantMsg?.pendingAction && !lastAssistantMsg.pendingAction.confirmed) {
            existingPendingAction = lastAssistantMsg.pendingAction;
          }
        }
      } catch (err) {
        logger.warn("Could not check pending action in stream", { error: err.message });
      }
    }

    // Handle pending action confirmation/cancellation in streaming mode
    if (existingPendingAction) {
      if (isConfirmation(lastMessageContent)) {
        // Handle confirmation - return non-streaming response
        const confirmResult = await handleConfirmAction(userId, existingPendingAction);
        
        // Update chat history
        if (chatHistoryId) {
          try {
            const session = await ChatHistory.findById(chatHistoryId);
            if (session) {
              session.addMessage({ role: "user", content: lastMessageContent });
              session.addMessage({ role: "assistant", content: confirmResult.message });
              const lastWithPending = [...session.messages].reverse().find(m => m.pendingAction?.type);
              if (lastWithPending) lastWithPending.pendingAction.confirmed = true;
              await session.save();
            }
          } catch (err) {
            logger.warn("Could not update history after confirmation", { error: err.message });
          }
        }

        // Return JSON response for confirmation (can't stream a single message)
        return res.json({
          role: "assistant",
          content: confirmResult.message,
          hitlCompleted: true,
        });
      }

      if (isCancellation(lastMessageContent)) {
        const cancelMessage = `No problem! I've cancelled the ${existingPendingAction.type?.replace(/_/g, " ") || "pending"} action. Is there anything else I can help you with?`;
        
        // Update chat history
        if (chatHistoryId) {
          try {
            const session = await ChatHistory.findById(chatHistoryId);
            if (session) {
              session.addMessage({ role: "user", content: lastMessageContent });
              session.addMessage({ role: "assistant", content: cancelMessage });
              await session.save();
            }
          } catch (err) {
            logger.warn("Could not update history after cancellation", { error: err.message });
          }
        }

        return res.json({
          role: "assistant",
          content: cancelMessage,
          hitlCancelled: true,
        });
      }
    }

    // Helper function to create stream with fallback - returns stream result or throws
    const createStreamWithFallback = async (retryCount = 0, disableTools = false) => {
      const providerInfo = getProviderInfo();
      logger.info("createStreamWithFallback called", { 
        retryCount, 
        disableTools,
        currentProvider: providerInfo.current 
      });
      
      try {
        logger.info("Calling createChatStream...");
        const result = await createChatStream(messages, userId, retryCount, disableTools);
        logger.info("createChatStream returned, getting reader...");
        
        // Test the stream by getting an iterator
        const reader = result.textStream.getReader();
        logger.info("Got reader, attempting first read...");
        
        // Try to read the first chunk to verify the stream works
        const firstRead = await reader.read();
        logger.info("First read completed", { 
          done: firstRead.done, 
          hasValue: !!firstRead.value,
          valueLength: firstRead.value?.length || 0,
          valuePreview: firstRead.value?.substring?.(0, 50)
        });
        
        // Check for Groq tool error in the response
        if (firstRead.value && typeof firstRead.value === 'string') {
          const isToolError = firstRead.value.includes("Failed to call a function") || 
                             firstRead.value.includes("failed_generation") ||
                             firstRead.value.includes("invalid_request_error");
          
          if (isToolError && !disableTools && providerInfo.current?.startsWith("groq")) {
            logger.warn("Groq tool error detected, retrying without tools");
            // Retry same provider but without tools
            return createStreamWithFallback(retryCount, true);
          }
        }
        
        // IMPORTANT: Vercel AI SDK may silently fail with empty stream on rate limit or tool errors
        // If first read is done with no value, this is likely an error
        if (firstRead.done && !firstRead.value) {
          logger.warn("Empty stream detected", { 
            currentProvider: providerInfo.current,
            disableTools,
            retryCount
          });
          
          // For Groq: if tools were enabled and we got empty stream, try without tools first
          if (!disableTools && providerInfo.current?.startsWith("groq")) {
            logger.info("Groq returned empty stream with tools enabled - retrying without tools");
            return createStreamWithFallback(retryCount, true);
          }
          
          // Create a synthetic error to trigger fallback to next provider
          const emptyStreamError = new Error("Stream completed with no content - possible rate limit");
          emptyStreamError.statusCode = 429;
          emptyStreamError.isEmptyStream = true;
          
          if (retryCount < 2 && handleProviderFailure(emptyStreamError)) {
            logger.info(`Retrying with fallback provider after empty stream (attempt ${retryCount + 1})`);
            return createStreamWithFallback(retryCount + 1, false);
          }
          
          // No fallback available, throw the error
          throw emptyStreamError;
        }
        
        // Create a new stream that includes the first chunk
        const chunks = [];
        if (!firstRead.done && firstRead.value) {
          chunks.push(firstRead.value);
        }
        
        // Return everything needed to continue streaming
        return { reader, firstChunk: chunks[0] || null, done: firstRead.done };
      } catch (streamError) {
        logger.error("Stream creation error:", { 
          error: streamError.message,
          errorName: streamError.name,
          errorCode: streamError.statusCode || streamError.code,
          isRateLimit: isRateLimitError(streamError),
          retryCount,
          disableTools
        });
        
        // Check if this is a Groq tool error - retry without tools
        const isGroqToolError = streamError.message?.includes("Failed to call a function") ||
                               streamError.message?.includes("failed_generation");
        
        if (isGroqToolError && !disableTools && providerInfo.current?.startsWith("groq")) {
          logger.warn("Groq tool error in exception, retrying without tools");
          return createStreamWithFallback(retryCount, true);
        }
        
        // Check if we can fallback to another provider
        if (retryCount < 2 && (isRateLimitError(streamError) || streamError.isEmptyStream)) {
          const canFallback = handleProviderFailure(streamError);
          logger.info("Error detected, fallback check:", { canFallback, isEmptyStream: streamError.isEmptyStream });
          
          if (canFallback) {
            logger.info(`Retrying stream creation with fallback provider (attempt ${retryCount + 1})`);
            return createStreamWithFallback(retryCount + 1, false);
          }
        }
        
        throw streamError;
      }
    };

    // Create stream with fallback support (errors are caught before streaming starts)
    const { reader, firstChunk, done: initialDone } = await createStreamWithFallback();

    // Now we know the provider works - set headers and start streaming
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Transfer-Encoding", "chunked");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    let fullText = "";
    
    try {
      // Send the first chunk if we have one
      if (firstChunk) {
        fullText += firstChunk;
        res.write(`0:${JSON.stringify(firstChunk)}\n`);
      }

      // Continue streaming remaining chunks
      if (!initialDone) {
        let readResult;
        while (!(readResult = await reader.read()).done) {
          const chunk = readResult.value;
          if (chunk) {
            fullText += chunk;
            res.write(`0:${JSON.stringify(chunk)}\n`);
          }
        }
      }
      
      // Signal completion
      res.write(`d:{"finishReason":"stop"}\n`);
      res.end();
      
      // Save to chat history after streaming completes
      if (chatHistoryId && fullText) {
        try {
          const session = await ChatHistory.findById(chatHistoryId);
          if (session) {
            const lastUserMsg = messages.filter(m => m.role === "user").pop();
            if (lastUserMsg) {
              session.addMessage({ role: "user", content: lastUserMsg.content });
            }
            session.addMessage({ role: "assistant", content: fullText });
            await session.save();
          }
        } catch (historyErr) {
          logger.warn("Could not save streaming chat to history", { error: historyErr.message });
        }
      }
    } catch (streamError) {
      logger.error("Stream processing error (mid-stream):", { error: streamError.message });
      if (!res.writableEnded) {
        res.write(`3:${JSON.stringify(streamError.message)}\n`);
        res.end();
      }
    }
  } catch (error) {
    logger.error("Streaming chat error:", { error: error.message, stack: error.stack });
    
    if (!res.headersSent) {
      if (error.message?.includes("API key")) {
        return res.status(500).json({ error: "AI service configuration error" });
      }
      if (error.message?.includes("quota") || error.message?.includes("429")) {
        return res.status(503).json({ error: "AI service is temporarily unavailable" });
      }
      res.status(500).json({ error: "Failed to process your request" });
    }
  }
};

/**
 * Non-streaming chat endpoint - for backwards compatibility and history persistence
 */
const chat = async (req, res) => {
  // Start chatbot logging session
  const logSessionId = ChatbotLogger.startSession(
    req.user?.id || null,
    req.body?.message
  );
  const requestStartTime = Date.now();

  try {
    const { message, conversationHistory = [], sessionId, chatHistoryId } = req.body;
    const userId = req.user ? (req.user._id?.toString() || req.user.id) : null;
    
    logger.info("Chat request received", { 
      hasUser: !!req.user, 
      userId,
      hasToken: !!req.headers.authorization || !!req.cookies?.accessToken 
    });

    // Log query to chatbot logger
    ChatbotLogger.logQuery(logSessionId, message, userId);

    if (!message || typeof message !== "string") {
      ChatbotLogger.logError(logSessionId, new Error("Message is required"), { type: "validation" });
      ChatbotLogger.endSession(logSessionId);
      return responseHandler.badrequest(res, "Message is required");
    }

    if (!process.env.GEMINI_API_KEY) {
      ChatbotLogger.logError(logSessionId, new Error("AI service not configured"), { type: "config" });
      ChatbotLogger.endSession(logSessionId);
      return responseHandler.error(res, "AI service not configured");
    }

    // Find or create chat history for persistence
    let chatSession = null;
    let existingPendingAction = null;

    try {
      if (chatHistoryId) {
        chatSession = await ChatHistory.findById(chatHistoryId);
      }

      if (!chatSession) {
        chatSession = await ChatHistory.findOrCreateSession(userId, sessionId);
      }

      // Check for pending action in the last message
      const lastAssistantMsg = [...chatSession.messages]
        .reverse()
        .find((m) => m.role === "assistant" && m.pendingAction?.type);
      
      if (lastAssistantMsg?.pendingAction && !lastAssistantMsg.pendingAction.confirmed) {
        existingPendingAction = lastAssistantMsg.pendingAction;
      }
    } catch (historyError) {
      logger.warn("Could not load chat history:", historyError.message);
    }

    // Handle pending action confirmation/cancellation
    if (existingPendingAction) {
      if (isConfirmation(message)) {
        const confirmResult = await handleConfirmAction(userId, existingPendingAction);
        
        if (chatSession) {
          chatSession.addMessage({ role: "user", content: message });
          chatSession.addMessage({ 
            role: "assistant", 
            content: confirmResult.message 
          });
          
          // Mark pending action as confirmed
          const lastMsgWithPending = [...chatSession.messages]
            .reverse()
            .find((m) => m.pendingAction?.type);
          if (lastMsgWithPending) {
            lastMsgWithPending.pendingAction.confirmed = true;
          }
          
          await chatSession.save();
        }

        return responseHandler.ok(res, {
          message: confirmResult.message,
          mediaRecommendations: [],
          toolsUsed: ["confirm_action"],
          pendingAction: null,
          chatHistoryId: chatSession?._id?.toString(),
        });
      }

      if (isCancellation(message)) {
        const cancelMessage = `No problem! I've cancelled the ${existingPendingAction.type || "pending"} action. Is there anything else I can help you with?`;
        
        if (chatSession) {
          chatSession.addMessage({ role: "user", content: message });
          chatSession.addMessage({ role: "assistant", content: cancelMessage });
          await chatSession.save();
        }

        return responseHandler.ok(res, {
          message: cancelMessage,
          mediaRecommendations: [],
          pendingAction: null,
          chatHistoryId: chatSession?._id?.toString(),
        });
      }
    }

    // Add user message to history
    if (chatSession) {
      chatSession.addMessage({
        role: "user",
        content: message,
      });
    }

    // Build messages array for AI SDK
    const recentHistory = chatSession
      ? chatSession.getRecentMessages(20)
      : conversationHistory.slice(-20);

    const messages = recentHistory.map(msg => ({
      role: msg.role === "assistant" ? "assistant" : "user",
      content: msg.content,
    }));

    // Add current message
    messages.push({ role: "user", content: message });

    // Generate response using multi-agent supervisor or direct approach
    let result;
    const agentStartTime = Date.now();
    
    if (USE_MULTI_AGENT) {
      // Use multi-agent supervisor for intelligent routing
      logger.info("Using multi-agent supervisor pattern");
      
      try {
        const routingStartTime = Date.now();
        const agentType = await classifyQuery(message);
        const routingDuration = Date.now() - routingStartTime;
        
        // Log routing decision
        ChatbotLogger.logRouting(logSessionId, message, agentType, routingDuration);
        logger.info("Query classified", { agentType, query: message.substring(0, 50) });
        
        // Log agent start
        ChatbotLogger.logAgentStart(logSessionId, agentType, message);
        
        const supervisorResult = await runSupervisor(
          message, 
          userId, 
          recentHistory,
          chatSession?._id?.toString(), // Pass chatHistoryId for checkpointing
          logSessionId // Pass log session for tool logging
        );
        
        result = {
          text: supervisorResult.message,
          mediaRecommendations: [], // Multi-agent doesn't extract media yet
          pendingAction: null,
          toolCalls: [],
        };
        
        const agentDuration = Date.now() - agentStartTime;
        
        // Log agent response
        ChatbotLogger.logAgentResponse(
          logSessionId, 
          supervisorResult.agentUsed || agentType, 
          result.text, 
          agentDuration
        );
        
        // Log checkpoint if saved
        if (supervisorResult.threadId) {
          ChatbotLogger.logCheckpoint(logSessionId, supervisorResult.threadId);
        }
        
        logger.info("Supervisor response generated", { 
          agentUsed: supervisorResult.agentUsed,
          threadId: supervisorResult.threadId,
          duration: agentDuration,
        });
      } catch (supervisorError) {
        logger.warn("Supervisor failed, falling back to direct approach", { 
          error: supervisorError.message 
        });
        ChatbotLogger.logError(logSessionId, supervisorError, { context: "supervisor_fallback" });
        
        // Fallback to direct approach if supervisor fails
        ChatbotLogger.logAgentStart(logSessionId, "direct_agent", message);
        result = await generateChatResponse(messages, userId);
        
        const agentDuration = Date.now() - agentStartTime;
        ChatbotLogger.logAgentResponse(logSessionId, "direct_agent", result.text, agentDuration);
      }
    } else {
      // Direct approach with all tools (non-streaming)
      ChatbotLogger.logAgentStart(logSessionId, "direct_agent", message);
      result = await generateChatResponse(messages, userId);
      
      const agentDuration = Date.now() - agentStartTime;
      ChatbotLogger.logAgentResponse(logSessionId, "direct_agent", result.text, agentDuration);
    }

    // Add assistant response to history (only if content exists)
    if (chatSession && result.text) {
      chatSession.addMessage({
        role: "assistant",
        content: result.text,
        mediaRecommendations: result.mediaRecommendations,
        pendingAction: result.pendingAction,
        toolCalls: result.toolCalls?.map((tc) => ({ name: tc.toolName })),
      });

      // Generate title from first user message
      if (chatSession.title === "New Conversation" && chatSession.messages.length <= 2) {
        chatSession.title = generateTitle(message);
      }

      await chatSession.save();
    } else if (chatSession && !result.text) {
      // Try to save with fallback message if text is empty
      logger.warn("AI returned empty response - using fallback");
      const fallbackMessage = "I processed your request but couldn't generate a proper response. Please try again.";
      chatSession.addMessage({
        role: "assistant",
        content: fallbackMessage,
      });
      await chatSession.save();
    }

    // End logging session and get stats
    const sessionStats = ChatbotLogger.endSession(logSessionId);
    const totalDuration = Date.now() - requestStartTime;

    logger.info("Chat request completed", {
      totalDuration,
      apiCalls: sessionStats?.apiCalls,
      cacheHits: sessionStats?.cacheHits,
      hasResponse: !!result.text,
      toolsUsed: result.toolCalls?.length || 0,
    });

    // Ensure we always have a message to return
    const responseMessage = result.text || "I processed your request but couldn't generate a proper response. Please try again.";

    responseHandler.ok(res, {
      message: responseMessage,
      mediaRecommendations: result.mediaRecommendations || [],
      toolsUsed: result.toolCalls?.map((tc) => tc.toolName) || [],
      pendingAction: result.pendingAction,
      chatHistoryId: chatSession?._id?.toString(),
    });
  } catch (error) {
    logger.error("Chatbot error:", { error: error.message, stack: error.stack });
    ChatbotLogger.logError(logSessionId, error, { context: "chat_endpoint" });
    ChatbotLogger.endSession(logSessionId);

    if (error.message?.includes("API key")) {
      return responseHandler.error(res, "AI service configuration error");
    }

    if (error.message?.includes("quota") || error.message?.includes("429")) {
      return responseHandler.error(res, "AI service is temporarily unavailable. Please try again later.");
    }

    responseHandler.error(res, "Failed to process your request. Please try again.");
  }
};

/**
 * Generate a title from the first message
 */
const generateTitle = (message) => {
  let title = message.trim().substring(0, 50);
  if (message.length > 50) title += "...";
  return title;
};

/**
 * Get user's chat history
 */
const getChatHistory = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { sessionId } = req.query;

    if (!userId && !sessionId) {
      return responseHandler.badrequest(res, "User ID or session ID required");
    }

    const query = userId ? { user: userId } : { sessionId };
    
    const sessions = await ChatHistory.find(query)
      .sort({ lastActivity: -1 })
      .limit(20)
      .select("_id title lastActivity metadata.totalMessages isActive")
      .lean();

    const formattedSessions = sessions.map((s) => ({
      id: s._id.toString(),
      title: s.title,
      lastActivity: s.lastActivity,
      messageCount: s.metadata?.totalMessages || 0,
      isActive: s.isActive,
    }));

    responseHandler.ok(res, { sessions: formattedSessions });
  } catch (error) {
    logger.error("Error fetching chat history:", error.message);
    responseHandler.error(res, "Failed to fetch chat history");
  }
};

/**
 * Get a specific chat session
 */
const getChatSession = async (req, res) => {
  try {
    const { chatHistoryId } = req.params;
    const userId = req.user?.id;

    if (!chatHistoryId) {
      return responseHandler.badrequest(res, "Chat history ID required");
    }

    const query = { _id: chatHistoryId };
    if (userId) {
      query.$or = [{ user: userId }, { user: null }];
    }

    const session = await ChatHistory.findOne(query).lean();

    if (!session) {
      return responseHandler.notfound(res, "Chat session not found");
    }

    const formattedSession = {
      id: session._id.toString(),
      title: session.title,
      messages: session.messages.map((m) => ({
        id: m._id?.toString(),
        role: m.role,
        content: m.content,
        mediaRecommendations: m.mediaRecommendations,
        pendingAction: m.pendingAction,
        timestamp: m.timestamp,
      })),
      lastActivity: session.lastActivity,
      isActive: session.isActive,
    };

    responseHandler.ok(res, formattedSession);
  } catch (error) {
    logger.error("Error fetching chat session:", error.message);
    responseHandler.error(res, "Failed to fetch chat session");
  }
};

/**
 * Delete a chat session
 */
const deleteChatSession = async (req, res) => {
  try {
    const { chatHistoryId } = req.params;
    const userId = req.user?.id;

    if (!chatHistoryId) {
      return responseHandler.badrequest(res, "Chat history ID required");
    }

    const query = { _id: chatHistoryId };
    if (userId) {
      query.user = userId;
    }

    const result = await ChatHistory.findOneAndDelete(query);

    if (!result) {
      return responseHandler.notfound(res, "Chat session not found");
    }

    responseHandler.ok(res, { message: "Chat session deleted" });
  } catch (error) {
    logger.error("Error deleting chat session:", error.message);
    responseHandler.error(res, "Failed to delete chat session");
  }
};

/**
 * Create a new chat session
 */
const createChatSession = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { sessionId } = req.body;

    const session = new ChatHistory({
      user: userId || null,
      sessionId: userId ? undefined : sessionId,
      messages: [],
    });

    await session.save();

    responseHandler.created(res, {
      id: session._id.toString(),
      title: session.title,
      messages: [],
    });
  } catch (error) {
    logger.error("Error creating chat session:", error.message);
    responseHandler.error(res, "Failed to create chat session");
  }
};

/**
 * Clear current chat session (start fresh)
 */
const clearChatSession = async (req, res) => {
  try {
    const { chatHistoryId } = req.params;
    const userId = req.user?.id;

    if (!chatHistoryId) {
      return responseHandler.badrequest(res, "Chat history ID required");
    }

    const query = { _id: chatHistoryId };
    if (userId) {
      query.$or = [{ user: userId }, { user: null }];
    }

    const session = await ChatHistory.findOne(query);

    if (!session) {
      return responseHandler.notfound(res, "Chat session not found");
    }

    // Mark old session as inactive
    session.isActive = false;
    await session.save();

    // Create new session
    const newSession = new ChatHistory({
      user: userId || null,
      sessionId: session.sessionId,
      messages: [],
    });

    await newSession.save();

    responseHandler.ok(res, {
      id: newSession._id.toString(),
      title: newSession.title,
      messages: [],
    });
  } catch (error) {
    logger.error("Error clearing chat session:", error.message);
    responseHandler.error(res, "Failed to clear chat session");
  }
};

/**
 * Confirm a pending action (e.g., submit a review)
 */
const confirmAction = async (req, res) => {
  try {
    const { chatHistoryId, pendingAction } = req.body;
    const userId = req.user?.id;

    if (!pendingAction) {
      return responseHandler.badrequest(res, "Pending action is required");
    }

    if (!userId) {
      return responseHandler.unauthorize(res, "Authentication required for this action");
    }

    const result = await confirmToolAction(userId, pendingAction);

    // Update chat history to mark action as confirmed
    if (chatHistoryId) {
      try {
        const session = await ChatHistory.findById(chatHistoryId);
        if (session) {
          const lastMsgWithPending = [...session.messages]
            .reverse()
            .find((m) => m.pendingAction?.type === pendingAction.type);
          
          if (lastMsgWithPending) {
            lastMsgWithPending.pendingAction.confirmed = true;
          }

          session.addMessage({
            role: "assistant",
            content: result.message,
          });

          await session.save();
        }
      } catch (historyError) {
        logger.warn("Could not update chat history after confirmation:", historyError.message);
      }
    }

    responseHandler.ok(res, result);
  } catch (error) {
    logger.error("Error confirming action:", error.message);
    responseHandler.error(res, "Failed to confirm action");
  }
};

/**
 * Get quick suggestions based on a media item
 */
const getQuickSuggestions = async (req, res) => {
  try {
    const { mediaId, mediaType, mediaTitle } = req.body;

    if (!mediaId || !mediaType || !mediaTitle) {
      return responseHandler.badrequest(res, "Media information is required");
    }

    // Fetch similar content from TMDB
    const [similar, recommendations] = await Promise.all([
      tmdbApi.mediaSimilar({ mediaType, mediaId }).catch(() => ({ results: [] })),
      tmdbApi.mediaRecommend({ mediaType, mediaId }).catch(() => ({ results: [] })),
    ]);

    const combinedResults = [
      ...(similar?.results || []),
      ...(recommendations?.results || []),
    ];

    // Remove duplicates and limit to 6
    const uniqueResults = [];
    const seenIds = new Set();

    for (const item of combinedResults) {
      if (!seenIds.has(item.id)) {
        seenIds.add(item.id);
        uniqueResults.push({
          id: item.id,
          title: item.title || item.name,
          mediaType,
          posterPath: item.poster_path,
          voteAverage: item.vote_average,
        });
      }
      if (uniqueResults.length >= 6) break;
    }

    responseHandler.ok(res, {
      basedOn: mediaTitle,
      suggestions: uniqueResults,
    });
  } catch (error) {
    logger.error("Quick suggestions error:", error);
    responseHandler.error(res, "Failed to get suggestions");
  }
};

export default {
  chat,
  chatStream,
  getChatHistory,
  getChatSession,
  deleteChatSession,
  createChatSession,
  clearChatSession,
  confirmAction,
  getQuickSuggestions,
};
