/**
 * Contact Controller
 * Handles contact form submissions
 */

import contactModel from "../models/contact.model.js";
import responseHandler from "../handlers/response.handler.js";
import logger from "../config/logger.config.js";
import emailService from "../utils/email.service.js";

/**
 * Submit contact form
 */
const submit = async (req, res) => {
  try {
    const { name, email, subject, category, message } = req.body;

    // Determine priority based on category
    let priority = "medium";
    if (category === "Bug Report" || category === "Technical Support") {
      priority = "high";
    } else if (category === "DMCA") {
      priority = "urgent";
    }

    const contact = new contactModel({
      name,
      email: email.toLowerCase(),
      subject,
      category,
      message,
      priority,
      ipAddress: req.ip || req.connection?.remoteAddress,
      userAgent: req.headers["user-agent"],
    });

    await contact.save();

    logger.info("New contact form submission", {
      ticketNumber: contact.ticketNumber,
      category,
      email,
    });

    const contactData = {
      name,
      email: email.toLowerCase(),
      subject,
      category,
      message,
      ticketNumber: contact.ticketNumber,
    };

    // Send confirmation email to user (non-blocking)
    emailService.sendContactConfirmation(contactData).catch((err) => {
      logger.error("Failed to send contact confirmation email", { email, error: err.message });
    });

    // Send notification to admin (non-blocking)
    emailService.sendAdminContactNotification(contactData).catch((err) => {
      logger.error("Failed to send admin contact notification", { email, error: err.message });
    });

    responseHandler.created(res, {
      message: "Your message has been received. We'll get back to you within 24-48 hours.",
      ticketNumber: contact.ticketNumber,
      submitted: true,
    });
  } catch (error) {
    logger.error("Contact form submission error", { error: error.message });
    responseHandler.error(res, "Failed to submit your message. Please try again.");
  }
};

/**
 * Get ticket status by ticket number
 */
const getTicketStatus = async (req, res) => {
  try {
    const { ticketNumber } = req.params;
    const { email } = req.query;

    const contact = await contactModel.findOne({
      ticketNumber,
      email: email.toLowerCase(),
    });

    if (!contact) {
      return responseHandler.notfound(res, "Ticket not found or email doesn't match.");
    }

    responseHandler.ok(res, {
      ticketNumber: contact.ticketNumber,
      status: contact.status,
      category: contact.category,
      subject: contact.subject,
      createdAt: contact.createdAt,
      responseMessage: contact.responseMessage,
      respondedAt: contact.respondedAt,
    });
  } catch (error) {
    logger.error("Ticket status check error", { error: error.message });
    responseHandler.error(res, "Failed to retrieve ticket status.");
  }
};

/**
 * Get all tickets for an email (user's tickets)
 */
const getUserTickets = async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return responseHandler.badrequest(res, "Email is required.");
    }

    const tickets = await contactModel
      .find({ email: email.toLowerCase() })
      .select("ticketNumber subject category status createdAt")
      .sort({ createdAt: -1 })
      .limit(10);

    responseHandler.ok(res, {
      tickets,
      count: tickets.length,
    });
  } catch (error) {
    logger.error("Get user tickets error", { error: error.message });
    responseHandler.error(res, "Failed to retrieve tickets.");
  }
};

export default {
  submit,
  getTicketStatus,
  getUserTickets,
};

