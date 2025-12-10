/**
 * Review Controller
 * Handles CRUD operations for user reviews with ratings
 */

import mongoose from "mongoose";
import responseHandler from "../handlers/response.handler.js";
import reviewModel from "../models/review.model.js";
import logger from "../config/logger.config.js";

/**
 * Validate MongoDB ObjectId
 */
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id) && 
         new mongoose.Types.ObjectId(id).toString() === id;
};

/**
 * Create a new review with optional rating
 */
const create = async (req, res) => {
  try {
    const { mediaId } = req.params;
    const { content, rating, mediaType, mediaTitle, mediaPoster, containsSpoilers } = req.body;

    if (!mediaId) {
      return responseHandler.badrequest(res, "Media ID is required");
    }

    const existingReview = await reviewModel.findOne({
      user: req.user.id,
      mediaId,
    });

    if (existingReview) {
      return responseHandler.conflict(res, "You have already reviewed this title. You can edit your existing review.");
    }

    const review = await reviewModel.create({
      user: req.user.id,
      mediaId,
      content,
      rating: rating || null,
      mediaType,
      mediaTitle,
      mediaPoster,
      containsSpoilers: containsSpoilers || false,
    });

    await review.populate("user", "displayName username");

    logger.info("Review created", { userId: req.user.id, mediaId, rating });

    responseHandler.created(res, {
      ...review._doc,
      id: review.id,
      user: req.user,
    });
  } catch (error) {
    logger.error("Error creating review", { error: error.message });
    responseHandler.error(res, "Failed to create review");
  }
};

/**
 * Update an existing review
 */
const update = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { content, rating, containsSpoilers } = req.body;

    if (!reviewId) {
      return responseHandler.badrequest(res, "Review ID is required");
    }

    if (!isValidObjectId(reviewId)) {
      return responseHandler.badrequest(res, "Invalid review ID format");
    }

    const updateData = {};
    if (content !== undefined) updateData.content = content;
    if (rating !== undefined) updateData.rating = rating;
    if (containsSpoilers !== undefined) updateData.containsSpoilers = containsSpoilers;

    const review = await reviewModel.findOneAndUpdate(
      { _id: reviewId, user: req.user.id },
      updateData,
      { new: true }
    ).populate("user", "displayName username");

    if (!review) {
      return responseHandler.notfound(res, "Review not found or unauthorized");
    }

    logger.info("Review updated", { userId: req.user.id, reviewId });

    responseHandler.ok(res, {
      ...review._doc,
      id: review.id,
    });
  } catch (error) {
    logger.error("Error updating review", { error: error.message });
    responseHandler.error(res, "Failed to update review");
  }
};

/**
 * Remove a review
 */
const remove = async (req, res) => {
  try {
    const { reviewId } = req.params;

    if (!reviewId) {
      return responseHandler.badrequest(res, "Review ID is required");
    }

    if (!isValidObjectId(reviewId)) {
      return responseHandler.badrequest(res, "Invalid review ID format");
    }

    const review = await reviewModel.findOneAndDelete({
      _id: reviewId,
      user: req.user.id,
    });

    if (!review) {
      return responseHandler.notfound(res, "Review not found or unauthorized");
    }

    logger.info("Review removed", { userId: req.user.id, reviewId });

    responseHandler.ok(res, { message: "Review successfully removed" });
  } catch (error) {
    logger.error("Error removing review", { error: error.message });
    responseHandler.error(res, "Failed to remove review");
  }
};

/**
 * Get all reviews by the authenticated user with pagination, filtering, sorting, and search
 * 
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 10, max: 50)
 * - sort: Sort option - 'createdAt', 'oldest', 'rating', 'title' (default: 'createdAt')
 * - mediaType: Filter by 'movie' or 'tv'
 * - search: Search term for title or content
 */
const getReviewsOfUser = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sort = "createdAt",
      mediaType,
      search,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 10));
    const skip = (pageNum - 1) * limitNum;

    const query = { user: req.user.id };

    if (mediaType && ["movie", "tv"].includes(mediaType)) {
      query.mediaType = mediaType;
    }

    if (search && search.trim()) {
      query.$or = [
        { mediaTitle: { $regex: search.trim(), $options: "i" } },
        { content: { $regex: search.trim(), $options: "i" } },
      ];
    }

    const sortOptions = {};
    switch (sort) {
      case "oldest":
        sortOptions.createdAt = 1;
        break;
      case "rating":
        sortOptions.rating = -1;
        sortOptions.createdAt = -1;
        break;
      case "title":
        sortOptions.mediaTitle = 1;
        break;
      default:
        sortOptions.createdAt = -1;
    }

    const [reviews, total] = await Promise.all([
      reviewModel
        .find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      reviewModel.countDocuments(query),
    ]);

    const transformedReviews = reviews.map(review => ({
      ...review,
      id: review._id.toString(),
    }));

    const totalPages = Math.ceil(total / limitNum);

    responseHandler.ok(res, {
      reviews: transformedReviews,
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
    logger.error("Error fetching user reviews", { error: error.message });
    responseHandler.error(res, "Failed to fetch user reviews");
  }
};

/**
 * Get review statistics for the authenticated user
 * Returns counts by type, average rating given, etc.
 */
const getReviewStats = async (req, res) => {
  try {
    const [stats, recentActivity] = await Promise.all([
      reviewModel.aggregate([
        { $match: { user: new mongoose.Types.ObjectId(req.user.id) } },
        {
          $group: {
            _id: "$mediaType",
            count: { $sum: 1 },
            avgRating: { $avg: "$rating" },
            totalHelpfulVotes: { $sum: "$helpfulVotes" },
          },
        },
      ]),
      reviewModel.aggregate([
        { $match: { user: new mongoose.Types.ObjectId(req.user.id) } },
        { $sort: { createdAt: -1 } },
        { $limit: 5 },
        {
          $project: {
            mediaTitle: 1,
            mediaType: 1,
            rating: 1,
            createdAt: 1,
          },
        },
      ]),
    ]);

    const movieStats = stats.find(s => s._id === "movie") || { count: 0, avgRating: null, totalHelpfulVotes: 0 };
    const tvStats = stats.find(s => s._id === "tv") || { count: 0, avgRating: null, totalHelpfulVotes: 0 };

    const totalReviews = movieStats.count + tvStats.count;
    const totalHelpfulVotes = movieStats.totalHelpfulVotes + tvStats.totalHelpfulVotes;
    
    let overallAvgRating = null;
    if (movieStats.avgRating !== null || tvStats.avgRating !== null) {
      const weightedSum = (movieStats.avgRating || 0) * movieStats.count + 
                          (tvStats.avgRating || 0) * tvStats.count;
      overallAvgRating = totalReviews > 0 ? weightedSum / totalReviews : null;
    }

    responseHandler.ok(res, {
      total: totalReviews,
      movies: movieStats.count,
      tvShows: tvStats.count,
      averageRating: overallAvgRating ? parseFloat(overallAvgRating.toFixed(1)) : null,
      movieAvgRating: movieStats.avgRating ? parseFloat(movieStats.avgRating.toFixed(1)) : null,
      tvAvgRating: tvStats.avgRating ? parseFloat(tvStats.avgRating.toFixed(1)) : null,
      totalHelpfulVotes,
      recentActivity,
    });
  } catch (error) {
    logger.error("Error fetching review stats", { error: error.message });
    responseHandler.error(res, "Failed to fetch review statistics");
  }
};

/**
 * Get reviews for a specific media
 */
const getReviewsForMedia = async (req, res) => {
  try {
    const { mediaId } = req.params;
    const { page = 1, limit = 10, sort = "createdAt" } = req.query;

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 10));
    const skip = (pageNum - 1) * limitNum;

    const sortOptions = {};
    if (sort === "helpful") {
      sortOptions.helpfulVotes = -1;
      sortOptions.createdAt = -1;
    } else if (sort === "rating") {
      sortOptions.rating = -1;
      sortOptions.createdAt = -1;
    } else {
      sortOptions.createdAt = -1;
    }

    const [reviews, total] = await Promise.all([
      reviewModel
        .find({ mediaId, status: "approved" })
        .populate("user", "displayName username")
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      reviewModel.countDocuments({ mediaId, status: "approved" }),
    ]);

    const transformedReviews = reviews.map(review => ({
      ...review,
      id: review._id.toString(),
    }));

    const ratingStats = await reviewModel.aggregate([
      { $match: { mediaId, rating: { $ne: null } } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
          totalRatings: { $sum: 1 },
          distribution: { $push: "$rating" },
        },
      },
    ]);

    const totalPages = Math.ceil(total / limitNum);

    responseHandler.ok(res, {
      reviews: transformedReviews,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
      ratingStats: ratingStats[0] || { averageRating: null, totalRatings: 0 },
    });
  } catch (error) {
    logger.error("Error fetching media reviews", { error: error.message });
    responseHandler.error(res, "Failed to fetch reviews");
  }
};

/**
 * Vote a review as helpful
 */
const voteHelpful = async (req, res) => {
  try {
    const { reviewId } = req.params;

    if (!reviewId) {
      return responseHandler.badrequest(res, "Review ID is required");
    }

    if (!isValidObjectId(reviewId)) {
      return responseHandler.badrequest(res, "Invalid review ID format");
    }

    const review = await reviewModel.findById(reviewId);

    if (!review) {
      return responseHandler.notfound(res, "Review not found");
    }

    const userId = req.user.id;
    const hasVoted = review.helpfulVoters.some(
      (id) => id.toString() === userId.toString()
    );

    if (hasVoted) {
      review.helpfulVoters = review.helpfulVoters.filter(
        (id) => id.toString() !== userId.toString()
      );
      review.helpfulVotes = Math.max(0, review.helpfulVotes - 1);
    } else {
      review.helpfulVoters.push(userId);
      review.helpfulVotes += 1;
    }

    await review.save();

    logger.info("Review vote updated", { userId, reviewId, hasVoted: !hasVoted });

    responseHandler.ok(res, {
      helpfulVotes: review.helpfulVotes,
      hasVoted: !hasVoted,
    });
  } catch (error) {
    logger.error("Error voting on review", { error: error.message });
    responseHandler.error(res, "Failed to update vote");
  }
};

/**
 * Get user's rating for a specific media
 */
const getUserRating = async (req, res) => {
  try {
    const { mediaId } = req.params;

    const review = await reviewModel.findOne({
      user: req.user.id,
      mediaId,
    });

    responseHandler.ok(res, {
      hasReviewed: !!review,
      rating: review?.rating || null,
      reviewId: review?.id || review?._id?.toString() || null,
    });
  } catch (error) {
    logger.error("Error fetching user rating", { error: error.message });
    responseHandler.error(res, "Failed to fetch rating");
  }
};

// ==================== ADMIN MODERATION ENDPOINTS ====================

/**
 * Get all pending reviews for moderation (Admin/Moderator only)
 */
const getPendingReviews = async (req, res) => {
  try {
    if (!["admin", "moderator"].includes(req.user.role)) {
      return responseHandler.forbidden(res, "Access denied. Admin or Moderator role required.");
    }

    const { page = 1, limit = 20, status = "pending" } = req.query;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const skip = (pageNum - 1) * limitNum;

    const filter = {};
    if (status && ["pending", "approved", "rejected"].includes(status)) {
      filter.status = status;
    }

    const [reviews, total, pendingCount, approvedCount, rejectedCount] = await Promise.all([
      reviewModel
        .find(filter)
        .populate("user", "displayName username email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      reviewModel.countDocuments(filter),
      reviewModel.countDocuments({ status: "pending" }),
      reviewModel.countDocuments({ status: "approved" }),
      reviewModel.countDocuments({ status: "rejected" }),
    ]);

    const transformedReviews = reviews.map((review) => ({
      ...review,
      id: review._id.toString(),
    }));

    const totalPages = Math.ceil(total / limitNum);

    responseHandler.ok(res, {
      reviews: transformedReviews,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
      stats: {
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
      },
    });
  } catch (error) {
    logger.error("Error fetching pending reviews", { error: error.message });
    responseHandler.error(res, "Failed to fetch pending reviews");
  }
};

/**
 * Moderate a review (approve/reject) - Admin/Moderator only
 */
const moderateReview = async (req, res) => {
  try {
    if (!["admin", "moderator"].includes(req.user.role)) {
      return responseHandler.forbidden(res, "Access denied. Admin or Moderator role required.");
    }

    const { reviewId } = req.params;
    const { status, reason } = req.body;

    if (!isValidObjectId(reviewId)) {
      return responseHandler.badrequest(res, "Invalid review ID format");
    }

    if (!["approved", "rejected"].includes(status)) {
      return responseHandler.badrequest(res, "Status must be 'approved' or 'rejected'");
    }

    const review = await reviewModel.findByIdAndUpdate(
      reviewId,
      {
        status,
        moderatedBy: req.user.id,
        moderatedAt: new Date(),
        moderationReason: reason || null,
      },
      { new: true }
    ).populate("user", "displayName username");

    if (!review) {
      return responseHandler.notfound(res, "Review not found");
    }

    logger.info("Review moderated", {
      reviewId,
      status,
      moderatorId: req.user.id,
      reason,
    });

    responseHandler.ok(res, {
      message: `Review ${status} successfully`,
      review: {
        ...review._doc,
        id: review.id,
      },
    });
  } catch (error) {
    logger.error("Error moderating review", { error: error.message });
    responseHandler.error(res, "Failed to moderate review");
  }
};

/**
 * Bulk moderate reviews - Admin/Moderator only
 */
const bulkModerateReviews = async (req, res) => {
  try {
    if (!["admin", "moderator"].includes(req.user.role)) {
      return responseHandler.forbidden(res, "Access denied. Admin or Moderator role required.");
    }

    const { reviewIds, status, reason } = req.body;

    if (!Array.isArray(reviewIds) || reviewIds.length === 0) {
      return responseHandler.badrequest(res, "Review IDs array is required");
    }

    if (reviewIds.length > 50) {
      return responseHandler.badrequest(res, "Cannot moderate more than 50 reviews at once");
    }

    const validIds = reviewIds.filter(id => isValidObjectId(id));
    if (validIds.length === 0) {
      return responseHandler.badrequest(res, "No valid review IDs provided");
    }

    if (!["approved", "rejected"].includes(status)) {
      return responseHandler.badrequest(res, "Status must be 'approved' or 'rejected'");
    }

    const result = await reviewModel.updateMany(
      { _id: { $in: validIds } },
      {
        status,
        moderatedBy: req.user.id,
        moderatedAt: new Date(),
        moderationReason: reason || null,
      }
    );

    logger.info("Bulk review moderation", {
      count: result.modifiedCount,
      status,
      moderatorId: req.user.id,
    });

    responseHandler.ok(res, {
      message: `${result.modifiedCount} reviews ${status} successfully`,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    logger.error("Error bulk moderating reviews", { error: error.message });
    responseHandler.error(res, "Failed to bulk moderate reviews");
  }
};

/**
 * Delete a review (Admin only)
 */
const adminDeleteReview = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return responseHandler.forbidden(res, "Access denied. Admin role required.");
    }

    const { reviewId } = req.params;

    if (!isValidObjectId(reviewId)) {
      return responseHandler.badrequest(res, "Invalid review ID format");
    }

    const review = await reviewModel.findByIdAndDelete(reviewId);

    if (!review) {
      return responseHandler.notfound(res, "Review not found");
    }

    logger.info("Review deleted by admin", {
      reviewId,
      adminId: req.user.id,
      mediaId: review.mediaId,
    });

    responseHandler.ok(res, { message: "Review deleted successfully" });
  } catch (error) {
    logger.error("Error deleting review", { error: error.message });
    responseHandler.error(res, "Failed to delete review");
  }
};

export default {
  create,
  update,
  remove,
  getReviewsOfUser,
  getReviewStats,
  getReviewsForMedia,
  voteHelpful,
  getUserRating,
  getPendingReviews,
  moderateReview,
  bulkModerateReviews,
  adminDeleteReview,
};
