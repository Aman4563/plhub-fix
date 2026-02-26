/**
 * PasswordUpdate Component
 * Allows users to securely update their password with:
 * - Real-time validation feedback
 * - Password strength indicator
 * - Password visibility toggles
 * - Confirmation dialog before update
 * - Clear user data on successful update
 */

import { LoadingButton } from "@mui/lab";
import {
  Box,
  Stack,
  TextField,
  Typography,
  IconButton,
  InputAdornment,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  LinearProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert,
  alpha,
  useTheme,
  Divider,
  Fade,
  Zoom,
  CircularProgress,
  keyframes,
} from "@mui/material";
import { useFormik } from "formik";
import * as Yup from "yup";
import Container from "../components/common/Container";
import uiConfigs from "../configs/ui.configs";
import { useState, useMemo, useCallback, useEffect } from "react";
import userApi from "../api/modules/user.api";
import { toast } from "react-toastify";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logoutUser, setListFavorites } from "../redux/features/userSlice";
import { setAuthModalOpen } from "../redux/features/authModalSlice";
import { clearWatchlist } from "../redux/features/watchlistSlice";

// Icons
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import LockResetIcon from "@mui/icons-material/LockReset";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import SecurityIcon from "@mui/icons-material/Security";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import KeyIcon from "@mui/icons-material/Key";

// Success animation keyframes
const successPulse = keyframes`
  0% {
    transform: scale(0);
    opacity: 0;
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
`;

/**
 * SuccessOverlay Component
 * Displays a success animation before redirecting
 */
const SuccessOverlay = ({ open, message }) => {
  const theme = useTheme();

  if (!open) return null;

  return (
    <Fade in={open}>
      <Box
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          bgcolor: alpha(theme.palette.background.default, 0.95),
          backdropFilter: "blur(8px)",
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Zoom in={open} style={{ transitionDelay: "200ms" }}>
          <Box
            sx={{
              width: 120,
              height: 120,
              borderRadius: "50%",
              bgcolor: alpha(theme.palette.success.main, 0.1),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              animation: `${successPulse} 0.6s ease-out`,
              mb: 3,
            }}
          >
            <CheckCircleOutlineIcon
              sx={{
                fontSize: 80,
                color: "success.main",
              }}
            />
          </Box>
        </Zoom>
        
        <Fade in={open} style={{ transitionDelay: "500ms" }}>
          <Typography
            variant="h5"
            fontWeight="600"
            color="text.primary"
            textAlign="center"
            sx={{ mb: 1 }}
          >
            Password Updated!
          </Typography>
        </Fade>
        
        <Fade in={open} style={{ transitionDelay: "700ms" }}>
          <Typography
            variant="body1"
            color="text.secondary"
            textAlign="center"
            sx={{ mb: 3, maxWidth: 300 }}
          >
            {message || "Redirecting to sign in..."}
          </Typography>
        </Fade>
        
        <Fade in={open} style={{ transitionDelay: "900ms" }}>
          <CircularProgress size={24} color="primary" />
        </Fade>
      </Box>
    </Fade>
  );
};

/**
 * Password requirements configuration
 */
const PASSWORD_REQUIREMENTS = [
  { key: "length", label: "At least 8 characters", test: (pwd) => pwd.length >= 8 },
  { key: "lowercase", label: "One lowercase letter (a-z)", test: (pwd) => /[a-z]/.test(pwd) },
  { key: "uppercase", label: "One uppercase letter (A-Z)", test: (pwd) => /[A-Z]/.test(pwd) },
  { key: "number", label: "One number (0-9)", test: (pwd) => /\d/.test(pwd) },
  { key: "special", label: "One special character (!@#$%^&*)", test: (pwd) => /[!@#$%^&*(),.?":{}|<>]/.test(pwd) },
];

/**
 * Calculate password strength (0-100)
 */
const calculatePasswordStrength = (password) => {
  if (!password) return 0;
  
  let score = 0;
  
  // Length scoring
  if (password.length >= 8) score += 20;
  if (password.length >= 12) score += 10;
  if (password.length >= 16) score += 10;
  
  // Character variety scoring
  if (/[a-z]/.test(password)) score += 15;
  if (/[A-Z]/.test(password)) score += 15;
  if (/\d/.test(password)) score += 15;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 15;
  
  return Math.min(100, score);
};

/**
 * Get strength label and color based on score
 */
const getStrengthInfo = (score) => {
  if (score < 30) return { label: "Very Weak", color: "error" };
  if (score < 50) return { label: "Weak", color: "warning" };
  if (score < 70) return { label: "Fair", color: "info" };
  if (score < 90) return { label: "Strong", color: "success" };
  return { label: "Very Strong", color: "success" };
};

/**
 * PasswordStrengthIndicator Component
 */
const PasswordStrengthIndicator = ({ password }) => {
  const theme = useTheme();
  const strength = useMemo(() => calculatePasswordStrength(password), [password]);
  const strengthInfo = useMemo(() => getStrengthInfo(strength), [strength]);

  if (!password) return null;

  return (
    <Box sx={{ mt: 1 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
        <Typography variant="caption" color="text.secondary">
          Password Strength
        </Typography>
        <Typography 
          variant="caption" 
          fontWeight="600"
          color={`${strengthInfo.color}.main`}
        >
          {strengthInfo.label}
        </Typography>
      </Stack>
      <LinearProgress
        variant="determinate"
        value={strength}
        color={strengthInfo.color}
        sx={{
          height: 6,
          borderRadius: 3,
          bgcolor: alpha(theme.palette.divider, 0.3),
        }}
      />
    </Box>
  );
};

/**
 * PasswordRequirements Component
 */
const PasswordRequirements = ({ password }) => {
  const theme = useTheme();

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        mt: 2,
        bgcolor: alpha(theme.palette.background.paper, 0.6),
        borderRadius: 2,
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
      }}
    >
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
        Password Requirements
      </Typography>
      <List dense disablePadding>
        {PASSWORD_REQUIREMENTS.map((req) => {
          const isMet = password ? req.test(password) : false;
          return (
            <ListItem key={req.key} disablePadding sx={{ py: 0.25 }}>
              <ListItemIcon sx={{ minWidth: 28 }}>
                {isMet ? (
                  <CheckCircleIcon sx={{ fontSize: 18, color: "success.main" }} />
                ) : (
                  <RadioButtonUncheckedIcon sx={{ fontSize: 18, color: "text.disabled" }} />
                )}
              </ListItemIcon>
              <ListItemText
                primary={req.label}
                primaryTypographyProps={{
                  variant: "body2",
                  color: isMet ? "success.main" : "text.secondary",
                  fontWeight: isMet ? 500 : 400,
                }}
              />
            </ListItem>
          );
        })}
      </List>
    </Paper>
  );
};

/**
 * PasswordUpdate Component
 */
const PasswordUpdate = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // State
  const [onRequest, setOnRequest] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Form validation schema matching backend
  const validationSchema = useMemo(() => 
    Yup.object({
      password: Yup.string()
        .min(8, "Password must be at least 8 characters")
        .max(128, "Password cannot exceed 128 characters")
        .required("Current password is required"),
      newPassword: Yup.string()
        .min(8, "Password must be at least 8 characters")
        .max(128, "Password cannot exceed 128 characters")
        .matches(/[a-z]/, "Must contain at least one lowercase letter")
        .matches(/[A-Z]/, "Must contain at least one uppercase letter")
        .matches(/\d/, "Must contain at least one number")
        .matches(/[!@#$%^&*(),.?":{}|<>]/, "Must contain at least one special character")
        .notOneOf([Yup.ref("password")], "New password must be different from current password")
        .required("New password is required"),
      confirmNewPassword: Yup.string()
        .oneOf([Yup.ref("newPassword")], "Passwords must match")
        .required("Please confirm your new password"),
    }),
  []);

  // Formik form handling
  const form = useFormik({
    initialValues: {
      password: "",
      newPassword: "",
      confirmNewPassword: "",
    },
    validationSchema,
    onSubmit: () => setConfirmDialog(true),
  });

  /**
   * Handles password update after confirmation
   */
  const handleConfirmedUpdate = useCallback(async () => {
    setConfirmDialog(false);
    if (onRequest) return;

    setOnRequest(true);
    const { response, err } = await userApi.passwordUpdate(form.values);
    setOnRequest(false);

    if (err) {
      toast.error(err.message || "Failed to update password");
      return;
    }

    if (response) {
      // Show success animation
      setSuccessMessage(response.message || "Please sign in with your new password.");
      setShowSuccess(true);
      
      // Clear all user data
      form.resetForm();
      dispatch(logoutUser());
      dispatch(setListFavorites([]));
      dispatch(clearWatchlist());
    }
  }, [form, onRequest, dispatch]);

  // Handle redirect after success animation
  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => {
        navigate("/");
        dispatch(setAuthModalOpen(true));
        toast.success("Password updated! Please sign in with your new password.");
      }, 2500); // Wait 2.5 seconds to show the animation

      return () => clearTimeout(timer);
    }
  }, [showSuccess, navigate, dispatch]);

  /**
   * Handle cancel button click
   */
  const handleCancel = useCallback(() => {
    if (form.dirty) {
      if (window.confirm("Are you sure you want to discard your changes?")) {
        navigate(-1);
      }
    } else {
      navigate(-1);
    }
  }, [form.dirty, navigate]);

  // Check if all requirements are met
  const allRequirementsMet = useMemo(() => 
    PASSWORD_REQUIREMENTS.every((req) => req.test(form.values.newPassword)),
  [form.values.newPassword]);

  return (
    <Box sx={{ ...uiConfigs.style.mainContent }}>
      <Container header="Update Password">
        {/* Centered Content Wrapper */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-start",
            width: "100%",
            px: { xs: 2, sm: 3, md: 4 },
          }}
        >
          <Box
            sx={{
              width: "100%",
              maxWidth: { xs: "100%", sm: 480 },
            }}
          >
            {/* Security Notice */}
            <Alert
              severity="info"
              icon={<SecurityIcon />}
              sx={{
                mb: 3,
                borderRadius: 2,
                "& .MuiAlert-message": { width: "100%" },
              }}
            >
              <Typography variant="body2">
                For your security, you'll need to sign in again after changing your password.
              </Typography>
            </Alert>

            {/* Form Container */}
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2, sm: 3 },
                bgcolor: alpha(theme.palette.background.paper, 0.6),
                backdropFilter: "blur(8px)",
                borderRadius: 3,
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              }}
            >
            <Box component="form" onSubmit={form.handleSubmit}>
              <Stack spacing={3}>
                {/* Current Password */}
                <TextField
                  type={showCurrentPassword ? "text" : "password"}
                  name="password"
                  label="Current Password"
                  placeholder="Enter your current password"
                  fullWidth
                  value={form.values.password}
                  onChange={form.handleChange}
                  onBlur={form.handleBlur}
                  error={form.touched.password && Boolean(form.errors.password)}
                  helperText={form.touched.password && form.errors.password}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlinedIcon color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          edge="end"
                          size="small"
                          aria-label={showCurrentPassword ? "Hide password" : "Show password"}
                        >
                          {showCurrentPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <Divider sx={{ my: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    New Password
                  </Typography>
                </Divider>

                {/* New Password */}
                <Box>
                  <TextField
                    type={showNewPassword ? "text" : "password"}
                    name="newPassword"
                    label="New Password"
                    placeholder="Enter your new password"
                    fullWidth
                    value={form.values.newPassword}
                    onChange={form.handleChange}
                    onBlur={form.handleBlur}
                    error={form.touched.newPassword && Boolean(form.errors.newPassword)}
                    helperText={form.touched.newPassword && form.errors.newPassword}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <KeyIcon color="action" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            edge="end"
                            size="small"
                            aria-label={showNewPassword ? "Hide password" : "Show password"}
                          >
                            {showNewPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                  <PasswordStrengthIndicator password={form.values.newPassword} />
                </Box>

                {/* Confirm New Password */}
                <TextField
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmNewPassword"
                  label="Confirm New Password"
                  placeholder="Re-enter your new password"
                  fullWidth
                  value={form.values.confirmNewPassword}
                  onChange={form.handleChange}
                  onBlur={form.handleBlur}
                  error={form.touched.confirmNewPassword && Boolean(form.errors.confirmNewPassword)}
                  helperText={form.touched.confirmNewPassword && form.errors.confirmNewPassword}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockResetIcon color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          edge="end"
                          size="small"
                          aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                        >
                          {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                {/* Password Requirements */}
                <PasswordRequirements password={form.values.newPassword} />

                {/* Action Buttons */}
                <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                  <Button
                    variant="outlined"
                    startIcon={<ArrowBackIcon />}
                    onClick={handleCancel}
                    disabled={onRequest}
                    sx={{ flex: 1 }}
                  >
                    Cancel
                  </Button>
                  <LoadingButton
                    type="submit"
                    variant="contained"
                    loading={onRequest}
                    disabled={!form.isValid || !form.dirty || !allRequirementsMet}
                    startIcon={<SecurityIcon />}
                    sx={{ flex: 1 }}
                  >
                    Update Password
                  </LoadingButton>
                </Stack>

                {/* Forgot Password Link */}
                <Box sx={{ textAlign: "center", mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Forgot your current password?{" "}
                    <Typography
                      component={RouterLink}
                      to="/help"
                      variant="body2"
                      color="primary"
                      sx={{ textDecoration: "none", fontWeight: 500 }}
                    >
                      Visit Help Center
                    </Typography>
                  </Typography>
                </Box>
              </Stack>
            </Box>
          </Paper>
          </Box>
        </Box>
      </Container>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog}
        onClose={() => !onRequest && setConfirmDialog(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            bgcolor: theme.palette.background.paper,
          },
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <WarningAmberIcon color="warning" />
            <span>Confirm Password Change</span>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to update your password? You will be logged out and need to sign in again with your new password.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setConfirmDialog(false)}
            disabled={onRequest}
          >
            Cancel
          </Button>
          <LoadingButton
            onClick={handleConfirmedUpdate}
            loading={onRequest}
            variant="contained"
            color="primary"
            startIcon={<SecurityIcon />}
          >
            Yes, Update Password
          </LoadingButton>
        </DialogActions>
      </Dialog>

      {/* Success Animation Overlay */}
      <SuccessOverlay open={showSuccess} message={successMessage} />
    </Box>
  );
};

export default PasswordUpdate;
