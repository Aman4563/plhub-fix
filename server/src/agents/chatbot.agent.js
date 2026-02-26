/**
 * Chatbot Agent - Vercel AI SDK with streaming support
 * Uses Google Gemini for AI with Groq as fallback
 * 
 * FIXES APPLIED:
 * - Environment variable for model version
 * - Improved tool result extraction
 * - Better error handling
 * - Groq fallback for rate limiting (llama-3.3-70b-versatile primary, llama-3.1-8b-instant secondary)
 * - Native Groq SDK for tool calling (Vercel AI SDK Groq provider has tool calling bugs)
 */

import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";
import { streamText, generateText } from "ai";
import Groq from "groq-sdk";
import { createTools, confirmAction, getToolDefinitions, executeToolCall } from "./chatbot.tools.js";
import logger from "../config/logger.config.js";

// Configuration from environment variables
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
// Groq models - llama-3.3-70b-versatile for best quality, llama-3.1-8b-instant for high volume fallback
const GROQ_PRIMARY_MODEL = process.env.GROQ_PRIMARY_MODEL || "llama-3.3-70b-versatile";
const GROQ_FALLBACK_MODEL = process.env.GROQ_FALLBACK_MODEL || "llama-3.1-8b-instant";
const MAX_STEPS = parseInt(process.env.CHATBOT_MAX_STEPS || "8", 10);
const MAX_TOKENS = parseInt(process.env.CHATBOT_MAX_TOKENS || "4096", 10);

// Provider preference tracking (for smart fallback)
let currentProvider = "gemini"; // "gemini" | "groq_primary" | "groq_fallback"
let lastProviderError = null;
let providerResetTimeout = null;

// Lazy-initialized providers (ensures env vars are loaded)
let googleProvider = null;
let groqProvider = null;

function getGoogleProvider() {
  if (!googleProvider) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      logger.warn("GEMINI_API_KEY not found, will use Groq if available");
      return null;
    }
    logger.info("Initializing Google AI provider", { hasApiKey: true, model: GEMINI_MODEL });
    googleProvider = createGoogleGenerativeAI({ apiKey });
  }
  return googleProvider;
}

function getGroqProvider() {
  if (!groqProvider) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      logger.warn("GROQ_API_KEY not found, Groq fallback disabled");
      return null;
    }
    logger.info("Initializing Groq AI provider", { 
      hasApiKey: true, 
      primaryModel: GROQ_PRIMARY_MODEL,
      fallbackModel: GROQ_FALLBACK_MODEL 
    });
    groqProvider = createGroq({ apiKey });
  }
  return groqProvider;
}

// Native Groq SDK client (for tool calling - the @ai-sdk/groq provider has bugs)
let nativeGroqClient = null;

function getNativeGroqClient() {
  if (!nativeGroqClient) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return null;
    nativeGroqClient = new Groq({ apiKey });
    logger.info("Initialized native Groq SDK client for tool calling");
  }
  return nativeGroqClient;
}

/**
 * Check if an error is a rate limit error (429)
 */
export function isRateLimitError(error) {
  return (
    error?.statusCode === 429 ||
    error?.message?.includes("429") ||
    error?.message?.includes("quota") ||
    error?.message?.includes("rate limit") ||
    error?.message?.includes("RESOURCE_EXHAUSTED") ||
    error?.cause?.statusCode === 429 ||
    error?.lastError?.statusCode === 429
  );
}

/**
 * Get the next available provider after a rate limit error
 */
function getNextProvider(failedProvider) {
  const providerOrder = ["gemini", "groq_primary", "groq_fallback"];
  const currentIndex = providerOrder.indexOf(failedProvider);
  
  for (let i = currentIndex + 1; i < providerOrder.length; i++) {
    const nextProvider = providerOrder[i];
    if (nextProvider === "gemini" && getGoogleProvider()) return nextProvider;
    if (nextProvider.startsWith("groq") && getGroqProvider()) return nextProvider;
  }
  
  return null; // No more providers available
}

/**
 * Get the AI model based on current provider
 */
function getCurrentModel() {
  switch (currentProvider) {
    case "gemini":
      const google = getGoogleProvider();
      if (google) return { provider: google, model: GEMINI_MODEL, name: "Gemini" };
      // Fall through to groq if Gemini not available
      currentProvider = "groq_primary";
      // falls through
    case "groq_primary":
      const groqPrimary = getGroqProvider();
      if (groqPrimary) return { provider: groqPrimary, model: GROQ_PRIMARY_MODEL, name: "Groq (Llama 70B)" };
      currentProvider = "groq_fallback";
      // falls through
    case "groq_fallback":
      const groqFallback = getGroqProvider();
      if (groqFallback) return { provider: groqFallback, model: GROQ_FALLBACK_MODEL, name: "Groq (Llama 8B)" };
      // falls through
    default:
      throw new Error("No AI providers available. Please configure GEMINI_API_KEY or GROQ_API_KEY");
  }
}

/**
 * Handle provider failure and switch to fallback
 */
export function handleProviderFailure(error) {
  logger.info("Checking provider failure", {
    isRateLimit: isRateLimitError(error),
    currentProvider,
    errorMessage: error?.message?.substring(0, 100),
    errorCode: error?.statusCode || error?.lastError?.statusCode,
  });

  if (isRateLimitError(error)) {
    lastProviderError = { provider: currentProvider, error, time: Date.now() };
    const nextProvider = getNextProvider(currentProvider);
    
    logger.info("Rate limit detected, checking for next provider", {
      failedProvider: currentProvider,
      nextProvider,
      groqConfigured: !!process.env.GROQ_API_KEY,
    });

    if (nextProvider) {
      logger.warn(`Rate limit hit on ${currentProvider}, switching to ${nextProvider}`, {
        errorCode: error?.statusCode || error?.lastError?.statusCode,
      });
      currentProvider = nextProvider;
      
      // Reset to primary provider after 60 seconds (rate limit window)
      if (providerResetTimeout) clearTimeout(providerResetTimeout);
      providerResetTimeout = setTimeout(() => {
        logger.info("Resetting to primary provider (Gemini) after rate limit cooldown");
        currentProvider = "gemini";
        lastProviderError = null;
      }, 60000); // 60 second cooldown
      
      return true; // Retry with new provider
    } else {
      logger.error("No fallback providers available", {
        geminiConfigured: !!process.env.GEMINI_API_KEY,
        groqConfigured: !!process.env.GROQ_API_KEY,
      });
    }
  }
  return false; // Don't retry
}

/**
 * Get the current active model name
 * @returns {string} Model name
 */
export function getModelName() {
  try {
    const { model } = getCurrentModel();
    return model;
  } catch {
    return GEMINI_MODEL;
  }
}

/**
 * Get current provider info
 * @returns {object} Provider info
 */
export function getProviderInfo() {
  return {
    current: currentProvider,
    geminiConfigured: !!process.env.GEMINI_API_KEY,
    groqConfigured: !!process.env.GROQ_API_KEY,
    models: {
      gemini: GEMINI_MODEL,
      groqPrimary: GROQ_PRIMARY_MODEL,
      groqFallback: GROQ_FALLBACK_MODEL,
    },
    lastError: lastProviderError,
  };
}

/**
 * System prompt for the movie/TV assistant agent
 * Designed to be flexible and handle a wide variety of queries
 */
const SYSTEM_PROMPT = `You are PLHub's intelligent AI entertainment assistant. You help users discover, explore, and track movies, TV shows, and related content using real data from TMDB (The Movie Database).

## GOLDEN RULES:
1. Use the right tool for the job - For details, use get_content_details_by_name. For browsing, use search tools.
2. Always use tools - Never make up information. Fetch real data.
3. Complete requests fully - Give users what they asked for.

## MOST IMPORTANT: CHOOSING THE RIGHT TOOL

### For "details", "info", "tell me about" requests:
USE: get_content_details_by_name - This is a ONE-CALL solution that finds the content AND returns full details.

Example: "Give me Zootopia 2 details"
- Call: get_content_details_by_name(title: "Zootopia 2")
- Done! Full details returned in one call.

### For "search", "find", "browse", "what are some" requests:
USE: multi_search - Returns a list of matching results for user to browse.

### For "who is [person]" requests:
USE: multi_search first, then get_person_info with the person's ID.

## AVAILABLE TOOLS:

### ⭐ PRIMARY TOOL for Details (USE THIS FIRST)
- **get_content_details_by_name**: Get full details about ANY movie or TV show by name. ONE call = complete information. Use for: "details about X", "tell me about X", "X info", "what is X about"

### Search & Discovery (for browsing/exploring)
- **multi_search**: Find movies, TV shows, or people. Use when user wants to BROWSE options.
- **get_trending**: What's popular/hot right now
- **discover_by_genre**: Find content by genre
- **get_top_rated**: Best/highest rated content
- **get_similar_content**: "Movies like X" or "shows similar to Y"

### Detail Tools by ID (when you already have the ID)
- **get_movie_details**: Full movie info by TMDB ID
- **get_tv_details**: Full TV show info by TMDB ID
- **get_person_info**: Actor/director info by TMDB ID

### User Features (requires login)
- **get_watchlist / add_to_watchlist / remove_from_watchlist**: Watchlist management
- **get_favorites / add_to_favorites / remove_from_favorites**: Favorites management
- **prepare_review / get_user_reviews / delete_review**: Review management

## QUERY → TOOL MAPPING:

- "Details about X" / "Tell me about X" / "X info" → USE: get_content_details_by_name ✅
- "Search for X" / "Find movies about X" → USE: multi_search
- "What's trending?" / "What's popular?" → USE: get_trending
- "Best movies" / "Top rated shows" → USE: get_top_rated
- "Movies like X" / "Similar to X" → USE: multi_search then get_similar_content
- "Who is [actor]?" → USE: multi_search then get_person_info
- "Add X to watchlist" → USE: get_content_details_by_name then add_to_watchlist

## RESPONSE FORMATTING:
- Use **bold** for titles
- Use ⭐ for ratings (8.5/10 ⭐)
- Use 🎬 for movies, 📺 for TV shows, 👤 for people
- Use bullet points for organized information
- Include genres, release date, runtime/seasons, and overview for details

## SCOPE:
I specialize in movies, TV shows, and entertainment. For other topics, I'll politely redirect to entertainment-related help.

## CONFIRMATION (HITL):
For destructive actions and review submission, always ask user to confirm with "yes" or "no".

Remember: ALWAYS complete the full workflow. If the user wants details, give them complete details in one response.`;

/**
 * System prompt for Groq fallback (uses general knowledge without tool calling)
 */
const GROQ_FALLBACK_PROMPT = `You are PLHub's AI entertainment assistant powered by Llama. You help users discover movies and TV shows.

## Your Capabilities:
- Provide movie/TV recommendations based on genres, themes, actors, or similar titles
- Share plot summaries, cast information, and general details about movies and shows
- Discuss ratings, reviews, and critical reception
- Suggest content based on mood or preferences

## Response Formatting:
- Use **Bold** for movie/TV titles
- Use ⭐ followed by ratings when you know them (e.g., ⭐ 8.5/10)
- Use 🎬 for movies, 📺 for TV shows, 👤 for actors/directors
- Use bullet points for organized lists
- Include year of release when relevant

## Important Notes:
- You're providing information from your training knowledge
- For the most current release dates, box office numbers, or streaming availability, users should check official sources
- You cannot add items to watchlists or perform user-specific actions in this mode

## Example Response Format:
**Movie Title** 🎬 (Year) ⭐ Rating
Brief description of the movie including genre, main cast, and why it's notable.

Now, provide helpful and engaging responses about movies and TV shows!`;

// Track if Groq tools have failed (to avoid retrying with tools)
let groqToolsFailed = false;

/**
 * Reset Groq tools status (called when switching back to Gemini)
 */
function resetGroqToolsStatus() {
  groqToolsFailed = false;
}

/**
 * Create a streaming response using native Groq SDK with tool calling
 * This is used because the @ai-sdk/groq provider has bugs with tool calling
 * @param {Array} messages - Conversation messages
 * @param {string|null} userId - User ID for authenticated actions
 * @returns {AsyncGenerator} - Async generator that yields text chunks
 */
async function* createNativeGroqStream(messages, userId = null) {
  const groqClient = getNativeGroqClient();
  if (!groqClient) {
    throw new Error("Groq client not available");
  }

  const model = currentProvider === "groq_fallback" ? GROQ_FALLBACK_MODEL : GROQ_PRIMARY_MODEL;
  const toolDefs = getToolDefinitions(userId);
  
  logger.info("Creating native Groq stream with tools", {
    model,
    toolCount: toolDefs.length,
    userId,
  });

  // Convert messages to Groq format
  // Note: We use a simplified system prompt for Groq to avoid interfering with tool calling format
  const groqSystemPrompt = `You are PLHub's AI movie assistant. You help users find information about movies and TV shows.

IMPORTANT: When you need information about a specific movie or TV show, use the available tools. 
- For details about a title, use get_content_details_by_name
- For searching, use multi_search
- For trending content, use get_trending

Format your responses with **bold** for titles, emojis (🎬 for movies, 📺 for TV, ⭐ for ratings), and bullet points for lists.`;

  const groqMessages = [
    { role: "system", content: groqSystemPrompt },
    ...messages.map(m => ({
      role: m.role,
      content: typeof m.content === "string" ? m.content : JSON.stringify(m.content),
    })),
  ];

  let continueLoop = true;
  let iterations = 0;
  const maxIterations = MAX_STEPS;

  while (continueLoop && iterations < maxIterations) {
    iterations++;
    logger.info("Native Groq: Iteration start", { iteration: iterations, messageCount: groqMessages.length });
    
    try {
      const response = await groqClient.chat.completions.create({
        model,
        messages: groqMessages,
        tools: toolDefs,
        tool_choice: "auto",
        stream: false, // We'll handle streaming text ourselves
        max_tokens: MAX_TOKENS,
        temperature: 0.7,
      });

      const choice = response.choices[0];
      const message = choice.message;

      // Check if the model wants to call tools
      if (choice.finish_reason === "tool_calls" && message.tool_calls?.length > 0) {
        logger.info("Native Groq: Tool calls requested", {
          toolCount: message.tool_calls.length,
          tools: message.tool_calls.map(tc => tc.function.name),
        });

        // Add assistant message with tool calls to history
        groqMessages.push(message);

        // Execute each tool call
        for (const toolCall of message.tool_calls) {
          const toolName = toolCall.function.name;
          let args;
          
          try {
            args = JSON.parse(toolCall.function.arguments);
          } catch (e) {
            args = {};
            logger.warn("Failed to parse tool arguments", { toolName, rawArgs: toolCall.function.arguments });
          }

          logger.info("Native Groq: Executing tool", { toolName, args });
          const result = await executeToolCall(toolName, args, userId);
          
          const resultJson = JSON.stringify(result);
          logger.info("Native Groq: Tool result", { 
            toolName, 
            resultLength: resultJson.length,
            resultPreview: resultJson.substring(0, 500),
          });
          
          // Add tool result to messages
          groqMessages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: resultJson,
          });

          logger.info("Native Groq: Tool executed", { toolName, hasResult: !!result });
        }

        logger.info("Native Groq: Continuing with tool results", { 
          messageCount: groqMessages.length,
          lastMessageRole: groqMessages[groqMessages.length - 1]?.role,
        });
        
        // Continue the loop to get the final response
        continue;
      }

      // No more tool calls - stream the final text response
      if (message.content) {
        // Yield the text in chunks to simulate streaming
        const text = message.content;
        const chunkSize = 10; // Characters per chunk
        for (let i = 0; i < text.length; i += chunkSize) {
          yield text.slice(i, i + chunkSize);
          // Small delay to simulate streaming
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      }

      continueLoop = false;
    } catch (error) {
      logger.error("Native Groq stream error", { error: error.message });
      throw error;
    }
  }

  if (iterations >= maxIterations) {
    yield "\n\n⚠️ Maximum tool call iterations reached. Response may be incomplete.";
  }
}

/**
 * Create a readable stream from native Groq generator
 * @param {Array} messages - Conversation messages
 * @param {string|null} userId - User ID
 * @returns {object} - Object with textStream property that yields strings
 */
export async function createNativeGroqChatStream(messages, userId = null) {
  const generator = createNativeGroqStream(messages, userId);
  
  // Create an async iterable that yields strings (compatible with controller code)
  const textStream = {
    async *[Symbol.asyncIterator]() {
      for await (const chunk of generator) {
        yield chunk;
      }
    },
    getReader() {
      const iterator = this[Symbol.asyncIterator]();
      return {
        async read() {
          const { value, done } = await iterator.next();
          return { value, done };
        },
      };
    },
  };

  return { textStream };
}

/**
 * Create a streaming chat response with automatic provider fallback
 * @param {Array} messages - Conversation messages in Vercel AI SDK format
 * @param {string|null} userId - User ID for authenticated actions
 * @param {number} retryCount - Internal retry counter
 * @param {boolean} disableTools - Force disable tools (for Groq retry)
 * @returns {Promise<StreamTextResult>} - Streaming result
 */
export async function createChatStream(messages, userId = null, retryCount = 0, disableTools = false) {
  const { provider, model, name } = getCurrentModel();
  
  // Determine if we should use tools
  const isGroqProvider = currentProvider.startsWith("groq");
  
  // For Groq with tools enabled, use native Groq SDK (fixes tool calling bugs in @ai-sdk/groq)
  if (isGroqProvider && !disableTools && !groqToolsFailed) {
    logger.info("Using native Groq SDK for tool calling", { 
      userId, 
      messageCount: messages.length,
      provider: name,
      model,
    });
    
    try {
      return await createNativeGroqChatStream(messages, userId);
    } catch (error) {
      logger.error("Native Groq stream failed", { error: error.message });
      // Mark Groq tools as failed and retry without tools
      groqToolsFailed = true;
      return createChatStream(messages, userId, retryCount, true);
    }
  }
  
  const shouldUseTools = !disableTools && !isGroqProvider; // Only use Vercel SDK tools for Gemini
  const tools = shouldUseTools ? createTools(userId) : undefined;
  const systemPrompt = (isGroqProvider && !shouldUseTools) ? GROQ_FALLBACK_PROMPT : SYSTEM_PROMPT;

  logger.info("Creating chat stream", { 
    userId, 
    messageCount: messages.length,
    hasUser: !!userId,
    provider: name,
    model,
    hasTools: !!tools,
    usingNativeGroq: false,
  });

  try {
    const streamConfig = {
      model: provider(model),
      system: systemPrompt,
      messages,
      temperature: 0.7,
      maxTokens: MAX_TOKENS,
      maxRetries: 0, // Disable SDK retries - we handle fallback ourselves
    };

    // Add tool-related config if tools are enabled (Gemini only)
    if (tools) {
      streamConfig.tools = tools;
      streamConfig.maxSteps = MAX_STEPS;
      streamConfig.toolChoice = "auto";
      streamConfig.onStepFinish = ({ stepType, toolCalls, toolResults }) => {
        if (stepType === "tool-result") {
          logger.info("Tool execution completed", {
            toolCalls: toolCalls?.map(tc => tc.toolName),
            resultCount: toolResults?.length,
          });
        }
      };
    }

    const result = streamText(streamConfig);

    return result;
  } catch (error) {
    // Check if we should retry with a different provider
    if (retryCount < 2 && handleProviderFailure(error)) {
      logger.info(`Retrying with fallback provider (attempt ${retryCount + 1})`);
      return createChatStream(messages, userId, retryCount + 1);
    }
    throw error;
  }
}

/**
 * Generate a non-streaming chat response with automatic provider fallback
 * @param {Array} messages - Conversation messages
 * @param {string|null} userId - User ID for authenticated actions
 * @param {number} retryCount - Internal retry counter
 * @returns {Promise<object>} - Generated response with text and tool results
 */
export async function generateChatResponse(messages, userId = null, retryCount = 0) {
  const tools = createTools(userId);
  const { provider, model, name } = getCurrentModel();

  logger.info("Generating chat response", { 
    userId, 
    messageCount: messages.length,
    provider: name,
    model,
  });

  let result;
  try {
    logger.info("Calling AI with tools", { 
      provider: name,
      model,
      toolCount: Object.keys(tools).length,
      toolNames: Object.keys(tools)
    });
    
    result = await generateText({
      model: provider(model),
      system: SYSTEM_PROMPT,
      messages,
      tools,
      maxSteps: MAX_STEPS,
      temperature: 0.7,
      maxTokens: MAX_TOKENS,
      toolChoice: "auto",
      maxRetries: 0, // Disable SDK retries - we handle fallback ourselves
      onStepFinish: ({ stepType, toolCalls, toolResults, text }) => {
        logger.info("Step finished", {
          stepType,
          toolCallCount: toolCalls?.length || 0,
          toolResultCount: toolResults?.length || 0,
          hasText: !!text
        });
      },
    });
    
    logger.info("AI response received", {
      provider: name,
      hasText: !!result.text,
      textLength: result.text?.length || 0,
      stepsCount: result.steps?.length || 0,
      totalToolCalls: result.steps?.flatMap(s => s.toolCalls || []).length || 0
    });
  } catch (error) {
    logger.error("generateText error", { 
      error: error.message,
      errorName: error.name,
      provider: name,
      model,
      messageCount: messages.length 
    });
    
    // Check if we should retry with a different provider
    if (retryCount < 2 && handleProviderFailure(error)) {
      logger.info(`Retrying with fallback provider (attempt ${retryCount + 1})`);
      return generateChatResponse(messages, userId, retryCount + 1);
    }
    throw error;
  }

  // Extract media recommendations from tool results
  const mediaRecommendations = extractMediaFromToolResults(result.steps);

  // Check for pending actions in tool results
  const pendingAction = extractPendingAction(result.steps);

  // Get response text - if empty but we have tool results, generate from them
  let responseText = result.text;
  
  if (!responseText && result.steps?.length > 0) {
    // AI called tools but didn't generate final text - create response from tool results
    logger.info("AI returned empty text, checking steps for tool results", {
      stepsCount: result.steps.length,
      stepsInfo: result.steps.map(s => ({
        toolCalls: s.toolCalls?.length || 0,
        toolResults: s.toolResults?.length || 0,
        toolNames: s.toolCalls?.map(tc => tc.toolName) || [],
        resultKeys: s.toolResults?.map(tr => Object.keys(tr)) || [],
        hasResultProp: s.toolResults?.map(tr => "result" in tr) || [],
        hasOutputProp: s.toolResults?.map(tr => "output" in tr) || [],
      }))
    });
    
    responseText = generateResponseFromToolResults(result.steps);
    logger.info("Generated response from tool results", { 
      hasToolResults: true,
      generatedLength: responseText.length 
    });
  } else if (!responseText) {
    logger.warn("AI returned empty text with no steps");
  }

  return {
    text: responseText,
    toolCalls: result.steps.flatMap(step => step.toolCalls || []),
    toolResults: result.steps.flatMap(step => step.toolResults || []),
    mediaRecommendations,
    pendingAction,
    usage: result.usage,
  };
}

/**
 * Safely extract data from a tool result, handling different Vercel AI SDK versions
 * @param {object} result - Tool result object
 * @returns {object|null} - Extracted data or null
 */
function extractToolResultData(result) {
  if (!result) return null;

  // Vercel AI SDK v3/v4 - result is directly the return value from tool execute function
  // Try multiple paths to handle different versions
  let data = null;

  // Direct result (most common in Vercel AI SDK v3+)
  if (result.result !== undefined) {
    data = result.result;
  } else if (result.output !== undefined) {
    data = result.output;
  } else if (result.value !== undefined) {
    data = result.value;
  } else if (result.data !== undefined) {
    data = result.data;
  } else if (typeof result === "object" && !Array.isArray(result)) {
    // If result itself is the data object (some versions)
    // Check if it has expected tool result properties
    if (result.movies || result.shows || result.trending || 
        result.similar || result.items || result.topRated ||
        result.watchlist || result.favorites || result.success !== undefined) {
      data = result;
    }
  }

  if (data === null || data === undefined) return null;

  // Parse stringified JSON if needed
  if (typeof data === "string") {
    try {
      data = JSON.parse(data);
    } catch {
      // If not valid JSON, return null for object-expecting callers
      return null;
    }
  }

  return data;
}

/**
 * Extract media items from tool results for UI display
 * @param {Array} steps - Generation steps with tool results
 * @returns {Array} - Media items for UI cards
 */
function extractMediaFromToolResults(steps) {
  const mediaItems = [];
  const seenIds = new Set();

  if (!steps || !Array.isArray(steps)) {
    logger.debug("extractMediaFromToolResults: No steps provided");
    return mediaItems;
  }

  for (const step of steps) {
    if (!step.toolResults || !Array.isArray(step.toolResults)) continue;

    for (const result of step.toolResults) {
      const data = extractToolResultData(result);
      if (!data || typeof data !== "object") continue;

      logger.debug("Processing tool result data", { 
        toolName: result.toolName,
        dataKeys: Object.keys(data),
      });

      // Extract from various tool result formats
      const itemsToProcess = [
        ...(Array.isArray(data.movies) ? data.movies : []),
        ...(Array.isArray(data.shows) ? data.shows : []),
        ...(Array.isArray(data.trending) ? data.trending : []),
        ...(Array.isArray(data.similar) ? data.similar : []),
        ...(Array.isArray(data.items) ? data.items : []),
        ...(Array.isArray(data.topRated) ? data.topRated : []),
        ...(Array.isArray(data.watchlist) ? data.watchlist : []),
        ...(Array.isArray(data.favorites) ? data.favorites : []),
      ];

      // Add single item results (get_movie_details, get_tv_details)
      if (data.id && data.title && !data.movies && !data.shows) {
        itemsToProcess.push(data);
      }

      for (const item of itemsToProcess) {
        if (item && item.id && !seenIds.has(item.id)) {
          seenIds.add(item.id);
          mediaItems.push({
            id: item.id,
            title: item.title || item.mediaTitle || item.name,
            mediaType: item.mediaType,
            posterPath: item.posterPath || item.mediaPoster,
            backdropPath: item.backdropPath,
            voteAverage: item.rating || item.voteAverage,
            overview: item.overview,
            releaseDate: item.releaseDate || item.firstAirDate,
          });
        }
      }
    }
  }

  logger.debug("extractMediaFromToolResults completed", { 
    itemCount: mediaItems.length 
  });
  
  return mediaItems.slice(0, 6);
}

/**
 * Extract pending action from tool results (for review confirmation flow)
 * @param {Array} steps - Generation steps with tool results
 * @returns {object|null} - Pending action or null
 */
function extractPendingAction(steps) {
  if (!steps || !Array.isArray(steps)) return null;

  for (const step of steps) {
    if (!step.toolResults || !Array.isArray(step.toolResults)) continue;

    for (const result of step.toolResults) {
      const data = extractToolResultData(result);
      if (!data || typeof data !== "object") continue;
      
      if (data.pendingAction) {
        logger.info("Found pending action", { 
          type: data.pendingAction.type,
          toolName: result.toolName 
        });
        return data.pendingAction;
      }
    }
  }
  return null;
}

/**
 * Generate a human-readable response from tool results when AI returns empty text
 * @param {Array} steps - Generation steps with tool results
 * @returns {string} - Formatted response text
 */
function generateResponseFromToolResults(steps) {
  const responses = [];
  
  if (!steps || !Array.isArray(steps)) {
    logger.warn("generateResponseFromToolResults: No steps provided");
    return "I couldn't process the results. Please try again.";
  }
  
  logger.info("Processing steps for response generation", { 
    stepCount: steps.length 
  });
  
  for (const step of steps) {
    if (!step.toolResults || !Array.isArray(step.toolResults)) {
      logger.debug("Step has no toolResults", { 
        hasToolCalls: !!step.toolCalls,
        toolCallCount: step.toolCalls?.length || 0
      });
      continue;
    }
    
    logger.info("Processing tool results", { 
      resultCount: step.toolResults.length 
    });
    
    for (const result of step.toolResults) {
      const toolName = result.toolName;
      const data = extractToolResultData(result);
      
      logger.debug("Processing tool result", { 
        toolName, 
        hasData: !!data,
        dataType: typeof data,
        dataKeys: data && typeof data === "object" ? Object.keys(data) : []
      });
      
      if (!data || typeof data !== "object") continue;
      
      // Format based on tool type
      switch (toolName) {
        case "get_trending": {
          if (data.error) {
            responses.push(`⚠️ ${data.error}`);
            break;
          }
          
          const items = Array.isArray(data.trending) ? data.trending : [];
          if (items.length > 0) {
            responses.push("🔥 **Here's what's trending this week!**\n");
            items.forEach((item, idx) => {
              const type = item.mediaType === "tv" ? "📺" : "🎬";
              const rating = item.rating ? `⭐ ${Number(item.rating).toFixed(1)}` : "";
              responses.push(`${idx + 1}. ${type} **${item.title}** ${rating}`);
            });
          } else {
            responses.push("I couldn't fetch trending content at the moment. Please try again.");
          }
          break;
        }
        
        case "search_movies": {
          // Handle errors first
          if (data.error) {
            responses.push(`⚠️ ${data.error}`);
            break;
          }
          
          const items = Array.isArray(data.movies) ? data.movies : [];
          if (items.length > 0) {
            responses.push("🎬 **Movies found:**\n");
            items.forEach((item, idx) => {
              const year = item.releaseDate ? `(${item.releaseDate.substring(0, 4)})` : "";
              const rating = item.rating ? `⭐ ${Number(item.rating).toFixed(1)}` : "";
              responses.push(`${idx + 1}. **${item.title}** ${year} ${rating}`);
              if (item.overview) {
                responses.push(`   _${item.overview}_\n`);
              }
            });
          } else {
            responses.push("I couldn't find any movies matching your search. Please try a different search term.");
          }
          break;
        }
        
        case "search_tv_shows": {
          // Handle errors first
          if (data.error) {
            responses.push(`⚠️ ${data.error}`);
            break;
          }
          
          const items = Array.isArray(data.shows) ? data.shows : [];
          if (items.length > 0) {
            responses.push("📺 **TV Shows found:**\n");
            items.forEach((item, idx) => {
              const year = item.firstAirDate ? `(${item.firstAirDate.substring(0, 4)})` : "";
              const rating = item.rating ? `⭐ ${Number(item.rating).toFixed(1)}` : "";
              responses.push(`${idx + 1}. **${item.title}** ${year} ${rating}`);
              if (item.overview) {
                responses.push(`   _${item.overview}_\n`);
              }
            });
          } else {
            responses.push("I couldn't find any TV shows matching your search. Please try a different search term.");
          }
          break;
        }
        
        case "get_content_details_by_name":
        case "get_movie_details":
        case "get_tv_details": {
          // Handle errors first
          if (data.error) {
            responses.push(`⚠️ ${data.error}`);
            break;
          }
          
          if (data.title) {
            const type = data.mediaType === "tv" ? "📺" : "🎬";
            responses.push(`${type} **${data.title}**\n`);
            if (data.rating) responses.push(`⭐ **Rating:** ${Number(data.rating).toFixed(1)}/10 (${data.voteCount?.toLocaleString() || 0} votes)`);
            if (data.releaseDate) responses.push(`📅 **Released:** ${data.releaseDate}`);
            if (data.firstAirDate) responses.push(`📅 **First Aired:** ${data.firstAirDate}`);
            if (data.lastAirDate && data.status === "Ended") responses.push(`📅 **Ended:** ${data.lastAirDate}`);
            if (data.runtime) responses.push(`⏱️ **Runtime:** ${data.runtime} min`);
            if (data.numberOfSeasons) responses.push(`📺 **Seasons:** ${data.numberOfSeasons} (${data.numberOfEpisodes || 0} episodes)`);
            if (data.status) responses.push(`📊 **Status:** ${data.status}`);
            if (Array.isArray(data.genres) && data.genres.length) {
              responses.push(`🎭 **Genres:** ${data.genres.join(", ")}`);
            }
            if (Array.isArray(data.networks) && data.networks.length) {
              responses.push(`📡 **Networks:** ${data.networks.join(", ")}`);
            }
            if (Array.isArray(data.productionCompanies) && data.productionCompanies.length) {
              responses.push(`🏢 **Studios:** ${data.productionCompanies.join(", ")}`);
            }
            if (data.tagline) responses.push(`\n> _"${data.tagline}"_`);
            if (data.overview) responses.push(`\n**Overview:**\n${data.overview}`);
          }
          break;
        }
        
        case "get_similar_content": {
          if (data.error) {
            responses.push(`⚠️ ${data.error}`);
            break;
          }
          
          const items = Array.isArray(data.similar) ? data.similar : [];
          if (items.length > 0) {
            responses.push("🎯 **Similar titles you might enjoy:**\n");
            items.forEach((item, idx) => {
              const rating = item.rating ? `⭐ ${Number(item.rating).toFixed(1)}` : "";
              responses.push(`${idx + 1}. **${item.title}** ${rating}`);
            });
          } else {
            responses.push("I couldn't find similar titles at the moment.");
          }
          break;
        }
        
        case "discover_by_genre": {
          if (data.error) {
            responses.push(`⚠️ ${data.error}`);
            break;
          }
          
          const items = Array.isArray(data.items) ? data.items : [];
          if (items.length > 0) {
            const genre = data.genre || "this genre";
            responses.push(`🎭 **${genre} picks:**\n`);
            items.forEach((item, idx) => {
              const rating = item.rating ? `⭐ ${Number(item.rating).toFixed(1)}` : "";
              responses.push(`${idx + 1}. **${item.title}** ${rating}`);
            });
          } else {
            responses.push(`I couldn't find any ${data.genre || "genre"} content at the moment.`);
          }
          break;
        }
        
        case "get_top_rated": {
          if (data.error) {
            responses.push(`⚠️ ${data.error}`);
            break;
          }
          
          const items = Array.isArray(data.topRated) ? data.topRated : [];
          if (items.length > 0) {
            const type = data.mediaType === "tv" ? "TV Shows" : "Movies";
            responses.push(`🏆 **Top Rated ${type}:**\n`);
            items.forEach((item, idx) => {
              const rating = item.rating ? `⭐ ${Number(item.rating).toFixed(1)}` : "";
              responses.push(`${idx + 1}. **${item.title}** ${rating}`);
            });
          } else {
            responses.push("I couldn't fetch top rated content at the moment.");
          }
          break;
        }
        
        case "add_to_watchlist":
        case "add_to_favorites":
        case "remove_from_watchlist":
        case "remove_from_favorites":
        case "update_watchlist_item": {
          if (data.success !== undefined) {
            responses.push(data.message || (data.success ? "✅ Done!" : "❌ Action failed"));
          }
          if (data.requiresAuth) {
            responses.push("🔐 Please sign in to use this feature.");
          }
          if (data.requiresConfirmation) {
            responses.push(data.message);
          }
          break;
        }
        
        case "get_watchlist": {
          const items = Array.isArray(data.watchlist) ? data.watchlist : [];
          if (items.length > 0) {
            responses.push(`📋 **Your Watchlist** (${items.length} items):\n`);
            items.forEach((item, idx) => {
              const type = item.mediaType === "tv" ? "📺" : "🎬";
              const status = item.status ? `[${item.status.replace(/_/g, " ")}]` : "";
              responses.push(`${idx + 1}. ${type} **${item.mediaTitle}** ${status}`);
            });
          } else if (data.message) {
            responses.push(data.message);
          } else {
            responses.push("📋 Your watchlist is empty! Start adding movies and shows.");
          }
          break;
        }
        
        case "get_favorites": {
          const items = Array.isArray(data.favorites) ? data.favorites : [];
          if (items.length > 0) {
            responses.push(`❤️ **Your Favorites** (${items.length} items):\n`);
            items.forEach((item, idx) => {
              const type = item.mediaType === "tv" ? "📺" : "🎬";
              responses.push(`${idx + 1}. ${type} **${item.mediaTitle}**`);
            });
          } else if (data.message) {
            responses.push(data.message);
          } else {
            responses.push("❤️ No favorites yet! Mark your favorite movies and shows.");
          }
          break;
        }
        
        case "prepare_review": {
          if (data.requiresConfirmation) {
            responses.push(data.message);
          } else if (data.message) {
            responses.push(data.message);
          }
          break;
        }
        
        case "get_user_reviews": {
          const items = Array.isArray(data.reviews) ? data.reviews : [];
          if (items.length > 0) {
            responses.push(`📝 **Your Reviews:**\n`);
            items.forEach((item, idx) => {
              responses.push(`${idx + 1}. **${item.mediaTitle}** - ⭐ ${item.rating}/10`);
              if (item.preview) responses.push(`   _${item.preview}_`);
            });
          } else if (data.message) {
            responses.push(data.message);
          }
          break;
        }
        
        case "delete_review": {
          responses.push(data.message || (data.success ? "✅ Review deleted" : "❌ Could not delete review"));
          break;
        }
        
        case "multi_search": {
          if (data.error) {
            responses.push(`⚠️ ${data.error}`);
            break;
          }
          
          const results = Array.isArray(data.results) ? data.results : [];
          if (results.length > 0) {
            // Only show search results if there are multiple or if AI didn't get details
            // The AI should automatically call get_details for the top result when user wants details
            responses.push("🔍 **Search Results:**\n");
            results.forEach((item, idx) => {
              if (item.mediaType === "person") {
                responses.push(`${idx + 1}. 👤 **${item.name}** (${item.knownFor || "Person"})`);
              } else {
                const type = item.mediaType === "tv" ? "📺" : "🎬";
                const year = item.releaseDate ? `(${item.releaseDate.substring(0, 4)})` : "";
                const rating = item.rating ? `⭐ ${Number(item.rating).toFixed(1)}` : "";
                responses.push(`${idx + 1}. ${type} **${item.title}** ${year} ${rating}`);
                if (item.overview) {
                  responses.push(`   _${item.overview}_\n`);
                }
              }
            });
            // Don't show the hint to users - it's for AI internal use
          } else {
            responses.push("I couldn't find anything matching your search. Try a different search term.");
          }
          break;
        }
        
        case "get_person_info": {
          if (data.error) {
            responses.push(`⚠️ ${data.error}`);
            break;
          }
          
          if (data.name) {
            responses.push(`👤 **${data.name}**\n`);
            if (data.knownForDepartment) responses.push(`🎬 **Known for:** ${data.knownForDepartment}`);
            if (data.birthday) {
              const age = data.deathday 
                ? `(${new Date(data.birthday).getFullYear()} - ${new Date(data.deathday).getFullYear()})`
                : `(Age: ${new Date().getFullYear() - new Date(data.birthday).getFullYear()})`;
              responses.push(`🎂 **Born:** ${data.birthday} ${age}`);
            }
            if (data.placeOfBirth) responses.push(`📍 **From:** ${data.placeOfBirth}`);
            if (data.biography) responses.push(`\n${data.biography}`);
            
            if (data.knownFor && data.knownFor.length > 0) {
              responses.push("\n🌟 **Notable Works:**");
              data.knownFor.forEach((work, idx) => {
                const role = work.character ? `as ${work.character}` : "";
                const year = work.year ? `(${work.year})` : "";
                responses.push(`${idx + 1}. **${work.title}** ${year} ${role}`);
              });
            }
          }
          break;
        }
        
        default: {
          // Handle errors first
          if (data.error) {
            responses.push(`⚠️ ${data.error}`);
            break;
          }
          
          // Generic formatting for unknown tools
          if (data.message) {
            responses.push(data.message);
          } else if (data.success === false) {
            responses.push("❌ The request could not be completed.");
          } else {
            // Try to extract any array of items
            const possibleArrays = ["items", "results", "movies", "shows", "similar", "trending", "topRated"];
            for (const key of possibleArrays) {
              if (Array.isArray(data[key]) && data[key].length > 0) {
                responses.push("Here's what I found:\n");
                data[key].slice(0, 6).forEach((item, idx) => {
                  const title = item.title || item.name || item.mediaTitle;
                  if (title) {
                    const rating = item.rating || item.voteAverage;
                    responses.push(`${idx + 1}. **${title}**${rating ? ` ⭐ ${Number(rating).toFixed(1)}` : ""}`);
                  }
                });
                break;
              }
            }
          }
        }
      }
    }
  }
  
  if (responses.length === 0) {
    logger.warn("generateResponseFromToolResults: No responses generated from tool results");
    return "I processed your request but couldn't format the results properly. Please try rephrasing your question.";
  }
  
  return responses.join("\n");
}

/**
 * Handle confirmation of pending action
 * @param {string} userId - User ID
 * @param {object} pendingAction - Pending action to confirm
 * @returns {Promise<object>} - Confirmation result
 */
export async function handleConfirmAction(userId, pendingAction) {
  return confirmAction(userId, pendingAction);
}

/**
 * Check if a message is a confirmation
 * @param {string} message - User message
 * @returns {boolean}
 */
export function isConfirmation(message) {
  const confirmPatterns = [
    /^(yes|yep|yeah|sure|ok|okay|confirm|submit|go ahead|do it|approved?|accept)/i,
    /^(sounds? good|let'?s? do it|perfect|great)/i,
  ];
  return confirmPatterns.some((pattern) => pattern.test(message.trim()));
}

/**
 * Check if a message is a cancellation
 * @param {string} message - User message
 * @returns {boolean}
 */
export function isCancellation(message) {
  const cancelPatterns = [
    /^(no|nope|cancel|stop|don'?t|nevermind|forget it)/i,
  ];
  return cancelPatterns.some((pattern) => pattern.test(message.trim()));
}

export default { 
  createChatStream, 
  generateChatResponse, 
  handleConfirmAction,
  isConfirmation,
  isCancellation,
};
