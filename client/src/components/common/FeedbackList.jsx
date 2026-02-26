import React, { useEffect, useState } from "react";
import feedbackApi from "../../api/modules/feedback.api";
import { Box, CircularProgress, Typography, Paper, Avatar, Rating, Pagination, alpha, useTheme } from "@mui/material";
import { Person as PersonIcon } from "@mui/icons-material";

const FeedbackList = () => {
  const theme = useTheme();
  const [feedbackList, setFeedbackList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchFeedback = async () => {
      setLoading(true);
      try {
        const response = await feedbackApi.fetchFeedback(page);
        console.log("Received feedbacks:", response);
        
        // Handle different response structures
        if (response?.err) {
          setError(response.err.message || "Failed to fetch feedback");
          setFeedbackList([]);
        } else if (response?.feedback) {
          // Backend returns { total, page, limit, feedback: [...] }
          setFeedbackList(response.feedback || []);
          const total = response.total || 0;
          const limit = response.limit || 10;
          setTotalPages(Math.ceil(total / limit));
        } else if (Array.isArray(response)) {
          // Direct array response
          setFeedbackList(response);
        } else {
          // Unexpected response format
          console.warn("Unexpected feedback response format:", response);
          setFeedbackList([]);
        }
      } catch (err) {
        console.error("Error fetching feedback:", err);
        setError("Failed to fetch feedback");
        setFeedbackList([]);
      } finally {
        setLoading(false);
      }
    };
    fetchFeedback();
  }, [page]);

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (feedbackList.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <Typography color="text.secondary">No feedback yet. Be the first to share your thoughts!</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {feedbackList.map((feedback, index) => (
          <Paper
            key={feedback._id || feedback.id || index}
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 2,
              bgcolor: alpha(theme.palette.background.paper, 0.6),
              border: `1px solid ${theme.palette.divider}`,
              transition: "all 0.2s ease",
              "&:hover": {
                bgcolor: alpha(theme.palette.background.paper, 0.9),
                borderColor: theme.palette.primary.main,
              },
            }}
          >
            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
              <Avatar
                sx={{
                  bgcolor: theme.palette.primary.main,
                  width: 40,
                  height: 40,
                }}
              >
                {feedback.user?.[0]?.toUpperCase() || <PersonIcon />}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    {feedback.user || "Anonymous"}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {feedback.createdAt ? new Date(feedback.createdAt).toLocaleDateString() : ""}
                  </Typography>
                </Box>
                {feedback.rating && (
                  <Rating value={feedback.rating} readOnly size="small" sx={{ mb: 1 }} />
                )}
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                  {feedback.feedback}
                </Typography>
              </Box>
            </Box>
          </Paper>
        ))}
      </Box>
      
      {totalPages > 1 && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
            color="primary"
          />
        </Box>
      )}
    </Box>
  );
};

export default FeedbackList;
