// modules/feedback.js

import privateClient from "../client/private.client";

const feedbackEndpoints = {
  submit: "feedback/submit-feedback", // Modify the endpoint as per your backend route
  fetch: "feedback/submit-feedback", // Modify the endpoint as per your backend route
};

const feedbackApi = {
  submitFeedback: async ({ user, feedback }) => {
    try {
      const response = await privateClient.post(feedbackEndpoints.submit, { user, feedback });
      return { response };
    } catch (err) {
      return { err };
    }
  },
  fetchFeedback: async () => {
    try {
      const response = await privateClient.get(feedbackEndpoints.fetch,{});
      return { response };
    } catch (err) {
      return { err };
    }
  },
};

export default feedbackApi;


// // feedback.api.js

// import privateClient from "../client/private.client";

// const feedbackEndpoints = {
//   list: "/feedback-list",
//   submit: "/submit-feedback",
// };

// const feedbackApi = {
//   fetchFeedbackList: async () => {
//     try {
//       const response = await privateClient.get(feedbackEndpoints.list);
//       return { response };
//     } catch (err) {
//       return { err };
//     }
//   },

//   submitFeedback: async (feedbackData) => {
//     try {
//       const response = await privateClient.post(feedbackEndpoints.submit, feedbackData);
//       return { response };
//     } catch (err) {
//       return { err };
//     }
//   },
// };

// export default feedbackApi;

