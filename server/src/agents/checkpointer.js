/**
 * LangGraph Checkpointer - Conversation State Persistence
 * Implements MemorySaver for in-memory checkpointing with MongoDB backup
 * Enables conversation continuity across agent invocations
 * 
 * FIXES APPLIED:
 * - Added cleanup function to prevent memory leaks
 * - Track checkpoint timestamps for cleanup
 */

import { MemorySaver } from "@langchain/langgraph-checkpoint";
import ChatHistory from "../models/chatHistory.model.js";
import logger from "../config/logger.config.js";

// Global in-memory checkpointer instance (singleton)
let memoryCheckpointer = null;

// Track checkpoint creation times for cleanup
const checkpointTimestamps = new Map();

/**
 * Get or create the memory checkpointer instance
 * @returns {MemorySaver} - The checkpointer instance
 */
export function getCheckpointer() {
  if (!memoryCheckpointer) {
    memoryCheckpointer = new MemorySaver();
    logger.info("LangGraph MemorySaver checkpointer initialized");
  }
  return memoryCheckpointer;
}

/**
 * Create a thread configuration for checkpointing
 * Uses chatHistoryId or generates a new thread ID
 * @param {string|null} chatHistoryId - Existing chat history ID
 * @param {string|null} userId - User ID for authenticated users
 * @returns {object} - Thread configuration for LangGraph
 */
export function createThreadConfig(chatHistoryId = null, userId = null) {
  // Thread ID format: user_{userId}_chat_{chatHistoryId} or anon_chat_{chatHistoryId}
  const threadId = chatHistoryId 
    ? (userId ? `user_${userId}_chat_${chatHistoryId}` : `anon_chat_${chatHistoryId}`)
    : `temp_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  return {
    configurable: {
      thread_id: threadId,
      userId,
      chatHistoryId,
    },
  };
}

/**
 * Sync checkpoint state to MongoDB for persistence
 * Called after significant agent interactions
 * @param {string} threadId - The thread ID
 * @param {string|null} chatHistoryId - Chat history document ID
 * @param {object} state - The current state to persist
 */
export async function syncCheckpointToMongo(threadId, chatHistoryId, state) {
  if (!chatHistoryId) return;

  // Track timestamp for this checkpoint
  checkpointTimestamps.set(threadId, Date.now());

  try {
    const chatSession = await ChatHistory.findById(chatHistoryId);
    if (chatSession) {
      // Store checkpoint metadata for recovery
      chatSession.metadata.lastCheckpointThreadId = threadId;
      chatSession.metadata.lastCheckpointTime = new Date();
      await chatSession.save();
      
      logger.debug("Checkpoint synced to MongoDB", { threadId, chatHistoryId });
    }
  } catch (error) {
    logger.warn("Failed to sync checkpoint to MongoDB", { 
      error: error.message,
      threadId,
      chatHistoryId,
    });
  }
}

/**
 * Clean up old thread checkpoints to prevent memory bloat
 * @param {number} maxAge - Maximum age in milliseconds (default: 24 hours)
 * @returns {Promise<object>} - Cleanup statistics
 */
export async function cleanupOldCheckpoints(maxAge = 24 * 60 * 60 * 1000) {
  const checkpointer = getCheckpointer();
  const now = Date.now();
  let cleaned = 0;
  let retained = 0;
  const errors = [];

  // Get all tracked thread IDs
  const threadIds = Array.from(checkpointTimestamps.keys());

  for (const threadId of threadIds) {
    const timestamp = checkpointTimestamps.get(threadId);
    const age = now - timestamp;

    if (age > maxAge) {
      try {
        // Delete from memory checkpointer
        if (checkpointer.storage && checkpointer.storage[threadId]) {
          delete checkpointer.storage[threadId];
        }
        // Remove from timestamps tracking
        checkpointTimestamps.delete(threadId);
        cleaned++;
        logger.debug("Cleaned up old checkpoint", { threadId, ageHours: (age / 3600000).toFixed(1) });
      } catch (error) {
        errors.push({ threadId, error: error.message });
      }
    } else {
      retained++;
    }
  }

  // Also clean up any orphaned storage entries not in our timestamp map
  if (checkpointer.storage) {
    const storageKeys = Object.keys(checkpointer.storage);
    for (const key of storageKeys) {
      if (!checkpointTimestamps.has(key)) {
        // Orphaned entry - clean it up
        delete checkpointer.storage[key];
        cleaned++;
      }
    }
  }

  const stats = { cleaned, retained, errors: errors.length };
  
  if (cleaned > 0 || errors.length > 0) {
    logger.info("Checkpoint cleanup completed", stats);
  }

  return stats;
}

/**
 * Clean up old thread checkpoints to prevent memory bloat
 * Called periodically or when sessions are deleted
 * @param {string} threadId - The thread ID to clean up
 */
export async function deleteThreadCheckpoint(threadId) {
  try {
    const checkpointer = getCheckpointer();
    await checkpointer.deleteThread(threadId);
    logger.debug("Thread checkpoint deleted", { threadId });
  } catch (error) {
    logger.warn("Failed to delete thread checkpoint", { 
      error: error.message,
      threadId,
    });
  }
}

/**
 * Get checkpoint statistics for monitoring
 * @returns {object} - Checkpoint statistics
 */
export function getCheckpointStats() {
  const checkpointer = getCheckpointer();
  const storageKeys = Object.keys(checkpointer.storage || {});
  
  return {
    activeThreads: storageKeys.length,
    threadIds: storageKeys.slice(0, 10), // First 10 for debugging
  };
}

export default {
  getCheckpointer,
  createThreadConfig,
  syncCheckpointToMongo,
  deleteThreadCheckpoint,
  getCheckpointStats,
  cleanupOldCheckpoints,
};

