/**
 * Report Model
 * Handles user reports for inappropriate reviews
 */

import mongoose, { Schema } from "mongoose";
import modelOptions from "./model.options.js";

const reportSchema = new Schema(
  {
    reporter: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Reporter ID is required."],
      index: true,
    },
    review: {
      type: Schema.Types.ObjectId,
      ref: "Review",
      required: [true, "Review ID is required."],
      index: true,
    },
    reason: {
      type: String,
      enum: ["spam", "harassment", "hate_speech", "misinformation", "spoiler_unmarked", "inappropriate", "other"],
      required: [true, "Report reason is required."],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters."],
    },
    status: {
      type: String,
      enum: ["pending", "reviewed", "resolved", "dismissed"],
      default: "pending",
      index: true,
    },
    resolvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    resolvedAt: {
      type: Date,
    },
    resolution: {
      type: String,
      enum: ["warning_issued", "review_removed", "user_banned", "no_action", null],
      default: null,
    },
    resolutionNote: {
      type: String,
      maxlength: 500,
    },
  },
  modelOptions
);

// Compound index to prevent duplicate reports from same user for same review
reportSchema.index({ reporter: 1, review: 1 }, { unique: true });

// Index for admin queries
reportSchema.index({ status: 1, createdAt: -1 });

const reportModel = mongoose.model("Report", reportSchema);

export default reportModel;
