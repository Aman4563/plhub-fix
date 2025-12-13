/**
 * Agent Logging Utilities
 * Shared logging utilities for AI agents
 * Provides consistent tool execution logging across all agents
 */

import { AsyncLocalStorage } from "async_hooks";
import ChatbotLogger from "../../config/chatbot.logger.js";
import logger from "../../config/logger.config.js";

// Request-scoped context using AsyncLocalStorage (thread-safe)
const requestContext = new AsyncLocalStorage();

/**
 * Get the current context from AsyncLocalStorage
 * @returns {object} - Context object with userId and logSessionId
 */
export function getCurrentContext() {
  return requestContext.getStore() || {};
}

/**
 * Get the current log session ID from request context
 * @returns {string|null}
 */
export function getCurrentLogSessionId() {
  const store = requestContext.getStore();
  return store?.logSessionId || null;
}

/**
 * Run a function with specific context (userId and logSessionId)
 * @param {object} context - Context object with userId and logSessionId
 * @param {Function} fn - The async function to run
 * @returns {Promise<any>}
 */
export function runWithContext(context, fn) {
  return requestContext.run(context, fn);
}

/**
 * Run a function with a specific log session ID in context
 * @param {string|null} logSessionId - The logging session ID
 * @param {Function} fn - The async function to run
 * @returns {Promise<any>}
 */
export function runWithLogSession(logSessionId, fn) {
  return requestContext.run({ logSessionId }, fn);
}

/**
 * Helper to log tool execution with timing
 * @param {string} toolName - Name of the tool being executed
 * @param {object} args - Tool arguments
 * @param {Function} executeFn - The async function to execute
 * @param {string|null} logSessionId - Logging session ID (passed through context or explicitly)
 * @param {object} options - Additional options
 * @param {Function} options.getCacheHit - Function to check if result was cached
 * @returns {Promise<any>} - Tool execution result
 */
export async function executeWithLogging(toolName, args, executeFn, logSessionId = null, options = {}) {
  const startTime = Date.now();
  
  // Use provided logSessionId or try to get from context
  const sessionId = logSessionId || getCurrentLogSessionId();
  
  // Log tool call
  if (sessionId) {
    ChatbotLogger.logToolCall(sessionId, toolName, args);
  }
  
  try {
    const result = await executeFn();
    const duration = Date.now() - startTime;
    
    // Check if result was from cache (if cache check function provided)
    let wasCached = false;
    if (options.getCacheHit) {
      try {
        wasCached = options.getCacheHit();
      } catch (e) {
        // Ignore cache check errors
      }
    }
    
    // Log tool result
    if (sessionId) {
      ChatbotLogger.logToolResult(sessionId, toolName, result, duration, wasCached);
    }
    
    logger.debug(`Tool ${toolName} executed`, { duration, wasCached });
    
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    // Log tool error
    if (sessionId) {
      ChatbotLogger.logToolError(sessionId, toolName, error, duration);
    }
    
    logger.error(`Tool ${toolName} failed`, { 
      error: error.message, 
      duration,
      args: JSON.stringify(args).substring(0, 200),
    });
    
    throw error;
  }
}

/**
 * Create a wrapped tool function with automatic logging
 * @param {string} toolName - Name of the tool
 * @param {Function} toolFn - The tool function to wrap
 * @param {object} options - Additional options
 * @returns {Function} - Wrapped function with logging
 */
export function wrapToolWithLogging(toolName, toolFn, options = {}) {
  return async (...args) => {
    const logSessionId = getCurrentLogSessionId();
    return executeWithLogging(
      toolName,
      args,
      () => toolFn(...args),
      logSessionId,
      options
    );
  };
}

export default {
  getCurrentContext,
  getCurrentLogSessionId,
  runWithContext,
  runWithLogSession,
  executeWithLogging,
  wrapToolWithLogging,
};

