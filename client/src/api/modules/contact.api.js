/**
 * Contact API Module
 * Handles contact form submissions
 */

import publicClient from "../client/public.client";

const contactEndpoints = {
  submit: "contact/submit",
  ticket: (ticketNumber) => `contact/ticket/${ticketNumber}`,
  tickets: "contact/tickets",
};

const contactApi = {
  /**
   * Submit contact form
   * @param {Object} data - { name, email, subject, category, message }
   */
  submit: async (data) => {
    try {
      const response = await publicClient.post(contactEndpoints.submit, data);
      return { response };
    } catch (err) {
      return { err };
    }
  },

  /**
   * Get ticket status
   * @param {string} ticketNumber
   * @param {string} email
   */
  getTicketStatus: async (ticketNumber, email) => {
    try {
      const response = await publicClient.get(contactEndpoints.ticket(ticketNumber), {
        params: { email },
      });
      return { response };
    } catch (err) {
      return { err };
    }
  },

  /**
   * Get user's tickets
   * @param {string} email
   */
  getUserTickets: async (email) => {
    try {
      const response = await publicClient.get(contactEndpoints.tickets, {
        params: { email },
      });
      return { response };
    } catch (err) {
      return { err };
    }
  },
};

export default contactApi;

