/**
 * Watchlist Controller
 * Handles CRUD operations for user's watchlist
 */

import responseHandler from "../handlers/response.handler.js";
import watchlistModel from "../models/watchlist.model.js";
import logger from "../config/logger.config.js";
import mongoose from "mongoose";

/**
 * Transform watchlist item to include id field
 * Safely handles null/undefined values
 */
const transformWatchlistItem = (item) => {
  if (!item) return null;
  
  // Handle both Mongoose documents and plain objects
  const obj = item.toObject ? item.toObject() : item;
  
  // Safely get the ID
  const id = obj._id ? obj._id.toString() : (obj.id ? obj.id.toString() : null);
  
  return {
    ...obj,
    id,
  };
};

/**
 * Add item to watchlist
 */
const addToWatchlist = async (req, res) => {
  try {
    const { mediaId, mediaType, mediaTitle, mediaPoster, mediaBackdrop, mediaRate, notes, priority } = req.body;

    // Validate required fields
    if (!mediaId) {
      return responseHandler.badrequest(res, "Media ID is required");
    }
    if (!mediaType) {
      return responseHandler.badrequest(res, "Media type is required");
    }
    if (!mediaTitle) {
      return responseHandler.badrequest(res, "Media title is required");
    }

    // Check if already in watchlist
    const existing = await watchlistModel.findOne({
      user: req.user.id,
      mediaId: mediaId.toString(),
    });

    if (existing) {
      logger.info("Item already in watchlist, returning existing", { userId: req.user.id, mediaId });
      return responseHandler.ok(res, transformWatchlistItem(existing));
    }

    // Create new watchlist item
    const watchlistItem = new watchlistModel({
      user: req.user.id,
      mediaId: mediaId.toString(),
      mediaType,
      mediaTitle,
      mediaPoster: mediaPoster || "",
      mediaBackdrop: mediaBackdrop || "",
      mediaRate: mediaRate || 0,
      notes: notes || "",
      priority: priority || 0,
    });

    // Save and wait for it to complete
    await watchlistItem.save();

    logger.info("Item added to watchlist", { userId: req.user.id, mediaId: mediaId.toString() });

    // Return the saved item with id
    const response = {
      ...watchlistItem.toObject(),
      id: watchlistItem._id.toString(),
    };

    responseHandler.created(res, response);
  } catch (error) {
    logger.error("Error adding to watchlist", { error: error.message, stack: error.stack });
    responseHandler.error(res, "Failed to add to watchlist");
  }
};

/**
 * Remove item from watchlist
 */
const removeFromWatchlist = async (req, res) => {
  try {
    const { watchlistId } = req.params;

    if (!watchlistId) {
      return responseHandler.badrequest(res, "Watchlist ID is required");
    }

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(watchlistId)) {
      return responseHandler.badrequest(res, "Invalid watchlist ID");
    }

    const item = await watchlistModel.findOneAndDelete({
      _id: watchlistId,
      user: req.user.id,
    });

    if (!item) {
      return responseHandler.notfound(res, "Watchlist item not found");
    }

    logger.info("Item removed from watchlist", { userId: req.user.id, watchlistId });

    responseHandler.ok(res, { message: "Removed from watchlist" });
  } catch (error) {
    logger.error("Error removing from watchlist", { error: error.message });
    responseHandler.error(res, "Failed to remove from watchlist");
  }
};

/**
 * Get user's watchlist
 */
const getWatchlist = async (req, res) => {
  try {
    const { status, mediaType, sort = "createdAt", order = "desc" } = req.query;

    const filter = { user: req.user.id };

    if (status) filter.status = status;
    if (mediaType) filter.mediaType = mediaType;

    const sortOptions = {};
    sortOptions[sort] = order === "asc" ? 1 : -1;

    const watchlist = await watchlistModel
      .find(filter)
      .sort(sortOptions)
      .lean();

    // Transform to include id field
    const transformedWatchlist = watchlist.map(item => ({
      ...item,
      id: item._id ? item._id.toString() : null,
    }));

    responseHandler.ok(res, transformedWatchlist);
  } catch (error) {
    logger.error("Error fetching watchlist", { error: error.message });
    responseHandler.error(res, "Failed to fetch watchlist");
  }
};

/**
 * Update watchlist item
 */
const updateWatchlistItem = async (req, res) => {
  try {
    const { watchlistId } = req.params;
    const { status, currentSeason, currentEpisode, notes, priority, reminderDate } = req.body;

    if (!watchlistId) {
      return responseHandler.badrequest(res, "Watchlist ID is required");
    }

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(watchlistId)) {
      return responseHandler.badrequest(res, "Invalid watchlist ID");
    }

    const updateData = {};
    if (status !== undefined) updateData.status = status;
    if (currentSeason !== undefined) updateData.currentSeason = currentSeason;
    if (currentEpisode !== undefined) updateData.currentEpisode = currentEpisode;
    if (notes !== undefined) updateData.notes = notes;
    if (priority !== undefined) updateData.priority = priority;
    if (reminderDate !== undefined) updateData.reminderDate = reminderDate;

    const item = await watchlistModel.findOneAndUpdate(
      { _id: watchlistId, user: req.user.id },
      updateData,
      { new: true }
    );

    if (!item) {
      return responseHandler.notfound(res, "Watchlist item not found");
    }

    logger.info("Watchlist item updated", { userId: req.user.id, watchlistId });

    // Return with id field
    const response = {
      ...item.toObject(),
      id: item._id.toString(),
    };

    responseHandler.ok(res, response);
  } catch (error) {
    logger.error("Error updating watchlist item", { error: error.message });
    responseHandler.error(res, "Failed to update watchlist item");
  }
};

/**
 * Check if media is in watchlist
 */
const checkWatchlist = async (req, res) => {
  try {
    const { mediaId } = req.params;

    if (!mediaId) {
      return responseHandler.badrequest(res, "Media ID is required");
    }

    const item = await watchlistModel.findOne({
      user: req.user.id,
      mediaId: mediaId.toString(),
    });

    responseHandler.ok(res, { 
      inWatchlist: !!item, 
      item: item ? transformWatchlistItem(item) : null 
    });
  } catch (error) {
    logger.error("Error checking watchlist", { error: error.message });
    responseHandler.error(res, "Failed to check watchlist");
  }
};

/**
 * Get watchlist statistics
 */
const getWatchlistStats = async (req, res) => {
  try {
    // Convert string id to ObjectId for aggregation
    const userId = new mongoose.Types.ObjectId(req.user.id);
    
    const stats = await watchlistModel.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const totalByType = await watchlistModel.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: "$mediaType",
          count: { $sum: 1 },
        },
      },
    ]);

    responseHandler.ok(res, {
      byStatus: stats,
      byMediaType: totalByType,
      total: stats.reduce((acc, curr) => acc + curr.count, 0),
    });
  } catch (error) {
    logger.error("Error fetching watchlist stats", { error: error.message });
    responseHandler.error(res, "Failed to fetch watchlist statistics");
  }
};

export default {
  addToWatchlist,
  removeFromWatchlist,
  getWatchlist,
  updateWatchlistItem,
  checkWatchlist,
  getWatchlistStats,
};
