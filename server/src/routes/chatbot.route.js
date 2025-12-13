/**
 * AI Chatbot Routes
 * Handles AI-powered movie/TV recommendation chat with tool calling
 */

import express from "express";
import chatbotController from "../controllers/chatbot.controller.js";
import tokenMiddleware from "../middlewares/token.middleware.js";

const router = express.Router();

/**
 * POST /api/v1/chatbot/chat
 * Send a message to the AI chatbot (non-streaming, with history persistence)
 * Supports both authenticated and anonymous users
 * Authenticated users get access to watchlist, favorites, and review features
 */
router.post("/chat", tokenMiddleware.optionalAuth, chatbotController.chat);

/**
 * POST /api/v1/chatbot/stream
 * Streaming chat endpoint compatible with Vercel AI SDK useChat hook
 * Supports both authenticated and anonymous users
 */
router.post("/stream", tokenMiddleware.optionalAuth, chatbotController.chatStream);

/**
 * POST /api/v1/chatbot/suggestions
 * Get quick AI suggestions based on a media item
 * Public route
 */
router.post("/suggestions", chatbotController.getQuickSuggestions);

/**
 * GET /api/v1/chatbot/history
 * Get user's chat history sessions
 * Supports both authenticated users and session-based anonymous users
 */
router.get("/history", tokenMiddleware.optionalAuth, chatbotController.getChatHistory);

/**
 * GET /api/v1/chatbot/history/:chatHistoryId
 * Get a specific chat session with all messages
 */
router.get("/history/:chatHistoryId", tokenMiddleware.optionalAuth, chatbotController.getChatSession);

/**
 * POST /api/v1/chatbot/history
 * Create a new chat session
 */
router.post("/history", tokenMiddleware.optionalAuth, chatbotController.createChatSession);

/**
 * DELETE /api/v1/chatbot/history/:chatHistoryId
 * Delete a chat session
 */
router.delete("/history/:chatHistoryId", tokenMiddleware.optionalAuth, chatbotController.deleteChatSession);

/**
 * POST /api/v1/chatbot/history/:chatHistoryId/clear
 * Clear a chat session and start fresh (archives old session)
 */
router.post("/history/:chatHistoryId/clear", tokenMiddleware.optionalAuth, chatbotController.clearChatSession);

/**
 * POST /api/v1/chatbot/confirm-action
 * Confirm a pending action (like submitting a review)
 * Requires authentication
 */
router.post("/confirm-action", tokenMiddleware.auth, chatbotController.confirmAction);

export default router;
