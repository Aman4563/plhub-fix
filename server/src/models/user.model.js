import mongoose from "mongoose";
import crypto from "crypto";
import modelOptions from "./model.options.js"; // Shared model options

/**
 * User Schema
 * Represents user data and methods for authentication and password management.
 */
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required."],
      unique: true,
      trim: true, // Ensures no leading/trailing spaces
    },
    email: {
      type: String,
      required: [true, "Email is required."],
      unique: true,
      lowercase: true, // Ensures emails are stored in lowercase
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address."],
    },
    displayName: {
      type: String,
      required: [true, "Display name is required."],
      trim: true,
    },
    password: {
      type: String,
      select: false, // Excludes password from query results by default
    },
    salt: {
      type: String,
      select: false, // Excludes salt from query results by default
    },
    authType: {
      type: String,
      enum: ["local", "google"], // Restricts values to "local" or "google"
      required: true,
      default: "local", // Default value for authType
    },
    googleId: {
      type: String,
      unique: true, // Ensures unique Google ID for OAuth users
      sparse: true, // Allows null/undefined values while ensuring uniqueness
    },
  },
  modelOptions
);

/**
 * Set Password
 * Hashes the provided password and sets it along with a unique salt.
 *
 * @param {string} password - The plain text password to hash.
 */
userSchema.methods.setPassword = function (password) {
  if (!password) throw new Error("Password is required to set.");
  this.salt = crypto.randomBytes(16).toString("hex"); // Generate random salt
  this.password = crypto
    .pbkdf2Sync(password, this.salt, 1000, 64, "sha512")
    .toString("hex"); // Hash the password
};

/**
 * Validate Password
 * Compares a provided password with the stored hashed password.
 *
 * @param {string} password - The plain text password to validate.
 * @returns {boolean} - True if the password is valid, false otherwise.
 */
userSchema.methods.validPassword = function (password) {
  if (!password) throw new Error("Password is required for validation.");
  const hash = crypto
    .pbkdf2Sync(password, this.salt, 1000, 64, "sha512")
    .toString("hex"); // Hash the provided password
  return this.password === hash; // Compare the hash with the stored password
};

// Create and export the User model
const userModel = mongoose.model("User", userSchema);

export default userModel;
