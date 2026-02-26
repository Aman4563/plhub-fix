/**
 * Chatbot Tools - Vercel AI SDK Tool Definitions with Zod Validation
 * These tools allow the AI to perform actions on behalf of the user
 * 
 * FEATURES:
 * - Input sanitization for review content and notes
 * - HITL (Human-in-the-Loop) for destructive actions
 * - Shared in-memory caching for TMDB responses
 * - Multi-search for efficient content discovery
 * - Popular titles lookup to reduce API calls
 */

import { tool } from "ai";
import { z } from "zod";
import tmdbApi from "../tmdb/tmdb.api.js";
import watchlistModel from "../models/watchlist.model.js";
import favoriteModel from "../models/favorite.model.js";
import reviewModel from "../models/review.model.js";
import logger from "../config/logger.config.js";
import tmdbCache from "../utils/cache.js";
import { sanitizeInput as sanitizeUserInput, sanitizeNotes as sanitizeUserNotes } from "../utils/sanitization.js";
import { lookupPopularTitle, POPULAR_TITLES } from "../config/popularTitles.js";

// ==================== CACHING SYSTEM ====================

// Use shared cache utility
const getCached = (key) => tmdbCache.get(key);
const setCache = (key, data) => tmdbCache.set(key, data);

// ==================== POPULAR TITLES ====================
// Popular titles map is now imported from config/popularTitles.js
// This reduces duplication and makes it easier to update

// ==================== SANITIZATION ====================
// Use shared sanitization utilities
const sanitizeInput = sanitizeUserInput;
const sanitizeNotes = sanitizeUserNotes;

/**
 * Create tools with user context
 * @param {string|null} userId - Current user ID for authenticated actions
 * @returns {object} - Tools object for Vercel AI SDK
 */
export function createTools(userId = null) {
  // ==================== SEARCH & DISCOVERY TOOLS ====================

  // ==================== GET DETAILS BY NAME (BEST FOR DETAILS QUERIES) ====================
  
  const get_content_details_by_name = tool({
    description: "Get FULL details about a movie or TV show by its name. USE THIS when user asks for 'details', 'info', 'tell me about' a specific title. This automatically finds the content and returns complete details in ONE call.",
    parameters: z.object({
      title: z.string().describe("The name/title of the movie or TV show"),
      preferredType: z.enum(["movie", "tv", "auto"]).default("auto").describe("Hint: 'movie', 'tv', or 'auto' to detect automatically"),
    }),
    execute: async ({ title, preferredType = "auto" }) => {
      logger.info("Executing tool: get_content_details_by_name", { title, preferredType, userId });
      
      if (!title || typeof title !== "string" || title.trim().length === 0) {
        return { error: "Please provide a title to search for." };
      }

      const searchQuery = title.trim();
      
      // Step 1: Check popular titles first
      const popularMatch = lookupPopularTitle(searchQuery);
      let contentId = null;
      let mediaType = null;
      
      if (popularMatch) {
        contentId = popularMatch.id;
        mediaType = popularMatch.mediaType;
        logger.info("get_content_details_by_name: Found in popular titles", { title: searchQuery, ...popularMatch });
      } else {
        // Step 2: Search TMDB
        const cacheKey = `search_for_details_${searchQuery.toLowerCase()}`;
        let searchResults = getCached(cacheKey);
        
        if (!searchResults) {
          try {
            const result = await tmdbApi.multiSearch({ query: searchQuery, page: 1 });
            searchResults = (result.results || []).filter(item => 
              item.media_type === "movie" || item.media_type === "tv"
            );
            setCache(cacheKey, searchResults);
          } catch (error) {
            logger.error("get_content_details_by_name: Search failed", { error: error.message, title: searchQuery });
            return { error: "Could not search for the title. Please try again." };
          }
        }
        
        if (!searchResults || searchResults.length === 0) {
          return { 
            error: `I couldn't find any movie or TV show called "${searchQuery}". Please check the spelling or try a different title.`,
            searchedFor: searchQuery,
          };
        }
        
        // Pick best match based on preferredType
        let bestMatch = searchResults[0];
        if (preferredType !== "auto") {
          const typeMatch = searchResults.find(item => item.media_type === preferredType);
          if (typeMatch) bestMatch = typeMatch;
        }
        
        contentId = bestMatch.id;
        mediaType = bestMatch.media_type;
      }
      
      // Step 3: Get full details
      const detailsCacheKey = `${mediaType}_details_${contentId}`;
      let details = getCached(detailsCacheKey);
      
      if (!details) {
        try {
          const content = await tmdbApi.mediaDetail({ mediaType, mediaId: contentId });
          
          if (mediaType === "movie") {
            details = {
              id: content.id,
              title: content.title,
              mediaType: "movie",
              releaseDate: content.release_date,
              runtime: content.runtime,
              rating: content.vote_average,
              voteCount: content.vote_count,
              overview: content.overview,
              genres: content.genres?.map((g) => g.name) || [],
              posterPath: content.poster_path,
              backdropPath: content.backdrop_path,
              tagline: content.tagline,
              budget: content.budget,
              revenue: content.revenue,
              status: content.status,
              originalLanguage: content.original_language,
              productionCompanies: content.production_companies?.slice(0, 3).map(c => c.name) || [],
            };
          } else {
            details = {
              id: content.id,
              title: content.name,
              mediaType: "tv",
              firstAirDate: content.first_air_date,
              lastAirDate: content.last_air_date,
              numberOfSeasons: content.number_of_seasons,
              numberOfEpisodes: content.number_of_episodes,
              rating: content.vote_average,
              voteCount: content.vote_count,
              overview: content.overview,
              genres: content.genres?.map((g) => g.name) || [],
              posterPath: content.poster_path,
              backdropPath: content.backdrop_path,
              status: content.status,
              type: content.type,
              networks: content.networks?.slice(0, 3).map(n => n.name) || [],
              originalLanguage: content.original_language,
              inProduction: content.in_production,
            };
          }
          setCache(detailsCacheKey, details);
        } catch (error) {
          logger.error("get_content_details_by_name: Details fetch failed", { error: error.message, contentId, mediaType });
          return { error: "Found the title but couldn't fetch details. Please try again." };
        }
      }
      
      return details;
    },
  });

  // ==================== MULTI-SEARCH ====================
  
  const multi_search = tool({
    description: "Search for movies, TV shows, AND people. Use this when user wants to BROWSE or EXPLORE options, not when they want details about a specific title. For details, use get_content_details_by_name instead.",
    parameters: z.object({
      query: z.string().describe("The search query (title, person name, or keyword)"),
    }),
    execute: async ({ query }) => {
      logger.info("Executing tool: multi_search", { query, userId });
      
      if (!query || typeof query !== "string" || query.trim().length === 0) {
        return { results: [], error: "Please provide a search query." };
      }

      const searchQuery = query.trim();
      
      // Check popular titles first (no API call needed)
      const popularMatch = lookupPopularTitle(searchQuery);
      if (popularMatch) {
        logger.info("multi_search: Found in popular titles", { query: searchQuery, ...popularMatch });
        // Return formatted result - AI should automatically call get_details next
        return {
          results: [{
            id: popularMatch.id,
            title: searchQuery,
            mediaType: popularMatch.mediaType,
            matchedFromCache: true,
          }],
          totalResults: 1,
          // Internal hint for AI to continue workflow
          _hint: `IMPORTANT: Call get_${popularMatch.mediaType === "tv" ? "tv_details" : "movie_details"}(${popularMatch.mediaType === "tv" ? "tvId" : "movieId"}: ${popularMatch.id}) now to get full details.`,
        };
      }

      // Check cache
      const cacheKey = `multi_search_${searchQuery.toLowerCase()}`;
      const cached = getCached(cacheKey);
      if (cached) {
        logger.info("multi_search: Cache hit", { query: searchQuery });
        return cached;
      }

      try {
        const result = await tmdbApi.multiSearch({ query: searchQuery, page: 1 });
        const items = (result.results || []).slice(0, 8).map((item) => {
          const mediaType = item.media_type;
          if (mediaType === "person") {
            return {
              id: item.id,
              name: item.name,
              mediaType: "person",
              knownFor: item.known_for_department,
              profilePath: item.profile_path,
              popularity: item.popularity,
            };
          }
          return {
            id: item.id,
            title: item.title || item.name,
            mediaType: mediaType,
            releaseDate: item.release_date || item.first_air_date,
            rating: item.vote_average,
            overview: item.overview?.substring(0, 120) + (item.overview?.length > 120 ? "..." : ""),
            posterPath: item.poster_path,
          };
        });
        
        const response = { 
          results: items, 
          totalResults: result.total_results || 0,
          // Note for AI: automatically proceed to get details if user asked for details
          _hint: items.length > 0 && items[0]?.id 
            ? `Top result ID: ${items[0].id}, mediaType: ${items[0].mediaType}. If user wanted details, call get_${items[0].mediaType === "tv" ? "tv" : "movie"}_details now.`
            : null,
        };
        
        setCache(cacheKey, response);
        return response;
      } catch (error) {
        logger.error("multi_search: TMDB API error", { error: error.message, query: searchQuery });
        return { 
          results: [], 
          totalResults: 0, 
          error: "Search is temporarily unavailable. Please try again." 
        };
      }
    },
  });

  // ==================== INDIVIDUAL SEARCH TOOLS ====================

  const search_movies = tool({
    description: "Search specifically for movies. Use multi_search instead unless you specifically need only movies.",
    parameters: z.object({
      query: z.string().describe("The search query for movies (title, keyword, or description)"),
      page: z.number().default(1).describe("Page number for pagination"),
    }),
    execute: async ({ query, page = 1 }) => {
      logger.info("Executing tool: search_movies", { query, page, userId });
      
      if (!query || typeof query !== "string" || query.trim().length === 0) {
        return { movies: [], totalResults: 0, page: 1, error: "Please provide a search query." };
      }

      const searchQuery = query.trim();
      const cacheKey = `search_movies_${searchQuery.toLowerCase()}_${page}`;
      const cached = getCached(cacheKey);
      if (cached) return cached;

      try {
        const result = await tmdbApi.mediaSearch({ mediaType: "movie", query: searchQuery, page });
        const movies = (result.results || []).slice(0, 5).map((m) => ({
          id: m.id,
          title: m.title,
          mediaType: "movie",
          releaseDate: m.release_date,
          rating: m.vote_average,
          overview: m.overview?.substring(0, 150) + (m.overview?.length > 150 ? "..." : ""),
          posterPath: m.poster_path,
        }));
        const response = { movies, totalResults: result.total_results || 0, page: result.page || 1 };
        setCache(cacheKey, response);
        return response;
      } catch (error) {
        logger.error("search_movies: TMDB API error", { error: error.message, query: searchQuery });
        return { movies: [], totalResults: 0, page: 1, error: "Movie search is temporarily unavailable." };
      }
    },
  });

  const search_tv_shows = tool({
    description: "Search specifically for TV shows. Use multi_search instead unless you specifically need only TV shows.",
    parameters: z.object({
      query: z.string().describe("The search query for TV shows"),
      page: z.number().default(1).describe("Page number for pagination"),
    }),
    execute: async ({ query, page = 1 }) => {
      logger.info("Executing tool: search_tv_shows", { query, page, userId });
      
      if (!query || typeof query !== "string" || query.trim().length === 0) {
        return { shows: [], totalResults: 0, page: 1, error: "Please provide a search query." };
      }

      const searchQuery = query.trim();
      const cacheKey = `search_tv_${searchQuery.toLowerCase()}_${page}`;
      const cached = getCached(cacheKey);
      if (cached) return cached;

      try {
        const result = await tmdbApi.mediaSearch({ mediaType: "tv", query: searchQuery, page });
        const shows = (result.results || []).slice(0, 5).map((s) => ({
          id: s.id,
          title: s.name,
          mediaType: "tv",
          firstAirDate: s.first_air_date,
          rating: s.vote_average,
          overview: s.overview?.substring(0, 150) + (s.overview?.length > 150 ? "..." : ""),
          posterPath: s.poster_path,
        }));
        const response = { shows, totalResults: result.total_results || 0, page: result.page || 1 };
        setCache(cacheKey, response);
        return response;
      } catch (error) {
        logger.error("search_tv_shows: TMDB API error", { error: error.message, query: searchQuery });
        return { shows: [], totalResults: 0, page: 1, error: "TV show search is temporarily unavailable." };
      }
    },
  });

  const get_movie_details = tool({
    description: "Get FULL detailed information about a movie by its TMDB ID. You must have the ID first - use multi_search to find it if you don't know it.",
    parameters: z.object({
      movieId: z.number().describe("The TMDB ID of the movie (get this from multi_search first)"),
    }),
    execute: async ({ movieId }) => {
      logger.info("Executing tool: get_movie_details", { movieId, userId });
      
      if (!movieId || typeof movieId !== "number") {
        return { error: "Invalid movie ID. Use multi_search first to find the correct ID." };
      }

      const cacheKey = `movie_details_${movieId}`;
      const cached = getCached(cacheKey);
      if (cached) {
        logger.info("get_movie_details: Cache hit", { movieId });
        return cached;
      }

      try {
        const movie = await tmdbApi.mediaDetail({ mediaType: "movie", mediaId: movieId });
        const response = {
          id: movie.id,
          title: movie.title,
          mediaType: "movie",
          releaseDate: movie.release_date,
          runtime: movie.runtime,
          rating: movie.vote_average,
          voteCount: movie.vote_count,
          overview: movie.overview,
          genres: movie.genres?.map((g) => g.name) || [],
          posterPath: movie.poster_path,
          backdropPath: movie.backdrop_path,
          tagline: movie.tagline,
          budget: movie.budget,
          revenue: movie.revenue,
          status: movie.status,
          originalLanguage: movie.original_language,
          productionCompanies: movie.production_companies?.slice(0, 3).map(c => c.name) || [],
        };
        setCache(cacheKey, response);
        return response;
      } catch (error) {
        logger.error("get_movie_details: TMDB API error", { error: error.message, movieId });
        return { error: "Could not fetch movie details. The ID might be invalid." };
      }
    },
  });

  const get_tv_details = tool({
    description: "Get FULL detailed information about a TV show by its TMDB ID. You must have the ID first - use multi_search to find it if you don't know it.",
    parameters: z.object({
      tvId: z.number().describe("The TMDB ID of the TV show (get this from multi_search first)"),
    }),
    execute: async ({ tvId }) => {
      logger.info("Executing tool: get_tv_details", { tvId, userId });
      
      if (!tvId || typeof tvId !== "number") {
        return { error: "Invalid TV show ID. Use multi_search first to find the correct ID." };
      }

      const cacheKey = `tv_details_${tvId}`;
      const cached = getCached(cacheKey);
      if (cached) {
        logger.info("get_tv_details: Cache hit", { tvId });
        return cached;
      }

      try {
        const show = await tmdbApi.mediaDetail({ mediaType: "tv", mediaId: tvId });
        const response = {
          id: show.id,
          title: show.name,
          mediaType: "tv",
          firstAirDate: show.first_air_date,
          lastAirDate: show.last_air_date,
          numberOfSeasons: show.number_of_seasons,
          numberOfEpisodes: show.number_of_episodes,
          rating: show.vote_average,
          voteCount: show.vote_count,
          overview: show.overview,
          genres: show.genres?.map((g) => g.name) || [],
          posterPath: show.poster_path,
          backdropPath: show.backdrop_path,
          status: show.status,
          type: show.type,
          networks: show.networks?.slice(0, 3).map(n => n.name) || [],
          originalLanguage: show.original_language,
          inProduction: show.in_production,
        };
        setCache(cacheKey, response);
        return response;
      } catch (error) {
        logger.error("get_tv_details: TMDB API error", { error: error.message, tvId });
        return { error: "Could not fetch TV show details. The ID might be invalid." };
      }
    },
  });

  const get_trending = tool({
    description: "Get currently trending movies and/or TV shows. Use when user asks what's popular, hot, or trending right now.",
    parameters: z.object({
      mediaType: z.enum(["movie", "tv", "all"]).default("all").describe("Type: 'movie', 'tv', or 'all' for both"),
      timeWindow: z.enum(["day", "week"]).default("week").describe("'day' for today's trends, 'week' for this week"),
    }),
    execute: async ({ mediaType = "all", timeWindow = "week" }) => {
      logger.info("Executing tool: get_trending", { mediaType, timeWindow, userId });
      
      const cacheKey = `trending_${mediaType}_${timeWindow}`;
      const cached = getCached(cacheKey);
      if (cached) return cached;

      try {
        const result = await tmdbApi.trending({ mediaType: mediaType || "all", timeWindow: timeWindow || "week" });
        const items = (result.results || []).slice(0, 8).map((item) => ({
          id: item.id,
          title: item.title || item.name,
          mediaType: item.media_type || mediaType,
          releaseDate: item.release_date || item.first_air_date,
          rating: item.vote_average,
          overview: item.overview?.substring(0, 120) + (item.overview?.length > 120 ? "..." : ""),
          posterPath: item.poster_path,
        }));
        const response = { trending: items, timeWindow, mediaType };
        setCache(cacheKey, response);
        return response;
      } catch (error) {
        logger.error("get_trending: TMDB API error", { error: error.message });
        return { trending: [], error: "Could not fetch trending content. Please try again." };
      }
    },
  });

  // ==================== PERSON/ACTOR INFO ====================

  const get_person_info = tool({
    description: "Get information about a person (actor, director, writer, etc.). Use multi_search first to find the person's ID.",
    parameters: z.object({
      personId: z.number().describe("The TMDB ID of the person"),
    }),
    execute: async ({ personId }) => {
      logger.info("Executing tool: get_person_info", { personId, userId });
      
      if (!personId || typeof personId !== "number") {
        return { error: "Invalid person ID. Use multi_search first to find the person." };
      }

      const cacheKey = `person_${personId}`;
      const cached = getCached(cacheKey);
      if (cached) return cached;

      try {
        const person = await tmdbApi.personDetail({ personId });
        const credits = await tmdbApi.personMedias({ personId }).catch(() => ({ cast: [], crew: [] }));
        
        // Get top known works
        const knownFor = (credits.cast || [])
          .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
          .slice(0, 5)
          .map(item => ({
            id: item.id,
            title: item.title || item.name,
            mediaType: item.media_type,
            character: item.character,
            year: (item.release_date || item.first_air_date || "").substring(0, 4),
          }));

        const response = {
          id: person.id,
          name: person.name,
          mediaType: "person",
          biography: person.biography?.substring(0, 500) + (person.biography?.length > 500 ? "..." : ""),
          birthday: person.birthday,
          deathday: person.deathday,
          placeOfBirth: person.place_of_birth,
          knownForDepartment: person.known_for_department,
          profilePath: person.profile_path,
          popularity: person.popularity,
          knownFor,
        };
        setCache(cacheKey, response);
        return response;
      } catch (error) {
        logger.error("get_person_info: TMDB API error", { error: error.message, personId });
        return { error: "Could not fetch person information. The ID might be invalid." };
      }
    },
  });

  const get_similar_content = tool({
    description: "Get movies or TV shows similar to a title. Use when user wants 'movies like X' or 'shows similar to Y'. Requires the TMDB ID.",
    parameters: z.object({
      mediaId: z.number().describe("The TMDB ID of the movie or TV show"),
      mediaType: z.enum(["movie", "tv"]).describe("Whether it's a 'movie' or 'tv' show"),
    }),
    execute: async ({ mediaId, mediaType }) => {
      logger.info("Executing tool: get_similar_content", { mediaId, mediaType, userId });
      
      if (!mediaId || !mediaType) {
        return { similar: [], error: "Invalid media ID or type. Use multi_search first." };
      }

      const cacheKey = `similar_${mediaType}_${mediaId}`;
      const cached = getCached(cacheKey);
      if (cached) return cached;

      try {
        const result = await tmdbApi.mediaSimilar({ mediaType, mediaId });
        const similar = (result.results || []).slice(0, 6).map((item) => ({
          id: item.id,
          title: item.title || item.name,
          mediaType,
          rating: item.vote_average,
          releaseDate: item.release_date || item.first_air_date,
          overview: item.overview?.substring(0, 120) + (item.overview?.length > 120 ? "..." : ""),
          posterPath: item.poster_path,
        }));
        const response = { similar, basedOnId: mediaId, mediaType };
        setCache(cacheKey, response);
        return response;
      } catch (error) {
        logger.error("get_similar_content: TMDB API error", { error: error.message });
        return { similar: [], error: "Could not fetch similar content." };
      }
    },
  });

  const discover_by_genre = tool({
    description: "Find movies or TV shows by genre. Use when user asks for 'action movies', 'comedy shows', 'horror films', etc.",
    parameters: z.object({
      mediaType: z.enum(["movie", "tv"]).describe("'movie' or 'tv'"),
      genreId: z.number().describe("Genre ID: 28=Action, 35=Comedy, 18=Drama, 27=Horror, 878=Sci-Fi, 10749=Romance, 53=Thriller, 16=Animation, 99=Documentary, 10751=Family, 80=Crime, 9648=Mystery, 10765=Sci-Fi&Fantasy(TV)"),
      page: z.number().default(1).describe("Page number"),
    }),
    execute: async ({ mediaType, genreId, page = 1 }) => {
      logger.info("Executing tool: discover_by_genre", { mediaType, genreId, page, userId });
      
      const genreMap = {
        28: "Action", 35: "Comedy", 18: "Drama", 27: "Horror",
        878: "Science Fiction", 10749: "Romance", 53: "Thriller",
        16: "Animation", 99: "Documentary", 10751: "Family",
        80: "Crime", 9648: "Mystery", 10765: "Sci-Fi & Fantasy",
        12: "Adventure", 14: "Fantasy", 36: "History", 10752: "War",
        37: "Western", 10402: "Music",
      };

      if (!mediaType || !genreId) {
        return { items: [], error: "Please specify media type and genre." };
      }

      const cacheKey = `discover_${mediaType}_${genreId}_${page}`;
      const cached = getCached(cacheKey);
      if (cached) return cached;

      try {
        const result = await tmdbApi.mediaCategoryList({ mediaType, mediaCategory: "popular", page });
        const items = (result.results || [])
          .filter((item) => item.genre_ids?.includes(genreId))
          .slice(0, 6)
          .map((item) => ({
            id: item.id,
            title: item.title || item.name,
            mediaType,
            rating: item.vote_average,
            releaseDate: item.release_date || item.first_air_date,
            overview: item.overview?.substring(0, 120) + (item.overview?.length > 120 ? "..." : ""),
            posterPath: item.poster_path,
          }));
        const response = { items, genre: genreMap[genreId] || "Unknown", mediaType };
        setCache(cacheKey, response);
        return response;
      } catch (error) {
        logger.error("discover_by_genre: TMDB API error", { error: error.message });
        return { items: [], genre: genreMap[genreId] || "Unknown", error: "Could not discover content." };
      }
    },
  });

  const get_top_rated = tool({
    description: "Get the highest rated movies or TV shows of all time. Use when user asks for 'best movies', 'top rated shows', etc.",
    parameters: z.object({
      mediaType: z.enum(["movie", "tv"]).describe("'movie' or 'tv'"),
      page: z.number().default(1).describe("Page number"),
    }),
    execute: async ({ mediaType, page = 1 }) => {
      logger.info("Executing tool: get_top_rated", { mediaType, page, userId });
      
      if (!mediaType) {
        return { topRated: [], error: "Please specify 'movie' or 'tv'." };
      }

      const cacheKey = `top_rated_${mediaType}_${page}`;
      const cached = getCached(cacheKey);
      if (cached) return cached;

      try {
        const result = await tmdbApi.mediaCategoryList({ mediaType, mediaCategory: "top_rated", page });
        const items = (result.results || []).slice(0, 8).map((item) => ({
          id: item.id,
          title: item.title || item.name,
          mediaType,
          rating: item.vote_average,
          releaseDate: item.release_date || item.first_air_date,
          overview: item.overview?.substring(0, 120) + (item.overview?.length > 120 ? "..." : ""),
          posterPath: item.poster_path,
        }));
        const response = { topRated: items, mediaType };
        setCache(cacheKey, response);
        return response;
      } catch (error) {
        logger.error("get_top_rated: TMDB API error", { error: error.message });
        return { topRated: [], error: "Could not fetch top rated content." };
      }
    },
  });

  // ==================== WATCHLIST TOOLS ====================

  const add_to_watchlist = tool({
    description: "Add a movie or TV show to the user's watchlist. Use when user explicitly wants to add something to their watchlist or says 'I want to watch this later'.",
    parameters: z.object({
      mediaId: z.number().describe("The TMDB ID of the media"),
      mediaType: z.enum(["movie", "tv"]).describe("Type of media"),
      mediaTitle: z.string().describe("Title of the media"),
      mediaPoster: z.string().optional().describe("Poster path of the media"),
      mediaRate: z.number().optional().describe("Rating of the media"),
    }),
    execute: async ({ mediaId, mediaType, mediaTitle, mediaPoster = "", mediaRate = 0 }) => {
      logger.info("Executing tool: add_to_watchlist", { mediaId, mediaType, mediaTitle, userId });
      if (!userId) {
        return { 
          success: false, 
          requiresAuth: true,
          message: "User needs to sign in to add items to watchlist." 
        };
      }

      const existing = await watchlistModel.findOne({
        user: userId,
        mediaId: mediaId.toString(),
      });

      if (existing) {
        return { 
          success: true, 
          alreadyExists: true,
          message: `"${mediaTitle}" is already in your watchlist.` 
        };
      }

      const item = await watchlistModel.create({
        user: userId,
        mediaId: mediaId.toString(),
        mediaType,
        mediaTitle,
        mediaPoster,
        mediaRate,
      });

      return { 
        success: true, 
        message: `Added "${mediaTitle}" to your watchlist! 🎬`,
        item: {
          id: item._id.toString(),
          mediaId: item.mediaId,
          mediaType: item.mediaType,
          mediaTitle: item.mediaTitle,
        }
      };
    },
  });

  const remove_from_watchlist = tool({
    description: "Remove a movie or TV show from the user's watchlist. This is a destructive action that requires user confirmation.",
    parameters: z.object({
      mediaId: z.number().describe("The TMDB ID of the media to remove"),
      mediaTitle: z.string().optional().describe("Title of the media (for confirmation message)"),
      confirmed: z.boolean().default(false).describe("Whether user has confirmed this action"),
    }),
    execute: async ({ mediaId, mediaTitle, confirmed }) => {
      logger.info("Executing tool: remove_from_watchlist", { mediaId, confirmed, userId });
      if (!userId) {
        return { 
          success: false, 
          requiresAuth: true,
          message: "🔐 Please sign in to manage your watchlist." 
        };
      }

      // First, check if item exists
      const item = await watchlistModel.findOne({
        user: userId,
        mediaId: mediaId.toString(),
      });

      if (!item) {
        return { success: false, message: "❌ Item not found in your watchlist." };
      }

      const title = mediaTitle || item.mediaTitle;

      // If not confirmed, return pending action for HITL
      if (!confirmed) {
        return {
          success: true,
          requiresConfirmation: true,
          message: `🗑️ Are you sure you want to remove **"${title}"** from your watchlist?\n\nSay **"yes"** to confirm or **"no"** to cancel.`,
          pendingAction: {
            type: "remove_watchlist",
            mediaId: mediaId.toString(),
            mediaTitle: title,
          },
        };
      }

      // Confirmed - proceed with deletion
      await watchlistModel.findOneAndDelete({
        user: userId,
        mediaId: mediaId.toString(),
      });

      return { 
        success: true, 
        message: `✅ Removed "${title}" from your watchlist.` 
      };
    },
  });

  const update_watchlist_item = tool({
    description: "Update the status of a watchlist item (e.g., mark as watching, completed). Use when user wants to update their watch progress.",
    parameters: z.object({
      mediaId: z.number().describe("The TMDB ID of the media to update"),
      status: z.enum(["plan_to_watch", "watching", "completed", "on_hold", "dropped"]).describe("New status for the watchlist item"),
      notes: z.string().optional().describe("Optional notes about the item"),
    }),
    execute: async ({ mediaId, status, notes }) => {
      logger.info("Executing tool: update_watchlist_item", { mediaId, status, userId });
      if (!userId) {
        return { 
          success: false, 
          requiresAuth: true,
          message: "🔐 Please sign in to update your watchlist." 
        };
      }

      const updateData = {};
      if (status) updateData.status = status;
      // Sanitize notes input
      if (notes !== undefined) updateData.notes = sanitizeNotes(notes);

      const item = await watchlistModel.findOneAndUpdate(
        { user: userId, mediaId: mediaId.toString() },
        updateData,
        { new: true }
      );

      if (!item) {
        return { success: false, message: "❌ Item not found in your watchlist." };
      }

      const statusEmojis = {
        plan_to_watch: "📋 Planning to watch",
        watching: "👀 Currently watching",
        completed: "✅ Completed!",
        on_hold: "⏸️ On hold",
        dropped: "❌ Dropped",
      };

      return { 
        success: true, 
        message: `${statusEmojis[status] || "Updated"}: **"${item.mediaTitle}"**`,
        item: {
          id: item._id.toString(),
          mediaId: item.mediaId,
          mediaTitle: item.mediaTitle,
          status: item.status,
        }
      };
    },
  });

  const get_watchlist = tool({
    description: "Get the user's current watchlist. Use when user asks what's on their watchlist or what they planned to watch.",
    parameters: z.object({
      mediaType: z.enum(["movie", "tv"]).optional().describe("Filter by media type"),
    }),
    execute: async ({ mediaType }) => {
      logger.info("Executing tool: get_watchlist", { mediaType, userId });
      if (!userId) {
        return { 
          success: false, 
          requiresAuth: true,
          message: "User needs to sign in to view watchlist." 
        };
      }

      const filter = { user: userId };
      if (mediaType) filter.mediaType = mediaType;

      const items = await watchlistModel.find(filter).sort({ createdAt: -1 }).limit(10).lean();

      return {
        success: true,
        watchlist: items.map((item) => ({
          id: item._id.toString(),
          mediaId: item.mediaId,
          mediaType: item.mediaType,
          mediaTitle: item.mediaTitle,
          mediaPoster: item.mediaPoster,
          status: item.status,
          addedAt: item.createdAt,
        })),
        totalCount: items.length,
      };
    },
  });

  // ==================== FAVORITES TOOLS ====================

  const add_to_favorites = tool({
    description: "Add a movie or TV show to the user's favorites. Use when user says they love something or want to mark it as a favorite.",
    parameters: z.object({
      mediaId: z.number().describe("The TMDB ID of the media"),
      mediaType: z.enum(["movie", "tv"]).describe("Type of media"),
      mediaTitle: z.string().describe("Title of the media"),
      mediaPoster: z.string().optional().describe("Poster path of the media"),
      mediaRate: z.number().optional().describe("Rating of the media"),
    }),
    execute: async ({ mediaId, mediaType, mediaTitle, mediaPoster = "", mediaRate = 0 }) => {
      logger.info("Executing tool: add_to_favorites", { mediaId, mediaType, mediaTitle, userId });
      if (!userId) {
        return { 
          success: false, 
          requiresAuth: true,
          message: "User needs to sign in to add favorites." 
        };
      }

      const existing = await favoriteModel.findOne({
        user: userId,
        mediaId: mediaId.toString(),
      });

      if (existing) {
        return { 
          success: true, 
          alreadyExists: true,
          message: `"${mediaTitle}" is already in your favorites.` 
        };
      }

      const item = await favoriteModel.create({
        user: userId,
        mediaId: mediaId.toString(),
        mediaType,
        mediaTitle,
        mediaPoster,
        mediaRate,
      });

      return { 
        success: true, 
        message: `Added "${mediaTitle}" to your favorites! ❤️`,
        item: {
          id: item._id.toString(),
          mediaId: item.mediaId,
          mediaType: item.mediaType,
          mediaTitle: item.mediaTitle,
        }
      };
    },
  });

  const remove_from_favorites = tool({
    description: "Remove a movie or TV show from the user's favorites. This is a destructive action that requires user confirmation.",
    parameters: z.object({
      mediaId: z.number().describe("The TMDB ID of the media to remove"),
      mediaTitle: z.string().optional().describe("Title of the media (for confirmation message)"),
      confirmed: z.boolean().default(false).describe("Whether user has confirmed this action"),
    }),
    execute: async ({ mediaId, mediaTitle, confirmed }) => {
      logger.info("Executing tool: remove_from_favorites", { mediaId, confirmed, userId });
      if (!userId) {
        return { 
          success: false, 
          requiresAuth: true,
          message: "🔐 Please sign in to manage your favorites." 
        };
      }

      // First, check if item exists
      const item = await favoriteModel.findOne({
        user: userId,
        mediaId: mediaId.toString(),
      });

      if (!item) {
        return { success: false, message: "❌ Item not found in your favorites." };
      }

      const title = mediaTitle || item.mediaTitle;

      // If not confirmed, return pending action for HITL
      if (!confirmed) {
        return {
          success: true,
          requiresConfirmation: true,
          message: `💔 Are you sure you want to remove **"${title}"** from your favorites?\n\nSay **"yes"** to confirm or **"no"** to cancel.`,
          pendingAction: {
            type: "remove_favorites",
            mediaId: mediaId.toString(),
            mediaTitle: title,
          },
        };
      }

      // Confirmed - proceed with deletion
      await favoriteModel.findOneAndDelete({
        user: userId,
        mediaId: mediaId.toString(),
      });

      return { 
        success: true, 
        message: `✅ Removed "${title}" from your favorites.` 
      };
    },
  });

  const get_favorites = tool({
    description: "Get the user's favorite movies and TV shows.",
    parameters: z.object({
      mediaType: z.enum(["movie", "tv"]).optional().describe("Filter by media type"),
    }),
    execute: async ({ mediaType }) => {
      logger.info("Executing tool: get_favorites", { mediaType, userId });
      if (!userId) {
        return { 
          success: false, 
          requiresAuth: true,
          message: "User needs to sign in to view favorites." 
        };
      }

      const filter = { user: userId };
      if (mediaType) filter.mediaType = mediaType;

      const items = await favoriteModel.find(filter).sort({ createdAt: -1 }).limit(10).lean();

      return {
        success: true,
        favorites: items.map((item) => ({
          id: item._id.toString(),
          mediaId: item.mediaId,
          mediaType: item.mediaType,
          mediaTitle: item.mediaTitle,
          mediaPoster: item.mediaPoster,
          addedAt: item.createdAt,
        })),
        totalCount: items.length,
      };
    },
  });

  // ==================== REVIEW TOOLS ====================

  const prepare_review = tool({
    description: "Prepare a review for a movie or TV show. This will ask for user confirmation before submitting. Use when user wants to write or submit a review.",
    parameters: z.object({
      mediaId: z.number().describe("The TMDB ID of the media"),
      mediaType: z.enum(["movie", "tv"]).describe("Type of media"),
      mediaTitle: z.string().describe("Title of the media"),
      content: z.string().describe("The review content/text"),
      rating: z.number().min(1).max(10).describe("Rating from 1-10"),
      containsSpoilers: z.boolean().default(false).describe("Whether the review contains spoilers"),
    }),
    execute: async ({ mediaId, mediaType, mediaTitle, content, rating, containsSpoilers }) => {
      logger.info("Executing tool: prepare_review", { mediaId, mediaType, mediaTitle, rating, userId });
      if (!userId) {
        return { 
          success: false, 
          requiresAuth: true,
          message: "🔐 Please sign in to write reviews." 
        };
      }

      // Sanitize the review content
      const sanitizedContent = sanitizeInput(content);
      
      if (sanitizedContent.length < 10) {
        return {
          success: false,
          message: "❌ Review content is too short. Please write at least 10 characters.",
        };
      }

      const existing = await reviewModel.findOne({
        user: userId,
        mediaId: mediaId.toString(),
      });

      if (existing) {
        return { 
          success: false, 
          alreadyReviewed: true,
          message: `📝 You've already reviewed **"${mediaTitle}"**. Would you like to update your existing review instead?` 
        };
      }

      const previewContent = sanitizedContent.substring(0, 100);
      const hasMore = sanitizedContent.length > 100;

      return {
        success: true,
        requiresConfirmation: true,
        message: `📝 I've prepared your review for **"${mediaTitle}"**:\n\n⭐ **Rating:** ${rating}/10\n💬 **Review:** "${previewContent}${hasMore ? "..." : ""}"\n${containsSpoilers ? "⚠️ **Contains spoilers**\n" : ""}\nSay **"yes"** to submit or **"no"** to cancel.`,
        pendingAction: {
          type: "review",
          mediaId: mediaId.toString(),
          mediaType,
          mediaTitle,
          data: {
            content: sanitizedContent,
            rating,
            containsSpoilers,
          },
        },
      };
    },
  });

  const get_user_reviews = tool({
    description: "Get reviews written by the user.",
    parameters: z.object({
      limit: z.number().default(5).describe("Number of reviews to return"),
    }),
    execute: async ({ limit }) => {
      logger.info("Executing tool: get_user_reviews", { limit, userId });
      if (!userId) {
        return { 
          success: false, 
          requiresAuth: true,
          message: "User needs to sign in to view their reviews." 
        };
      }

      const reviews = await reviewModel
        .find({ user: userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

      return {
        success: true,
        reviews: reviews.map((r) => ({
          id: r._id.toString(),
          mediaId: r.mediaId,
          mediaType: r.mediaType,
          mediaTitle: r.mediaTitle,
          rating: r.rating,
          content: r.content.substring(0, 100) + (r.content.length > 100 ? "..." : ""),
          createdAt: r.createdAt,
        })),
        totalCount: reviews.length,
      };
    },
  });

  const delete_review = tool({
    description: "Delete a review that the user previously wrote. This is a destructive action that requires user confirmation.",
    parameters: z.object({
      mediaId: z.number().describe("The TMDB ID of the media whose review to delete"),
      mediaTitle: z.string().optional().describe("Title of the media (for confirmation message)"),
      confirmed: z.boolean().default(false).describe("Whether user has confirmed this action"),
    }),
    execute: async ({ mediaId, mediaTitle, confirmed }) => {
      logger.info("Executing tool: delete_review", { mediaId, confirmed, userId });
      if (!userId) {
        return { 
          success: false, 
          requiresAuth: true,
          message: "🔐 Please sign in to delete reviews." 
        };
      }

      // First, check if review exists
      const review = await reviewModel.findOne({
        user: userId,
        mediaId: mediaId.toString(),
      });

      if (!review) {
        return { 
          success: false, 
          message: "❌ You haven't reviewed this title yet." 
        };
      }

      const title = mediaTitle || review.mediaTitle;

      // If not confirmed, return pending action for HITL
      if (!confirmed) {
        return {
          success: true,
          requiresConfirmation: true,
          message: `🗑️ Are you sure you want to delete your review for **"${title}"**?\n\n⭐ Rating: ${review.rating}/10\n💬 Review: "${review.content.substring(0, 50)}..."\n\nSay **"yes"** to confirm or **"no"** to cancel.`,
          pendingAction: {
            type: "delete_review",
            mediaId: mediaId.toString(),
            mediaTitle: title,
          },
        };
      }

      // Confirmed - proceed with deletion
      await reviewModel.findOneAndDelete({
        user: userId,
        mediaId: mediaId.toString(),
      });

      return { 
        success: true, 
        message: `✅ Your review for "${title}" has been deleted.` 
      };
    },
  });

  // Return all tools
  return {
    // BEST tool for "details" queries - does search + details in one call
    get_content_details_by_name,
    
    // Search tools (for browsing/exploring, not for getting details)
    multi_search,
    search_movies,
    search_tv_shows,
    
    // Detail tools by ID (use when you already have the ID)
    get_movie_details,
    get_tv_details,
    get_person_info,
    
    // Discovery tools
    get_trending,
    get_similar_content,
    discover_by_genre,
    get_top_rated,
    
    // User list management (requires auth)
    add_to_watchlist,
    remove_from_watchlist,
    update_watchlist_item,
    get_watchlist,
    add_to_favorites,
    remove_from_favorites,
    get_favorites,
    
    // Reviews (requires auth)
    prepare_review,
    get_user_reviews,
    delete_review,
  };
}

/**
 * Confirm and execute a pending action (like submitting a review or removing items)
 * @param {string} userId - User ID
 * @param {object} pendingAction - The pending action to confirm
 * @returns {Promise<object>} - Result of the action
 */
export async function confirmAction(userId, pendingAction) {
  if (!userId) {
    return { 
      success: false, 
      message: "🔐 Please sign in to complete this action." 
    };
  }

  if (!pendingAction || !pendingAction.type) {
    return { 
      success: false, 
      message: "❌ No pending action found." 
    };
  }

  logger.info("Confirming action", { type: pendingAction.type, userId });

  switch (pendingAction.type) {
    case "review": {
      const { mediaId, mediaType, mediaTitle, data } = pendingAction;

      // Check if review already exists (user may have submitted via another method)
      const existing = await reviewModel.findOne({
        user: userId,
        mediaId: mediaId.toString(),
      });

      if (existing) {
        return {
          success: false,
          message: `📝 You've already reviewed "${mediaTitle}".`,
        };
      }

      const review = await reviewModel.create({
        user: userId,
        mediaId,
        mediaType,
        mediaTitle,
        mediaPoster: data.mediaPoster || "",
        content: sanitizeInput(data.content), // Sanitize again for safety
        rating: data.rating,
        containsSpoilers: data.containsSpoilers || false,
      });

      return {
        success: true,
        message: `🎉 Your review for **"${mediaTitle}"** has been submitted! Thank you for sharing your thoughts.`,
        review: {
          id: review._id.toString(),
          rating: review.rating,
          mediaTitle: review.mediaTitle,
        },
      };
    }

    case "remove_watchlist": {
      const { mediaId, mediaTitle } = pendingAction;

      const item = await watchlistModel.findOneAndDelete({
        user: userId,
        mediaId: mediaId.toString(),
      });

      if (!item) {
        return { 
          success: false, 
          message: `❌ "${mediaTitle || "Item"}" was not found in your watchlist.` 
        };
      }

      return { 
        success: true, 
        message: `✅ Removed **"${item.mediaTitle}"** from your watchlist.` 
      };
    }

    case "remove_favorites": {
      const { mediaId, mediaTitle } = pendingAction;

      const item = await favoriteModel.findOneAndDelete({
        user: userId,
        mediaId: mediaId.toString(),
      });

      if (!item) {
        return { 
          success: false, 
          message: `❌ "${mediaTitle || "Item"}" was not found in your favorites.` 
        };
      }

      return { 
        success: true, 
        message: `✅ Removed **"${item.mediaTitle}"** from your favorites.` 
      };
    }

    case "delete_review": {
      const { mediaId, mediaTitle } = pendingAction;

      const review = await reviewModel.findOneAndDelete({
        user: userId,
        mediaId: mediaId.toString(),
      });

      if (!review) {
        return { 
          success: false, 
          message: `❌ Review for "${mediaTitle || "this item"}" was not found.` 
        };
      }

      return { 
        success: true, 
        message: `✅ Your review for **"${review.mediaTitle}"** has been deleted.` 
      };
    }

    default:
      logger.warn("Unknown pending action type", { type: pendingAction.type });
      return { 
        success: false, 
        message: `❌ Unknown action type: ${pendingAction.type}` 
      };
  }
}

// ==================== CACHE MANAGEMENT ====================

/**
 * Clear the TMDB response cache
 * @returns {number} - Number of entries cleared
 */
export function clearTmdbCache() {
  return tmdbCache.clear();
}

/**
 * Get cache statistics
 * @returns {object} - Cache stats
 */
export function getCacheStats() {
  return tmdbCache.getStats();
}

/**
 * Look up a popular title (for external use)
 * @param {string} query - Title to look up
 * @returns {object|null} - { id, mediaType } or null
 */
export function findPopularTitle(query) {
  return lookupPopularTitle(query);
}

// ==================== NATIVE GROQ SDK SUPPORT ====================
// These functions provide tool definitions and execution for the native Groq SDK
// since the Vercel AI SDK's @ai-sdk/groq provider has tool calling issues

/**
 * Convert Zod schema to JSON Schema for Groq's native format
 * This handles Vercel AI SDK's tool() wrapper format and Zod v4
 * @param {z.ZodType} schema - Zod schema
 * @returns {object} - JSON Schema
 */
function zodToJsonSchema(schema) {
  // Helper to get shape from various Zod object formats
  function getShape(zodType) {
    // Try direct shape property (common for Zod objects)
    if (typeof zodType.shape === "function") {
      return zodType.shape();
    }
    if (zodType.shape && typeof zodType.shape === "object") {
      return zodType.shape;
    }
    // Try _def.shape
    if (typeof zodType._def?.shape === "function") {
      return zodType._def.shape();
    }
    if (zodType._def?.shape && typeof zodType._def.shape === "object") {
      return zodType._def.shape;
    }
    return null;
  }

  // Helper to get Zod type name (works with Zod v4)
  function getTypeName(zodType) {
    // Zod v4 uses constructor.name
    if (zodType?.constructor?.name) {
      return zodType.constructor.name;
    }
    // Fallback to _def.typeName for older versions
    return zodType?._def?.typeName;
  }

  // Helper to check if a field is optional (ZodOptional or ZodDefault)
  function isOptional(zodType) {
    const typeName = getTypeName(zodType);
    return typeName === "ZodOptional" || typeName === "ZodDefault";
  }

  // Helper to unwrap default/optional types
  function unwrapType(zodType) {
    const typeName = getTypeName(zodType);
    if (typeName === "ZodDefault" && typeof zodType.unwrap === "function") {
      return zodType.unwrap();
    }
    if (typeName === "ZodOptional" && zodType._def?.innerType) {
      return zodType._def.innerType;
    }
    return zodType;
  }

  // Helper to get enum values
  function getEnumValues(zodType) {
    // Zod v4 stores values differently
    if (zodType._def?.entries) {
      return Object.values(zodType._def.entries);
    }
    if (zodType._def?.values) {
      return zodType._def.values;
    }
    // Try to get from the type's entries (ZodEnum)
    if (zodType.enum) {
      return Object.values(zodType.enum);
    }
    return null;
  }

  // Helper to convert Zod types to JSON Schema
  function convertType(zodType, includeDescription = true) {
    if (!zodType) return { type: "string" };
    
    const typeName = getTypeName(zodType);
    const description = includeDescription ? zodType.description : undefined;
    
    // Check if it has a shape (ZodObject-like)
    const shape = getShape(zodType);
    if (shape && typeof shape === "object" && Object.keys(shape).length > 0) {
      const properties = {};
      const required = [];
      
      for (const [key, value] of Object.entries(shape)) {
        properties[key] = convertType(value);
        // Check if field is required
        if (!isOptional(value)) {
          required.push(key);
        }
      }
      
      return {
        type: "object",
        properties,
        required: required.length > 0 ? required : undefined,
        additionalProperties: false,
      };
    }
    
    // Handle ZodDefault - unwrap and convert inner type
    if (typeName === "ZodDefault") {
      const inner = unwrapType(zodType);
      const result = convertType(inner, false);
      // Add description from the outer type
      if (description) result.description = description;
      return result;
    }
    
    // Handle ZodOptional - convert inner type
    if (typeName === "ZodOptional") {
      const inner = zodType._def?.innerType || zodType;
      return convertType(inner);
    }
    
    // Handle ZodString
    if (typeName === "ZodString") {
      const result = { type: "string" };
      if (description) result.description = description;
      return result;
    }
    
    // Handle ZodNumber
    if (typeName === "ZodNumber") {
      const result = { type: "number" };
      if (description) result.description = description;
      return result;
    }
    
    // Handle ZodBoolean
    if (typeName === "ZodBoolean") {
      const result = { type: "boolean" };
      if (description) result.description = description;
      return result;
    }
    
    // Handle ZodEnum
    if (typeName === "ZodEnum") {
      const enumValues = getEnumValues(zodType);
      const result = { type: "string" };
      if (enumValues) result.enum = enumValues;
      if (description) result.description = description;
      return result;
    }
    
    // Handle ZodArray
    if (typeName === "ZodArray") {
      const itemType = zodType._def?.type || zodType.element;
      const result = { type: "array", items: convertType(itemType) };
      if (description) result.description = description;
      return result;
    }
    
    // Handle ZodObject (fallback if not caught by shape check)
    if (typeName === "ZodObject") {
      return { type: "object", properties: {}, additionalProperties: false };
    }
    
    // Last resort fallback - treat as string
    return { type: "string" };
  }
  
  return convertType(schema);
}

// Core tools to include for Groq (limited set works better with Llama models)
const GROQ_CORE_TOOLS = [
  "get_content_details_by_name",
  "multi_search",
  "get_trending",
  "discover_by_genre",
  "get_similar_content",
  "get_movie_details",
  "get_tv_details",
  "get_top_rated",
];

/**
 * Get tool definitions in Groq's native format
 * @param {string|null} userId - User ID for authenticated tools
 * @param {boolean} limitTools - If true, only include core tools (for better Groq compatibility)
 * @returns {Array} - Array of tool definitions for Groq API
 */
export function getToolDefinitions(userId = null, limitTools = true) {
  const tools = createTools(userId);
  const definitions = [];
  
  for (const [name, toolObj] of Object.entries(tools)) {
    // Skip non-core tools for Groq (limited tool set works better with Llama)
    if (limitTools && !GROQ_CORE_TOOLS.includes(name)) {
      continue;
    }
    
    // Access the tool's internal structure
    const params = toolObj.parameters;
    const description = toolObj.description;
    
    const jsonSchema = zodToJsonSchema(params);
    
    definitions.push({
      type: "function",
      function: {
        name,
        description,
        parameters: jsonSchema,
      },
    });
  }
  
  logger.info("Generated tool definitions", { 
    totalTools: Object.keys(tools).length,
    includedTools: definitions.length,
    limitTools,
  });
  
  return definitions;
}

/**
 * Execute a tool by name with given arguments
 * @param {string} toolName - Name of the tool to execute
 * @param {object} args - Arguments for the tool
 * @param {string|null} userId - User ID for authenticated tools
 * @returns {Promise<any>} - Tool execution result
 */
export async function executeToolCall(toolName, args, userId = null) {
  const tools = createTools(userId);
  const tool = tools[toolName];
  
  if (!tool) {
    logger.error("Tool not found", { toolName, availableTools: Object.keys(tools) });
    return { error: `Tool "${toolName}" not found` };
  }
  
  try {
    logger.info("Executing tool via native Groq SDK", { toolName, args, userId });
    const result = await tool.execute(args);
    return result;
  } catch (error) {
    logger.error("Tool execution failed", { toolName, error: error.message });
    return { error: `Tool execution failed: ${error.message}` };
  }
}

export default { 
  createTools, 
  confirmAction, 
  sanitizeInput, 
  sanitizeNotes,
  clearTmdbCache,
  getCacheStats,
  findPopularTitle,
  getToolDefinitions,
  executeToolCall,
};
