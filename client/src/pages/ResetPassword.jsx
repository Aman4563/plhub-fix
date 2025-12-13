import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  alpha,
  useTheme,
  InputAdornment,
  IconButton,
  Alert,
  LinearProgress,
} from "@mui/material";
import { LoadingButton } from "@mui/lab";
import {
  Visibility,
  VisibilityOff,
  CheckCircleOutline,
  LockReset,
  Check,
} from "@mui/icons-material";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import userApi from "../api/modules/user.api";

/**
 * Password Strength Indicator
 */
const PasswordStrengthIndicator = ({ password }) => {
  const theme = useTheme();

  const checks = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /\d/.test(password),
  };

  const passedChecks = Object.values(checks).filter(Boolean).length;
  const strength = passedChecks / 4;

  const getStrengthInfo = () => {
    if (strength <= 0.25) return { label: "Weak", color: theme.palette.error.main };
    if (strength <= 0.5) return { label: "Fair", color: theme.palette.warning.main };
    if (strength <= 0.75) return { label: "Good", color: theme.palette.info.main };
    return { label: "Strong", color: theme.palette.success.main };
  };

  const { label, color } = getStrengthInfo();

  if (!password) return null;

  return (
    <Box
      sx={{
        width: "100%",
        p: 2,
        borderRadius: 2,
        backgroundColor: alpha(theme.palette.background.default, 0.5),
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        mt: 2,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1.5 }}>
        <LinearProgress
          variant="determinate"
          value={strength * 100}
          sx={{
            flex: 1,
            height: 6,
            borderRadius: 3,
            backgroundColor: alpha(theme.palette.divider, 0.2),
            "& .MuiLinearProgress-bar": { borderRadius: 3, backgroundColor: color },
          }}
        />
        <Typography variant="caption" sx={{ color, fontWeight: 600, fontSize: "0.85rem", minWidth: 55 }}>
          {label}
        </Typography>
      </Box>
      <Box sx={{ display: "flex", gap: 2.5, flexWrap: "wrap" }}>
        {[
          { key: "length", label: "8+ chars" },
          { key: "lowercase", label: "a-z" },
          { key: "uppercase", label: "A-Z" },
          { key: "number", label: "0-9" },
        ].map(({ key, label: checkLabel }) => (
          <Box
            key={key}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              color: checks[key] ? theme.palette.success.main : alpha(theme.palette.text.primary, 0.4),
              fontSize: "0.85rem",
            }}
          >
            <Check sx={{ fontSize: 16 }} />
            {checkLabel}
          </Box>
        ))}
      </Box>
    </Box>
  );
};

/**
 * ResetPassword Page
 * Handles password reset when user clicks the reset link from email
 */
const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();

  const [status, setStatus] = useState("form"); // form, success, error
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const resetForm = useFormik({
    initialValues: {
      newPassword: "",
      confirmPassword: "",
    },
    validationSchema: Yup.object({
      newPassword: Yup.string()
        .min(8, "Password must be at least 8 characters")
        .max(128, "Password is too long")
        .matches(/[a-z]/, "Must contain at least one lowercase letter")
        .matches(/[A-Z]/, "Must contain at least one uppercase letter")
        .matches(/\d/, "Must contain at least one number")
        .required("New password is required"),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref("newPassword")], "Passwords must match")
        .required("Please confirm your password"),
    }),
    onSubmit: async (values) => {
      if (!token) {
        setErrorMessage("Invalid reset link. Please request a new password reset.");
        setStatus("error");
        return;
      }

      setIsLoading(true);
      setErrorMessage("");

      try {
        const { response, err } = await userApi.resetPassword({
          token,
          newPassword: values.newPassword,
        });

        if (response) {
          setStatus("success");
          toast.success("Password reset successful!");
        } else if (err) {
          setErrorMessage(err.message || "Failed to reset password. The link may be invalid or expired.");
          setStatus("error");
        }
      } catch (error) {
        setErrorMessage("An unexpected error occurred. Please try again.");
        setStatus("error");
      } finally {
        setIsLoading(false);
      }
    },
  });

  const handleGoToSignIn = () => {
    navigate("/");
  };

  const handleRequestNewLink = () => {
    navigate("/");
    // Could also open auth modal with forgot password state
  };

  const passwordsMatch =
    resetForm.values.newPassword &&
    resetForm.values.confirmPassword &&
    resetForm.values.newPassword === resetForm.values.confirmPassword;

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
          {/* Form State */}
          {status === "form" && (
            <>
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: "50%",
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mx: "auto",
                  mb: 3,
                }}
              >
                <LockReset
                  sx={{
                    fontSize: 42,
                    color: theme.palette.primary.main,
                  }}
                />
              </Box>
              <Typography variant="h5" gutterBottom fontWeight={600}>
                Reset Your Password
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 3 }}>
                Enter your new password below. Make sure it's strong and unique.
              </Typography>

              <Box
                component="form"
                onSubmit={resetForm.handleSubmit}
                sx={{ textAlign: "left" }}
              >
                <TextField
                  fullWidth
                  type={showPassword ? "text" : "password"}
                  label="New Password"
                  name="newPassword"
                  value={resetForm.values.newPassword}
                  onChange={resetForm.handleChange}
                  onBlur={resetForm.handleBlur}
                  error={resetForm.touched.newPassword && Boolean(resetForm.errors.newPassword)}
                  helperText={resetForm.touched.newPassword && resetForm.errors.newPassword}
                  autoComplete="new-password"
                  sx={{ mb: 2 }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          tabIndex={-1}
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  fullWidth
                  type={showConfirmPassword ? "text" : "password"}
                  label="Confirm New Password"
                  name="confirmPassword"
                  value={resetForm.values.confirmPassword}
                  onChange={resetForm.handleChange}
                  onBlur={resetForm.handleBlur}
                  error={resetForm.touched.confirmPassword && Boolean(resetForm.errors.confirmPassword)}
                  helperText={
                    (resetForm.touched.confirmPassword && resetForm.errors.confirmPassword) ||
                    (passwordsMatch && (
                      <Typography component="span" sx={{ color: "success.main", fontSize: "0.8rem" }}>
                        ✓ Passwords match
                      </Typography>
                    ))
                  }
                  autoComplete="new-password"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          edge="end"
                          tabIndex={-1}
                        >
                          {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <PasswordStrengthIndicator password={resetForm.values.newPassword} />

                {errorMessage && (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    {errorMessage}
                  </Alert>
                )}

                <LoadingButton
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  loading={isLoading}
                  sx={{
                    mt: 3,
                    py: 1.5,
                    borderRadius: 2,
                    textTransform: "none",
                    fontSize: "1rem",
                  }}
                >
                  Reset Password
                </LoadingButton>
              </Box>
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
                <CheckCircleOutline
                  sx={{
                    fontSize: 48,
                    color: theme.palette.success.main,
                  }}
                />
              </Box>
              <Typography variant="h5" gutterBottom fontWeight={600}>
                Password Reset Successful
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 3 }}>
                Your password has been reset successfully. You can now sign in with your new password.
              </Typography>
              <Button
                variant="contained"
                size="large"
                onClick={handleGoToSignIn}
                sx={{
                  px: 4,
                  py: 1.5,
                  borderRadius: 2,
                  textTransform: "none",
                  fontSize: "1rem",
                }}
              >
                Sign In
              </Button>
            </>
          )}

          {/* Error State */}
          {status === "error" && !resetForm.values.newPassword && (
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
                <LockReset
                  sx={{
                    fontSize: 48,
                    color: theme.palette.error.main,
                  }}
                />
              </Box>
              <Typography variant="h5" gutterBottom fontWeight={600}>
                Reset Link Invalid
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 3 }}>
                {errorMessage || "This password reset link is invalid or has expired."}
              </Typography>
              <Box sx={{ display: "flex", gap: 2, justifyContent: "center", flexWrap: "wrap" }}>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={handleRequestNewLink}
                  sx={{
                    px: 3,
                    py: 1.5,
                    borderRadius: 2,
                    textTransform: "none",
                    fontSize: "1rem",
                  }}
                >
                  Request New Link
                </Button>
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleGoToSignIn}
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

export default ResetPassword;

