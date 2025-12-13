/**
 * Chat History Hooks - TanStack Query based data fetching for chatbot
 * Provides caching, automatic refetching, optimistic updates, and streaming support
 * 
 * This is the SINGLE SOURCE OF TRUTH for chat state management
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef, useState } from "react";
import chatbotApi from "../api/modules/chatbot.api";
import chatbotConfigs from "../configs/chatbot.configs";

// Query keys for cache management
const CHAT_KEYS = {
  all: ["chatHistory"],
  sessions: () => [...CHAT_KEYS.all, "sessions"],
  session: (id) => [...CHAT_KEYS.all, "session", id],
  messages: (id) => [...CHAT_KEYS.all, "messages", id],
};

const { staleTimeMs: STALE_TIME, refetchOnWindowFocus } = chatbotConfigs.cache;

/**
 * Hook to fetch all chat sessions
 * @returns {object} - Query result with sessions data
 */
export function useChatSessions() {
  return useQuery({
    queryKey: CHAT_KEYS.sessions(),
    queryFn: async () => {
      const { response, err } = await chatbotApi.getChatHistory();
      if (err) throw new Error(err.message || "Failed to fetch chat history");
      return response?.sessions || [];
    },
    staleTime: STALE_TIME,
    refetchOnWindowFocus,
  });
}

/**
 * Hook to fetch a specific chat session with messages
 * @param {string|null} chatHistoryId - The session ID to fetch
 * @returns {object} - Query result with session data
 */
export function useChatSession(chatHistoryId) {
  return useQuery({
    queryKey: CHAT_KEYS.session(chatHistoryId),
    queryFn: async () => {
      if (!chatHistoryId) return null;
      
      const { response, err } = await chatbotApi.getChatSession({ 
        chatHistoryId 
      });
      if (err) throw new Error(err.message || "Failed to fetch chat session");
      return response;
    },
    enabled: !!chatHistoryId,
    staleTime: STALE_TIME,
    refetchOnWindowFocus,
  });
}

/**
 * Hook to manage chat messages with streaming, optimistic updates, editing and deletion
 * This is the main hook for sending messages with proper state management
 * @param {string|null} chatHistoryId - Current chat session ID
 * @param {function} onChatHistoryIdChange - Callback when chat history ID changes
 * @returns {object} - Messages state and mutation functions
 */
export function useChatMessages(chatHistoryId, onChatHistoryIdChange) {
  const queryClient = useQueryClient();
  const lastSentRef = useRef(0);
  const abortControllerRef = useRef(null);
  
  // Streaming state
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState(null);
  
  // Get current messages from cache
  const messagesQuery = useQuery({
    queryKey: CHAT_KEYS.messages(chatHistoryId),
    queryFn: async () => {
      if (!chatHistoryId) return [];
      const { response, err } = await chatbotApi.getChatSession({ chatHistoryId });
      if (err) throw new Error(err.message);
      
      // Transform messages to consistent format
      return (response?.messages || []).map((msg, idx) => ({
        id: msg.id || `msg-${idx}-${Date.now()}`,
        role: msg.role === "model" ? "assistant" : msg.role,
        content: msg.content,
        mediaRecommendations: msg.mediaRecommendations || [],
        status: "sent",
        timestamp: msg.timestamp || new Date().toISOString(),
      }));
    },
    enabled: !!chatHistoryId,
    staleTime: STALE_TIME,
    refetchOnWindowFocus: false,
  });

  // Stop streaming
  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
    setStreamingMessageId(null);
    
    // Mark streaming message as sent
    const messages = queryClient.getQueryData(CHAT_KEYS.messages(chatHistoryId)) || [];
    queryClient.setQueryData(
      CHAT_KEYS.messages(chatHistoryId),
      messages.map(msg => 
        msg.status === "streaming" ? { ...msg, status: "sent" } : msg
      )
    );
  }, [chatHistoryId, queryClient]);

  // Send message with streaming
  const sendMessageStreaming = useCallback(async ({ message, conversationHistory }) => {
    // Rate limiting check
    const now = Date.now();
    if (now - lastSentRef.current < chatbotConfigs.timing.rateLimitMs) {
      throw new Error("Please wait before sending another message");
    }
    lastSentRef.current = now;
    
    // Cancel any existing stream
    stopStreaming();
    
    // Get previous messages
    const previousMessages = queryClient.getQueryData(CHAT_KEYS.messages(chatHistoryId)) || [];
    
    // Create user message
    const userMessageId = `user-${Date.now()}`;
    const userMessage = {
      id: userMessageId,
      role: "user",
      content: message,
      mediaRecommendations: [],
      status: "sent",
      timestamp: new Date().toISOString(),
    };
    
    // Create placeholder assistant message for streaming
    const assistantMessageId = `assistant-${Date.now()}`;
    const assistantMessage = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      mediaRecommendations: [],
      status: "streaming",
      timestamp: new Date().toISOString(),
    };
    
    // Add both messages to cache
    queryClient.setQueryData(
      CHAT_KEYS.messages(chatHistoryId),
      [...previousMessages, userMessage, assistantMessage]
    );
    
    setIsStreaming(true);
    setStreamingMessageId(assistantMessageId);
    
    // Create abort controller
    abortControllerRef.current = new AbortController();
    
    // Build messages array for AI SDK format
    const aiMessages = conversationHistory.map(m => ({
      role: m.role === "model" ? "assistant" : m.role,
      content: m.content,
    }));
    aiMessages.push({ role: "user", content: message });
    
    try {
      await chatbotApi.chatStream({
        messages: aiMessages,
        chatHistoryId,
        signal: abortControllerRef.current.signal,
        onChunk: (chunk, fullText) => {
          // Update assistant message content incrementally
          const currentMessages = queryClient.getQueryData(CHAT_KEYS.messages(chatHistoryId)) || [];
          queryClient.setQueryData(
            CHAT_KEYS.messages(chatHistoryId),
            currentMessages.map(msg =>
              msg.id === assistantMessageId
                ? { ...msg, content: fullText }
                : msg
            )
          );
        },
        onComplete: (finalText, data) => {
          // Mark message as sent and add any media recommendations
          const currentMessages = queryClient.getQueryData(CHAT_KEYS.messages(chatHistoryId)) || [];
          queryClient.setQueryData(
            CHAT_KEYS.messages(chatHistoryId),
            currentMessages.map(msg =>
              msg.id === assistantMessageId
                ? { 
                    ...msg, 
                    content: finalText || msg.content, 
                    status: "sent",
                    mediaRecommendations: data?.mediaRecommendations || [],
                  }
                : msg
            )
          );
          
          // Update chat history ID if returned
          if (data?.chatHistoryId && data.chatHistoryId !== chatHistoryId) {
            onChatHistoryIdChange?.(data.chatHistoryId);
          }
          
          setIsStreaming(false);
          setStreamingMessageId(null);
          abortControllerRef.current = null;
          
          // Invalidate sessions to update the list
          queryClient.invalidateQueries({ queryKey: CHAT_KEYS.sessions() });
        },
        onError: (error) => {
          // Mark assistant message as failed
          const currentMessages = queryClient.getQueryData(CHAT_KEYS.messages(chatHistoryId)) || [];
          queryClient.setQueryData(
            CHAT_KEYS.messages(chatHistoryId),
            currentMessages.map(msg =>
              msg.id === assistantMessageId
                ? { ...msg, status: "failed", error: error.message, content: msg.content || "Error occurred" }
                : msg
            )
          );
          
          setIsStreaming(false);
          setStreamingMessageId(null);
          abortControllerRef.current = null;
        },
      });
    } catch (error) {
      if (error.name !== "AbortError") {
        const currentMessages = queryClient.getQueryData(CHAT_KEYS.messages(chatHistoryId)) || [];
        queryClient.setQueryData(
          CHAT_KEYS.messages(chatHistoryId),
          currentMessages.map(msg =>
            msg.id === assistantMessageId
              ? { ...msg, status: "failed", error: error.message }
              : msg
          )
        );
      }
      setIsStreaming(false);
      setStreamingMessageId(null);
    }
  }, [chatHistoryId, queryClient, onChatHistoryIdChange, stopStreaming]);

  // Non-streaming send (fallback)
  const sendMessageMutation = useMutation({
    mutationFn: async ({ message, conversationHistory }) => {
      const { response, err } = await chatbotApi.chat({
        message,
        conversationHistory,
        chatHistoryId,
      });
      
      if (err) throw new Error(err.message || "Failed to send message");
      return response;
    },
    
    onMutate: async ({ message }) => {
      const now = Date.now();
      if (now - lastSentRef.current < chatbotConfigs.timing.rateLimitMs) {
        throw new Error("Please wait before sending another message");
      }
      lastSentRef.current = now;
      
      await queryClient.cancelQueries({ queryKey: CHAT_KEYS.messages(chatHistoryId) });
      const previousMessages = queryClient.getQueryData(CHAT_KEYS.messages(chatHistoryId)) || [];
      
      const optimisticUserMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: message,
        mediaRecommendations: [],
        status: "sending",
        timestamp: new Date().toISOString(),
      };
      
      queryClient.setQueryData(
        CHAT_KEYS.messages(chatHistoryId),
        [...previousMessages, optimisticUserMessage]
      );
      
      return { previousMessages, optimisticUserMessage };
    },
    
    onSuccess: (response, variables, context) => {
      const currentMessages = queryClient.getQueryData(CHAT_KEYS.messages(chatHistoryId)) || [];
      
      const updatedMessages = currentMessages.map(msg => 
        msg.id === context.optimisticUserMessage.id 
          ? { ...msg, status: "sent" }
          : msg
      );
      
      const assistantMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: response.message || response.text || "I couldn't generate a response.",
        mediaRecommendations: response.mediaRecommendations || [],
        status: "sent",
        timestamp: new Date().toISOString(),
      };
      
      queryClient.setQueryData(
        CHAT_KEYS.messages(chatHistoryId),
        [...updatedMessages, assistantMessage]
      );
      
      if (response.chatHistoryId && response.chatHistoryId !== chatHistoryId) {
        onChatHistoryIdChange?.(response.chatHistoryId);
        queryClient.setQueryData(
          CHAT_KEYS.messages(response.chatHistoryId),
          [...updatedMessages, assistantMessage]
        );
      }
      
      queryClient.invalidateQueries({ queryKey: CHAT_KEYS.sessions() });
    },
    
    onError: (error, variables, context) => {
      const currentMessages = queryClient.getQueryData(CHAT_KEYS.messages(chatHistoryId)) || [];
      
      queryClient.setQueryData(
        CHAT_KEYS.messages(chatHistoryId),
        currentMessages.map(msg =>
          msg.id === context?.optimisticUserMessage?.id
            ? { ...msg, status: "failed", error: error.message }
            : msg
        )
      );
    },
  });

  // Retry failed message
  const retryMessage = useCallback((messageId) => {
    const messages = queryClient.getQueryData(CHAT_KEYS.messages(chatHistoryId)) || [];
    const failedMessage = messages.find(m => m.id === messageId && m.status === "failed");
    
    if (failedMessage) {
      // Remove failed message and any following assistant response
      const messageIndex = messages.findIndex(m => m.id === messageId);
      const filteredMessages = messages.filter((m, idx) => {
        if (m.id === messageId) return false;
        // Also remove the assistant response that follows
        if (idx === messageIndex + 1 && m.role === "assistant") return false;
        return true;
      });
      
      queryClient.setQueryData(CHAT_KEYS.messages(chatHistoryId), filteredMessages);
      
      const conversationHistory = filteredMessages
        .filter(m => m.status === "sent")
        .slice(-chatbotConfigs.messages.maxHistoryMessages)
        .map(m => ({
          role: m.role === "assistant" ? "model" : m.role,
          content: m.content,
        }));
      
      // Use streaming for retry
      sendMessageStreaming({
        message: failedMessage.content,
        conversationHistory,
      });
    }
  }, [chatHistoryId, queryClient, sendMessageStreaming]);

  // Edit message
  const editMessage = useCallback((messageId, newContent) => {
    const messages = queryClient.getQueryData(CHAT_KEYS.messages(chatHistoryId)) || [];
    const messageIndex = messages.findIndex(m => m.id === messageId);
    
    if (messageIndex === -1) return;
    
    const message = messages[messageIndex];
    if (message.role !== "user") return; // Can only edit user messages
    
    // Remove the edited message and all messages after it
    const messagesBeforeEdit = messages.slice(0, messageIndex);
    queryClient.setQueryData(CHAT_KEYS.messages(chatHistoryId), messagesBeforeEdit);
    
    // Build conversation history from remaining messages
    const conversationHistory = messagesBeforeEdit
      .filter(m => m.status === "sent")
      .slice(-chatbotConfigs.messages.maxHistoryMessages)
      .map(m => ({
        role: m.role === "assistant" ? "model" : m.role,
        content: m.content,
      }));
    
    // Send the edited message with streaming
    sendMessageStreaming({
      message: newContent,
      conversationHistory,
    });
  }, [chatHistoryId, queryClient, sendMessageStreaming]);

  // Delete message (and its response)
  const deleteMessage = useCallback((messageId) => {
    const messages = queryClient.getQueryData(CHAT_KEYS.messages(chatHistoryId)) || [];
    const messageIndex = messages.findIndex(m => m.id === messageId);
    
    if (messageIndex === -1) return;
    
    const message = messages[messageIndex];
    
    // Filter out the message and optionally its response
    const filteredMessages = messages.filter((m, idx) => {
      if (m.id === messageId) return false;
      // If deleting a user message, also delete the following assistant response
      if (message.role === "user" && idx === messageIndex + 1 && m.role === "assistant") {
        return false;
      }
      return true;
    });
    
    queryClient.setQueryData(CHAT_KEYS.messages(chatHistoryId), filteredMessages);
  }, [chatHistoryId, queryClient]);

  // Set initial welcome message
  const setWelcomeMessage = useCallback((welcomeContent) => {
    const existingMessages = queryClient.getQueryData(CHAT_KEYS.messages(chatHistoryId)) || [];
    
    if (existingMessages.length === 0) {
      queryClient.setQueryData(CHAT_KEYS.messages(chatHistoryId), [{
        id: "welcome",
        role: "assistant",
        content: welcomeContent,
        mediaRecommendations: [],
        status: "sent",
        timestamp: new Date().toISOString(),
      }]);
    }
  }, [chatHistoryId, queryClient]);

  return {
    messages: messagesQuery.data || [],
    isLoadingMessages: messagesQuery.isLoading,
    isSending: sendMessageMutation.isPending || isStreaming,
    isStreaming,
    streamingMessageId,
    sendMessage: sendMessageMutation.mutate,
    sendMessageStreaming,
    sendMessageAsync: sendMessageMutation.mutateAsync,
    stopStreaming,
    retryMessage,
    editMessage,
    deleteMessage,
    setWelcomeMessage,
    sendError: sendMessageMutation.error,
  };
}

/**
 * Hook to create a new chat session
 * @returns {object} - Mutation result with create function
 */
export function useCreateChatSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { response, err } = await chatbotApi.createChatSession();
      if (err) throw new Error(err.message);
      return response;
    },
    onSuccess: (newSession) => {
      queryClient.invalidateQueries({ queryKey: CHAT_KEYS.sessions() });
      
      if (newSession?.id) {
        queryClient.setQueryData(CHAT_KEYS.session(newSession.id), newSession);
      }
    },
  });
}

/**
 * Hook to delete a chat session
 * @returns {object} - Mutation result with delete function
 */
export function useDeleteChatSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (chatHistoryId) => {
      const { response, err } = await chatbotApi.deleteChatSession({ 
        chatHistoryId 
      });
      if (err) throw new Error(err.message);
      return { chatHistoryId, response };
    },
    onMutate: async (chatHistoryId) => {
      await queryClient.cancelQueries({ queryKey: CHAT_KEYS.sessions() });
      const previousSessions = queryClient.getQueryData(CHAT_KEYS.sessions());

      queryClient.setQueryData(CHAT_KEYS.sessions(), (old) => 
        (old || []).filter((s) => s.id !== chatHistoryId)
      );

      return { previousSessions };
    },
    onError: (err, chatHistoryId, context) => {
      queryClient.setQueryData(CHAT_KEYS.sessions(), context.previousSessions);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: CHAT_KEYS.sessions() });
    },
  });
}

/**
 * Hook to clear/archive a chat session
 * @returns {object} - Mutation result with clear function
 */
export function useClearChatSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (chatHistoryId) => {
      const { response, err } = await chatbotApi.clearChatSession({ 
        chatHistoryId 
      });
      if (err) throw new Error(err.message);
      return response;
    },
    onSuccess: (newSession, oldSessionId) => {
      // Clear old session caches
      queryClient.removeQueries({ queryKey: CHAT_KEYS.session(oldSessionId) });
      queryClient.removeQueries({ queryKey: CHAT_KEYS.messages(oldSessionId) });
      
      if (newSession?.id) {
        queryClient.setQueryData(CHAT_KEYS.session(newSession.id), newSession);
      }
      
      queryClient.invalidateQueries({ queryKey: CHAT_KEYS.sessions() });
    },
  });
}

/**
 * Hook to clear local messages without affecting server
 * @returns {function} - Clear function
 */
export function useClearLocalMessages() {
  const queryClient = useQueryClient();
  
  return useCallback((chatHistoryId) => {
    queryClient.setQueryData(CHAT_KEYS.messages(chatHistoryId), []);
  }, [queryClient]);
}

/**
 * Hook to prefetch chat sessions
 * @returns {function} - Prefetch function
 */
export function usePrefetchChatSessions() {
  const queryClient = useQueryClient();

  return useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: CHAT_KEYS.sessions(),
      queryFn: async () => {
        const { response } = await chatbotApi.getChatHistory();
        return response?.sessions || [];
      },
      staleTime: STALE_TIME,
    });
  }, [queryClient]);
}

/**
 * Hook to prefetch a specific chat session
 * @returns {function} - Prefetch function that takes sessionId
 */
export function usePrefetchChatSession() {
  const queryClient = useQueryClient();

  return useCallback((chatHistoryId) => {
    if (!chatHistoryId) return;

    queryClient.prefetchQuery({
      queryKey: CHAT_KEYS.session(chatHistoryId),
      queryFn: async () => {
        const { response } = await chatbotApi.getChatSession({ chatHistoryId });
        return response;
      },
      staleTime: STALE_TIME,
    });
  }, [queryClient]);
}

/**
 * Hook to invalidate all chat history caches
 * @returns {function} - Invalidate function
 */
export function useInvalidateChatHistory() {
  const queryClient = useQueryClient();

  return useCallback(() => {
    queryClient.invalidateQueries({ queryKey: CHAT_KEYS.all });
  }, [queryClient]);
}

// Export query keys for external use
export { CHAT_KEYS };

// Named export object for convenience
const chatHistoryHooks = {
  useChatSessions,
  useChatSession,
  useChatMessages,
  useCreateChatSession,
  useDeleteChatSession,
  useClearChatSession,
  useClearLocalMessages,
  usePrefetchChatSessions,
  usePrefetchChatSession,
  useInvalidateChatHistory,
  CHAT_KEYS,
};

export default chatHistoryHooks;
