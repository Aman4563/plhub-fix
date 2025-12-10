import mongoose from "mongoose";
import responseHandler from "../handlers/response.handler.js";
import favoriteModel from "../models/favorite.model.js";
import logger from "../config/logger.config.js";

/**
 * Transform favorite item to include id field
 */
const transformFavoriteItem = (item) => {
  if (!item) return null;
  const obj = item.toObject ? item.toObject() : item;
  
  // Handle cases where _id might be undefined
  const id = obj._id ? obj._id.toString() : obj.id || null;
  
  return {
    ...obj,
    id,
  };
};

/**
 * Validate MongoDB ObjectId
 */
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id) && 
         new mongoose.Types.ObjectId(id).toString() === id;
};

/**
 * Add a Favorite
 * Adds a media item to the user's list of favorites.
 * Returns alreadyFavorited: true if item was already in favorites.
 */
const addFavorite = async (req, res) => {
  try {
    const { mediaId, mediaType, mediaTitle, mediaPoster, mediaRate } = req.body;

    // Validate required fields
    if (!mediaId) {
      return responseHandler.badrequest(res, "Media ID is required.");
    }
    if (!mediaType || !["movie", "tv"].includes(mediaType)) {
      return responseHandler.badrequest(res, "Valid media type (movie/tv) is required.");
    }
    if (!mediaTitle) {
      return responseHandler.badrequest(res, "Media title is required.");
    }
    if (mediaPoster === undefined) {
      return responseHandler.badrequest(res, "Media poster is required.");
    }
    if (mediaRate === undefined || mediaRate === null) {
      return responseHandler.badrequest(res, "Media rate is required.");
    }

    // Check for existing favorite
    const existingFavorite = await favoriteModel.findOne({
      user: req.user.id,
      mediaId: String(mediaId),
    });

    if (existingFavorite) {
      return responseHandler.ok(res, {
        ...transformFavoriteItem(existingFavorite),
        alreadyFavorited: true,
      });
    }

    // Create new favorite with validated data
    const newFavorite = await favoriteModel.create({
      user: req.user.id,
      mediaId: String(mediaId),
      mediaType,
      mediaTitle,
      mediaPoster: mediaPoster || "",
      mediaRate: Number(mediaRate) || 0,
    });

    logger.info("Favorite added", { userId: req.user.id, mediaId: String(mediaId) });
    
    responseHandler.created(res, {
      ...transformFavoriteItem(newFavorite),
      alreadyFavorited: false,
    });
  } catch (error) {
    logger.error("Error adding favorite:", { error: error.message, stack: error.stack });
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return responseHandler.ok(res, {
        alreadyFavorited: true,
        message: "Already in favorites",
      });
    }
    
    responseHandler.error(res, "Failed to add favorite.");
  }
};

/**
 * Remove a Favorite
 * Removes a media item from the user's list of favorites.
 */
const removeFavorite = async (req, res) => {
  try {
    const { favoriteId } = req.params;

    if (!favoriteId) {
      return responseHandler.badrequest(res, "Favorite ID is required.");
    }

    if (!isValidObjectId(favoriteId)) {
      return responseHandler.badrequest(res, "Invalid favorite ID format.");
    }

    const favorite = await favoriteModel.findOneAndDelete({
      user: req.user.id,
      _id: favoriteId,
    });

    if (!favorite) {
      return responseHandler.notfound(res, "Favorite not found.");
    }

    logger.info("Favorite removed", { userId: req.user.id, favoriteId });
    responseHandler.ok(res, { message: "Favorite removed successfully." });
  } catch (error) {
    logger.error("Error removing favorite:", { error: error.message });
    responseHandler.error(res, "Failed to remove favorite.");
  }
};

/**
 * Bulk Remove Favorites
 * Removes multiple favorites at once.
 */
const bulkRemoveFavorites = async (req, res) => {
  try {
    const { favoriteIds } = req.body;

    if (!favoriteIds || !Array.isArray(favoriteIds) || favoriteIds.length === 0) {
      return responseHandler.badrequest(res, "favoriteIds array is required.");
    }

    if (favoriteIds.length > 100) {
      return responseHandler.badrequest(res, "Cannot remove more than 100 favorites at once.");
    }

    const validIds = favoriteIds.filter(id => isValidObjectId(id));
    if (validIds.length === 0) {
      return responseHandler.badrequest(res, "No valid favorite IDs provided.");
    }

    const result = await favoriteModel.deleteMany({
      user: req.user.id,
      _id: { $in: validIds },
    });

    logger.info("Bulk favorites removed", { 
      userId: req.user.id, 
      requestedCount: favoriteIds.length,
      deletedCount: result.deletedCount 
    });

    responseHandler.ok(res, { 
      message: "Favorites removed successfully.",
      deletedCount: result.deletedCount,
      requestedCount: favoriteIds.length,
    });
  } catch (error) {
    logger.error("Error bulk removing favorites:", { error: error.message });
    responseHandler.error(res, "Failed to remove favorites.");
  }
};

/**
 * Remove Favorites by Media Type
 * Removes all favorites of a specific media type (movie or tv).
 */
const removeFavoritesByType = async (req, res) => {
  try {
    const { mediaType } = req.params;

    if (!["movie", "tv"].includes(mediaType)) {
      return responseHandler.badrequest(res, "Media type must be 'movie' or 'tv'.");
    }

    const result = await favoriteModel.deleteMany({
      user: req.user.id,
      mediaType,
    });

    logger.info("Favorites removed by type", { 
      userId: req.user.id, 
      mediaType,
      deletedCount: result.deletedCount 
    });

    responseHandler.ok(res, { 
      message: `All ${mediaType} favorites removed successfully.`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    logger.error("Error removing favorites by type:", { error: error.message });
    responseHandler.error(res, "Failed to remove favorites.");
  }
};

/**
 * Get User's Favorites with Pagination, Filtering, Sorting, and Search
 * 
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 100)
 * - mediaType: Filter by 'movie' or 'tv'
 * - sortBy: Sort field - 'createdAt', 'mediaTitle', 'mediaRate' (default: 'createdAt')
 * - sortOrder: 'asc' or 'desc' (default: 'desc')
 * - search: Search term for title
 */
const getFavoritesOfUser = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      mediaType,
      sortBy = "createdAt",
      sortOrder = "desc",
      search,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const skip = (pageNum - 1) * limitNum;

    const query = { user: req.user.id };

    if (mediaType && ["movie", "tv"].includes(mediaType)) {
      query.mediaType = mediaType;
    }

    if (search && search.trim()) {
      query.mediaTitle = { $regex: search.trim(), $options: "i" };
    }

    const allowedSortFields = ["createdAt", "mediaTitle", "mediaRate"];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";
    const sortDirection = sortOrder === "asc" ? 1 : -1;

    const [favorites, total] = await Promise.all([
      favoriteModel
        .find(query)
        .sort({ [sortField]: sortDirection })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      favoriteModel.countDocuments(query),
    ]);

    const transformedFavorites = favorites.map((item) => ({
      ...item,
      id: item._id.toString(),
    }));

    const totalPages = Math.ceil(total / limitNum);

    responseHandler.ok(res, {
      favorites: transformedFavorites,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
    });
  } catch (error) {
    logger.error("Error fetching favorites:", { error: error.message });
    responseHandler.error(res, "Failed to retrieve favorites.");
  }
};

/**
 * Get Favorites Count
 * Returns count of favorites, optionally filtered by media type
 */
const getFavoritesCount = async (req, res) => {
  try {
    const { mediaType } = req.query;
    
    const query = { user: req.user.id };
    if (mediaType && ["movie", "tv"].includes(mediaType)) {
      query.mediaType = mediaType;
    }

    const [total, movieCount, tvCount] = await Promise.all([
      favoriteModel.countDocuments({ user: req.user.id }),
      favoriteModel.countDocuments({ user: req.user.id, mediaType: "movie" }),
      favoriteModel.countDocuments({ user: req.user.id, mediaType: "tv" }),
    ]);

    responseHandler.ok(res, {
      total,
      movies: movieCount,
      tvShows: tvCount,
    });
  } catch (error) {
    logger.error("Error getting favorites count:", { error: error.message });
    responseHandler.error(res, "Failed to get favorites count.");
  }
};

/**
 * Check if Media is Favorited
 * Checks if a specific media item is in user's favorites
 */
const checkFavorite = async (req, res) => {
  try {
    const { mediaId } = req.params;

    if (!mediaId) {
      return responseHandler.badrequest(res, "Media ID is required.");
    }

    const favorite = await favoriteModel.findOne({
      user: req.user.id,
      mediaId: String(mediaId),
    });

    responseHandler.ok(res, {
      isFavorite: !!favorite,
      favorite: favorite ? transformFavoriteItem(favorite) : null,
    });
  } catch (error) {
    logger.error("Error checking favorite:", { error: error.message });
    responseHandler.error(res, "Failed to check favorite status.");
  }
};

export default { 
  addFavorite, 
  removeFavorite, 
  bulkRemoveFavorites,
  removeFavoritesByType,
  getFavoritesOfUser,
  getFavoritesCount,
  checkFavorite,
};
