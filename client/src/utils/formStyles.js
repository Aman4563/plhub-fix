/**
 * Shared Form Styles Utility
 * Centralized styles for authentication forms
 */

import { alpha } from "@mui/material";

// Constants
export const GOOGLE_BUTTON_TIMEOUT = 3000;

/**
 * Input field styles - Consistent sizing
 */
export const getInputSx = (theme, isDark = true) => ({
  width: "100%",
  "& .MuiOutlinedInput-root": {
    borderRadius: 2,
    backgroundColor: alpha(theme.palette.background.paper, isDark ? 0.6 : 0.9),
    border: `1px solid ${alpha(isDark ? "#fff" : "#000", 0.12)}`,
    transition: "all 0.2s ease",
    minHeight: 52,
    "&:hover": {
      borderColor: alpha(isDark ? "#fff" : "#000", 0.25),
      backgroundColor: alpha(theme.palette.background.paper, isDark ? 0.7 : 0.95),
    },
    "&.Mui-focused": {
      borderColor: theme.palette.primary.main,
      backgroundColor: alpha(theme.palette.background.paper, isDark ? 0.8 : 1),
      outline: `2px solid ${alpha(theme.palette.primary.main, 0.25)}`,
      outlineOffset: "1px",
    },
    "&.Mui-error": {
      borderColor: theme.palette.error.main,
    },
  },
  "& .MuiOutlinedInput-notchedOutline": {
    border: "none",
  },
  "& .MuiInputBase-input": {
    fontSize: "1rem",
    py: 1.75,
    px: 1.75,
    color: isDark ? "#fff" : theme.palette.text.primary,
  },
  "& .MuiInputLabel-root": {
    fontSize: "1rem",
    color: alpha(isDark ? "#fff" : "#000", 0.6),
    "&.Mui-focused": {
      color: theme.palette.primary.main,
    },
    "&.Mui-error": {
      color: theme.palette.error.main,
    },
  },
  "& .MuiFormHelperText-root": {
    fontSize: "0.8rem",
    mt: 0.75,
    ml: 0.5,
  },
});

/**
 * Primary button styles - Full width consistent
 */
export const getPrimaryButtonSx = (theme) => ({
  mt: 3,
  py: 1.75,
  minHeight: 52,
  borderRadius: 2,
  fontWeight: 600,
  fontSize: "1.05rem",
  textTransform: "none",
  width: "100%",
  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
  boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.4)}`,
  transition: "all 0.25s ease",
  "&:hover": {
    background: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 100%)`,
    boxShadow: `0 6px 28px ${alpha(theme.palette.primary.main, 0.5)}`,
    transform: "translateY(-1px)",
  },
  "&:active": {
    transform: "translateY(0)",
  },
  "&.Mui-disabled": {
    background: alpha("#fff", 0.1),
    color: alpha("#fff", 0.4),
    boxShadow: "none",
  },
});

/**
 * Link button styles
 */
export const getLinkButtonSx = (theme) => ({
  fontWeight: 600,
  textTransform: "none",
  p: 0,
  minWidth: "auto",
  fontSize: "0.95rem",
  color: theme.palette.primary.main,
  "&:hover": {
    background: "transparent",
    textDecoration: "underline",
  },
});

/**
 * Alert styles
 */
export const getAlertSx = (theme) => ({
  borderRadius: 2,
  py: 1.5,
  px: 2,
  width: "100%",
  "& .MuiAlert-message": {
    fontSize: "0.9rem",
  },
  "& .MuiAlert-icon": {
    fontSize: "1.25rem",
  },
  backgroundColor: alpha(theme.palette.error.main, 0.9),
});

/**
 * Divider styles
 */
export const getDividerSx = () => ({
  my: 3,
  width: "100%",
  "&::before, &::after": {
    borderColor: alpha("#fff", 0.12),
  },
});

/**
 * Divider text styles
 */
export const getDividerTextSx = () => ({
  color: alpha("#fff", 0.65),
  fontSize: "0.9rem",
  px: 2,
  fontWeight: 500,
});

/**
 * Switch auth container styles
 */
export const getSwitchAuthContainerSx = () => ({
  textAlign: "center",
  mt: 3,
  pt: 2.5,
  width: "100%",
  borderTop: `1px solid ${alpha("#fff", 0.08)}`,
});

/**
 * Switch auth text styles
 */
export const getSwitchAuthTextSx = () => ({
  color: alpha("#fff", 0.65),
  fontSize: "1rem",
});

/**
 * Checkbox styles
 */
export const getCheckboxSx = (theme) => ({
  color: alpha("#fff", 0.5),
  "&.Mui-checked": {
    color: theme.palette.primary.main,
  },
  "& .MuiSvgIcon-root": {
    fontSize: 22,
  },
});

/**
 * Password helper texts
 */
export const passwordHelperText = {
  default: "Use 8+ characters with uppercase, lowercase, and numbers",
  weak: "Password is too weak. Add more variety.",
  fair: "Getting better. Try adding more character types.",
  good: "Good password! Consider making it longer.",
  strong: "Excellent password strength!",
};

/**
 * Validation messages
 */
export const validationMessages = {
  username: {
    required: "Please enter your username",
    min: "Username must be at least 3 characters",
    max: "Username cannot exceed 30 characters",
    pattern: "Username can only contain letters, numbers, and underscores",
  },
  email: {
    required: "Please enter your email address",
    invalid: "Please enter a valid email address",
  },
  displayName: {
    required: "Please enter your display name",
    min: "Display name must be at least 2 characters",
    max: "Display name cannot exceed 50 characters",
  },
  password: {
    required: "Please enter your password",
    min: "Password must be at least 8 characters",
    lowercase: "Password must contain at least one lowercase letter",
    uppercase: "Password must contain at least one uppercase letter",
    number: "Password must contain at least one number",
    helper: "Use 8+ characters with uppercase, lowercase, and numbers",
  },
  confirmPassword: {
    required: "Please confirm your password",
    match: "Passwords do not match",
  },
  captcha: {
    required: "Please complete the CAPTCHA verification",
    expired: "CAPTCHA has expired. Please try again.",
    error: "CAPTCHA verification failed. Please try again.",
  },
};

const formStyles = {
  getInputSx,
  getPrimaryButtonSx,
  getLinkButtonSx,
  getAlertSx,
  getDividerSx,
  getDividerTextSx,
  getSwitchAuthContainerSx,
  getSwitchAuthTextSx,
  getCheckboxSx,
  passwordHelperText,
  validationMessages,
  GOOGLE_BUTTON_TIMEOUT,
};

export default formStyles;
