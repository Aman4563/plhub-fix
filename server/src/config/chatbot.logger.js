/**
 * Chatbot Logger - Structured logging for AI chatbot analysis
 * Captures agent thinking, tool calls, API usage, and insights
 * 
 * Log files:
 * - chatbot.log: Human-readable conversation logs
 * - chatbot.json.log: JSON-structured logs for analysis
 */

import winston from "winston";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure logs directory exists
const logsDir = path.join(__dirname, "../../logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Session tracking for grouping related logs
const activeSessions = new Map();

/**
 * Generate session ID
 */
function generateSessionId() {
  return `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

/**
 * Human-readable format for chatbot logs
 */
const readableFormat = winston.format.printf(({ 
  timestamp, 
  level, 
  event, 
  sessionId,
  userId,
  query,
  agent,
  tool,
  toolArgs,
  toolResult,
  response,
  duration,
  apiCalls,
  cacheHits,
  error,
  metadata 
}) => {
  let log = `\n${"=".repeat(80)}\n`;
  log += `📅 ${timestamp} | ${level.toUpperCase()}\n`;
  log += `${"=".repeat(80)}\n`;
  
  if (sessionId) log += `🔑 Session: ${sessionId}\n`;
  if (userId) log += `👤 User: ${userId}\n`;
  
  switch (event) {
    case "SESSION_START":
      log += `\n🚀 NEW CHATBOT SESSION STARTED\n`;
      if (query) log += `📝 Initial Query: "${query}"\n`;
      break;
      
    case "QUERY_RECEIVED":
      log += `\n📨 QUERY RECEIVED\n`;
      log += `   Query: "${query}"\n`;
      break;
      
    case "SUPERVISOR_ROUTING":
      log += `\n🧭 SUPERVISOR ROUTING DECISION\n`;
      log += `   Query: "${query?.substring(0, 50)}..."\n`;
      log += `   Routed to: ${agent}\n`;
      if (duration) log += `   Routing Time: ${duration}ms\n`;
      break;
      
    case "AGENT_START":
      log += `\n🤖 AGENT STARTED: ${agent}\n`;
      log += `   Processing: "${query?.substring(0, 100)}..."\n`;
      break;
      
    case "TOOL_CALL":
      log += `\n🔧 TOOL CALL: ${tool}\n`;
      log += `   Arguments: ${JSON.stringify(toolArgs, null, 2).split("\n").map((l, i) => i === 0 ? l : "   " + l).join("\n")}\n`;
      break;
      
    case "TOOL_RESULT":
      log += `\n✅ TOOL RESULT: ${tool}\n`;
      if (duration) log += `   Execution Time: ${duration}ms\n`;
      if (cacheHits !== undefined) log += `   Cache Hit: ${cacheHits ? "Yes ✓" : "No"}\n`;
      // Truncate result for readability
      const resultPreview = typeof toolResult === "string" 
        ? toolResult.substring(0, 500) 
        : JSON.stringify(toolResult, null, 2).substring(0, 500);
      log += `   Result Preview:\n   ${resultPreview.split("\n").map((l, i) => i === 0 ? l : "   " + l).join("\n")}${resultPreview.length >= 500 ? "..." : ""}\n`;
      break;
      
    case "TOOL_ERROR":
      log += `\n❌ TOOL ERROR: ${tool}\n`;
      log += `   Error: ${error}\n`;
      if (duration) log += `   Failed After: ${duration}ms\n`;
      break;
      
    case "AGENT_RESPONSE":
      log += `\n💬 AGENT RESPONSE: ${agent}\n`;
      if (duration) log += `   Total Time: ${duration}ms\n`;
      if (apiCalls !== undefined) log += `   API Calls Made: ${apiCalls}\n`;
      if (cacheHits !== undefined) log += `   Cache Hits: ${cacheHits}\n`;
      // Truncate response for readability
      const responsePreview = response?.substring(0, 800) || "No response";
      log += `   Response:\n   ${responsePreview.split("\n").map((l, i) => i === 0 ? l : "   " + l).join("\n")}${response?.length > 800 ? "..." : ""}\n`;
      break;
      
    case "SESSION_END":
      log += `\n🏁 SESSION COMPLETED\n`;
      if (duration) log += `   Total Duration: ${duration}ms\n`;
      if (apiCalls !== undefined) log += `   Total API Calls: ${apiCalls}\n`;
      if (cacheHits !== undefined) log += `   Total Cache Hits: ${cacheHits}\n`;
      break;
      
    case "CHECKPOINT_SAVED":
      log += `\n💾 CHECKPOINT SAVED\n`;
      if (metadata?.threadId) log += `   Thread ID: ${metadata.threadId}\n`;
      break;
      
    case "ERROR":
      log += `\n⚠️ ERROR OCCURRED\n`;
      log += `   Error: ${error}\n`;
      if (metadata?.stack) log += `   Stack: ${metadata.stack}\n`;
      break;
      
    default:
      log += `\n📋 ${event}\n`;
      if (metadata) {
        log += `   Details: ${JSON.stringify(metadata, null, 2).split("\n").map((l, i) => i === 0 ? l : "   " + l).join("\n")}\n`;
      }
  }
  
  log += `${"─".repeat(80)}\n`;
  return log;
});

/**
 * JSON format for structured analysis
 */
const jsonFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS" }),
  winston.format.json()
);

// Create chatbot logger with multiple transports
const chatbotLogger = winston.createLogger({
  level: "debug",
  transports: [
    // Human-readable log file
    new winston.transports.File({
      filename: path.join(logsDir, "chatbot.log"),
      format: winston.format.combine(
        winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        readableFormat
      ),
      maxsize: 10485760, // 10MB
      maxFiles: 10,
    }),
    // JSON structured log file for analysis
    new winston.transports.File({
      filename: path.join(logsDir, "chatbot.json.log"),
      format: jsonFormat,
      maxsize: 10485760, // 10MB
      maxFiles: 10,
    }),
  ],
});

// Add console transport in development
if (process.env.NODE_ENV !== "production") {
  chatbotLogger.add(new winston.transports.Console({
    level: "info",
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp({ format: "HH:mm:ss" }),
      winston.format.printf(({ timestamp, level, event, agent, tool, duration }) => {
        const icon = {
          "SESSION_START": "🚀",
          "QUERY_RECEIVED": "📨",
          "SUPERVISOR_ROUTING": "🧭",
          "AGENT_START": "🤖",
          "TOOL_CALL": "🔧",
          "TOOL_RESULT": "✅",
          "TOOL_ERROR": "❌",
          "AGENT_RESPONSE": "💬",
          "SESSION_END": "🏁",
          "ERROR": "⚠️",
        }[event] || "📋";
        
        let msg = `${timestamp} ${icon} ${event}`;
        if (agent) msg += ` [${agent}]`;
        if (tool) msg += ` → ${tool}`;
        if (duration) msg += ` (${duration}ms)`;
        return msg;
      })
    ),
  }));
}

/**
 * ChatbotLogger class - High-level logging interface
 */
class ChatbotLoggerClass {
  constructor() {
    this.apiCallCounts = new Map();
    this.cacheHitCounts = new Map();
  }

  /**
   * Start a new chatbot session
   */
  startSession(userId = null, query = null) {
    const sessionId = generateSessionId();
    const sessionData = {
      startTime: Date.now(),
      userId,
      apiCalls: 0,
      cacheHits: 0,
      toolCalls: [],
      agents: [],
    };
    activeSessions.set(sessionId, sessionData);
    
    chatbotLogger.info({
      event: "SESSION_START",
      sessionId,
      userId,
      query,
    });
    
    return sessionId;
  }

  /**
   * Log query received
   */
  logQuery(sessionId, query, userId = null) {
    chatbotLogger.info({
      event: "QUERY_RECEIVED",
      sessionId,
      userId,
      query,
    });
  }

  /**
   * Log supervisor routing decision
   */
  logRouting(sessionId, query, agent, duration = null, method = "LLM") {
    const session = activeSessions.get(sessionId);
    if (session) {
      session.agents.push(agent);
    }
    
    chatbotLogger.info({
      event: "SUPERVISOR_ROUTING",
      sessionId,
      query,
      agent,
      duration,
      metadata: { method }, // "pattern_match" or "LLM"
    });
  }

  /**
   * Log agent start
   */
  logAgentStart(sessionId, agent, query) {
    chatbotLogger.info({
      event: "AGENT_START",
      sessionId,
      agent,
      query,
    });
  }

  /**
   * Log tool call
   */
  logToolCall(sessionId, tool, args) {
    const session = activeSessions.get(sessionId);
    if (session) {
      session.toolCalls.push({ tool, args, startTime: Date.now() });
    }
    
    chatbotLogger.info({
      event: "TOOL_CALL",
      sessionId,
      tool,
      toolArgs: args,
    });
  }

  /**
   * Log tool result
   */
  logToolResult(sessionId, tool, result, duration = null, cacheHit = false) {
    const session = activeSessions.get(sessionId);
    if (session) {
      if (!cacheHit) session.apiCalls++;
      if (cacheHit) session.cacheHits++;
    }
    
    chatbotLogger.info({
      event: "TOOL_RESULT",
      sessionId,
      tool,
      toolResult: result,
      duration,
      cacheHits: cacheHit,
    });
  }

  /**
   * Log tool error
   */
  logToolError(sessionId, tool, error, duration = null) {
    chatbotLogger.error({
      event: "TOOL_ERROR",
      sessionId,
      tool,
      error: error.message || error,
      duration,
      metadata: { stack: error.stack },
    });
  }

  /**
   * Log agent response
   */
  logAgentResponse(sessionId, agent, response, duration = null, toolCallsCount = 0) {
    const session = activeSessions.get(sessionId);
    
    chatbotLogger.info({
      event: "AGENT_RESPONSE",
      sessionId,
      agent,
      response,
      duration,
      apiCalls: session?.apiCalls || toolCallsCount,
      cacheHits: session?.cacheHits || 0,
    });
  }

  /**
   * Log checkpoint saved
   */
  logCheckpoint(sessionId, threadId) {
    chatbotLogger.info({
      event: "CHECKPOINT_SAVED",
      sessionId,
      metadata: { threadId },
    });
  }

  /**
   * End session and log summary
   */
  endSession(sessionId) {
    const session = activeSessions.get(sessionId);
    if (!session) return;
    
    const duration = Date.now() - session.startTime;
    
    chatbotLogger.info({
      event: "SESSION_END",
      sessionId,
      userId: session.userId,
      duration,
      apiCalls: session.apiCalls,
      cacheHits: session.cacheHits,
      metadata: {
        toolCalls: session.toolCalls.map(tc => tc.tool),
        agents: session.agents,
      },
    });
    
    activeSessions.delete(sessionId);
    
    return {
      duration,
      apiCalls: session.apiCalls,
      cacheHits: session.cacheHits,
      toolCalls: session.toolCalls,
      agents: session.agents,
    };
  }

  /**
   * Log general error
   */
  logError(sessionId, error, context = {}) {
    chatbotLogger.error({
      event: "ERROR",
      sessionId,
      error: error.message || error,
      metadata: { 
        stack: error.stack,
        ...context,
      },
    });
  }

  /**
   * Log custom event
   */
  logCustom(sessionId, eventName, data = {}) {
    chatbotLogger.info({
      event: eventName,
      sessionId,
      metadata: data,
    });
  }

  /**
   * Get session stats
   */
  getSessionStats(sessionId) {
    const session = activeSessions.get(sessionId);
    if (!session) return null;
    
    return {
      duration: Date.now() - session.startTime,
      apiCalls: session.apiCalls,
      cacheHits: session.cacheHits,
      toolCalls: session.toolCalls.length,
      agents: session.agents,
    };
  }

  /**
   * Get all active sessions
   */
  getActiveSessions() {
    return Array.from(activeSessions.keys());
  }
}

// Export singleton instance
const ChatbotLogger = new ChatbotLoggerClass();

export default ChatbotLogger;
export { chatbotLogger, ChatbotLogger };

