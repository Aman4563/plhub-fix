/**
 * Newsletter API Module
 * Handles newsletter subscription operations
 */

import publicClient from "../client/public.client";

const newsletterEndpoints = {
  subscribe: "newsletter/subscribe",
  unsubscribe: "newsletter/unsubscribe",
  preferences: "newsletter/preferences",
  status: "newsletter/status",
};

const newsletterApi = {
  /**
   * Subscribe to newsletter
   * @param {Object} data - { email, source?, preferences? }
   */
  subscribe: async (data) => {
    try {
      const response = await publicClient.post(newsletterEndpoints.subscribe, data);
      return { response };
    } catch (err) {
      return { err };
    }
  },

  /**
   * Unsubscribe from newsletter
   * @param {Object} data - { email }
   */
  unsubscribe: async (data) => {
    try {
      const response = await publicClient.post(newsletterEndpoints.unsubscribe, data);
      return { response };
    } catch (err) {
      return { err };
    }
  },

  /**
   * Update subscription preferences
   * @param {Object} data - { email, preferences }
   */
  updatePreferences: async (data) => {
    try {
      const response = await publicClient.put(newsletterEndpoints.preferences, data);
      return { response };
    } catch (err) {
      return { err };
    }
  },

  /**
   * Check subscription status
   * @param {string} email
   */
  checkStatus: async (email) => {
    try {
      const response = await publicClient.get(newsletterEndpoints.status, {
        params: { email },
      });
      return { response };
    } catch (err) {
      return { err };
    }
  },
};

export default newsletterApi;

