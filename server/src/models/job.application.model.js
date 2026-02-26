/**
 * Job Application Model
 * Stores job applications submitted through the careers page
 */

import mongoose from "mongoose";
import { nanoid } from "nanoid";

const jobApplicationSchema = new mongoose.Schema(
  {
    applicationId: {
      type: String,
      unique: true,
      default: () => `APP-${nanoid(10).toUpperCase()}`,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    position: {
      type: String,
      required: true,
      trim: true,
    },
    department: {
      type: String,
      required: true,
      enum: ["Engineering", "Design", "Marketing", "Support", "Other"],
    },
    experience: {
      type: String,
      enum: ["", "0-1", "1-3", "3-5", "5-10", "10+"],
    },
    resumeUrl: {
      type: String,
      trim: true,
    },
    portfolioUrl: {
      type: String,
      trim: true,
    },
    linkedinUrl: {
      type: String,
      trim: true,
    },
    coverLetter: {
      type: String,
      maxlength: 5000,
    },
    referralSource: {
      type: String,
      enum: ["LinkedIn", "Indeed", "Glassdoor", "Referral", "Website", "Other"],
      default: "Website",
    },
    status: {
      type: String,
      enum: ["submitted", "reviewing", "interview", "offer", "rejected", "withdrawn"],
      default: "submitted",
    },
    notes: {
      type: String,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
jobApplicationSchema.index({ email: 1 });
jobApplicationSchema.index({ position: 1 });
jobApplicationSchema.index({ status: 1 });
jobApplicationSchema.index({ createdAt: -1 });

const jobApplicationModel = mongoose.model("JobApplication", jobApplicationSchema);

export default jobApplicationModel;

