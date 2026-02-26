/**
 * Chat History Model
 * Stores conversation history for AI chatbot sessions
 */

import mongoose from "mongoose";
import modelOptions from "./model.options.js";

const { Schema } = mongoose;

/**
 * Message Schema - Individual messages in a conversation
 */
const messageSchema = new Schema({
  role: {
    type: String,
    enum: ["user", "assistant", "system", "tool"],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  // Tool call information if this is a tool response
  toolCalls: [{
    id: String,
    name: String,
    arguments: Schema.Types.Mixed,
  }],
  toolCallId: String,
  toolName: String,
  // Media recommendations extracted from AI response
  mediaRecommendations: [{
    id: Number,
    title: String,
    mediaType: String,
    posterPath: String,
    backdropPath: String,
    voteAverage: Number,
    overview: String,
    releaseDate: String,
  }],
  // Pending actions that require user confirmation
  pendingAction: {
    type: {
      type: String,
      enum: ["review", "watchlist", "favorite", null],
    },
    mediaId: String,
    mediaType: String,
    mediaTitle: String,
    data: Schema.Types.Mixed,
    confirmed: {
      type: Boolean,
      default: false,
    },
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

/**
 * Chat Session Schema - A complete conversation session
 */
const chatHistorySchema = new Schema(
  {
    // User who owns this conversation (null for anonymous)
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
      default: null,
    },
    // Session ID for anonymous users
    sessionId: {
      type: String,
      index: true,
    },
    // Title generated from first message
    title: {
      type: String,
      default: "New Conversation",
      maxlength: 200,
    },
    // All messages in this conversation
    messages: [messageSchema],
    // Whether this conversation is active
    isActive: {
      type: Boolean,
      default: true,
    },
    // Last activity timestamp
    lastActivity: {
      type: Date,
      default: Date.now,
    },
    // Metadata
    metadata: {
      totalMessages: {
        type: Number,
        default: 0,
      },
      toolsUsed: [{
        type: String,
      }],
    },
  },
  modelOptions
);

// Indexes for efficient queries
chatHistorySchema.index({ user: 1, lastActivity: -1 });
chatHistorySchema.index({ sessionId: 1, lastActivity: -1 });
chatHistorySchema.index({ isActive: 1, lastActivity: -1 });

// Auto-delete old inactive conversations (30 days)
chatHistorySchema.index(
  { lastActivity: 1 },
  { expireAfterSeconds: 30 * 24 * 60 * 60, partialFilterExpression: { isActive: false } }
);

// Pre-save middleware to update metadata
chatHistorySchema.pre("save", function (next) {
  this.lastActivity = new Date();
  this.metadata.totalMessages = this.messages.length;
  next();
});

// Method to add a message
chatHistorySchema.methods.addMessage = function (message) {
  this.messages.push({
    ...message,
    timestamp: new Date(),
  });
  this.lastActivity = new Date();
  this.metadata.totalMessages = this.messages.length;

  // Track tool usage
  if (message.toolCalls && message.toolCalls.length > 0) {
    const toolNames = message.toolCalls.map((tc) => tc.name);
    this.metadata.toolsUsed = [...new Set([...this.metadata.toolsUsed, ...toolNames])];
  }

  return this;
};

// Method to get recent messages for context
chatHistorySchema.methods.getRecentMessages = function (limit = 20) {
  return this.messages.slice(-limit).map((msg) => ({
    role: msg.role,
    content: msg.content,
    toolCalls: msg.toolCalls,
    toolCallId: msg.toolCallId,
    toolName: msg.toolName,
  }));
};

// Static method to find or create a session
chatHistorySchema.statics.findOrCreateSession = async function (userId, sessionId) {
  const query = userId ? { user: userId, isActive: true } : { sessionId, isActive: true };

  let session = await this.findOne(query).sort({ lastActivity: -1 });

  if (!session) {
    session = new this({
      user: userId || null,
      sessionId: userId ? undefined : sessionId,
      messages: [],
    });
    await session.save();
  }

  return session;
};

const ChatHistory = mongoose.model("ChatHistory", chatHistorySchema);

export default ChatHistory;

