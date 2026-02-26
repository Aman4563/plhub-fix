/**
 * Report Controller
 * Handles user reports for reviews
 */

import mongoose from "mongoose";
import responseHandler from "../handlers/response.handler.js";
import reportModel from "../models/report.model.js";
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
 * Report reason labels for display
 */
const REASON_LABELS = {
  spam: "Spam or advertising",
  harassment: "Harassment or bullying",
  hate_speech: "Hate speech or discrimination",
  misinformation: "Misinformation or false claims",
  spoiler_unmarked: "Unmarked spoilers",
  inappropriate: "Inappropriate or offensive content",
  other: "Other",
};

/**
 * Create a new report for a review
 */
const createReport = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { reason, description } = req.body;

    if (!isValidObjectId(reviewId)) {
      return responseHandler.badrequest(res, "Invalid review ID format");
    }

    // Check if review exists
    const review = await reviewModel.findById(reviewId);
    if (!review) {
      return responseHandler.notfound(res, "Review not found");
    }

    // Check if user is trying to report their own review
    const reviewUserId = review.user?.toString();
    if (reviewUserId === req.user.id) {
      return responseHandler.badrequest(res, "You cannot report your own review");
    }

    // Check for existing report from this user for this review
    const existingReport = await reportModel.findOne({
      reporter: req.user.id,
      review: reviewId,
    });

    if (existingReport) {
      return responseHandler.conflict(res, "You have already reported this review");
    }

    // Create report
    const report = await reportModel.create({
      reporter: req.user.id,
      review: reviewId,
      reason,
      description: description?.trim() || null,
    });

    logger.info("Review reported", {
      reporterId: req.user.id,
      reviewId,
      reason,
    });

    responseHandler.created(res, {
      message: "Report submitted successfully. Our team will review it shortly.",
      reportId: report._id,
    });
  } catch (error) {
    logger.error("Error creating report", { error: error.message });
    responseHandler.error(res, "Failed to submit report");
  }
};

/**
 * Check if user has already reported a review
 */
const checkReport = async (req, res) => {
  try {
    const { reviewId } = req.params;

    if (!isValidObjectId(reviewId)) {
      return responseHandler.badrequest(res, "Invalid review ID format");
    }

    const existingReport = await reportModel.findOne({
      reporter: req.user.id,
      review: reviewId,
    });

    responseHandler.ok(res, {
      hasReported: !!existingReport,
      reportId: existingReport?._id || null,
    });
  } catch (error) {
    logger.error("Error checking report", { error: error.message });
    responseHandler.error(res, "Failed to check report status");
  }
};

/**
 * Get user's submitted reports
 */
const getUserReports = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 10));
    const skip = (pageNum - 1) * limitNum;

    const [reports, total] = await Promise.all([
      reportModel
        .find({ reporter: req.user.id })
        .populate({
          path: "review",
          select: "mediaTitle mediaType mediaPoster content",
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      reportModel.countDocuments({ reporter: req.user.id }),
    ]);

    const transformedReports = reports.map((report) => ({
      ...report,
      id: report._id.toString(),
      reasonLabel: REASON_LABELS[report.reason] || report.reason,
    }));

    const totalPages = Math.ceil(total / limitNum);

    responseHandler.ok(res, {
      reports: transformedReports,
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
    logger.error("Error fetching user reports", { error: error.message });
    responseHandler.error(res, "Failed to fetch reports");
  }
};

// ==================== ADMIN ENDPOINTS ====================

/**
 * Get all reports for admin moderation
 */
const getReports = async (req, res) => {
  try {
    if (!["admin", "moderator"].includes(req.user.role)) {
      return responseHandler.forbidden(res, "Access denied. Admin or Moderator role required.");
    }

    const { page = 1, limit = 20, status = "pending", reason } = req.query;

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const skip = (pageNum - 1) * limitNum;

    const query = {};
    if (status && ["pending", "reviewed", "resolved", "dismissed"].includes(status)) {
      query.status = status;
    }
    if (reason && Object.keys(REASON_LABELS).includes(reason)) {
      query.reason = reason;
    }

    const [reports, total, statusCounts] = await Promise.all([
      reportModel
        .find(query)
        .populate("reporter", "displayName username email")
        .populate({
          path: "review",
          select: "mediaTitle mediaType mediaPoster content user createdAt",
          populate: {
            path: "user",
            select: "displayName username",
          },
        })
        .populate("resolvedBy", "displayName username")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      reportModel.countDocuments(query),
      reportModel.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
    ]);

    const transformedReports = reports.map((report) => ({
      ...report,
      id: report._id.toString(),
      reasonLabel: REASON_LABELS[report.reason] || report.reason,
    }));

    const totalPages = Math.ceil(total / limitNum);

    // Convert status counts to object
    const stats = {
      pending: 0,
      reviewed: 0,
      resolved: 0,
      dismissed: 0,
    };
    statusCounts.forEach((item) => {
      stats[item._id] = item.count;
    });

    responseHandler.ok(res, {
      reports: transformedReports,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
      stats,
      reasonLabels: REASON_LABELS,
    });
  } catch (error) {
    logger.error("Error fetching reports", { error: error.message });
    responseHandler.error(res, "Failed to fetch reports");
  }
};

/**
 * Resolve a report (admin/moderator only)
 */
const resolveReport = async (req, res) => {
  try {
    if (!["admin", "moderator"].includes(req.user.role)) {
      return responseHandler.forbidden(res, "Access denied. Admin or Moderator role required.");
    }

    const { reportId } = req.params;
    const { status, resolution, resolutionNote, removeReview } = req.body;

    if (!isValidObjectId(reportId)) {
      return responseHandler.badrequest(res, "Invalid report ID format");
    }

    if (!["reviewed", "resolved", "dismissed"].includes(status)) {
      return responseHandler.badrequest(res, "Invalid status. Must be 'reviewed', 'resolved', or 'dismissed'");
    }

    const report = await reportModel.findById(reportId).populate("review");

    if (!report) {
      return responseHandler.notfound(res, "Report not found");
    }

    // Update report
    report.status = status;
    report.resolvedBy = req.user.id;
    report.resolvedAt = new Date();
    
    if (resolution) {
      report.resolution = resolution;
    }
    if (resolutionNote) {
      report.resolutionNote = resolutionNote.trim();
    }

    await report.save();

    // Optionally remove the reported review
    if (removeReview && report.review) {
      await reviewModel.findByIdAndDelete(report.review._id);
      logger.info("Reported review removed", {
        reviewId: report.review._id,
        moderatorId: req.user.id,
      });
    }

    logger.info("Report resolved", {
      reportId,
      status,
      resolution,
      moderatorId: req.user.id,
      reviewRemoved: removeReview,
    });

    responseHandler.ok(res, {
      message: "Report resolved successfully",
      report: {
        ...report._doc,
        id: report._id.toString(),
        reasonLabel: REASON_LABELS[report.reason],
      },
    });
  } catch (error) {
    logger.error("Error resolving report", { error: error.message });
    responseHandler.error(res, "Failed to resolve report");
  }
};

/**
 * Bulk resolve reports (admin only)
 */
const bulkResolveReports = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return responseHandler.forbidden(res, "Access denied. Admin role required.");
    }

    const { reportIds, status, resolution, resolutionNote } = req.body;

    if (!Array.isArray(reportIds) || reportIds.length === 0) {
      return responseHandler.badrequest(res, "Report IDs array is required");
    }

    if (reportIds.length > 50) {
      return responseHandler.badrequest(res, "Cannot resolve more than 50 reports at once");
    }

    const validIds = reportIds.filter((id) => isValidObjectId(id));
    if (validIds.length === 0) {
      return responseHandler.badrequest(res, "No valid report IDs provided");
    }

    if (!["reviewed", "resolved", "dismissed"].includes(status)) {
      return responseHandler.badrequest(res, "Invalid status");
    }

    const updateData = {
      status,
      resolvedBy: req.user.id,
      resolvedAt: new Date(),
    };

    if (resolution) {
      updateData.resolution = resolution;
    }
    if (resolutionNote) {
      updateData.resolutionNote = resolutionNote.trim();
    }

    const result = await reportModel.updateMany(
      { _id: { $in: validIds } },
      updateData
    );

    logger.info("Bulk reports resolved", {
      count: result.modifiedCount,
      status,
      adminId: req.user.id,
    });

    responseHandler.ok(res, {
      message: `${result.modifiedCount} reports resolved successfully`,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    logger.error("Error bulk resolving reports", { error: error.message });
    responseHandler.error(res, "Failed to bulk resolve reports");
  }
};

/**
 * Get report statistics
 */
const getReportStats = async (req, res) => {
  try {
    if (!["admin", "moderator"].includes(req.user.role)) {
      return responseHandler.forbidden(res, "Access denied. Admin or Moderator role required.");
    }

    const [statusStats, reasonStats, recentReports] = await Promise.all([
      reportModel.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      reportModel.aggregate([
        { $match: { status: "pending" } },
        { $group: { _id: "$reason", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      reportModel
        .find({ status: "pending" })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("reporter", "displayName")
        .populate("review", "mediaTitle")
        .lean(),
    ]);

    const stats = {
      byStatus: {
        pending: 0,
        reviewed: 0,
        resolved: 0,
        dismissed: 0,
      },
      byReason: {},
      recentPending: recentReports.map((r) => ({
        id: r._id.toString(),
        reason: r.reason,
        reasonLabel: REASON_LABELS[r.reason],
        reporterName: r.reporter?.displayName,
        mediaTitle: r.review?.mediaTitle,
        createdAt: r.createdAt,
      })),
    };

    statusStats.forEach((item) => {
      stats.byStatus[item._id] = item.count;
    });

    reasonStats.forEach((item) => {
      stats.byReason[item._id] = {
        count: item.count,
        label: REASON_LABELS[item._id] || item._id,
      };
    });

    stats.total = Object.values(stats.byStatus).reduce((a, b) => a + b, 0);

    responseHandler.ok(res, stats);
  } catch (error) {
    logger.error("Error fetching report stats", { error: error.message });
    responseHandler.error(res, "Failed to fetch report statistics");
  }
};

export default {
  createReport,
  checkReport,
  getUserReports,
  getReports,
  resolveReport,
  bulkResolveReports,
  getReportStats,
};
