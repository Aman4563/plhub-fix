/**
 * Job Application Controller
 * Handles job application submissions from the careers page
 */

import jobApplicationModel from "../models/job.application.model.js";
import responseHandler from "../handlers/response.handler.js";
import logger from "../utils/logger.js";
import emailService from "../utils/email.service.js";

/**
 * Submit job application
 */
const submit = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      position,
      department,
      experience,
      resumeUrl,
      portfolioUrl,
      linkedinUrl,
      coverLetter,
      referralSource,
    } = req.body;

    // Check for duplicate application (same email + position within 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const existingApplication = await jobApplicationModel.findOne({
      email: email.toLowerCase(),
      position,
      createdAt: { $gte: thirtyDaysAgo },
    });

    if (existingApplication) {
      return responseHandler.badrequest(
        res,
        "You've already applied for this position recently. Please wait 30 days before reapplying."
      );
    }

    const application = new jobApplicationModel({
      name,
      email: email.toLowerCase(),
      phone,
      position,
      department,
      experience,
      resumeUrl,
      portfolioUrl,
      linkedinUrl,
      coverLetter,
      referralSource: referralSource || "Website",
      ipAddress: req.ip || req.connection?.remoteAddress,
      userAgent: req.headers["user-agent"],
    });

    await application.save();

    logger.info("New job application submitted", {
      applicationId: application.applicationId,
      position,
      email,
    });

    const applicationData = {
      name,
      email: email.toLowerCase(),
      phone,
      position,
      department,
      experience,
      linkedinUrl,
      portfolioUrl,
      coverLetter,
      applicationId: application.applicationId,
    };

    // Send confirmation email to applicant (non-blocking)
    emailService.sendJobApplicationConfirmation(applicationData).catch((err) => {
      logger.error("Failed to send job application confirmation email", { email, error: err.message });
    });

    // Send notification to admin/recruitment (non-blocking)
    emailService.sendAdminJobApplicationNotification(applicationData).catch((err) => {
      logger.error("Failed to send admin job application notification", { email, error: err.message });
    });

    responseHandler.created(res, {
      message: "Your application has been submitted successfully! Check your email for confirmation.",
      applicationId: application.applicationId,
      submitted: true,
    });
  } catch (error) {
    logger.error("Job application submission error", { error: error.message });
    responseHandler.error(res, "Failed to submit application. Please try again.");
  }
};

/**
 * Get application status by ID and email
 */
const getStatus = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { email } = req.query;

    const application = await jobApplicationModel.findOne({
      applicationId,
      email: email.toLowerCase(),
    });

    if (!application) {
      return responseHandler.notfound(res, "Application not found or email doesn't match.");
    }

    responseHandler.ok(res, {
      applicationId: application.applicationId,
      position: application.position,
      department: application.department,
      status: application.status,
      appliedAt: application.createdAt,
    });
  } catch (error) {
    logger.error("Application status check error", { error: error.message });
    responseHandler.error(res, "Failed to retrieve application status.");
  }
};

/**
 * Get all applications for an email
 */
const getUserApplications = async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return responseHandler.badrequest(res, "Email is required.");
    }

    const applications = await jobApplicationModel
      .find({ email: email.toLowerCase() })
      .select("applicationId position department status createdAt")
      .sort({ createdAt: -1 })
      .limit(10);

    responseHandler.ok(res, {
      applications,
      count: applications.length,
    });
  } catch (error) {
    logger.error("Get user applications error", { error: error.message });
    responseHandler.error(res, "Failed to retrieve applications.");
  }
};

/**
 * Withdraw application
 */
const withdraw = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { email } = req.body;

    const application = await jobApplicationModel.findOne({
      applicationId,
      email: email.toLowerCase(),
    });

    if (!application) {
      return responseHandler.notfound(res, "Application not found or email doesn't match.");
    }

    if (application.status === "withdrawn") {
      return responseHandler.ok(res, {
        message: "Application is already withdrawn.",
        withdrawn: true,
      });
    }

    if (["offer", "rejected"].includes(application.status)) {
      return responseHandler.badrequest(
        res,
        "Cannot withdraw application at this stage."
      );
    }

    application.status = "withdrawn";
    await application.save();

    logger.info("Job application withdrawn", { applicationId, email });

    responseHandler.ok(res, {
      message: "Your application has been withdrawn successfully.",
      withdrawn: true,
    });
  } catch (error) {
    logger.error("Application withdrawal error", { error: error.message });
    responseHandler.error(res, "Failed to withdraw application.");
  }
};

export default {
  submit,
  getStatus,
  getUserApplications,
  withdraw,
};

