/**
 * User Controller
 * Handles user authentication, registration, and account management
 * Implements secure JWT with httpOnly cookies and refresh tokens
 */

import userModel from "../models/user.model.js";
import jsonwebtoken from "jsonwebtoken";
import responseHandler from "../handlers/response.handler.js";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { OAuth2Client } from "google-auth-library";
import securityConfig from "../config/security.config.js";
import logger from "../config/logger.config.js";
import { isDisposableEmail, checkUsername, maskEmail, hashToken } from "../utils/validation.utils.js";
import { emailVerificationTemplate, welcomeEmailTemplate, passwordResetTemplate } from "../utils/email.templates.js";
import { checkPasswordBreach, sanitizeDisplayName } from "../utils/password.utils.js";

// Nodemailer transporter for email communication
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Google OAuth2 client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Generate Access Token (short-lived)
 */
const generateAccessToken = (userId) => {
  return jsonwebtoken.sign(
    { data: userId },
    process.env.TOKEN_SECRET,
    { expiresIn: securityConfig.jwt.accessTokenExpiry }
  );
};

/**
 * Generate Refresh Token (long-lived)
 */
const generateRefreshToken = (userId) => {
  return jsonwebtoken.sign(
    { data: userId },
    process.env.REFRESH_TOKEN_SECRET || process.env.TOKEN_SECRET + "_refresh",
    { expiresIn: securityConfig.jwt.refreshTokenExpiry }
  );
};

/**
 * Set authentication cookies
 */
const setAuthCookies = (res, accessToken, refreshToken) => {
  res.cookie("accessToken", accessToken, securityConfig.jwt.cookieOptions);
  res.cookie("refreshToken", refreshToken, securityConfig.jwt.refreshCookieOptions);
};

/**
 * Clear authentication cookies
 */
const clearAuthCookies = (res) => {
  res.clearCookie("accessToken", { ...securityConfig.jwt.cookieOptions, maxAge: 0 });
  res.clearCookie("refreshToken", { ...securityConfig.jwt.refreshCookieOptions, maxAge: 0 });
};

/**
 * Verify CAPTCHA token with Google reCAPTCHA
 * 
 * Google reCAPTCHA v2 siteverify API:
 * - Endpoint: https://www.google.com/recaptcha/api/siteverify
 * - Method: POST
 * - Content-Type: application/x-www-form-urlencoded
 * - Parameters: secret (required), response (required), remoteip (optional)
 * - Returns: JSON { success: boolean, challenge_ts: string, hostname: string, error-codes?: string[] }
 * 
 * How CAPTCHA works in our app:
 * 1. Frontend: User completes the reCAPTCHA widget on the sign-in/sign-up form
 * 2. Frontend: Widget generates a token (captchaToken) that proves human interaction
 * 3. Frontend: Token is sent to backend along with form data
 * 4. Backend: This function sends the token to Google's siteverify API
 * 5. Backend: Google verifies the token and returns success/failure
 * 6. Backend: If valid, proceed with sign-in/sign-up; if invalid, reject the request
 */
const verifyCaptcha = async (captchaToken) => {
  try {
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    const isDevelopment = process.env.NODE_ENV === "development";
    const bypassCaptcha = process.env.BYPASS_CAPTCHA === "true";
    
    // Allow bypass in development mode if configured
    if (isDevelopment && bypassCaptcha) {
      logger.warn("CAPTCHA verification bypassed (BYPASS_CAPTCHA=true)");
      return true;
    }
    
    // Check if secret key is configured
    if (!secretKey || secretKey === "your_recaptcha_secret_key_here") {
      logger.error("RECAPTCHA_SECRET_KEY is not configured");
      if (isDevelopment) {
        logger.warn("CAPTCHA bypassed - no secret key configured in development");
        return true;
      }
      return false;
    }

    // Check if token is provided
    if (!captchaToken) {
      logger.warn("CAPTCHA token missing from request");
      return false;
    }

    logger.info("Verifying CAPTCHA token...", { 
      tokenLength: captchaToken.length,
      secretKeyPrefix: secretKey.substring(0, 10) + "..."
    });

    // Use Node.js native fetch API (available in Node 18+)
    // This properly handles gzip-compressed responses from Google
    const verifyUrl = "https://www.google.com/recaptcha/api/siteverify";
    
    // Create form data as URL-encoded string
    const formData = new URLSearchParams();
    formData.append("secret", secretKey);
    formData.append("response", captchaToken);

    const response = await fetch(verifyUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        },
      body: formData.toString(),
    });

    // Parse JSON response (fetch automatically handles gzip decompression)
    const responseData = await response.json();

    const isValid = responseData.success === true;
    
    logger.info("CAPTCHA verification result", {
      success: responseData.success,
      hostname: responseData.hostname,
      challengeTs: responseData.challenge_ts,
      errorCodes: responseData["error-codes"] || [],
    });
    
    if (!isValid) {
      const errorCodes = responseData["error-codes"] || [];
      
      if (errorCodes.length === 0) {
        logger.error("CAPTCHA failed with no error codes - site key and secret key may not match");
      }
      
      // Log specific error messages for debugging
      const errorMessages = {
        "missing-input-secret": "The secret parameter is missing",
        "invalid-input-secret": "The secret key is invalid - check RECAPTCHA_SECRET_KEY",
        "missing-input-response": "The response token is missing",
        "invalid-input-response": "The response token is invalid or malformed",
        "bad-request": "The request is invalid",
        "timeout-or-duplicate": "The token has expired or was already used",
      };
      
      errorCodes.forEach(code => {
        logger.error(`CAPTCHA error: ${errorMessages[code] || code}`);
      });
    }

    return isValid;
  } catch (error) {
    logger.error("CAPTCHA verification error", { 
      message: error.message,
      stack: error.stack,
    });
    
    if (process.env.NODE_ENV === "development") {
      logger.warn("CAPTCHA bypassed - error in development");
      return true;
    }
    return false;
  }
};

/**
 * User Signup
 * Enhanced with email verification, disposable email detection, and profanity filtering
 */
const signup = async (req, res) => {
  try {
    const { username, email, password, displayName, captchaToken, acceptedTerms } = req.body;

    // Verify terms acceptance
    if (!acceptedTerms) {
      return responseHandler.badrequest(res, "You must accept the Terms of Service and Privacy Policy");
    }

    // Verify CAPTCHA
    const captchaValid = await verifyCaptcha(captchaToken);
    if (!captchaValid) {
      return responseHandler.badrequest(res, "CAPTCHA verification failed. Please try again.");
    }

    // Check for disposable email
    if (isDisposableEmail(email)) {
      return responseHandler.badrequest(res, "Please use a permanent email address. Temporary emails are not allowed.");
    }

    // Check username for profanity and reserved words
    const usernameCheck = checkUsername(username);
    if (usernameCheck.isProfane || usernameCheck.isReserved) {
      return responseHandler.badrequest(res, usernameCheck.reason);
    }

    // Check existing username with suggestion
    const existingUsername = await userModel.findOne({ username });
    if (existingUsername) {
      const suggestion = `${username}_${new Date().getFullYear()}`;
      return responseHandler.badrequest(res, `Username "${username}" is already taken. Try "${suggestion}" instead?`);
    }

    // Check existing email with hint
    const existingEmail = await userModel.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return responseHandler.badrequest(res, "This email is already registered. Did you mean to sign in?");
    }

    // Check password against breached passwords database (HIBP)
    const breachCheck = await checkPasswordBreach(password);
    if (breachCheck.breached) {
      const message = breachCheck.count > 1000000
        ? `This password has been exposed in over ${Math.floor(breachCheck.count / 1000000)} million data breaches. Please choose a different password.`
        : `This password has been found in ${breachCheck.count.toLocaleString()} data breaches. Please choose a more secure password.`;
      return responseHandler.badrequest(res, message);
    }

    // Sanitize displayName to prevent XSS
    const sanitizedDisplayName = sanitizeDisplayName(displayName);

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const hashedVerificationToken = hashToken(verificationToken);

    // Create new user with email verification pending
    const user = new userModel({
      displayName: sanitizedDisplayName,
      username,
      email: email.toLowerCase(),
      authType: "local",
      isEmailVerified: false,
      emailVerificationToken: hashedVerificationToken,
      emailVerificationExpires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    });

    // Set password using bcrypt
    await user.setPassword(password);
    await user.save();

    // Generate tokens
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Store hashed refresh token in database
    user.refreshToken = hashToken(refreshToken);
    await user.save();

    // Set httpOnly cookies
    setAuthCookies(res, accessToken, refreshToken);

    // Send verification email
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
    
    try {
      await transporter.sendMail({
        to: user.email,
        from: process.env.EMAIL_USER,
        subject: "Verify Your Email - PLHub",
        html: emailVerificationTemplate({
          displayName: user.displayName,
          verificationUrl,
          expiresIn: "24 hours",
        }),
      });
      logger.info("Verification email sent", { userId: user.id, email: maskEmail(user.email) });
    } catch (emailError) {
      logger.error("Failed to send verification email", { 
        userId: user.id, 
        error: emailError.message 
      });
      // Continue with signup even if email fails - user can request resend
    }

    logger.info("User registered successfully", { 
      userId: user.id, 
      username,
      email: maskEmail(email),
      ip: req.ip,
      userAgent: req.headers["user-agent"]?.substring(0, 100),
    });

    // Return user data
    responseHandler.created(res, {
      token: accessToken,
      refreshToken,
      ...user._doc,
      id: user.id,
      password: undefined,
      emailVerificationToken: undefined,
      refreshToken: undefined,
      message: "Account created! Please check your email to verify your account.",
    });
  } catch (error) {
    logger.error("Signup error", { error: error.message, stack: error.stack });
    responseHandler.error(res);
  }
};

/**
 * Verify Email
 */
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return responseHandler.badrequest(res, "Verification token is required");
    }

    // Hash the provided token to compare with stored hash
    const hashedToken = hashToken(token);

    const user = await userModel.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() },
    });

    if (!user) {
      return responseHandler.badrequest(res, "Invalid or expired verification token");
    }

    if (user.isEmailVerified) {
      return responseHandler.ok(res, { message: "Email already verified" });
    }

    // Mark email as verified
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    // Send welcome email
    try {
      await transporter.sendMail({
        to: user.email,
        from: process.env.EMAIL_USER,
        subject: "Welcome to PLHub! 🎬",
        html: welcomeEmailTemplate({
          displayName: user.displayName,
          loginUrl: `${process.env.FRONTEND_URL}`,
        }),
      });
      logger.info("Welcome email sent", { userId: user.id });
    } catch (emailError) {
      logger.error("Failed to send welcome email", { 
        userId: user.id, 
        error: emailError.message 
      });
    }

    logger.info("Email verified successfully", { userId: user.id });

    responseHandler.ok(res, { 
      message: "Email verified successfully! You can now access all features.",
      isEmailVerified: true,
    });
  } catch (error) {
    logger.error("Email verification error", { error: error.message });
    responseHandler.error(res);
  }
};

/**
 * Resend Verification Email
 */
const resendVerificationEmail = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return responseHandler.unauthorize(res, "Authentication required");
    }

    const user = await userModel.findById(userId);

    if (!user) {
      return responseHandler.notfound(res, "User not found");
    }

    if (user.isEmailVerified) {
      return responseHandler.badrequest(res, "Email is already verified");
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const hashedVerificationToken = hashToken(verificationToken);

    user.emailVerificationToken = hashedVerificationToken;
    user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    await user.save();

    // Send verification email
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;

    await transporter.sendMail({
      to: user.email,
      from: process.env.EMAIL_USER,
      subject: "Verify Your Email - PLHub",
      html: emailVerificationTemplate({
        displayName: user.displayName,
        verificationUrl,
        expiresIn: "24 hours",
      }),
    });

    logger.info("Verification email resent", { userId: user.id, email: maskEmail(user.email) });

    responseHandler.ok(res, { 
      message: "Verification email sent! Please check your inbox.",
    });
  } catch (error) {
    logger.error("Resend verification email error", { error: error.message });
    responseHandler.error(res);
  }
};

/**
 * Check Username Availability
 */
const checkUsernameAvailability = async (req, res) => {
  try {
    const { username } = req.params;

    if (!username || username.length < 3) {
      return responseHandler.ok(res, { available: false, reason: "Username too short" });
    }

    // Check for profanity and reserved words
    const usernameCheck = checkUsername(username);
    if (usernameCheck.isProfane || usernameCheck.isReserved) {
      return responseHandler.ok(res, { available: false, reason: usernameCheck.reason });
    }

    // Check if username exists
    const existingUser = await userModel.findOne({ username });
    
    responseHandler.ok(res, { 
      available: !existingUser,
      reason: existingUser ? "Username is already taken" : null,
    });
  } catch (error) {
    logger.error("Check username error", { error: error.message });
    responseHandler.error(res);
  }
};

/**
 * Check Email Availability
 */
const checkEmailAvailability = async (req, res) => {
  try {
    const { email } = req.params;

    if (!email) {
      return responseHandler.ok(res, { available: false, reason: "Email is required" });
    }

    // Check for disposable email
    if (isDisposableEmail(email)) {
      return responseHandler.ok(res, { 
        available: false, 
        reason: "Temporary emails are not allowed",
      });
    }

    // Check if email exists
    const existingUser = await userModel.findOne({ email: email.toLowerCase() });
    
    responseHandler.ok(res, { 
      available: !existingUser,
      reason: existingUser ? "Email is already registered" : null,
    });
  } catch (error) {
    logger.error("Check email error", { error: error.message });
    responseHandler.error(res);
  }
};

/**
 * User Signin
 */
const signin = async (req, res) => {
  try {
    const { username, password, captchaToken } = req.body;

    // Verify CAPTCHA
    const captchaValid = await verifyCaptcha(captchaToken);
    if (!captchaValid) {
      return responseHandler.badrequest(res, "CAPTCHA verification failed. Please try again.");
    }

    // Find user with password and security fields
    const user = await userModel
      .findOne({ username })
      .select("+password +failedLoginAttempts +lockUntil");

    if (!user) {
      return responseHandler.badrequest(res, "Invalid username or password");
    }

    // Check if account is locked
    if (user.isLocked) {
      const lockTimeRemaining = Math.ceil((user.lockUntil - Date.now()) / 60000);
      logger.warn("Login attempt on locked account", { username });
      return responseHandler.badrequest(
        res,
        `Account is locked. Please try again in ${lockTimeRemaining} minutes.`
      );
    }

    // Validate password
    const isValidPassword = await user.validPassword(password);
    if (!isValidPassword) {
      await user.incLoginAttempts();
      logger.warn("Failed login attempt", { username, ip: req.ip });
      return responseHandler.badrequest(res, "Invalid username or password");
    }

    // Reset login attempts on successful login
    await user.resetLoginAttempts();

    // Generate tokens
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Store hashed refresh token
    await userModel.findByIdAndUpdate(user.id, { refreshToken: hashToken(refreshToken) });

    // Set httpOnly cookies
    setAuthCookies(res, accessToken, refreshToken);

    logger.info("User logged in successfully", { userId: user.id, username });

    // Prepare response with email verification warning if not verified
    const responseData = {
      token: accessToken,
      refreshToken,
      ...user._doc,
      id: user.id,
      password: undefined,
      failedLoginAttempts: undefined,
      lockUntil: undefined,
    };

    // Add warning if email is not verified
    if (!user.isEmailVerified) {
      responseData.emailVerificationWarning = "Please verify your email address to access all features.";
    }

    responseHandler.ok(res, responseData);
  } catch (error) {
    logger.error("Signin error", { error: error.message, stack: error.stack });
    responseHandler.error(res);
  }
};

/**
 * Google Sign-In
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

    // Check if user exists
    let user = await userModel.findOne({ $or: [{ googleId }, { email }] });

    if (!user) {
      // Create new user for Google sign-in
      user = new userModel({
        displayName: name,
        username: `${name.replace(/\s+/g, "").toLowerCase()}_${googleId.substring(0, 5)}`,
        email: email.toLowerCase(),
        googleId,
        authType: "google",
      });
      await user.save();
      logger.info("New Google user created", { userId: user.id, email });
    } else if (user.authType !== "google" && !user.googleId) {
      // Link Google account to existing local account
      user.googleId = googleId;
      user.authType = "google";
      await user.save();
      logger.info("Google account linked to existing user", { userId: user.id });
    }

    // Google accounts are automatically verified
    if (!user.isEmailVerified) {
      user.isEmailVerified = true;
    }

    // Generate tokens
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Store hashed refresh token
    user.refreshToken = hashToken(refreshToken);
    await user.save();

    // Set httpOnly cookies
    setAuthCookies(res, accessToken, refreshToken);

    logger.info("Google sign-in successful", { userId: user.id });

    responseHandler.ok(res, {
      token: accessToken,
      refreshToken,
      ...user._doc,
      id: user.id,
    });
  } catch (error) {
    logger.error("Google Sign-In error", { error: error.message });
    responseHandler.error(res);
  }
};

/**
 * Refresh Access Token
 */
const refreshAccessToken = async (req, res) => {
  try {
    // Get refresh token from cookie or body
    const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
      return responseHandler.unauthorize(res, "Refresh token required");
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = jsonwebtoken.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET || process.env.TOKEN_SECRET + "_refresh"
      );
    } catch (err) {
      clearAuthCookies(res);
      return responseHandler.unauthorize(res, "Invalid or expired refresh token");
    }

    // Find user and verify stored refresh token (compare hashed tokens)
    const user = await userModel.findById(decoded.data).select("+refreshToken");
    const hashedProvidedToken = hashToken(refreshToken);

    if (!user || user.refreshToken !== hashedProvidedToken) {
      clearAuthCookies(res);
      logger.warn("Refresh token mismatch or user not found", { userId: decoded.data });
      return responseHandler.unauthorize(res, "Invalid refresh token");
    }

    // Generate new tokens
    const newAccessToken = generateAccessToken(user.id);
    const newRefreshToken = generateRefreshToken(user.id);

    // Update stored refresh token (hashed)
    user.refreshToken = hashToken(newRefreshToken);
    await user.save();

    // Set new cookies
    setAuthCookies(res, newAccessToken, newRefreshToken);

    logger.info("Token refreshed successfully", { userId: user.id });

    responseHandler.ok(res, {
      token: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    logger.error("Refresh token error", { error: error.message });
    clearAuthCookies(res);
    responseHandler.error(res);
  }
};

/**
 * Logout
 */
const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (refreshToken) {
      // Invalidate refresh token in database (compare with hashed token)
      const hashedToken = hashToken(refreshToken);
      await userModel.findOneAndUpdate(
        { refreshToken: hashedToken },
        { $unset: { refreshToken: 1 } }
      );
    }

    clearAuthCookies(res);
    logger.info("User logged out");

    responseHandler.ok(res, { message: "Logged out successfully" });
  } catch (error) {
    logger.error("Logout error", { error: error.message });
    clearAuthCookies(res);
    responseHandler.ok(res, { message: "Logged out" });
  }
};

/**
 * Forgot Password
 */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await userModel.findOne({ email: email.toLowerCase() });

    // Don't reveal if email exists (security best practice)
    if (!user) {
      logger.info("Password reset requested for non-existent email", { email });
      return responseHandler.ok(res, {
        message: "If an account exists with this email, a password reset link has been sent.",
      });
    }

    // Check if user uses Google auth
    if (user.authType === "google") {
      return responseHandler.badrequest(
        res,
        "This account uses Google Sign-In. Please sign in with Google."
      );
    }

    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    await transporter.sendMail({
      to: user.email,
      from: process.env.EMAIL_USER,
      subject: "Reset Your Password - PLHub",
      html: passwordResetTemplate({
        displayName: user.displayName,
        resetUrl,
        expiresIn: "1 hour",
      }),
    });
    logger.info("Password reset email sent", { userId: user.id });

    responseHandler.ok(res, {
      message: "If an account exists with this email, a password reset link has been sent.",
    });
  } catch (error) {
    logger.error("Forgot password error", { error: error.message });
    responseHandler.error(res);
  }
};

/**
 * Reset Password
 */
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Hash the provided token to compare with stored hash
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await userModel.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return responseHandler.badrequest(res, "Invalid or expired password reset token");
    }

    // Set new password
    await user.setPassword(newPassword);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();

    logger.info("Password reset successful", { userId: user.id });

    responseHandler.ok(res, { message: "Password reset successful. You can now sign in." });
  } catch (error) {
    logger.error("Reset password error", { error: error.message });
    responseHandler.error(res);
  }
};

/**
 * Update Password
 * Validates current password, ensures new password is different,
 * and forces re-login after successful update.
 * Includes account lockout after 5 failed attempts.
 */
const updatePassword = async (req, res) => {
  try {
    const { password, newPassword } = req.body;

    // Fetch user with password and lockout fields
    const user = await userModel
      .findById(req.user.id)
      .select("+password +failedLoginAttempts +lockUntil");

    if (!user) {
      return responseHandler.notfound(res, "User not found");
    }

    if (user.authType === "google") {
      return responseHandler.badrequest(
        res,
        "Cannot update password for Google Sign-In accounts. Please use Google account settings."
      );
    }

    // Check if account is locked due to too many failed attempts
    if (user.lockUntil && user.lockUntil > Date.now()) {
      const remainingMinutes = Math.ceil((user.lockUntil - Date.now()) / 60000);
      logger.warn("Password update blocked - account locked", { 
        userId: user.id,
        remainingMinutes 
      });
      return responseHandler.badrequest(
        res,
        `Account temporarily locked due to too many failed attempts. Please try again in ${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''}.`
      );
    }

    // Verify current password
    const isValidPassword = await user.validPassword(password);
    if (!isValidPassword) {
      // Increment failed attempts
      await user.incLoginAttempts();
      
      const attemptsRemaining = Math.max(0, 5 - (user.failedLoginAttempts + 1));
      
      logger.warn("Failed password update attempt - incorrect current password", { 
        userId: user.id,
        failedAttempts: user.failedLoginAttempts + 1,
        attemptsRemaining
      });
      
      if (attemptsRemaining === 0) {
        return responseHandler.badrequest(
          res, 
          "Current password is incorrect. Account has been temporarily locked for 2 hours due to too many failed attempts."
        );
      }
      
      return responseHandler.badrequest(
        res, 
        `Current password is incorrect. ${attemptsRemaining} attempt${attemptsRemaining > 1 ? 's' : ''} remaining before account lockout.`
      );
    }

    // Check if new password is same as current password
    const isSamePassword = await user.validPassword(newPassword);
    if (isSamePassword) {
      return responseHandler.badrequest(
        res, 
        "New password must be different from your current password"
      );
    }

    // Update password
    await user.setPassword(newPassword);
    await user.save();

    // Reset failed attempts on successful password change
    await user.resetLoginAttempts();

    // Invalidate refresh token to force re-login
    await userModel.findByIdAndUpdate(user.id, { 
      $unset: { refreshToken: 1 },
      $set: { failedLoginAttempts: 0 },
    });

    logger.info("Password updated successfully", { userId: user.id });

    responseHandler.ok(res, { 
      message: "Password updated successfully. Please sign in with your new password." 
    });
  } catch (error) {
    logger.error("Update password error", { error: error.message });
    responseHandler.error(res, "Failed to update password. Please try again.");
  }
};

/**
 * Get User Information
 */
const getInfo = async (req, res) => {
  try {
    const user = await userModel.findById(req.user.id);

    if (!user) {
      return responseHandler.notfound(res);
    }

    responseHandler.ok(res, user);
  } catch (error) {
    logger.error("Get info error", { error: error.message });
    responseHandler.error(res);
  }
};

export default {
  signup,
  signin,
  googleSignIn,
  verifyEmail,
  resendVerificationEmail,
  checkUsernameAvailability,
  checkEmailAvailability,
  forgotPassword,
  resetPassword,
  updatePassword,
  getInfo,
  refreshAccessToken,
  logout,
};
