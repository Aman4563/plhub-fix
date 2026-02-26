/**
 * Search Agent - Specialized agent for movie/TV discovery
 * Handles: search, trending, details, similar content, genre discovery
 * Enhanced with RAG for community review retrieval
 * 
 * OPTIMIZED: Minimizes TMDB API calls through smart tool selection
 * Uses shared utilities for caching and logging
 */

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import tmdbApi from "../../tmdb/tmdb.api.js";
import logger from "../../config/logger.config.js";
import { searchSimilarReviews, getReviewsForMedia, buildRAGContext } from "../rag/vectorStore.js";

// Shared utilities
import tmdbCache from "../../utils/cache.js";
import { 
  executeWithLogging, 
  getCurrentLogSessionId, 
  runWithLogSession 
} from "../utils/agentLogging.js";

// Re-export for backwards compatibility
export { runWithLogSession };

// Configuration from environment variables
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

// Use shared cache utility
const getCached = (key) => tmdbCache.get(key);
const setCache = (key, data) => tmdbCache.set(key, data);

// Optimized search agent prompt - emphasizes minimal API calls
const SEARCH_AGENT_PROMPT = `You are a movie/TV discovery expert. Help users find and learn about content.

## CRITICAL RULES FOR EFFICIENCY:
1. **MINIMIZE API CALLS** - Only call tools when absolutely necessary
2. **ONE TOOL PER CONCEPT** - Don't call multiple tools for the same information
3. **USE CACHED KNOWLEDGE** - If you already have the movie ID from a previous search, use it directly
4. **COMBINE QUERIES** - If user wants trending sci-fi, use get_trending (not search + filter)
5. **AVOID REDUNDANT SEARCHES** - Don't search for a movie if you already know its details

## RESPONSE GUIDELINES:
- Keep responses concise (3-5 items max unless specifically asked for more)
- Use **bold** for titles, ⭐ for ratings
- Don't list every detail - focus on what the user asked

## TOOL SELECTION STRATEGY:
- "What's trending?" → get_trending (ONE call)
- "Tell me about Inception" → get_movie_details with ID 27205 (ONE call, use known IDs for popular movies)
- "Find action movies" → discover_by_genre with genreId 28 (ONE call)
- "Movies like X" → get_similar_content (ONE call, requires knowing ID first)
- "Search for [title]" → search_movies OR search_tv_shows (ONE call, not both unless ambiguous)

## KNOWN MOVIE IDS (use directly, don't search):
- Inception: 27205
- The Dark Knight: 155
- Interstellar: 157336
- Pulp Fiction: 680
- The Matrix: 603
- Fight Club: 550
- Forrest Gump: 13
- The Godfather: 238
- The Shawshank Redemption: 278
- Avengers Endgame: 299536

Remember: Every API call costs resources. Be efficient!`;

/**
 * Create LangChain tools with caching and logging
 * Tools use AsyncLocalStorage to access the current log session ID
 */
function createLangChainSearchTools() {
  const searchMovies = new DynamicStructuredTool({
    name: "search_movies",
    description: "Search for movies by title or keyword. Use ONLY when you don't know the movie ID.",
    schema: z.object({
      query: z.string().describe("The search query for movies"),
      page: z.number().default(1).describe("Page number (default 1, rarely need more)"),
    }),
    func: async ({ query, page }) => {
      const logSessionId = getCurrentLogSessionId();
      return executeWithLogging("search_movies", { query, page }, async () => {
        const cacheKey = `search_movie_${query}_${page}`;
        const cached = getCached(cacheKey);
        if (cached) return JSON.stringify(cached);

        logger.info("Search Agent: search_movies", { query, page });
        const result = await tmdbApi.mediaSearch({ mediaType: "movie", query, page });
        const movies = (result.results || []).slice(0, 5).map((m) => ({
          id: m.id,
          title: m.title,
          mediaType: "movie",
          releaseDate: m.release_date,
          rating: m.vote_average,
          overview: m.overview?.substring(0, 150) + (m.overview?.length > 150 ? "..." : ""),
        }));
        
        const response = { movies, totalResults: result.total_results };
        setCache(cacheKey, response);
        return JSON.stringify(response);
      }, logSessionId);
    },
  });

  const searchTvShows = new DynamicStructuredTool({
    name: "search_tv_shows",
    description: "Search for TV shows by title or keyword. Use ONLY when you don't know the show ID.",
    schema: z.object({
      query: z.string().describe("The search query for TV shows"),
      page: z.number().default(1).describe("Page number (default 1)"),
    }),
    func: async ({ query, page }) => {
      const logSessionId = getCurrentLogSessionId();
      return executeWithLogging("search_tv_shows", { query, page }, async () => {
        const cacheKey = `search_tv_${query}_${page}`;
        const cached = getCached(cacheKey);
        if (cached) return JSON.stringify(cached);

        logger.info("Search Agent: search_tv_shows", { query, page });
        const result = await tmdbApi.mediaSearch({ mediaType: "tv", query, page });
        const shows = (result.results || []).slice(0, 5).map((s) => ({
          id: s.id,
          title: s.name,
          mediaType: "tv",
          firstAirDate: s.first_air_date,
          rating: s.vote_average,
          overview: s.overview?.substring(0, 150) + (s.overview?.length > 150 ? "..." : ""),
        }));
        
        const response = { shows, totalResults: result.total_results };
        setCache(cacheKey, response);
        return JSON.stringify(response);
      }, logSessionId);
    },
  });

  const getMovieDetails = new DynamicStructuredTool({
    name: "get_movie_details",
    description: "Get details about a specific movie by TMDB ID. Use known IDs directly when possible.",
    schema: z.object({
      movieId: z.number().describe("The TMDB ID of the movie"),
    }),
    func: async ({ movieId }) => {
      const logSessionId = getCurrentLogSessionId();
      return executeWithLogging("get_movie_details", { movieId }, async () => {
        const cacheKey = `movie_details_${movieId}`;
        const cached = getCached(cacheKey);
        if (cached) return JSON.stringify(cached);

        logger.info("Search Agent: get_movie_details", { movieId });
        const movie = await tmdbApi.mediaDetail({ mediaType: "movie", mediaId: movieId });
        const response = {
          id: movie.id,
          title: movie.title,
          mediaType: "movie",
          releaseDate: movie.release_date,
          runtime: movie.runtime,
          rating: movie.vote_average,
          overview: movie.overview,
          genres: movie.genres?.map((g) => g.name) || [],
          tagline: movie.tagline,
        };
        
        setCache(cacheKey, response);
        return JSON.stringify(response);
      }, logSessionId);
    },
  });

  const getTvDetails = new DynamicStructuredTool({
    name: "get_tv_details",
    description: "Get details about a specific TV show by TMDB ID.",
    schema: z.object({
      tvId: z.number().describe("The TMDB ID of the TV show"),
    }),
    func: async ({ tvId }) => {
      const logSessionId = getCurrentLogSessionId();
      return executeWithLogging("get_tv_details", { tvId }, async () => {
        const cacheKey = `tv_details_${tvId}`;
        const cached = getCached(cacheKey);
        if (cached) return JSON.stringify(cached);

        logger.info("Search Agent: get_tv_details", { tvId });
        const show = await tmdbApi.mediaDetail({ mediaType: "tv", mediaId: tvId });
        const response = {
          id: show.id,
          title: show.name,
          mediaType: "tv",
          firstAirDate: show.first_air_date,
          numberOfSeasons: show.number_of_seasons,
          numberOfEpisodes: show.number_of_episodes,
          rating: show.vote_average,
          overview: show.overview,
          genres: show.genres?.map((g) => g.name) || [],
          status: show.status,
        };
        
        setCache(cacheKey, response);
        return JSON.stringify(response);
      }, logSessionId);
    },
  });

  const getTrending = new DynamicStructuredTool({
    name: "get_trending",
    description: "Get trending movies or TV shows. Perfect for 'what's popular' questions.",
    schema: z.object({
      mediaType: z.enum(["movie", "tv", "all"]).default("all").describe("Type of media (use 'all' for mixed results)"),
      timeWindow: z.enum(["day", "week"]).default("week").describe("Time window"),
    }),
    func: async ({ mediaType = "all", timeWindow = "week" }) => {
      const logSessionId = getCurrentLogSessionId();
      return executeWithLogging("get_trending", { mediaType, timeWindow }, async () => {
        const actualMediaType = mediaType || "all";
        const actualTimeWindow = timeWindow || "week";
        const cacheKey = `trending_${actualMediaType}_${actualTimeWindow}`;
        const cached = getCached(cacheKey);
        if (cached) return JSON.stringify(cached);

        logger.info("Search Agent: get_trending", { mediaType: actualMediaType, timeWindow: actualTimeWindow });
        const result = await tmdbApi.trending({ mediaType: actualMediaType, timeWindow: actualTimeWindow });
        const items = (result.results || []).slice(0, 6).map((item) => ({
          id: item.id,
          title: item.title || item.name,
          mediaType: item.media_type || mediaType,
          rating: item.vote_average,
          overview: item.overview?.substring(0, 100) + "...",
        }));
        
        const response = { trending: items, timeWindow };
        setCache(cacheKey, response);
        return JSON.stringify(response);
      }, logSessionId);
    },
  });

  const getSimilarContent = new DynamicStructuredTool({
    name: "get_similar_content",
    description: "Get movies/shows similar to a given title. Requires knowing the media ID first.",
    schema: z.object({
      mediaId: z.number().describe("The TMDB ID of the media"),
      mediaType: z.enum(["movie", "tv"]).describe("Type of media"),
    }),
    func: async ({ mediaId, mediaType }) => {
      const logSessionId = getCurrentLogSessionId();
      return executeWithLogging("get_similar_content", { mediaId, mediaType }, async () => {
        const cacheKey = `similar_${mediaType}_${mediaId}`;
        const cached = getCached(cacheKey);
        if (cached) return JSON.stringify(cached);

        logger.info("Search Agent: get_similar_content", { mediaId, mediaType });
        const result = await tmdbApi.mediaSimilar({ mediaType, mediaId });
        const similar = (result.results || []).slice(0, 5).map((item) => ({
          id: item.id,
          title: item.title || item.name,
          mediaType,
          rating: item.vote_average,
        }));
        
        const response = { similar, basedOnId: mediaId };
        setCache(cacheKey, response);
        return JSON.stringify(response);
      }, logSessionId);
    },
  });

  const discoverByGenre = new DynamicStructuredTool({
    name: "discover_by_genre",
    description: "Discover content by genre. Genre IDs: 28=Action, 35=Comedy, 18=Drama, 27=Horror, 878=Sci-Fi, 10749=Romance, 53=Thriller, 16=Animation",
    schema: z.object({
      mediaType: z.enum(["movie", "tv"]).describe("Type of media"),
      genreId: z.number().describe("Genre ID (28=Action, 35=Comedy, 18=Drama, 27=Horror, 878=Sci-Fi)"),
      page: z.number().default(1).describe("Page number"),
    }),
    func: async ({ mediaType, genreId, page }) => {
      const logSessionId = getCurrentLogSessionId();
      return executeWithLogging("discover_by_genre", { mediaType, genreId, page }, async () => {
        const cacheKey = `genre_${mediaType}_${genreId}_${page}`;
        const cached = getCached(cacheKey);
        if (cached) return JSON.stringify(cached);

        logger.info("Search Agent: discover_by_genre", { mediaType, genreId, page });
        const genreMap = { 28: "Action", 35: "Comedy", 18: "Drama", 27: "Horror", 878: "Sci-Fi", 10749: "Romance", 53: "Thriller", 16: "Animation" };
        const result = await tmdbApi.mediaCategoryList({ mediaType, mediaCategory: "popular", page });
        const items = (result.results || [])
          .filter((item) => item.genre_ids?.includes(genreId))
          .slice(0, 5)
          .map((item) => ({
            id: item.id,
            title: item.title || item.name,
            mediaType,
            rating: item.vote_average,
          }));
        
        const response = { items, genre: genreMap[genreId] || "Unknown" };
        setCache(cacheKey, response);
        return JSON.stringify(response);
      }, logSessionId);
    },
  });

  const getTopRated = new DynamicStructuredTool({
    name: "get_top_rated",
    description: "Get top rated movies or TV shows. Use for 'best' or 'highest rated' questions.",
    schema: z.object({
      mediaType: z.enum(["movie", "tv"]).describe("Type of media"),
      page: z.number().default(1).describe("Page number"),
    }),
    func: async ({ mediaType, page }) => {
      const logSessionId = getCurrentLogSessionId();
      return executeWithLogging("get_top_rated", { mediaType, page }, async () => {
        const cacheKey = `top_rated_${mediaType}_${page}`;
        const cached = getCached(cacheKey);
        if (cached) return JSON.stringify(cached);

        logger.info("Search Agent: get_top_rated", { mediaType, page });
        const result = await tmdbApi.mediaCategoryList({ mediaType, mediaCategory: "top_rated", page });
        const items = (result.results || []).slice(0, 6).map((item) => ({
          id: item.id,
          title: item.title || item.name,
          mediaType,
          rating: item.vote_average,
        }));
        
        const response = { topRated: items, mediaType };
        setCache(cacheKey, response);
        return JSON.stringify(response);
      }, logSessionId);
    },
  });

  // RAG Tool: Search community reviews
  const searchCommunityReviews = new DynamicStructuredTool({
    name: "search_community_reviews",
    description: "Search community reviews for opinions. Use for subjective questions like 'what do people think about...'",
    schema: z.object({
      query: z.string().describe("The search query"),
      limit: z.number().default(3).describe("Number of reviews (keep low for efficiency)"),
    }),
    func: async ({ query, limit }) => {
      const logSessionId = getCurrentLogSessionId();
      return executeWithLogging("search_community_reviews", { query, limit }, async () => {
        logger.info("Search Agent: search_community_reviews (RAG)", { query, limit });
        try {
          const searchResult = await searchSimilarReviews(query, limit);
          const reviews = searchResult.results || [];
          
          if (reviews.length === 0) {
            return JSON.stringify({ 
              message: searchResult.message || "No community reviews found for this query.",
              reviews: [],
              searchMode: searchResult.searchMode,
            });
          }

          const context = buildRAGContext(reviews);
          return JSON.stringify({
            message: searchResult.message || "Found community reviews",
            context,
            searchMode: searchResult.searchMode,
            reviews: reviews.map(r => ({
              mediaTitle: r.mediaTitle,
              rating: r.rating,
              excerpt: r.content.substring(0, 200) + (r.content.length > 200 ? "..." : ""),
            })),
          });
        } catch (error) {
          logger.warn("RAG search failed, returning empty", { error: error.message });
          return JSON.stringify({ message: "Could not search reviews", reviews: [], searchMode: "unavailable" });
        }
      }, logSessionId);
    },
  });

  // RAG Tool: Get reviews for specific media
  const getMediaReviews = new DynamicStructuredTool({
    name: "get_media_reviews",
    description: "Get community reviews for a specific title. Use when user asks about opinions on a specific movie/show.",
    schema: z.object({
      mediaId: z.number().describe("The TMDB ID of the media"),
      mediaTitle: z.string().describe("Title of the media"),
      limit: z.number().default(3).describe("Number of reviews"),
    }),
    func: async ({ mediaId, mediaTitle, limit }) => {
      const logSessionId = getCurrentLogSessionId();
      return executeWithLogging("get_media_reviews", { mediaId, mediaTitle, limit }, async () => {
        logger.info("Search Agent: get_media_reviews (RAG)", { mediaId, mediaTitle, limit });
        try {
          const reviews = await getReviewsForMedia(mediaId, limit);
          
          if (reviews.length === 0) {
            return JSON.stringify({ 
              message: `No community reviews found for "${mediaTitle}".`,
              reviews: [] 
            });
          }

          const avgRating = reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length;

          return JSON.stringify({
            mediaTitle,
            averageUserRating: avgRating.toFixed(1),
            reviewCount: reviews.length,
            reviews: reviews.map(r => ({
              rating: r.rating,
              content: r.content.substring(0, 200) + "...",
              user: r.user?.displayName || "Anonymous",
            })),
          });
        } catch (error) {
          logger.warn("Get media reviews failed", { error: error.message });
          return JSON.stringify({ message: "Could not get reviews", reviews: [] });
        }
      }, logSessionId);
    },
  });

  return [
    searchMovies,
    searchTvShows,
    getMovieDetails,
    getTvDetails,
    getTrending,
    getSimilarContent,
    discoverByGenre,
    getTopRated,
    searchCommunityReviews,
    getMediaReviews,
  ];
}

// Cached agent instance
let searchAgentInstance = null;

/**
 * Create the Search Agent with optimized settings
 * @returns {CompiledGraph} - The compiled search agent
 */
export function createSearchAgent() {
  if (searchAgentInstance) {
    return searchAgentInstance;
  }

  const model = new ChatGoogleGenerativeAI({
    model: GEMINI_MODEL, // Use environment variable for model
    temperature: 0.3, // Lower temp for more consistent tool selection
    maxOutputTokens: 3000, // Limit response length
    apiKey: process.env.GEMINI_API_KEY, // Explicit API key
  });

  const tools = createLangChainSearchTools();

  searchAgentInstance = createReactAgent({
    llm: model,
    tools,
    messageModifier: SEARCH_AGENT_PROMPT,
  });

  logger.info("Search agent created", { model: GEMINI_MODEL });
  return searchAgentInstance;
}

/**
 * Run the search agent on a query
 * @param {string} query - User query
 * @param {Array} history - Conversation history
 * @param {string|null} logSessionId - Logging session ID for chatbot logger
 * @returns {Promise<object>} - Agent response
 */
export async function runSearchAgent(query, history = [], logSessionId = null) {
  const agent = createSearchAgent();
  
  const messages = [
    ...history.slice(-6).map(msg => ({ // Limit history to last 6 messages
      role: msg.role === "assistant" ? "ai" : "human",
      content: msg.content,
    })),
    { role: "human", content: query },
  ];

  // Run agent with log session in AsyncLocalStorage context (thread-safe)
  return runWithLogSession(logSessionId, async () => {
    try {
      const result = await agent.invoke({ messages });
      
      return {
        response: result.messages[result.messages.length - 1].content,
        toolCalls: result.messages
          .filter(m => m.tool_calls?.length > 0)
          .flatMap(m => m.tool_calls),
      };
    } catch (error) {
      logger.error("Search agent error", { error: error.message, query: query.substring(0, 50) });
      throw error;
    }
  });
}

/**
 * Clear the agent cache (for testing)
 */
export function resetSearchAgent() {
  searchAgentInstance = null;
  tmdbCache.clear();
  logger.info("Search agent and cache reset");
}

export default { 
  createSearchAgent, 
  runSearchAgent, 
  resetSearchAgent,
  runWithLogSession,
};
