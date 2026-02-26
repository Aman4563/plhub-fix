/**
 * Vector Store Module - MongoDB Atlas Vector Search integration
 * Uses Google's text-embedding-004 model for embeddings
 * 
 * Note: Requires MongoDB Atlas with Vector Search enabled
 * and a vector search index on the reviews collection
 */

import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import mongoose from "mongoose";
import logger from "../../config/logger.config.js";

// Embedding dimension for text-embedding-004
const EMBEDDING_DIMENSION = 768;

/**
 * Initialize the Google embeddings model
 * Uses free tier of Google Generative AI
 */
export function createEmbeddingsModel() {
  return new GoogleGenerativeAIEmbeddings({
    model: "text-embedding-004",
    apiKey: process.env.GEMINI_API_KEY, // Explicit API key
  });
}

/**
 * Generate embedding for a text query
 * @param {string} text - Text to embed
 * @returns {Promise<number[]>} - Embedding vector
 */
export async function embedText(text) {
  const embeddings = createEmbeddingsModel();
  const vector = await embeddings.embedQuery(text);
  return vector;
}

/**
 * Generate embeddings for multiple texts
 * @param {string[]} texts - Array of texts to embed
 * @returns {Promise<number[][]>} - Array of embedding vectors
 */
export async function embedDocuments(texts) {
  const embeddings = createEmbeddingsModel();
  const vectors = await embeddings.embedDocuments(texts);
  return vectors;
}

/**
 * Search mode indicators for UX feedback
 */
export const SearchMode = {
  VECTOR: "vector",
  TEXT_FALLBACK: "text_fallback",
  UNAVAILABLE: "unavailable",
};

/**
 * Perform vector similarity search on reviews collection
 * Requires MongoDB Atlas Vector Search index named "review_embeddings"
 * 
 * @param {string} query - Search query text
 * @param {number} k - Number of results to return (default: 5)
 * @param {object} filter - Optional filter (e.g., { mediaId: "123" })
 * @returns {Promise<object>} - Object with results array, searchMode, and optional message
 */
export async function searchSimilarReviews(query, k = 5, filter = {}) {
  try {
    // Generate embedding for query
    const queryEmbedding = await embedText(query);

    // Get the Review collection directly from mongoose connection
    const Review = mongoose.model("Review");
    
    // Build the aggregation pipeline for vector search
    const pipeline = [
      {
        $vectorSearch: {
          index: "review_embeddings",
          path: "embedding",
          queryVector: queryEmbedding,
          numCandidates: k * 10,
          limit: k,
          filter: Object.keys(filter).length > 0 ? filter : undefined,
        },
      },
      {
        $project: {
          _id: 1,
          content: 1,
          rating: 1,
          mediaId: 1,
          mediaTitle: 1,
          mediaType: 1,
          user: 1,
          createdAt: 1,
          score: { $meta: "vectorSearchScore" },
        },
      },
    ];

    const results = await Review.aggregate(pipeline);

    logger.info("Vector search completed", {
      query: query.substring(0, 50),
      resultsCount: results.length,
      searchMode: SearchMode.VECTOR,
    });

    return {
      results,
      searchMode: SearchMode.VECTOR,
      message: null,
    };
  } catch (error) {
    // If vector search isn't configured, fall back to text search
    if (error.message?.includes("index") || error.message?.includes("vector") || 
        error.message?.includes("$vectorSearch")) {
      logger.warn("Vector search not available, falling back to text search", {
        error: error.message,
      });
      return fallbackTextSearch(query, k, filter);
    }
    
    logger.error("Vector search failed", { error: error.message });
    return {
      results: [],
      searchMode: SearchMode.UNAVAILABLE,
      message: "Review search is temporarily unavailable.",
    };
  }
}

/**
 * Fallback text search when vector search isn't available
 * Returns results with search mode indicator for UX
 * @param {string} query - Search query
 * @param {number} k - Number of results
 * @param {object} filter - Optional filter
 * @returns {Promise<object>} - Object with results array, searchMode, and message
 */
async function fallbackTextSearch(query, k = 5, filter = {}) {
  try {
    const Review = mongoose.model("Review");
    
    // Escape regex special characters in query
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    
    // Simple text search fallback
    const searchFilter = {
      ...filter,
      $or: [
        { content: { $regex: escapedQuery, $options: "i" } },
        { mediaTitle: { $regex: escapedQuery, $options: "i" } },
      ],
    };

    const results = await Review.find(searchFilter)
      .sort({ rating: -1, createdAt: -1 })
      .limit(k)
      .select("content rating mediaId mediaTitle mediaType user createdAt")
      .lean();

    logger.info("Text fallback search completed", {
      query: query.substring(0, 50),
      resultsCount: results.length,
    });

    return {
      results: results.map((r) => ({ ...r, score: 0.5 })),
      searchMode: SearchMode.TEXT_FALLBACK,
      message: results.length > 0 
        ? "Using basic text search - results may be less accurate than semantic search."
        : null,
    };
  } catch (error) {
    logger.error("Text fallback search failed", { error: error.message });
    return {
      results: [],
      searchMode: SearchMode.UNAVAILABLE,
      message: "Review search is temporarily unavailable.",
    };
  }
}

/**
 * Get relevant reviews for a media item
 * @param {string} mediaId - TMDB media ID
 * @param {number} limit - Max reviews to return
 * @returns {Promise<Array>} - Reviews for the media (backward compatible - returns array directly)
 */
export async function getReviewsForMedia(mediaId, limit = 5) {
  try {
    const Review = mongoose.model("Review");
    
    // Try to find reviews (with or without status field)
    let reviews = await Review.find({ 
      mediaId: mediaId.toString(),
    })
      .sort({ rating: -1, createdAt: -1 })
      .limit(limit)
      .populate("user", "displayName")
      .lean();

    // If status field exists and we got no results, try with status filter
    if (reviews.length === 0) {
      reviews = await Review.find({ 
        mediaId: mediaId.toString(),
        status: "approved",
      })
        .sort({ rating: -1, createdAt: -1 })
        .limit(limit)
        .populate("user", "displayName")
        .lean();
    }

    return reviews;
  } catch (error) {
    logger.error("Get reviews for media failed", { error: error.message, mediaId });
    return [];
  }
}

/**
 * Add embedding to a review document
 * @param {string} reviewId - Review document ID
 * @param {number[]} embedding - Embedding vector
 */
export async function updateReviewEmbedding(reviewId, embedding) {
  const Review = mongoose.model("Review");
  
  await Review.findByIdAndUpdate(reviewId, { embedding });
  
  logger.info("Updated review embedding", { reviewId });
}

/**
 * Check if a review has an embedding
 * @param {string} reviewId - Review document ID
 * @returns {Promise<boolean>}
 */
export async function hasEmbedding(reviewId) {
  const Review = mongoose.model("Review");
  const review = await Review.findById(reviewId).select("embedding").lean();
  return !!(review?.embedding?.length > 0);
}

/**
 * Get reviews without embeddings (for batch processing)
 * @param {number} limit - Max reviews to return
 * @returns {Promise<Array>}
 */
export async function getReviewsWithoutEmbeddings(limit = 100) {
  const Review = mongoose.model("Review");
  
  return Review.find({
    $or: [
      { embedding: { $exists: false } },
      { embedding: { $size: 0 } },
      { embedding: null },
    ],
  })
    .select("_id content mediaTitle")
    .limit(limit)
    .lean();
}

/**
 * Build RAG context from retrieved reviews
 * @param {Array} reviews - Retrieved reviews
 * @returns {string} - Formatted context string
 */
export function buildRAGContext(reviews) {
  if (!reviews || reviews.length === 0) {
    return "";
  }

  const context = reviews
    .map((r, idx) => {
      return `Review ${idx + 1} (${r.mediaTitle}, Rating: ${r.rating}/10):
"${r.content.substring(0, 300)}${r.content.length > 300 ? "..." : ""}"`;
    })
    .join("\n\n");

  return `Based on community reviews:\n\n${context}`;
}

export default {
  createEmbeddingsModel,
  embedText,
  embedDocuments,
  searchSimilarReviews,
  getReviewsForMedia,
  updateReviewEmbedding,
  hasEmbedding,
  getReviewsWithoutEmbeddings,
  buildRAGContext,
  EMBEDDING_DIMENSION,
  SearchMode,
};

