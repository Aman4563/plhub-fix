import mongoose from "mongoose";
import modelOptions from "./model.options.js";

/**
 * Newsletter Subscription Schema
 * Stores email subscriptions for newsletter service
 */
const newsletterSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    subscribedAt: {
      type: Date,
      default: Date.now,
    },
    unsubscribedAt: {
      type: Date,
      default: null,
    },
    source: {
      type: String,
      enum: ["footer", "popup", "landing", "other"],
      default: "footer",
    },
    preferences: {
      newReleases: { type: Boolean, default: true },
      recommendations: { type: Boolean, default: true },
      updates: { type: Boolean, default: true },
    },
    ipAddress: {
      type: String,
      select: false,
    },
    userAgent: {
      type: String,
      select: false,
    },
  },
  modelOptions
);

// Indexes
// Note: email already has index via `unique: true`
newsletterSchema.index({ isActive: 1 });
newsletterSchema.index({ subscribedAt: -1 });

const newsletterModel = mongoose.model("Newsletter", newsletterSchema);

export default newsletterModel;

