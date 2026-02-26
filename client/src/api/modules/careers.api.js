/**
 * Careers API Module
 * Handles job application related API calls
 */

import publicClient from "../client/public.client";

const careersApi = {
  /**
   * Submit a job application
   * @param {Object} data - Application data
   * @param {string} data.name - Applicant's full name
   * @param {string} data.email - Applicant's email address
   * @param {string} [data.phone] - Applicant's phone number
   * @param {string} data.position - Position applied for
   * @param {string} data.department - Department (Engineering, Design, Marketing, Support, Other)
   * @param {string} [data.experience] - Years of experience (0-1, 1-3, 3-5, 5-10, 10+)
   * @param {string} [data.resumeUrl] - URL to resume
   * @param {string} [data.portfolioUrl] - URL to portfolio
   * @param {string} [data.linkedinUrl] - LinkedIn profile URL
   * @param {string} [data.coverLetter] - Cover letter text
   * @param {string} [data.referralSource] - How did you hear about us
   */
  apply: async (data) => {
    try {
      const response = await publicClient.post("careers/apply", data);
      return { response };
    } catch (err) {
      return { err };
    }
  },

  /**
   * Get application status by ID
   * @param {string} applicationId - The application ID
   * @param {string} email - The applicant's email
   */
  getStatus: async ({ applicationId, email }) => {
    try {
      const response = await publicClient.get(
        `careers/application/${applicationId}`,
        { params: { email } }
      );
      return { response };
    } catch (err) {
      return { err };
    }
  },

  /**
   * Get all applications for a user
   * @param {string} email - User's email address
   */
  getUserApplications: async (email) => {
    try {
      const response = await publicClient.get("careers/applications", {
        params: { email },
      });
      return { response };
    } catch (err) {
      return { err };
    }
  },

  /**
   * Withdraw an application
   * @param {string} applicationId - The application ID
   * @param {string} email - The applicant's email
   */
  withdraw: async ({ applicationId, email }) => {
    try {
      const response = await publicClient.post(
        `careers/withdraw/${applicationId}`,
        { email }
      );
      return { response };
    } catch (err) {
      return { err };
    }
  },
};

export default careersApi;

