import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import modelOptions from "./model.options.js";
import securityConfig from "../config/security.config.js";

/**
 * User Schema
 * Represents user data and methods for authentication and password management.
 * Uses bcrypt for secure password hashing (industry standard)
 */
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required."],
      unique: true,
      trim: true,
      minlength: [3, "Username must be at least 3 characters."],
      maxlength: [30, "Username cannot exceed 30 characters."],
    },
    email: {
      type: String,
      required: [true, "Email is required."],
      unique: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address."],
    },
    displayName: {
      type: String,
      required: [true, "Display name is required."],
      trim: true,
      minlength: [2, "Display name must be at least 2 characters."],
      maxlength: [50, "Display name cannot exceed 50 characters."],
    },
    password: {
      type: String,
      select: false,
      minlength: [8, "Password must be at least 8 characters."],
    },
    authType: {
      type: String,
      enum: ["local", "google"],
      required: true,
      default: "local",
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    // Refresh token for secure session management
    refreshToken: {
      type: String,
      select: false,
    },
    // Email verification fields
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
      select: false,
    },
    emailVerificationExpires: {
      type: Date,
      select: false,
    },
    // Password reset fields
    resetPasswordToken: {
      type: String,
      select: false,
    },
    resetPasswordExpires: {
      type: Date,
      select: false,
    },
    // Account status
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
    // Failed login attempts for account lockout
    failedLoginAttempts: {
      type: Number,
      default: 0,
      select: false,
    },
    lockUntil: {
      type: Date,
      select: false,
    },
    // User role for admin features
    role: {
      type: String,
      enum: ["user", "moderator", "admin"],
      default: "user",
    },

    // ==================== ADMIN MANAGEMENT FIELDS ====================

    // Warnings system
    warnings: [{
      reason: {
        type: String,
        required: true,
        maxlength: 500,
      },
      issuedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      issuedAt: {
        type: Date,
        default: Date.now,
      },
      severity: {
        type: String,
        enum: ["minor", "moderate", "severe"],
        default: "minor",
      },
      acknowledged: {
        type: Boolean,
        default: false,
      },
      acknowledgedAt: {
        type: Date,
      },
    }],

    // Suspension/Ban system
    isSuspended: {
      type: Boolean,
      default: false,
    },
    suspendedUntil: {
      type: Date,
    },
    suspensionReason: {
      type: String,
      maxlength: 500,
    },
    suspendedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    suspendedAt: {
      type: Date,
    },
    isPermanentlyBanned: {
      type: Boolean,
      default: false,
    },
    banReason: {
      type: String,
      maxlength: 500,
    },
    bannedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    bannedAt: {
      type: Date,
    },

    // Admin notes (internal, not visible to user)
    adminNotes: [{
      note: {
        type: String,
        required: true,
        maxlength: 1000,
      },
      addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      addedAt: {
        type: Date,
        default: Date.now,
      },
    }],

    // Profile enhancement
    avatar: {
      type: String,
    },
    bio: {
      type: String,
      maxlength: 500,
    },

    // Activity tracking for admin
    totalReviews: {
      type: Number,
      default: 0,
    },
    totalHelpfulVotes: {
      type: Number,
      default: 0,
    },
    reportCount: {
      type: Number,
      default: 0,
    },

    // Role change history (for audit)
    roleHistory: [{
      previousRole: {
        type: String,
        enum: ["user", "moderator", "admin"],
      },
      newRole: {
        type: String,
        enum: ["user", "moderator", "admin"],
      },
      changedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      changedAt: {
        type: Date,
        default: Date.now,
      },
      reason: {
        type: String,
        maxlength: 200,
      },
    }],
  },
  modelOptions
);

// Indexes for performance
// Note: email, username, googleId already have indexes via `unique: true`
userSchema.index({ resetPasswordToken: 1, resetPasswordExpires: 1 });
userSchema.index({ emailVerificationToken: 1, emailVerificationExpires: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isSuspended: 1 });
userSchema.index({ isPermanentlyBanned: 1 });
userSchema.index({ createdAt: -1 });

/**
 * Virtual for checking if account is locked
 */
userSchema.virtual("isLocked").get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

/**
 * Virtual for checking if user is currently suspended
 */
userSchema.virtual("isCurrentlySuspended").get(function () {
  if (this.isPermanentlyBanned) return true;
  if (!this.isSuspended) return false;
  if (!this.suspendedUntil) return true; // Indefinite suspension
  return this.suspendedUntil > Date.now();
});

/**
 * Virtual for getting active warnings count
 */
userSchema.virtual("activeWarningsCount").get(function () {
  if (!this.warnings) return 0;
  return this.warnings.filter(w => !w.acknowledged).length;
});

/**
 * Set Password using bcrypt
 * Hashes the provided password with bcrypt (12 salt rounds - industry standard)
 * @param {string} password - The plain text password to hash
 */
userSchema.methods.setPassword = async function (password) {
  if (!password) throw new Error("Password is required to set.");
  if (password.length < securityConfig.password.minLength) {
    throw new Error(`Password must be at least ${securityConfig.password.minLength} characters.`);
  }
  this.password = await bcrypt.hash(password, securityConfig.password.saltRounds);
};

/**
 * Validate Password using bcrypt
 * Compares a provided password with the stored hashed password
 * @param {string} password - The plain text password to validate
 * @returns {Promise<boolean>} - True if the password is valid, false otherwise
 */
userSchema.methods.validPassword = async function (password) {
  if (!password) return false;
  if (!this.password) return false;
  return await bcrypt.compare(password, this.password);
};

/**
 * Increment failed login attempts
 * Implements account lockout after too many failed attempts
 */
userSchema.methods.incLoginAttempts = async function () {
  // Reset if lock has expired
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { failedLoginAttempts: 1 },
      $unset: { lockUntil: 1 },
    });
  }

  const updates = { $inc: { failedLoginAttempts: 1 } };

  // Lock account after 5 failed attempts for 2 hours
  if (this.failedLoginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 };
  }

  return this.updateOne(updates);
};

/**
 * Reset login attempts after successful login
 */
userSchema.methods.resetLoginAttempts = function () {
  return this.updateOne({
    $set: { failedLoginAttempts: 0, lastLogin: new Date() },
    $unset: { lockUntil: 1 },
  });
};

/**
 * Pre-save middleware to ensure password is hashed
 */
userSchema.pre("save", async function (next) {
  // Only hash password if it's modified and not already hashed
  if (this.isModified("password") && this.password && !this.password.startsWith("$2")) {
    this.password = await bcrypt.hash(this.password, securityConfig.password.saltRounds);
  }
  next();
});

const userModel = mongoose.model("User", userSchema);

export default userModel;
