// Import required modules and dependencies
import userModel from "../models/user.model.js";
import jsonwebtoken from "jsonwebtoken";
import responseHandler from "../handlers/response.handler.js";
import crypto from "crypto";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import { OAuth2Client } from "google-auth-library";
import axios from "axios";

dotenv.config(); // Load environment variables

// Nodemailer transporter for email communication
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Google OAuth2 client for Google Sign-In functionality
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Utility function to generate JWT tokens
const generateToken = (data, secret, expiresIn) => {
  return jsonwebtoken.sign({ data }, secret, { expiresIn });
};

// Utility function to verify CAPTCHA
const verifyCaptcha = async (captchaToken) => {
  const response = await axios.post(`https://www.google.com/recaptcha/api/siteverify`, null, {
    params: {
      secret: process.env.RECAPTCHA_SECRET_KEY,
      response: captchaToken,
    },
  });
  return response.status;
};

/**
 * User Signup
 * Handles user registration, CAPTCHA verification, and token generation.
 */
const signup = async (req, res) => {
  try {
    const { username, email, password, displayName, captchaToken } = req.body;

    // CAPTCHA verification
    if (!(await verifyCaptcha(captchaToken))) {
      return responseHandler.badrequest(res, "Captcha verification failed");
    }

    // Check if username or email is already in use
    if (await userModel.findOne({ username })) {
      return responseHandler.badrequest(res, "Username already in use");
    }
    if (await userModel.findOne({ email })) {
      return responseHandler.badrequest(res, "Email already in use");
    }

    // Create and save the new user
    const user = new userModel({ displayName, username, email });
    user.setPassword(password);
    await user.save();

    // Generate authentication token
    const token = generateToken(user.id, process.env.TOKEN_SECRET, "24h");

    responseHandler.created(res, { token, ...user._doc, id: user.id });
  } catch (error) {
    console.error("Signup Error:", error);
    responseHandler.error(res);
  }
};

/**
 * User Signin
 * Authenticates the user, verifies CAPTCHA, and generates a token.
 */
const signin = async (req, res) => {
  try {
    const { username, password, captchaToken } = req.body;

    // CAPTCHA verification
    if (!(await verifyCaptcha(captchaToken))) {
      return responseHandler.badrequest(res, "Captcha verification failed");
    }

    // Verify username and password
    const user = await userModel.findOne({ username }).select("+password +salt");
    if (!user || !user.validPassword(password)) {
      return responseHandler.badrequest(res, "Invalid username or password");
    }

    // Generate authentication token
    const token = generateToken(user.id, process.env.TOKEN_SECRET, "24h");

    responseHandler.created(res, { token, ...user._doc, id: user.id });
  } catch (error) {
    console.error("Signin Error:", error);
    responseHandler.error(res);
  }
};

/**
 * Google Sign-In
 * Authenticates users using Google OAuth2 and creates accounts if necessary.
 */
const googleSignIn = async (req, res) => {
  try {
    const { tokenId } = req.body;

    // Verify Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: tokenId,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const { email, name, sub: googleId } = ticket.getPayload();

    // Check if user exists or create a new one
    let user = await userModel.findOne({ $or: [{ googleId }, { email }] });
    if (!user) {
      user = new userModel({
        displayName: name,
        username: `${name.replace(/\s+/g, "").toLowerCase()}_${googleId.substring(0, 5)}`,
        email,
        googleId,
        authType: "google",
      });
      await user.save();
    } else if (user.authType !== "google") {
      return responseHandler.badrequest(res, "Email already used with a different sign-in method.");
    }

    const token = generateToken(user.id, process.env.TOKEN_SECRET, "24h");
    responseHandler.ok(res, { token, ...user._doc, id: user.id });
  } catch (error) {
    console.error("Google Sign-In Error:", error);
    responseHandler.error(res);
  }
};

/**
 * Forgot Password
 * Sends an email with a password reset link.
 */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await userModel.findOne({ email });
    if (!user) return responseHandler.badrequest(res, "Email not found");

    const resetToken = crypto.randomBytes(20).toString("hex");
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // Token expires in 1 hour
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    const mailOptions = {
      to: user.email,
      from: process.env.EMAIL_USER,
      subject: "Password Reset",
      text: `To reset your password, click the link: ${resetUrl}`,
    };

    transporter.sendMail(mailOptions, (err) => {
      if (err) return responseHandler.error(res);
      responseHandler.ok(res, { message: "Password reset email sent" });
    });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    responseHandler.error(res);
  }
};

/**
 * Reset Password
 * Updates the user's password if the token is valid.
 */
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    const user = await userModel.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) return responseHandler.badrequest(res, "Invalid or expired password reset token");

    user.setPassword(newPassword);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    responseHandler.ok(res, { message: "Password reset successful" });
  } catch (error) {
    console.error("Reset Password Error:", error);
    responseHandler.error(res);
  }
};

/**
 * Update Password
 * Allows authenticated users to update their password.
 */
const updatePassword = async (req, res) => {
  try {
    const { password, newPassword } = req.body;

    const user = await userModel.findById(req.user.id).select("+password +salt");
    if (!user || !user.validPassword(password)) {
      return responseHandler.badrequest(res, "Invalid current password");
    }

    user.setPassword(newPassword);
    await user.save();

    responseHandler.ok(res, { message: "Password updated successfully" });
  } catch (error) {
    console.error("Update Password Error:", error);
    responseHandler.error(res);
  }
};

/**
 * Get User Information
 * Retrieves information about the authenticated user.
 */
const getInfo = async (req, res) => {
  try {
    const user = await userModel.findById(req.user.id);
    if (!user) return responseHandler.notfound(res);

    responseHandler.ok(res, user);
  } catch (error) {
    console.error("Get Info Error:", error);
    responseHandler.error(res);
  }
};

/**
 * Refresh Access Token
 * Issues a new access token using a valid refresh token.
 */
const refreshAccessToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) return responseHandler.unauthorize(res, "Refresh token required");

    const decoded = jsonwebtoken.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const user = await userModel.findById(decoded.data);

    if (!user) return responseHandler.unauthorize(res, "Invalid refresh token");

    const newAccessToken = generateToken(user.id, process.env.TOKEN_SECRET, "15m");

    responseHandler.ok(res, { token: newAccessToken });
  } catch (error) {
    console.error("Refresh Access Token Error:", error);
    responseHandler.error(res);
  }
};

// Export all handlers
export default {
  signup,
  signin,
  googleSignIn,
  forgotPassword,
  resetPassword,
  updatePassword,
  getInfo,
  refreshAccessToken,
};
