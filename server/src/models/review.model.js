import mongoose from "mongoose";
import modelOptions from "./model.options.js";

const { Schema } = mongoose;

/**
 * Review Schema
 * Represents user-submitted reviews for media items
 * Now includes user ratings (1-10 scale like IMDb)
 */
const reviewSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required."],
      index: true,
    },
    content: {
      type: String,
      required: [true, "Review content is required."],
      trim: true,
      maxlength: [2000, "Review content cannot exceed 2000 characters."],
    },
    // User rating (1-10 scale like IMDb)
    rating: {
      type: Number,
      min: [1, "Rating must be at least 1."],
      max: [10, "Rating cannot exceed 10."],
      default: null,
    },
    mediaType: {
      type: String,
      enum: ["tv", "movie"],
      required: [true, "Media type is required."],
    },
    mediaId: {
      type: String,
      required: [true, "Media ID is required."],
      index: true,
    },
    mediaTitle: {
      type: String,
      required: [true, "Media title is required."],
      trim: true,
      maxlength: [200, "Media title cannot exceed 200 characters."],
    },
    mediaPoster: {
      type: String,
      required: [true, "Media poster URL is required."],
    },
    // Helpful votes tracking
    helpfulVotes: {
      type: Number,
      default: 0,
    },
    // Users who voted this review as helpful
    helpfulVoters: [{
      type: Schema.Types.ObjectId,
      ref: "User",
    }],
    // Review status for moderation
    // Set to "pending" if you want moderation enabled, "approved" for auto-approval
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: process.env.REVIEW_MODERATION_ENABLED === "true" ? "pending" : "approved",
    },
    // Spoiler flag
    containsSpoilers: {
      type: Boolean,
      default: false,
    },
    // Moderation fields
    moderatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    moderatedAt: {
      type: Date,
    },
    moderationReason: {
      type: String,
      maxlength: 500,
    },
    // Vector embedding for RAG (768 dimensions for text-embedding-004)
    embedding: {
      type: [Number],
      default: [],
      select: false, // Don't include in regular queries
    },
  },
  modelOptions
);

// Compound indexes for efficient queries
reviewSchema.index({ mediaId: 1, createdAt: -1 });
reviewSchema.index({ user: 1, mediaId: 1 }, { unique: true }); // One review per user per media
reviewSchema.index({ user: 1, createdAt: -1 });
reviewSchema.index({ mediaType: 1, rating: -1 });
reviewSchema.index({ helpfulVotes: -1 });

// Virtual for calculating if user has already voted
reviewSchema.methods.hasUserVoted = function (userId) {
  return this.helpfulVoters.includes(userId);
};

const Review = mongoose.model("Review", reviewSchema);

export default Review;
