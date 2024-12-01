import React, { useEffect, useState } from "react";
import feedbackApi from "../../api/modules/feedback.api"; // Adjust path as needed
import { Box, CircularProgress, Typography } from "@mui/material";

const FeedbackList = () => {
  const [feedbackList, setFeedbackList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        const response = await feedbackApi.fetchFeedback();
        console.log("recived feedbacks: ", response)
        setFeedbackList(response); // Ensure the response structure matches
      } catch (err) {
        setError("Failed to fetch feedback");
      } finally {
        setLoading(false);
      }
    };
    fetchFeedback();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  return (
    <Box>
      {feedbackList.map((feedback) => (
        <Box key={feedback.id} p={2} border="1px solid #ccc" borderRadius="8px" mb={2}>
          <Typography variant="h6">{feedback.user}</Typography>
          <Typography>{feedback.feedback}</Typography>
          <Typography variant="caption" color="textSecondary">
            {new Date(feedback.createdAt).toLocaleString()}
          </Typography>
        </Box>
      ))}
    </Box>
  );
};

export default FeedbackList;
