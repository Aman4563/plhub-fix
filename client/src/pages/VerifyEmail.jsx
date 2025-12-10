import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  Box, 
  Container, 
  Typography, 
  CircularProgress, 
  Button,
  Paper,
  alpha,
  useTheme,
} from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import userApi from "../api/modules/user.api";

/**
 * VerifyEmail Page
 * Handles email verification when user clicks the verification link
 */
const VerifyEmail = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();

  const [status, setStatus] = useState("verifying"); // verifying, success, error
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus("error");
        setMessage("Invalid verification link. Please request a new verification email.");
        return;
      }

      try {
        const { response, err } = await userApi.verifyEmail(token);

        if (response) {
          setStatus("success");
          setMessage(response.message || "Your email has been verified successfully!");
        } else if (err) {
          setStatus("error");
          setMessage(err.message || "Email verification failed. The link may be invalid or expired.");
        }
      } catch (error) {
        setStatus("error");
        setMessage("An unexpected error occurred. Please try again later.");
      }
    };

    verifyEmail();
  }, [token]);

  const handleGoHome = () => {
    navigate("/");
  };

  const handleResendEmail = () => {
    navigate("/resend-verification");
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.background.default, 1)} 100%)`,
        py: 4,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, md: 5 },
            textAlign: "center",
            borderRadius: 3,
            backgroundColor: alpha(theme.palette.background.paper, 0.9),
            backdropFilter: "blur(10px)",
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          }}
        >
          {/* Loading State */}
          {status === "verifying" && (
            <>
              <CircularProgress 
                size={60} 
                thickness={4}
                sx={{ mb: 3, color: theme.palette.primary.main }}
              />
              <Typography variant="h5" gutterBottom fontWeight={600}>
                Verifying your email...
              </Typography>
              <Typography color="text.secondary">
                Please wait while we verify your email address.
              </Typography>
            </>
          )}

          {/* Success State */}
          {status === "success" && (
            <>
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: "50%",
                  backgroundColor: alpha(theme.palette.success.main, 0.1),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mx: "auto",
                  mb: 3,
                }}
              >
                <CheckCircleOutlineIcon 
                  sx={{ 
                    fontSize: 48, 
                    color: theme.palette.success.main,
                  }} 
                />
              </Box>
              <Typography variant="h5" gutterBottom fontWeight={600}>
                Email Verified Successfully
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 3 }}>
                {message}
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 3 }}>
                Your account is now fully activated. You can now enjoy all features of PLHub.
              </Typography>
              <Button
                variant="contained"
                size="large"
                onClick={handleGoHome}
                sx={{ 
                  px: 4,
                  py: 1.5,
                  borderRadius: 2,
                  textTransform: "none",
                  fontSize: "1rem",
                }}
              >
                Start Exploring
              </Button>
            </>
          )}

          {/* Error State */}
          {status === "error" && (
            <>
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: "50%",
                  backgroundColor: alpha(theme.palette.error.main, 0.1),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mx: "auto",
                  mb: 3,
                }}
              >
                <ErrorOutlineIcon 
                  sx={{ 
                    fontSize: 48, 
                    color: theme.palette.error.main,
                  }} 
                />
              </Box>
              <Typography variant="h5" gutterBottom fontWeight={600}>
                Verification Failed
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 3 }}>
                {message}
              </Typography>
              <Box sx={{ display: "flex", gap: 2, justifyContent: "center", flexWrap: "wrap" }}>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={handleResendEmail}
                  sx={{ 
                    px: 3,
                    py: 1.5,
                    borderRadius: 2,
                    textTransform: "none",
                    fontSize: "1rem",
                  }}
                >
                  Resend Email
                </Button>
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleGoHome}
                  sx={{ 
                    px: 3,
                    py: 1.5,
                    borderRadius: 2,
                    textTransform: "none",
                    fontSize: "1rem",
                  }}
                >
                  Go Home
                </Button>
              </Box>
            </>
          )}
        </Paper>
      </Container>
    </Box>
  );
};

export default VerifyEmail;

