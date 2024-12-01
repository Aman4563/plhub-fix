import privateClient from "../client/private.client";
import publicClient from "../client/public.client";

/**
 * Endpoints for user-related API operations.
 */
const userEndpoints = {
  signin: "user/signin", // Endpoint for signing in
  signup: "user/signup", // Endpoint for signing up
  googleSignin: "user/google-signin", // Endpoint for Google Sign-In
  forgotPassword: "user/forgot-password", // Endpoint for initiating password reset
  resetPassword: "user/reset-password", // Endpoint for resetting password
  getInfo: "user/info", // Endpoint for fetching user info
  passwordUpdate: "user/update-password", // Endpoint for updating password
};

/**
 * API methods for interacting with user-related endpoints.
 */
const userApi = {
  /**
   * Signs in a user with username and password.
   *
   * @param {Object} params - Login details.
   * @param {string} params.username - Username of the user.
   * @param {string} params.password - Password of the user.
   * @param {string} params.captchaToken - Captcha token for verification.
   * @returns {Promise<Object>} - API response or error.
   */
  signin: async ({ username, password, captchaToken }) => {
    try {
      const response = await publicClient.post(userEndpoints.signin, {
        username,
        password,
        captchaToken,
      });
      return { response };
    } catch (err) {
      return { err };
    }
  },

  /**
   * Signs up a new user.
   *
   * @param {Object} params - Signup details.
   * @param {string} params.username - Username for the new user.
   * @param {string} params.email - Email of the new user.
   * @param {string} params.password - Password for the new user.
   * @param {string} params.confirmPassword - Confirm password field.
   * @param {string} params.displayName - Display name of the new user.
   * @param {string} params.captchaToken - Captcha token for verification.
   * @returns {Promise<Object>} - API response or error.
   */
  signup: async ({
    username,
    email,
    password,
    confirmPassword,
    displayName,
    captchaToken,
  }) => {
    try {
      const response = await publicClient.post(userEndpoints.signup, {
        username,
        email,
        password,
        confirmPassword,
        displayName,
        captchaToken,
      });
      return { response };
    } catch (err) {
      return { err };
    }
  },

  /**
   * Signs in a user using Google authentication.
   *
   * @param {Object} params - Google Sign-In details.
   * @param {string} params.tokenId - Google authentication token ID.
   * @returns {Promise<Object>} - API response or error.
   */
  googleSignin: async ({ tokenId }) => {
    try {
      const response = await publicClient.post(userEndpoints.googleSignin, {
        tokenId,
      });
      return { response };
    } catch (err) {
      return { err };
    }
  },

  /**
   * Sends a forgot password request for the user.
   *
   * @param {Object} params - Details for the forgot password request.
   * @param {string} params.email - Email of the user requesting password reset.
   * @returns {Promise<Object>} - API response or error.
   */
  forgotPassword: async ({ email }) => {
    try {
      const response = await publicClient.post(userEndpoints.forgotPassword, {
        email,
      });
      return { response };
    } catch (err) {
      return { err };
    }
  },

  /**
   * Resets the user's password.
   *
   * @param {Object} params - Details for the password reset request.
   * @param {string} params.token - Reset token received via email.
   * @param {string} params.newPassword - New password for the user.
   * @returns {Promise<Object>} - API response or error.
   */
  resetPassword: async ({ token, newPassword }) => {
    try {
      const response = await publicClient.post(userEndpoints.resetPassword, {
        token,
        newPassword,
      });
      return { response };
    } catch (err) {
      return { err };
    }
  },

  /**
   * Fetches information about the authenticated user.
   *
   * @returns {Promise<Object>} - API response or error.
   */
  getInfo: async () => {
    try {
      const response = await privateClient.get(userEndpoints.getInfo);
      return { response };
    } catch (err) {
      return { err };
    }
  },

  /**
   * Updates the user's password.
   *
   * @param {Object} params - Password update details.
   * @param {string} params.password - Current password of the user.
   * @param {string} params.newPassword - New password for the user.
   * @param {string} params.confirmNewPassword - Confirm new password field.
   * @returns {Promise<Object>} - API response or error.
   */
  passwordUpdate: async ({ password, newPassword, confirmNewPassword }) => {
    try {
      const response = await privateClient.put(userEndpoints.passwordUpdate, {
        password,
        newPassword,
        confirmNewPassword,
      });
      return { response };
    } catch (err) {
      return { err };
    }
  },
};

export default userApi;
