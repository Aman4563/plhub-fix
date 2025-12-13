/**
 * User Agent - Specialized agent for user management
 * Handles: watchlist, favorites, reviews
 * 
 * OPTIMIZED: Minimal tool calls, efficient database operations
 * Uses shared utilities for logging and sanitization
 */

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import watchlistModel from "../../models/watchlist.model.js";
import favoriteModel from "../../models/favorite.model.js";
import reviewModel from "../../models/review.model.js";
import logger from "../../config/logger.config.js";

// Shared utilities
import { sanitizeInput } from "../../utils/sanitization.js";
import { 
  executeWithLogging, 
  getCurrentContext, 
  runWithContext 
} from "../utils/agentLogging.js";

// Re-export for backwards compatibility
export { runWithContext };

// Configuration from environment variables
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

// Optimized user agent prompt
const USER_AGENT_PROMPT = `You are a personal assistant for managing the user's movie/TV watchlist, favorites, and reviews.

## CRITICAL RULES:
1. **ONE TOOL PER ACTION** - Don't call multiple tools for the same task
2. **CONFIRM BEFORE ACTING** - For destructive actions (remove, delete), confirm with user
3. **MINIMAL OUTPUT** - Keep confirmations short and friendly

## TOOL SELECTION:
- "Add X to watchlist" → add_to_watchlist (ONE call)
- "Show my watchlist" → get_watchlist (ONE call)
- "Remove from watchlist" → remove_from_watchlist (ONE call, ask for confirmation first)
- "Add to favorites" → add_to_favorites (ONE call)
- "Show favorites" → get_favorites (ONE call)
- "Write a review" → prepare_review (requires confirmation before submitting)

## AUTH HANDLING:
- If user isn't logged in, politely ask them to sign in
- Don't attempt database operations without userId

Format responses with emojis and brief confirmations:
- ✅ Added to watchlist!
- ❤️ Added to favorites!
- 📝 Review prepared, confirm to submit`;

/**
 * Create LangChain tools for user management
 * Tools get userId from AsyncLocalStorage context instead of closure
 * This ensures fresh userId for each request
 */
function createLangChainUserTools() {
  const addToWatchlist = new DynamicStructuredTool({
    name: "add_to_watchlist",
    description: "Add a movie or TV show to the user's watchlist. Requires mediaId, mediaType, and title.",
    schema: z.object({
      mediaId: z.number().describe("The TMDB ID of the media"),
      mediaType: z.enum(["movie", "tv"]).describe("Type of media"),
      mediaTitle: z.string().describe("Title of the media"),
      mediaPoster: z.string().optional().describe("Poster path"),
      mediaRate: z.number().optional().describe("Rating"),
    }),
    func: async ({ mediaId, mediaType, mediaTitle, mediaPoster = "", mediaRate = 0 }) => {
      const { userId, logSessionId } = getCurrentContext();
      
      return executeWithLogging("add_to_watchlist", { mediaId, mediaTitle }, async () => {
        logger.info("User Agent: add_to_watchlist", { mediaId, mediaTitle, userId });
        if (!userId) {
          return JSON.stringify({ success: false, requiresAuth: true, message: "🔐 Please sign in to add items to your watchlist." });
        }

        const existing = await watchlistModel.findOne({ user: userId, mediaId: mediaId.toString() });
        if (existing) {
          return JSON.stringify({ success: true, alreadyExists: true, message: `📋 "${mediaTitle}" is already in your watchlist!` });
        }

        const item = await watchlistModel.create({
          user: userId,
          mediaId: mediaId.toString(),
          mediaType,
          mediaTitle,
          mediaPoster,
          mediaRate,
        });

        return JSON.stringify({ 
          success: true, 
          message: `✅ Added "${mediaTitle}" to your watchlist!`,
          item: { id: item._id.toString(), mediaId: item.mediaId, mediaTitle: item.mediaTitle }
        });
      }, logSessionId);
    },
  });

  const removeFromWatchlist = new DynamicStructuredTool({
    name: "remove_from_watchlist",
    description: "Remove a movie or TV show from the user's watchlist. Requires confirmation.",
    schema: z.object({
      mediaId: z.number().describe("The TMDB ID of the media to remove"),
      mediaTitle: z.string().optional().describe("Title for confirmation message"),
      confirmed: z.boolean().default(false).describe("Whether user confirmed"),
    }),
    func: async ({ mediaId, mediaTitle, confirmed }) => {
      const { userId, logSessionId } = getCurrentContext();
      
      return executeWithLogging("remove_from_watchlist", { mediaId, confirmed }, async () => {
        logger.info("User Agent: remove_from_watchlist", { mediaId, confirmed, userId });
        if (!userId) {
          return JSON.stringify({ success: false, requiresAuth: true, message: "🔐 Please sign in to manage your watchlist." });
        }

        const item = await watchlistModel.findOne({ user: userId, mediaId: mediaId.toString() });
        if (!item) {
          return JSON.stringify({ success: false, message: "❌ Item not found in your watchlist." });
        }

        const title = mediaTitle || item.mediaTitle;

        if (!confirmed) {
          return JSON.stringify({
            success: true,
            requiresConfirmation: true,
            message: `🗑️ Remove **"${title}"** from watchlist?\n\nSay **"yes"** to confirm.`,
            pendingAction: { type: "remove_watchlist", mediaId: mediaId.toString(), mediaTitle: title },
          });
        }

        await watchlistModel.findOneAndDelete({ user: userId, mediaId: mediaId.toString() });
        return JSON.stringify({ success: true, message: `✅ Removed "${title}" from your watchlist.` });
      }, logSessionId);
    },
  });

  const getWatchlist = new DynamicStructuredTool({
    name: "get_watchlist",
    description: "Get the user's current watchlist.",
    schema: z.object({
      mediaType: z.enum(["movie", "tv"]).optional().describe("Filter by media type"),
    }),
    func: async ({ mediaType }) => {
      const { userId, logSessionId } = getCurrentContext();
      
      return executeWithLogging("get_watchlist", { mediaType }, async () => {
        logger.info("User Agent: get_watchlist", { mediaType, userId });
        if (!userId) {
          return JSON.stringify({ success: false, requiresAuth: true, message: "🔐 Please sign in to view your watchlist." });
        }

        const filter = { user: userId };
        if (mediaType) filter.mediaType = mediaType;

        const items = await watchlistModel.find(filter).sort({ createdAt: -1 }).limit(10).lean();
        
        if (items.length === 0) {
          return JSON.stringify({
            success: true,
            message: "📋 Your watchlist is empty! Start adding movies and shows you want to watch.",
            watchlist: [],
            totalCount: 0,
          });
        }

        return JSON.stringify({
          success: true,
          watchlist: items.map((item) => ({
            mediaId: item.mediaId,
            mediaType: item.mediaType,
            mediaTitle: item.mediaTitle,
            status: item.status || "plan_to_watch",
          })),
          totalCount: items.length,
        });
      }, logSessionId);
    },
  });

  const updateWatchlistItem = new DynamicStructuredTool({
    name: "update_watchlist_item",
    description: "Update the status of a watchlist item (plan_to_watch, watching, completed, on_hold, dropped).",
    schema: z.object({
      mediaId: z.number().describe("The TMDB ID of the media"),
      status: z.enum(["plan_to_watch", "watching", "completed", "on_hold", "dropped"]).describe("New status"),
      notes: z.string().optional().describe("Optional notes"),
    }),
    func: async ({ mediaId, status, notes }) => {
      const { userId, logSessionId } = getCurrentContext();
      
      return executeWithLogging("update_watchlist_item", { mediaId, status }, async () => {
        logger.info("User Agent: update_watchlist_item", { mediaId, status, userId });
        if (!userId) {
          return JSON.stringify({ success: false, requiresAuth: true, message: "🔐 Please sign in to update your watchlist." });
        }

        const updateData = { status };
        if (notes !== undefined) updateData.notes = sanitizeInput(notes).substring(0, 500);

        const item = await watchlistModel.findOneAndUpdate(
          { user: userId, mediaId: mediaId.toString() },
          updateData,
          { new: true }
        );

        if (!item) {
          return JSON.stringify({ success: false, message: "❌ Item not found in your watchlist." });
        }

        const statusEmojis = {
          plan_to_watch: "📋 Planning to watch",
          watching: "👀 Currently watching",
          completed: "✅ Completed!",
          on_hold: "⏸️ On hold",
          dropped: "❌ Dropped",
        };

        return JSON.stringify({ 
          success: true, 
          message: `${statusEmojis[status]}: **"${item.mediaTitle}"**`
        });
      }, logSessionId);
    },
  });

  const addToFavorites = new DynamicStructuredTool({
    name: "add_to_favorites",
    description: "Add a movie or TV show to the user's favorites.",
    schema: z.object({
      mediaId: z.number().describe("The TMDB ID of the media"),
      mediaType: z.enum(["movie", "tv"]).describe("Type of media"),
      mediaTitle: z.string().describe("Title of the media"),
      mediaPoster: z.string().optional().describe("Poster path"),
      mediaRate: z.number().optional().describe("Rating"),
    }),
    func: async ({ mediaId, mediaType, mediaTitle, mediaPoster = "", mediaRate = 0 }) => {
      const { userId, logSessionId } = getCurrentContext();
      
      return executeWithLogging("add_to_favorites", { mediaId, mediaTitle }, async () => {
        logger.info("User Agent: add_to_favorites", { mediaId, mediaTitle, userId });
        if (!userId) {
          return JSON.stringify({ success: false, requiresAuth: true, message: "🔐 Please sign in to add favorites." });
        }

        const existing = await favoriteModel.findOne({ user: userId, mediaId: mediaId.toString() });
        if (existing) {
          return JSON.stringify({ success: true, alreadyExists: true, message: `❤️ "${mediaTitle}" is already in your favorites!` });
        }

        const item = await favoriteModel.create({
          user: userId,
          mediaId: mediaId.toString(),
          mediaType,
          mediaTitle,
          mediaPoster,
          mediaRate,
        });

        return JSON.stringify({ 
          success: true, 
          message: `❤️ Added "${mediaTitle}" to your favorites!`,
          item: { id: item._id.toString(), mediaId: item.mediaId, mediaTitle: item.mediaTitle }
        });
      }, logSessionId);
    },
  });

  const removeFromFavorites = new DynamicStructuredTool({
    name: "remove_from_favorites",
    description: "Remove a movie or TV show from the user's favorites. Requires confirmation.",
    schema: z.object({
      mediaId: z.number().describe("The TMDB ID of the media to remove"),
      mediaTitle: z.string().optional().describe("Title for confirmation message"),
      confirmed: z.boolean().default(false).describe("Whether user confirmed"),
    }),
    func: async ({ mediaId, mediaTitle, confirmed }) => {
      const { userId, logSessionId } = getCurrentContext();
      
      return executeWithLogging("remove_from_favorites", { mediaId, confirmed }, async () => {
        logger.info("User Agent: remove_from_favorites", { mediaId, confirmed, userId });
        if (!userId) {
          return JSON.stringify({ success: false, requiresAuth: true, message: "🔐 Please sign in to manage favorites." });
        }

        const item = await favoriteModel.findOne({ user: userId, mediaId: mediaId.toString() });
        if (!item) {
          return JSON.stringify({ success: false, message: "❌ Item not found in your favorites." });
        }

        const title = mediaTitle || item.mediaTitle;

        if (!confirmed) {
          return JSON.stringify({
            success: true,
            requiresConfirmation: true,
            message: `💔 Remove **"${title}"** from favorites?\n\nSay **"yes"** to confirm.`,
            pendingAction: { type: "remove_favorites", mediaId: mediaId.toString(), mediaTitle: title },
          });
        }

        await favoriteModel.findOneAndDelete({ user: userId, mediaId: mediaId.toString() });
        return JSON.stringify({ success: true, message: `✅ Removed "${title}" from your favorites.` });
      }, logSessionId);
    },
  });

  const getFavorites = new DynamicStructuredTool({
    name: "get_favorites",
    description: "Get the user's favorite movies and TV shows.",
    schema: z.object({
      mediaType: z.enum(["movie", "tv"]).optional().describe("Filter by media type"),
    }),
    func: async ({ mediaType }) => {
      const { userId, logSessionId } = getCurrentContext();
      
      return executeWithLogging("get_favorites", { mediaType }, async () => {
        logger.info("User Agent: get_favorites", { mediaType, userId });
        if (!userId) {
          return JSON.stringify({ success: false, requiresAuth: true, message: "🔐 Please sign in to view your favorites." });
        }

        const filter = { user: userId };
        if (mediaType) filter.mediaType = mediaType;

        const items = await favoriteModel.find(filter).sort({ createdAt: -1 }).limit(10).lean();
        
        if (items.length === 0) {
          return JSON.stringify({
            success: true,
            message: "❤️ No favorites yet! Start marking your favorite movies and shows.",
            favorites: [],
            totalCount: 0,
          });
        }

        return JSON.stringify({
          success: true,
          favorites: items.map((item) => ({
            mediaId: item.mediaId,
            mediaType: item.mediaType,
            mediaTitle: item.mediaTitle,
          })),
          totalCount: items.length,
        });
      }, logSessionId);
    },
  });

  const prepareReview = new DynamicStructuredTool({
    name: "prepare_review",
    description: "Prepare a review for submission. ALWAYS asks for confirmation before submitting.",
    schema: z.object({
      mediaId: z.number().describe("The TMDB ID of the media"),
      mediaType: z.enum(["movie", "tv"]).describe("Type of media"),
      mediaTitle: z.string().describe("Title of the media"),
      content: z.string().describe("The review content"),
      rating: z.number().min(1).max(10).describe("Rating from 1-10"),
      containsSpoilers: z.boolean().default(false).describe("Contains spoilers?"),
    }),
    func: async ({ mediaId, mediaType, mediaTitle, content, rating, containsSpoilers }) => {
      const { userId, logSessionId } = getCurrentContext();
      
      return executeWithLogging("prepare_review", { mediaId, mediaTitle, rating }, async () => {
        logger.info("User Agent: prepare_review", { mediaId, mediaTitle, rating, userId });
        if (!userId) {
          return JSON.stringify({ success: false, requiresAuth: true, message: "🔐 Please sign in to write reviews." });
        }

        // Sanitize review content
        const sanitizedContent = sanitizeInput(content);
        if (sanitizedContent.length < 10) {
          return JSON.stringify({ success: false, message: "❌ Review is too short. Please write at least 10 characters." });
        }

        const existing = await reviewModel.findOne({ user: userId, mediaId: mediaId.toString() });
        if (existing) {
          return JSON.stringify({ success: false, alreadyReviewed: true, message: `📝 You've already reviewed "${mediaTitle}". Would you like to update it?` });
        }

        const preview = sanitizedContent.substring(0, 100);
        return JSON.stringify({
          success: true,
          requiresConfirmation: true,
          message: `📝 Review ready for **"${mediaTitle}"**\n⭐ Rating: ${rating}/10\n💬 "${preview}${sanitizedContent.length > 100 ? "..." : ""}"\n${containsSpoilers ? "⚠️ Contains spoilers\n" : ""}\nSay **"yes"** to submit!`,
          pendingAction: {
            type: "review",
            mediaId: mediaId.toString(),
            mediaType,
            mediaTitle,
            data: { content: sanitizedContent, rating, containsSpoilers },
          },
        });
      }, logSessionId);
    },
  });

  const getUserReviews = new DynamicStructuredTool({
    name: "get_user_reviews",
    description: "Get reviews written by the user.",
    schema: z.object({
      limit: z.number().default(5).describe("Number of reviews to return"),
    }),
    func: async ({ limit }) => {
      const { userId, logSessionId } = getCurrentContext();
      
      return executeWithLogging("get_user_reviews", { limit }, async () => {
        logger.info("User Agent: get_user_reviews", { limit, userId });
        if (!userId) {
          return JSON.stringify({ success: false, requiresAuth: true, message: "🔐 Please sign in to view your reviews." });
        }

        const reviews = await reviewModel.find({ user: userId }).sort({ createdAt: -1 }).limit(limit).lean();
        
        if (reviews.length === 0) {
          return JSON.stringify({
            success: true,
            message: "📝 No reviews yet! Share your thoughts on movies and shows you've watched.",
            reviews: [],
            totalCount: 0,
          });
        }

        return JSON.stringify({
          success: true,
          reviews: reviews.map((r) => ({
            mediaId: r.mediaId,
            mediaTitle: r.mediaTitle,
            rating: r.rating,
            preview: r.content.substring(0, 100) + (r.content.length > 100 ? "..." : ""),
          })),
          totalCount: reviews.length,
        });
      }, logSessionId);
    },
  });

  const deleteReview = new DynamicStructuredTool({
    name: "delete_review",
    description: "Delete a review that the user wrote. Requires confirmation.",
    schema: z.object({
      mediaId: z.number().describe("The TMDB ID of the media whose review to delete"),
      mediaTitle: z.string().optional().describe("Title for confirmation message"),
      confirmed: z.boolean().default(false).describe("Whether user confirmed"),
    }),
    func: async ({ mediaId, mediaTitle, confirmed }) => {
      const { userId, logSessionId } = getCurrentContext();
      
      return executeWithLogging("delete_review", { mediaId, confirmed }, async () => {
        logger.info("User Agent: delete_review", { mediaId, confirmed, userId });
        if (!userId) {
          return JSON.stringify({ success: false, requiresAuth: true, message: "🔐 Please sign in to delete reviews." });
        }

        const review = await reviewModel.findOne({ user: userId, mediaId: mediaId.toString() });
        if (!review) {
          return JSON.stringify({ success: false, message: "❌ You haven't reviewed this title." });
        }

        const title = mediaTitle || review.mediaTitle;

        if (!confirmed) {
          return JSON.stringify({
            success: true,
            requiresConfirmation: true,
            message: `🗑️ Delete your review for **"${title}"**?\n⭐ Rating: ${review.rating}/10\n\nSay **"yes"** to confirm.`,
            pendingAction: { type: "delete_review", mediaId: mediaId.toString(), mediaTitle: title },
          });
        }

        await reviewModel.findOneAndDelete({ user: userId, mediaId: mediaId.toString() });
        return JSON.stringify({ success: true, message: `✅ Deleted your review for "${title}".` });
      }, logSessionId);
    },
  });

  return [
    addToWatchlist,
    removeFromWatchlist,
    getWatchlist,
    updateWatchlistItem,
    addToFavorites,
    removeFromFavorites,
    getFavorites,
    prepareReview,
    getUserReviews,
    deleteReview,
  ];
}

// Single cached agent instance (tools get userId from context now)
let userAgentInstance = null;

/**
 * Create the User Agent with optimized settings
 * Tools use AsyncLocalStorage to get userId, so we can cache the agent
 * @returns {CompiledGraph} - The compiled user agent
 */
export function createUserAgent() {
  if (userAgentInstance) {
    return userAgentInstance;
  }

  const model = new ChatGoogleGenerativeAI({
    model: GEMINI_MODEL, // Use environment variable for model
    temperature: 0.3,
    maxOutputTokens: 1024, // Increased for better responses
    apiKey: process.env.GEMINI_API_KEY,
  });

  // Tools get userId from AsyncLocalStorage context, not from closure
  const tools = createLangChainUserTools();

  userAgentInstance = createReactAgent({
    llm: model,
    tools,
    messageModifier: USER_AGENT_PROMPT,
  });

  logger.info("User agent created", { model: GEMINI_MODEL });
  return userAgentInstance;
}

/**
 * Run the user agent on a query
 * @param {string} query - User query
 * @param {string|null} userId - User ID
 * @param {Array} history - Conversation history
 * @param {string|null} logSessionId - Logging session ID for chatbot logger
 * @returns {Promise<object>} - Agent response
 */
export async function runUserAgent(query, userId, history = [], logSessionId = null) {
  const agent = createUserAgent();
  
  const messages = [
    ...history.slice(-4).map(msg => ({ // Limit history for user actions
      role: msg.role === "assistant" ? "ai" : "human",
      content: msg.content,
    })),
    { role: "human", content: query },
  ];

  // Run agent with userId and logSessionId in AsyncLocalStorage context (thread-safe)
  return runWithContext({ userId, logSessionId }, async () => {
    try {
      const result = await agent.invoke({ messages });
      
      return {
        response: result.messages[result.messages.length - 1].content,
        toolCalls: result.messages
          .filter(m => m.tool_calls?.length > 0)
          .flatMap(m => m.tool_calls),
      };
    } catch (error) {
      logger.error("User agent error", { error: error.message, query: query.substring(0, 50), userId });
      throw error;
    }
  });
}

/**
 * Clear agent cache (for testing or config changes)
 */
export function resetUserAgents() {
  userAgentInstance = null;
  logger.info("User agent cache cleared");
}

export default { 
  createUserAgent, 
  runUserAgent, 
  resetUserAgents,
  runWithContext,
};
