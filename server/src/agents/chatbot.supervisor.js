/**
 * Chatbot Supervisor - LangGraph-based multi-agent orchestration
 * Routes user queries to specialized agents based on intent
 * Now with checkpointing for conversation persistence
 * 
 * FIXES APPLIED:
 * - Environment variable for model version
 */

import { StateGraph, MessagesAnnotation, START, END, Annotation } from "@langchain/langgraph";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, AIMessage, SystemMessage } from "@langchain/core/messages";
import { createSearchAgent, runSearchAgent } from "./specialists/search.agent.js";
import { createUserAgent, runUserAgent } from "./specialists/user.agent.js";
import { getCheckpointer, createThreadConfig, syncCheckpointToMongo } from "./checkpointer.js";
import logger from "../config/logger.config.js";
import ChatbotLogger from "../config/chatbot.logger.js";

// Configuration from environment variables
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

// Optimized supervisor prompt - more concise for faster routing
const SUPERVISOR_PROMPT = `You are a routing supervisor. Analyze the user message and route to the best agent.

Agents:
1. SEARCH_EXPERT - Movie/TV discovery: search, trending, details, similar, genre, top-rated, recommendations
2. USER_MANAGER - Personal actions: watchlist, favorites, reviews management

Route rules:
- Questions about movies/shows (what, find, search, trending, recommend, similar, details, cast, rating) → SEARCH_EXPERT
- Personal lists (add/remove/show watchlist, favorites, write review, my reviews) → USER_MANAGER
- Default to SEARCH_EXPERT for ambiguous queries

Respond with ONLY: SEARCH_EXPERT or USER_MANAGER`;

// Cached model instance for supervisor (routing is simple, use low temp)
let supervisorModel = null;

function getSupervisorModel() {
  if (!supervisorModel) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      logger.error("GEMINI_API_KEY not found in environment variables");
      throw new Error("GEMINI_API_KEY not configured");
    }
    
    logger.info("Initializing supervisor model", { 
      model: GEMINI_MODEL,
      hasApiKey: !!apiKey 
    });
    
    supervisorModel = new ChatGoogleGenerativeAI({
      model: GEMINI_MODEL,
      temperature: 0,
      maxOutputTokens: 100,
      apiKey: apiKey,
    });
  }
  return supervisorModel;
}

/**
 * Supervisor node that routes to appropriate agent
 * Optimized for minimal API calls
 */
async function supervisorNode(state, config) {
  const messages = state.messages;
  const lastMessage = messages[messages.length - 1];
  
  // Quick pattern matching before LLM call for common patterns
  const content = lastMessage.content.toLowerCase();
  
  // Fast routing for obvious user management queries
  const userPatterns = [
    /\b(my|show|add|remove|delete)\s*(watchlist|favorites?|review)/i,
    /\b(watchlist|favorite)\b/i,
    /\bwrite\s+(?:a\s+)?review/i,
    /\bmy\s+reviews?/i,
  ];
  
  for (const pattern of userPatterns) {
    if (pattern.test(content)) {
      logger.info("Supervisor: Fast-routed to USER_MANAGER", { 
        query: content.substring(0, 30) 
      });
      return { next: "user_manager" };
    }
  }

  // Use LLM for ambiguous cases
  const model = getSupervisorModel();

  const routingMessages = [
    new SystemMessage(SUPERVISOR_PROMPT),
    new HumanMessage(lastMessage.content),
  ];

  const response = await model.invoke(routingMessages);
  const decision = response.content.trim().toUpperCase();

  logger.info("Supervisor routing decision", { 
    query: lastMessage.content.substring(0, 50),
    decision 
  });

  if (decision.includes("USER_MANAGER") || decision.includes("USER")) {
    return { next: "user_manager" };
  }
  
  return { next: "search_expert" };
}

/**
 * Search Expert node - handles discovery queries
 * Optimized prompts for efficient tool usage
 */
async function searchExpertNode(state, config) {
  const messages = state.messages;
  const lastMessage = messages[messages.length - 1];
  const logSessionId = config?.configurable?.logSessionId || null;
  
  logger.info("Search Expert processing", { query: lastMessage.content.substring(0, 50) });

  try {
    const result = await runSearchAgent(lastMessage.content, messages.slice(0, -1), logSessionId);
    
    return {
      messages: [
        ...messages,
        new AIMessage(result.response),
      ],
    };
  } catch (error) {
    logger.error("Search Expert error", { error: error.message });
    if (logSessionId) {
      ChatbotLogger.logError(logSessionId, error, { agent: "search_expert" });
    }
    return {
      messages: [
        ...messages,
        new AIMessage("I had trouble searching for that. Please try again."),
      ],
    };
  }
}

/**
 * User Manager node - handles personal actions
 */
async function userManagerNode(state, config) {
  const messages = state.messages;
  const lastMessage = messages[messages.length - 1];
  const userId = config?.configurable?.userId || null;
  const logSessionId = config?.configurable?.logSessionId || null;
  
  logger.info("User Manager processing", { 
    query: lastMessage.content.substring(0, 50),
    hasUserId: !!userId 
  });

  try {
    const result = await runUserAgent(lastMessage.content, userId, messages.slice(0, -1), logSessionId);
    
    return {
      messages: [
        ...messages,
        new AIMessage(result.response),
      ],
    };
  } catch (error) {
    logger.error("User Manager error", { error: error.message });
    if (logSessionId) {
      ChatbotLogger.logError(logSessionId, error, { agent: "user_manager" });
    }
    return {
      messages: [
        ...messages,
        new AIMessage("I had trouble with that action. Please try again."),
      ],
    };
  }
}

// Compiled graph cache with checkpointer
let compiledGraph = null;

/**
 * Create the supervisor graph with checkpointing
 * @returns {CompiledGraph} - The compiled supervisor workflow
 */
export function createSupervisorGraph() {
  if (compiledGraph) {
    return compiledGraph;
  }

  // Define the state schema with next routing
  const StateAnnotation = Annotation.Root({
    ...MessagesAnnotation.spec,
    next: Annotation({
      reducer: (_, next) => next,
      default: () => "search_expert",
    }),
  });

  // Create the graph
  const workflow = new StateGraph(StateAnnotation)
    // Add nodes
    .addNode("supervisor", supervisorNode)
    .addNode("search_expert", searchExpertNode)
    .addNode("user_manager", userManagerNode)
    
    // Define edges
    .addEdge(START, "supervisor")
    .addConditionalEdges(
      "supervisor",
      (state) => state.next,
      {
        search_expert: "search_expert",
        user_manager: "user_manager",
      }
    )
    .addEdge("search_expert", END)
    .addEdge("user_manager", END);

  // Compile with checkpointer for conversation persistence
  const checkpointer = getCheckpointer();
  compiledGraph = workflow.compile({ checkpointer });
  
  logger.info("Supervisor graph compiled with checkpointing");
  
  return compiledGraph;
}

/**
 * Run a query through the supervisor system with checkpointing
 * @param {string} query - User query
 * @param {string|null} userId - User ID for authenticated actions
 * @param {Array} history - Conversation history
 * @param {string|null} chatHistoryId - Chat history document ID for checkpointing
 * @param {string|null} logSessionId - Logging session ID for chatbot logger
 * @returns {Promise<object>} - Response with message and metadata
 */
export async function runSupervisor(query, userId = null, history = [], chatHistoryId = null, logSessionId = null) {
  const graph = createSupervisorGraph();

  // Build messages array
  const messages = [
    ...history.map(msg => 
      msg.role === "assistant" 
        ? new AIMessage(msg.content)
        : new HumanMessage(msg.content)
    ),
    new HumanMessage(query),
  ];

  // Create thread config for checkpointing
  const threadConfig = createThreadConfig(chatHistoryId, userId);

  // Run the graph with configurable userId, thread, and logSessionId
  const result = await graph.invoke(
    { messages },
    { 
      configurable: { 
        ...threadConfig.configurable,
        userId,
        logSessionId,
      } 
    }
  );

  // Sync checkpoint to MongoDB for persistence
  if (chatHistoryId) {
    await syncCheckpointToMongo(
      threadConfig.configurable.thread_id,
      chatHistoryId,
      result
    );
  }

  // Get the last message (response)
  const lastMessage = result.messages[result.messages.length - 1];

  return {
    message: lastMessage.content,
    agentUsed: result.next || "unknown",
    threadId: threadConfig.configurable.thread_id,
  };
}

/**
 * Determine which agent should handle a query (for preview/routing info)
 * Uses fast pattern matching first, then LLM fallback
 * @param {string} query - User query
 * @returns {Promise<string>} - Agent name
 */
export async function classifyQuery(query) {
  const content = query.toLowerCase();
  
  // Fast pattern matching
  const userPatterns = [
    /\b(my|show|add|remove|delete)\s*(watchlist|favorites?|review)/i,
    /\b(watchlist|favorite)\b/i,
    /\bwrite\s+(?:a\s+)?review/i,
  ];
  
  for (const pattern of userPatterns) {
    if (pattern.test(content)) {
      return "user_manager";
    }
  }

  // LLM for ambiguous cases - with timeout and error handling
  try {
    const model = getSupervisorModel();

    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Routing timeout")), 10000)
    );

    const invokePromise = model.invoke([
    new SystemMessage(SUPERVISOR_PROMPT),
    new HumanMessage(query),
  ]);

    const response = await Promise.race([invokePromise, timeoutPromise]);
  const decision = response.content.trim().toUpperCase();
    
    logger.info("Supervisor routing decision", { decision, query: query.substring(0, 30) });
  
  if (decision.includes("USER_MANAGER") || decision.includes("USER")) {
    return "user_manager";
  }
  return "search_expert";
  } catch (error) {
    // Default to search_expert on any error (most common use case)
    logger.warn("Supervisor routing failed, defaulting to search_expert", { 
      error: error.message,
      query: query.substring(0, 30)
    });
    return "search_expert";
  }
}

/**
 * Reset the compiled graph (for testing or config changes)
 */
export function resetGraph() {
  compiledGraph = null;
  supervisorModel = null;
  logger.info("Supervisor graph reset");
}

export default { 
  createSupervisorGraph, 
  runSupervisor, 
  classifyQuery,
  resetGraph,
};
