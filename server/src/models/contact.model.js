import mongoose from "mongoose";
import modelOptions from "./model.options.js";

/**
 * Contact Form Submission Schema
 * Stores contact form submissions for support tracking
 */
const contactSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
    },
    subject: {
      type: String,
      required: [true, "Subject is required"],
      trim: true,
      minlength: [5, "Subject must be at least 5 characters"],
      maxlength: [200, "Subject cannot exceed 200 characters"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: [
        "General Inquiry",
        "Technical Support",
        "Account Issues",
        "Content Request",
        "Bug Report",
        "Partnership",
        "DMCA",
        "Other",
      ],
    },
    message: {
      type: String,
      required: [true, "Message is required"],
      trim: true,
      minlength: [10, "Message must be at least 10 characters"],
      maxlength: [5000, "Message cannot exceed 5000 characters"],
    },
    status: {
      type: String,
      enum: ["pending", "in_progress", "resolved", "closed"],
      default: "pending",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    assignedTo: {
      type: String,
      default: null,
    },
    responseMessage: {
      type: String,
      default: null,
    },
    respondedAt: {
      type: Date,
      default: null,
    },
    ipAddress: {
      type: String,
      select: false,
    },
    userAgent: {
      type: String,
      select: false,
    },
    ticketNumber: {
      type: String,
      unique: true,
    },
  },
  modelOptions
);

// Generate ticket number before saving
contactSchema.pre("save", async function (next) {
  if (!this.ticketNumber) {
    const count = await mongoose.model("Contact").countDocuments();
    const timestamp = Date.now().toString(36).toUpperCase();
    this.ticketNumber = `PLH-${timestamp}-${(count + 1).toString().padStart(5, "0")}`;
  }
  next();
});

// Indexes
contactSchema.index({ email: 1 });
contactSchema.index({ status: 1 });
contactSchema.index({ category: 1 });
contactSchema.index({ createdAt: -1 });
contactSchema.index({ ticketNumber: 1 });

const contactModel = mongoose.model("Contact", contactSchema);

export default contactModel;

