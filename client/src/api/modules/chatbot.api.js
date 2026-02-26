/**
 * AI Chatbot API Module
 * Handles communication with the AI movie/TV recommendation chatbot
 * Supports tool calling, streaming responses, and chat history persistence
 */

import publicClient from "../client/public.client";
import privateClient from "../client/private.client";

const chatbotEndpoints = {
  chat: "chatbot/chat",
  stream: "chatbot/stream",
  suggestions: "chatbot/suggestions",
  history: "chatbot/history",
  historySession: (id) => `chatbot/history/${id}`,
  clearSession: (id) => `chatbot/history/${id}/clear`,
  confirmAction: "chatbot/confirm-action",
};

// Base URL for streaming (needs direct fetch, not axios)
const getBaseUrl = () => {
  return process.env.REACT_APP_API_URL || "/api/v1";
};

/**
 * Get session ID for anonymous users
 */
const getSessionId = () => {
  let sessionId = localStorage.getItem("chatbot_session_id");
  if (!sessionId) {
    sessionId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem("chatbot_session_id", sessionId);
  }
  return sessionId;
};

const chatbotApi = {
  /**
   * Send a message to the AI chatbot (non-streaming)
   * Uses privateClient if user is authenticated, publicClient otherwise
   * @param {string} message - User's message
   * @param {Array} conversationHistory - Previous conversation messages
   * @param {string} chatHistoryId - ID of existing chat history (for persistence)
   * @returns {Promise<{response: object} | {err: object}>}
   */
  chat: async ({ message, conversationHistory = [], chatHistoryId = null }) => {
    try {
      const sessionId = getSessionId();
      const hasToken = localStorage.getItem("actkn");
      const client = hasToken ? privateClient : publicClient;
      
      const response = await client.post(chatbotEndpoints.chat, {
        message,
        conversationHistory,
        chatHistoryId,
        sessionId,
      });
      return { response };
    } catch (err) {
      return { err };
    }
  },

  /**
   * Send a message to the AI chatbot with streaming response
   * Uses fetch with ReadableStream for real-time text streaming
   * @param {Array} messages - Conversation messages in AI SDK format
   * @param {string} chatHistoryId - ID of existing chat history
   * @param {function} onChunk - Callback for each text chunk received
   * @param {function} onComplete - Callback when streaming completes
   * @param {function} onError - Callback for errors
   * @param {AbortSignal} signal - AbortSignal for cancellation
   * @returns {Promise<void>}
   */
  chatStream: async ({ 
    messages, 
    chatHistoryId = null, 
    onChunk, 
    onComplete, 
    onError,
    signal 
  }) => {
    try {
      const sessionId = getSessionId();
      const hasToken = localStorage.getItem("actkn");
      const baseUrl = getBaseUrl();
      
      const headers = {
        "Content-Type": "application/json",
      };
      
      if (hasToken) {
        headers["Authorization"] = `Bearer ${hasToken}`;
      }

      const response = await fetch(`${baseUrl}/${chatbotEndpoints.stream}`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          messages,
          chatHistoryId,
          sessionId,
        }),
        signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      // Check if response is streaming or JSON (for HITL responses)
      const contentType = response.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        // Non-streaming response (HITL confirmation/cancellation)
        const data = await response.json();
        onComplete?.(data.content || data.message, data);
        return;
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
      }

      const decoder = new TextDecoder();
      let fullText = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        
        // Parse Vercel AI SDK data stream format
        // Format: 0:"text chunk"\n or data: {"type": "text", "value": "chunk"}\n
        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; // Keep incomplete line in buffer

        for (const line of lines) {
          if (!line.trim()) continue;

          try {
            // Vercel AI SDK v3 format: 0:"text"
            if (line.startsWith("0:")) {
              const textContent = line.substring(2);
              // Parse JSON string
              const parsed = JSON.parse(textContent);
              if (typeof parsed === "string") {
                fullText += parsed;
                onChunk?.(parsed, fullText);
              }
            }
            // Alternative format: data: {...}
            else if (line.startsWith("data:")) {
              const jsonStr = line.substring(5).trim();
              if (jsonStr === "[DONE]") continue;
              
              const data = JSON.parse(jsonStr);
              if (data.type === "text-delta" && data.textDelta) {
                fullText += data.textDelta;
                onChunk?.(data.textDelta, fullText);
              } else if (data.type === "finish") {
                // Stream finished
              }
            }
            // Plain text chunk
            else if (!line.startsWith("{") && !line.includes(":")) {
              fullText += line;
              onChunk?.(line, fullText);
            }
          } catch (parseError) {
            // Ignore parse errors for malformed lines
            console.debug("Stream parse skip:", line);
          }
        }
      }

      onComplete?.(fullText, { text: fullText });
    } catch (err) {
      if (err.name === "AbortError") {
        // Request was cancelled
        return;
      }
      onError?.(err);
    }
  },

  /**
   * Get quick suggestions based on a media item
   * @param {number} mediaId - TMDB media ID
   * @param {string} mediaType - 'movie' or 'tv'
   * @param {string} mediaTitle - Title of the media
   * @returns {Promise<{response: object} | {err: object}>}
   */
  getQuickSuggestions: async ({ mediaId, mediaType, mediaTitle }) => {
    try {
      const response = await publicClient.post(chatbotEndpoints.suggestions, {
        mediaId,
        mediaType,
        mediaTitle,
      });
      return { response };
    } catch (err) {
      return { err };
    }
  },

  /**
   * Get user's chat history sessions
   * @returns {Promise<{response: object} | {err: object}>}
   */
  getChatHistory: async () => {
    try {
      const sessionId = getSessionId();
      const hasToken = localStorage.getItem("actkn");
      const client = hasToken ? privateClient : publicClient;
      
      // Build URL with query string directly to avoid serialization issues
      const url = `${chatbotEndpoints.history}?sessionId=${encodeURIComponent(sessionId)}`;
      const response = await client.get(url);
      return { response };
    } catch (err) {
      return { err };
    }
  },

  /**
   * Get a specific chat session with all messages
   * @param {string} chatHistoryId - ID of the chat history
   * @returns {Promise<{response: object} | {err: object}>}
   */
  getChatSession: async ({ chatHistoryId }) => {
    try {
      const hasToken = localStorage.getItem("actkn");
      const client = hasToken ? privateClient : publicClient;
      
      const response = await client.get(chatbotEndpoints.historySession(chatHistoryId));
      return { response };
    } catch (err) {
      return { err };
    }
  },

  /**
   * Create a new chat session
   * @returns {Promise<{response: object} | {err: object}>}
   */
  createChatSession: async () => {
    try {
      const sessionId = getSessionId();
      const hasToken = localStorage.getItem("actkn");
      const client = hasToken ? privateClient : publicClient;
      
      const response = await client.post(chatbotEndpoints.history, { sessionId });
      return { response };
    } catch (err) {
      return { err };
    }
  },

  /**
   * Delete a chat session
   * @param {string} chatHistoryId - ID of the chat history to delete
   * @returns {Promise<{response: object} | {err: object}>}
   */
  deleteChatSession: async ({ chatHistoryId }) => {
    try {
      const hasToken = localStorage.getItem("actkn");
      const client = hasToken ? privateClient : publicClient;
      
      const response = await client.delete(chatbotEndpoints.historySession(chatHistoryId));
      return { response };
    } catch (err) {
      return { err };
    }
  },

  /**
   * Clear a chat session and start fresh
   * @param {string} chatHistoryId - ID of the chat history to clear
   * @returns {Promise<{response: object} | {err: object}>}
   */
  clearChatSession: async ({ chatHistoryId }) => {
    try {
      const hasToken = localStorage.getItem("actkn");
      const client = hasToken ? privateClient : publicClient;
      
      const response = await client.post(chatbotEndpoints.clearSession(chatHistoryId));
      return { response };
    } catch (err) {
      return { err };
    }
  },

  /**
   * Confirm a pending action (like submitting a review)
   * Requires authentication
   * @param {string} chatHistoryId - ID of the chat history
   * @param {object} pendingAction - The pending action to confirm
   * @returns {Promise<{response: object} | {err: object}>}
   */
  confirmAction: async ({ chatHistoryId, pendingAction }) => {
    try {
      const response = await privateClient.post(chatbotEndpoints.confirmAction, {
        chatHistoryId,
        pendingAction,
      });
      return { response };
    } catch (err) {
      return { err };
    }
  },
};

export default chatbotApi;
