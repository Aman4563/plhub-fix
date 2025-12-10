/**
 * Newsletter Controller
 * Handles newsletter subscription operations
 */

import newsletterModel from "../models/newsletter.model.js";
import responseHandler from "../handlers/response.handler.js";
import logger from "../utils/logger.js";
import emailService from "../utils/email.service.js";

/**
 * Subscribe to newsletter
 */
const subscribe = async (req, res) => {
  try {
    const { email, source = "footer", preferences } = req.body;

    // Check if already subscribed
    const existingSubscription = await newsletterModel.findOne({ email: email.toLowerCase() });

    if (existingSubscription) {
      // If previously unsubscribed, reactivate
      if (!existingSubscription.isActive) {
        existingSubscription.isActive = true;
        existingSubscription.subscribedAt = new Date();
        existingSubscription.unsubscribedAt = null;
        if (preferences) {
          existingSubscription.preferences = { ...existingSubscription.preferences, ...preferences };
        }
        await existingSubscription.save();

        logger.info("Newsletter subscription reactivated", { email });

        // Send welcome email to user (non-blocking)
        emailService.sendNewsletterWelcome(email.toLowerCase()).catch((err) => {
          logger.error("Failed to send newsletter welcome email", { email, error: err.message });
        });

        // Send notification to admin (non-blocking)
        emailService.sendAdminNewsletterNotification({
          email: email.toLowerCase(),
          source,
          subscribedAt: new Date(),
        }).catch((err) => {
          logger.error("Failed to send admin newsletter notification", { email, error: err.message });
        });

        return responseHandler.ok(res, {
          message: "Welcome back! Your subscription has been reactivated.",
          subscribed: true,
        });
      }

      // Already actively subscribed
      return responseHandler.ok(res, {
        message: "You're already subscribed to our newsletter!",
        subscribed: true,
      });
    }

    // Create new subscription
    const subscription = new newsletterModel({
      email: email.toLowerCase(),
      source,
      preferences: preferences || {
        newReleases: true,
        recommendations: true,
        updates: true,
      },
      ipAddress: req.ip || req.connection?.remoteAddress,
      userAgent: req.headers["user-agent"],
    });

    await subscription.save();

    logger.info("New newsletter subscription", { email, source });

    // Send welcome email to user (non-blocking)
    emailService.sendNewsletterWelcome(email.toLowerCase()).catch((err) => {
      logger.error("Failed to send newsletter welcome email", { email, error: err.message });
    });

    // Send notification to admin (non-blocking)
    emailService.sendAdminNewsletterNotification({
      email: email.toLowerCase(),
      source,
      subscribedAt: new Date(),
    }).catch((err) => {
      logger.error("Failed to send admin newsletter notification", { email, error: err.message });
    });

    responseHandler.created(res, {
      message: "Successfully subscribed! Check your email for confirmation.",
      subscribed: true,
    });
  } catch (error) {
    logger.error("Newsletter subscription error", { error: error.message });

    if (error.code === 11000) {
      return responseHandler.ok(res, {
        message: "You're already subscribed to our newsletter!",
        subscribed: true,
      });
    }

    responseHandler.error(res, "Failed to subscribe. Please try again.");
  }
};

/**
 * Unsubscribe from newsletter
 */
const unsubscribe = async (req, res) => {
  try {
    const { email } = req.body;

    const subscription = await newsletterModel.findOne({ email: email.toLowerCase() });

    if (!subscription) {
      return responseHandler.notfound(res, "Email not found in our subscription list.");
    }

    if (!subscription.isActive) {
      return responseHandler.ok(res, {
        message: "You're already unsubscribed.",
        unsubscribed: true,
      });
    }

    subscription.isActive = false;
    subscription.unsubscribedAt = new Date();
    await subscription.save();

    logger.info("Newsletter unsubscription", { email });

    responseHandler.ok(res, {
      message: "You've been successfully unsubscribed. We're sorry to see you go!",
      unsubscribed: true,
    });
  } catch (error) {
    logger.error("Newsletter unsubscription error", { error: error.message });
    responseHandler.error(res, "Failed to unsubscribe. Please try again.");
  }
};

/**
 * Update subscription preferences
 */
const updatePreferences = async (req, res) => {
  try {
    const { email, preferences } = req.body;

    const subscription = await newsletterModel.findOne({ email: email.toLowerCase() });

    if (!subscription) {
      return responseHandler.notfound(res, "Email not found in our subscription list.");
    }

    subscription.preferences = { ...subscription.preferences, ...preferences };
    await subscription.save();

    logger.info("Newsletter preferences updated", { email });

    responseHandler.ok(res, {
      message: "Your preferences have been updated.",
      preferences: subscription.preferences,
    });
  } catch (error) {
    logger.error("Newsletter preferences update error", { error: error.message });
    responseHandler.error(res, "Failed to update preferences. Please try again.");
  }
};

/**
 * Check subscription status
 */
const checkStatus = async (req, res) => {
  try {
    const { email } = req.query;

    const subscription = await newsletterModel.findOne({ email: email.toLowerCase() });

    if (!subscription) {
      return responseHandler.ok(res, {
        subscribed: false,
        message: "Email not subscribed.",
      });
    }

    responseHandler.ok(res, {
      subscribed: subscription.isActive,
      subscribedAt: subscription.subscribedAt,
      preferences: subscription.preferences,
    });
  } catch (error) {
    logger.error("Newsletter status check error", { error: error.message });
    responseHandler.error(res, "Failed to check status.");
  }
};

export default {
  subscribe,
  unsubscribe,
  updatePreferences,
  checkStatus,
};

