/**
 * ChatbotErrorBoundary
 * Error boundary specifically for the AI chatbot component
 * Catches JavaScript errors and displays a fallback UI
 */

import { Component } from "react";
import { Box, Typography, Button, Paper, alpha } from "@mui/material";
import { Refresh as RefreshIcon, SmartToy as BotIcon } from "@mui/icons-material";

class ChatbotErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    // Log error to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("Chatbot Error:", error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    // Call optional onReset callback
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      const { t } = this.props;
      
      return (
        <Paper
          elevation={8}
          sx={{
            position: "fixed",
            bottom: { xs: 0, sm: 24 },
            right: { xs: 0, sm: 24 },
            width: { xs: "100%", sm: 400 },
            height: { xs: "100vh", sm: 600 },
            maxHeight: { xs: "100vh", sm: "85vh" },
            borderRadius: { xs: 0, sm: 3 },
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            zIndex: 1300,
            bgcolor: "background.default",
            border: (theme) => `1px solid ${theme.palette.divider}`,
          }}
        >
          {/* Header */}
          <Box
            sx={{
              p: 2,
              background: (theme) =>
                `linear-gradient(135deg, ${theme.palette.error.main} 0%, ${theme.palette.error.dark} 100%)`,
              color: "#fff",
              display: "flex",
              alignItems: "center",
              gap: 1.5,
            }}
          >
            <BotIcon />
            <Typography variant="subtitle1" fontWeight={600}>
              {t?.("chatbot.error.title") || "Something went wrong"}
            </Typography>
          </Box>

          {/* Error Content */}
          <Box
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              p: 3,
              textAlign: "center",
            }}
          >
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                bgcolor: (theme) => alpha(theme.palette.error.main, 0.1),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mb: 2,
              }}
            >
              <BotIcon sx={{ fontSize: 40, color: "error.main" }} />
            </Box>

            <Typography variant="h6" gutterBottom>
              {t?.("chatbot.error.title") || "Oops! Something went wrong"}
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mb: 3, maxWidth: 280 }}
            >
              {t?.("chatbot.error.description") ||
                "The chat encountered an error. Please try again."}
            </Typography>

            {process.env.NODE_ENV === "development" && this.state.error && (
              <Paper
                variant="outlined"
                sx={{
                  p: 1.5,
                  mb: 2,
                  maxWidth: "100%",
                  overflow: "auto",
                  bgcolor: (theme) => alpha(theme.palette.error.main, 0.05),
                }}
              >
                <Typography
                  variant="caption"
                  component="pre"
                  sx={{ fontFamily: "monospace", whiteSpace: "pre-wrap" }}
                >
                  {this.state.error.toString()}
                </Typography>
              </Paper>
            )}

            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={this.handleReset}
              sx={{
                bgcolor: "primary.main",
                "&:hover": { bgcolor: "primary.dark" },
              }}
            >
              {t?.("chatbot.error.tryAgain") || "Try Again"}
            </Button>
          </Box>
        </Paper>
      );
    }

    return this.props.children;
  }
}

export default ChatbotErrorBoundary;

