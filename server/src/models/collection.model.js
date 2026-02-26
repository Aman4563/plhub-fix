import mongoose from "mongoose";
import modelOptions from "./model.options.js";

const { Schema } = mongoose;

/**
 * Collection Item Schema
 * Represents an individual media item in a collection
 */
const collectionItemSchema = new Schema({
  mediaId: {
    type: String,
    required: true,
    trim: true,
  },
  mediaType: {
    type: String,
    enum: ["movie", "tv"],
    required: true,
  },
  mediaTitle: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
  },
  mediaPoster: {
    type: String,
  },
  mediaRate: {
    type: Number,
    min: 0,
    max: 10,
  },
  addedAt: {
    type: Date,
    default: Date.now,
  },
});

/**
 * Collection Schema
 * Represents a user's custom collection of media items
 */
const collectionSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required."],
      index: true,
    },
    name: {
      type: String,
      required: [true, "Collection name is required."],
      trim: true,
      maxlength: [100, "Collection name cannot exceed 100 characters."],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters."],
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    coverImage: {
      type: String,
    },
    items: [collectionItemSchema],
    // Saved search/filter criteria
    savedFilters: {
      mediaType: String,
      genre: [Number],
      language: String,
      year: Number,
      minScore: Number,
      maxScore: Number,
      sortBy: String,
      certification: String,
      minRuntime: Number,
      maxRuntime: Number,
      keywords: String,
      watchProviders: [Number],
    },
  },
  modelOptions
);

// Compound indexes
collectionSchema.index({ user: 1, name: 1 }, { unique: true });
collectionSchema.index({ user: 1, isPublic: 1 });
collectionSchema.index({ isPublic: 1, createdAt: -1 });

const Collection = mongoose.model("Collection", collectionSchema);

export default Collection;

