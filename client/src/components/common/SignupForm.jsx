import { LoadingButton } from "@mui/lab";
import { 
  Alert, 
  Box, 
  Button, 
  Stack, 
  TextField, 
  InputAdornment, 
  IconButton, 
  useTheme,
  Typography,
  CircularProgress,
  Divider,
  Fade,
  Skeleton,
  Zoom,
  alpha,
  Grid,
  LinearProgress,
} from "@mui/material";
import { 
  Visibility, 
  VisibilityOff, 
  CheckCircle, 
  Cancel, 
  CheckCircleOutline,
  MailOutline,
  Check,
} from "@mui/icons-material";
import { useFormik } from "formik";
import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import * as Yup from "yup";
import userApi from "../../api/modules/user.api";
import { setAuthModalOpen } from "../../redux/features/authModalSlice";
import { setUser } from "../../redux/features/userSlice";
import ReCAPTCHA from "react-google-recaptcha";
import useGoogleOAuth from "../../hooks/useGoogleOAuth";

// Debounce hook
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

// Compact Password Strength Indicator
const CompactPasswordStrength = ({ password }) => {
  const theme = useTheme();
  
  const checks = useMemo(() => ({
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /\d/.test(password),
  }), [password]);
  
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
        p: 1.5, 
        borderRadius: 1.5, 
        backgroundColor: alpha("#fff", 0.03),
        border: `1px solid ${alpha("#fff", 0.08)}`,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
        <LinearProgress
          variant="determinate"
          value={strength * 100}
          sx={{
            flex: 1,
            height: 4,
            borderRadius: 2,
            backgroundColor: alpha("#fff", 0.1),
            "& .MuiLinearProgress-bar": {
              borderRadius: 2,
              backgroundColor: color,
              transition: "transform 0.3s ease, background-color 0.3s ease",
            },
          }}
        />
        <Typography variant="caption" sx={{ color, fontWeight: 600, fontSize: "0.75rem", minWidth: 45 }}>
          {label}
        </Typography>
      </Box>
      
      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
        {[
          { key: "length", label: "8+ chars" },
          { key: "lowercase", label: "a-z" },
          { key: "uppercase", label: "A-Z" },
          { key: "number", label: "0-9" },
        ].map(({ key, label }) => (
          <Box
            key={key}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              color: checks[key] ? theme.palette.success.main : alpha("#fff", 0.4),
              fontSize: "0.7rem",
              transition: "color 0.2s ease",
            }}
          >
            <Check sx={{ fontSize: 12 }} />
            {label}
          </Box>
        ))}
      </Box>
    </Box>
  );
};

/**
 * SignupForm Component - Compact Design
 */
const SignupForm = ({ switchAuthState }) => {
  const dispatch = useDispatch();
  const theme = useTheme();

  const [isSignupRequest, setIsSignupRequest] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [captchaToken, setCaptchaToken] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [googleButtonLoaded, setGoogleButtonLoaded] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);

  const [usernameAvailability, setUsernameAvailability] = useState({ status: "idle", message: null });
  const [emailAvailability, setEmailAvailability] = useState({ status: "idle", message: null });

  const recaptchaRef = useRef(null);

  useEffect(() => {
    const checkGoogleButton = () => {
      const button = document.getElementById("signupGoogleButton");
      if (button && button.children.length > 0) setGoogleButtonLoaded(true);
    };
    const interval = setInterval(checkGoogleButton, 100);
    const timeout = setTimeout(() => { clearInterval(interval); setGoogleButtonLoaded(true); }, 3000);
    return () => { clearInterval(interval); clearTimeout(timeout); };
  }, []);

  const handleGoogleSignIn = async (response) => {
    try {
      setIsSignupRequest(true);
      const { credential: tokenId } = response;
      const { response: data, err } = await userApi.googleSignin({ tokenId });
      if (err) {
        setErrorMessage("Google Sign-in failed.");
        toast.error("Google Sign-in failed.");
      } else if (data?.token) {
        localStorage.setItem("actkn", data.token);
        dispatch(setUser(data));
        dispatch(setAuthModalOpen(false));
        toast.success("Welcome to PLhub!");
      }
    } catch {
      setErrorMessage("Google Sign-in error.");
    } finally {
      setIsSignupRequest(false);
    }
  };

  useGoogleOAuth(process.env.REACT_APP_GOOGLE_CLIENT_ID, "signupGoogleButton", handleGoogleSignIn);

  const handleCaptchaChange = (token) => { setCaptchaToken(token); if (token) setErrorMessage(null); };
  const handleCaptchaExpired = () => { setCaptchaToken(null); setErrorMessage("CAPTCHA expired."); };
  const handleCaptchaError = () => { setCaptchaToken(null); setErrorMessage("CAPTCHA error."); };
  const resetCaptcha = () => { if (recaptchaRef.current) recaptchaRef.current.reset(); setCaptchaToken(null); };

  const signupForm = useFormik({
    initialValues: { username: "", email: "", displayName: "", password: "", confirmPassword: "" },
    validationSchema: Yup.object({
      username: Yup.string().min(3, "Min 3 chars").max(30, "Max 30 chars")
        .matches(/^[a-zA-Z0-9_]+$/, "Letters, numbers, _ only").required("Required"),
      email: Yup.string().email("Invalid email").required("Required"),
      displayName: Yup.string().min(2, "Min 2 chars").max(50, "Max 50 chars").required("Required"),
      password: Yup.string().min(8, "Min 8 chars").max(128)
        .matches(/[a-z]/, "Need lowercase").matches(/[A-Z]/, "Need uppercase")
        .matches(/\d/, "Need number").required("Required"),
      confirmPassword: Yup.string().oneOf([Yup.ref("password")], "Must match").required("Required"),
    }),
    onSubmit: async (values) => {
      setErrorMessage(null);
      if (!captchaToken) { setErrorMessage("Complete CAPTCHA."); return; }
      if (usernameAvailability.status === "unavailable" || emailAvailability.status === "unavailable") {
        setErrorMessage("Fix validation errors."); return;
      }
      setIsSignupRequest(true);
      const { response, err } = await userApi.signup({ ...values, captchaToken, acceptedTerms: true });
      setIsSignupRequest(false);
      resetCaptcha();
      if (response) {
        setShowSuccessAnimation(true);
        setTimeout(() => {
          signupForm.resetForm();
          dispatch(setUser(response));
          dispatch(setAuthModalOpen(false));
          toast.success("Welcome! Check your email to verify.");
        }, 1500);
      } else if (err) {
        setErrorMessage(err.message || "Sign up failed.");
      }
    },
  });

  const debouncedUsername = useDebounce(signupForm.values.username, 500);
  const debouncedEmail = useDebounce(signupForm.values.email, 500);

  const checkUsername = useCallback(async (username) => {
    if (!username || username.length < 3 || !/^[a-zA-Z0-9_]+$/.test(username)) {
      setUsernameAvailability({ status: "idle", message: null }); return;
    }
    setUsernameAvailability({ status: "checking", message: null });
    try {
      const { response, err } = await userApi.checkUsername(username);
      if (err) { setUsernameAvailability({ status: "idle", message: null }); return; }
      setUsernameAvailability(response.available 
        ? { status: "available", message: "Available" }
        : { status: "unavailable", message: response.reason || "Taken" });
    } catch { setUsernameAvailability({ status: "idle", message: null }); }
  }, []);

  const checkEmail = useCallback(async (email) => {
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      setEmailAvailability({ status: "idle", message: null }); return;
    }
    setEmailAvailability({ status: "checking", message: null });
    try {
      const { response, err } = await userApi.checkEmail(email);
      if (err) { setEmailAvailability({ status: "idle", message: null }); return; }
      setEmailAvailability(response.available 
        ? { status: "available", message: "Available" }
        : { status: "unavailable", message: response.reason || "Registered" });
    } catch { setEmailAvailability({ status: "idle", message: null }); }
  }, []);

  useEffect(() => { checkUsername(debouncedUsername); }, [debouncedUsername, checkUsername]);
  useEffect(() => { checkEmail(debouncedEmail); }, [debouncedEmail, checkEmail]);

  const getAvailabilityIcon = (status) => {
    if (status === "checking") return <CircularProgress size={14} thickness={4} />;
    if (status === "available") return <CheckCircle sx={{ color: "success.main", fontSize: 16 }} />;
    if (status === "unavailable") return <Cancel sx={{ color: "error.main", fontSize: 16 }} />;
    return null;
  };

  const isFormValid = signupForm.isValid && captchaToken && 
    usernameAvailability.status !== "unavailable" && emailAvailability.status !== "unavailable" &&
    usernameAvailability.status !== "checking" && emailAvailability.status !== "checking";

  const inputSx = {
    "& .MuiOutlinedInput-root": { 
      borderRadius: 1.5,
      backgroundColor: alpha(theme.palette.background.paper, 0.6),
      border: `1px solid ${alpha("#fff", 0.1)}`,
      "&:hover": {
        borderColor: alpha("#fff", 0.2),
      },
      "&.Mui-focused": {
        borderColor: theme.palette.primary.main,
        backgroundColor: alpha(theme.palette.background.paper, 0.8),
      },
    },
    "& .MuiOutlinedInput-notchedOutline": { border: "none" },
    "& .MuiInputBase-input": { fontSize: "0.9rem", py: 1.25, color: "#fff" },
    "& .MuiInputLabel-root": { fontSize: "0.9rem", color: alpha("#fff", 0.6) },
    "& .MuiInputLabel-root.Mui-focused": { color: theme.palette.primary.main },
  };

  return (
    <Box component="form" onSubmit={signupForm.handleSubmit} sx={{ position: "relative" }}>
      {/* Google Sign-In - Custom styled button */}
      <Box sx={{ mb: 2.5 }}>
        <Box 
          sx={{ 
            position: "relative", 
            minHeight: 48,
            borderRadius: 1.5,
            overflow: "hidden",
            border: `1px solid ${alpha("#fff", 0.15)}`,
            backgroundColor: alpha("#fff", 0.05),
            transition: "all 0.2s ease",
            "&:hover": {
              backgroundColor: alpha("#fff", 0.1),
              borderColor: alpha("#fff", 0.25),
            },
          }}
        >
          {!googleButtonLoaded && (
            <Skeleton 
              variant="rounded" 
              height={48} 
              sx={{ 
                borderRadius: 1.5, 
                bgcolor: alpha(theme.palette.action.hover, 0.15),
                position: "absolute",
                inset: 0,
              }} 
            />
          )}
          <Box 
            id="signupGoogleButton" 
            sx={{ 
              opacity: googleButtonLoaded ? 1 : 0,
              position: "relative",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              py: 0.5,
              transition: "opacity 0.2s ease",
              "& > div": { 
                width: "100% !important",
                display: "flex",
                justifyContent: "center",
              },
              "& iframe": {
                borderRadius: "8px !important",
              },
            }} 
          />
        </Box>
      </Box>

      {/* Divider */}
      <Divider sx={{ my: 2.5, "&::before, &::after": { borderColor: alpha("#fff", 0.1) } }}>
        <Typography variant="caption" sx={{ color: alpha("#fff", 0.5), fontSize: "0.75rem", px: 2 }}>
          or with email
        </Typography>
      </Divider>

      {/* Form Fields */}
      <Stack spacing={2}>
        {/* Row 1: Username + Display Name */}
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <TextField
              label="Username"
              name="username"
              size="medium"
              fullWidth
              value={signupForm.values.username}
              onChange={signupForm.handleChange}
              onBlur={signupForm.handleBlur}
              error={Boolean((signupForm.touched.username && signupForm.errors.username) || usernameAvailability.status === "unavailable")}
              helperText={(signupForm.touched.username && signupForm.errors.username) || 
                (usernameAvailability.status === "unavailable" && usernameAvailability.message) ||
                (usernameAvailability.status === "available" && <Typography component="span" sx={{ color: "success.main", fontSize: "0.7rem" }}>✓</Typography>)}
              autoComplete="username"
              sx={inputSx}
              InputProps={{
                endAdornment: signupForm.values.username.length >= 3 && (
                  <InputAdornment position="end">{getAvailabilityIcon(usernameAvailability.status)}</InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Display Name"
              name="displayName"
              size="medium"
              fullWidth
              value={signupForm.values.displayName}
              onChange={signupForm.handleChange}
              onBlur={signupForm.handleBlur}
              error={Boolean(signupForm.touched.displayName && signupForm.errors.displayName)}
              helperText={signupForm.touched.displayName && signupForm.errors.displayName}
              autoComplete="name"
              sx={inputSx}
            />
          </Grid>
        </Grid>

        {/* Row 2: Email (full width) */}
        <TextField
          label="Email"
          name="email"
          type="email"
          size="medium"
          fullWidth
          value={signupForm.values.email}
          onChange={signupForm.handleChange}
          onBlur={signupForm.handleBlur}
          error={Boolean((signupForm.touched.email && signupForm.errors.email) || emailAvailability.status === "unavailable")}
          helperText={(signupForm.touched.email && signupForm.errors.email) ||
            (emailAvailability.status === "unavailable" && emailAvailability.message) ||
            (emailAvailability.status === "available" && <Typography component="span" sx={{ color: "success.main", fontSize: "0.7rem" }}>✓</Typography>)}
          autoComplete="email"
          sx={inputSx}
          InputProps={{
            endAdornment: signupForm.values.email.includes("@") && (
              <InputAdornment position="end">{getAvailabilityIcon(emailAvailability.status)}</InputAdornment>
            ),
          }}
        />

        {/* Row 3: Password + Confirm Password */}
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <TextField
              type={showPassword ? "text" : "password"}
              label="Password"
              name="password"
              size="medium"
              fullWidth
              value={signupForm.values.password}
              onChange={signupForm.handleChange}
              onBlur={signupForm.handleBlur}
              error={Boolean(signupForm.touched.password && signupForm.errors.password)}
              autoComplete="new-password"
              sx={inputSx}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" tabIndex={-1} size="small" sx={{ color: alpha("#fff", 0.6) }}>
                      {showPassword ? <VisibilityOff sx={{ fontSize: 20 }} /> : <Visibility sx={{ fontSize: 20 }} />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              type={showConfirmPassword ? "text" : "password"}
              label="Confirm Password"
              name="confirmPassword"
              size="medium"
              fullWidth
              value={signupForm.values.confirmPassword}
              onChange={signupForm.handleChange}
              onBlur={signupForm.handleBlur}
              error={Boolean(signupForm.touched.confirmPassword && signupForm.errors.confirmPassword)}
              helperText={signupForm.touched.confirmPassword && signupForm.errors.confirmPassword}
              autoComplete="new-password"
              sx={inputSx}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end" tabIndex={-1} size="small" sx={{ color: alpha("#fff", 0.6) }}>
                      {showConfirmPassword ? <VisibilityOff sx={{ fontSize: 20 }} /> : <Visibility sx={{ fontSize: 20 }} />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
        </Grid>

        {/* Password Strength - Compact */}
        <CompactPasswordStrength password={signupForm.values.password} />

        {/* reCAPTCHA */}
        <Box 
          sx={{ 
            display: "flex", 
            justifyContent: "center", 
            py: 1,
            borderRadius: 1.5,
            backgroundColor: alpha("#fff", 0.03),
            border: `1px solid ${alpha("#fff", 0.08)}`,
          }}
        >
          <ReCAPTCHA
            ref={recaptchaRef}
            sitekey={process.env.REACT_APP_RECAPTCHA_SITE_KEY}
            onChange={handleCaptchaChange}
            onExpired={handleCaptchaExpired}
            onErrored={handleCaptchaError}
            theme="dark"
            size="normal"
          />
        </Box>
      </Stack>

      {/* Error Message */}
      <Fade in={Boolean(errorMessage)}>
        <Box sx={{ mt: 2 }}>
          {errorMessage && (
            <Alert 
              severity="error" 
              variant="filled" 
              sx={{ 
                borderRadius: 1.5, 
                py: 0.5, 
                "& .MuiAlert-message": { fontSize: "0.85rem" },
                backgroundColor: alpha(theme.palette.error.main, 0.9),
              }} 
              onClose={() => setErrorMessage(null)}
            >
              {errorMessage}
            </Alert>
          )}
        </Box>
      </Fade>

      {/* Submit Button */}
      <LoadingButton
        type="submit"
        fullWidth
        size="large"
        variant="contained"
        loading={isSignupRequest}
        disabled={!isFormValid}
        sx={{ 
          mt: 2.5,
          py: 1.5,
          borderRadius: 1.5,
          fontWeight: 600,
          fontSize: "1rem",
          textTransform: "none",
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.4)}`,
          "&:hover": {
            background: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 100%)`,
            boxShadow: `0 6px 24px ${alpha(theme.palette.primary.main, 0.5)}`,
          },
          "&.Mui-disabled": {
            background: alpha("#fff", 0.1),
            color: alpha("#fff", 0.4),
          },
        }}
      >
        Create Account
      </LoadingButton>

      {/* Switch to Sign In */}
      <Box sx={{ textAlign: "center", mt: 2.5 }}>
        <Typography variant="body2" sx={{ color: alpha("#fff", 0.6), fontSize: "0.9rem" }}>
          Already have an account?{" "}
          <Button 
            onClick={switchAuthState}
            sx={{ 
              fontWeight: 600, 
              textTransform: "none", 
              p: 0, 
              minWidth: "auto", 
              fontSize: "0.9rem", 
              color: theme.palette.primary.main,
              "&:hover": { background: "transparent", textDecoration: "underline" } 
            }}
          >
            Sign in
          </Button>
        </Typography>
      </Box>

      {/* Success Animation */}
      <Fade in={showSuccessAnimation}>
        <Box
          sx={{
            position: "absolute",
            inset: -12,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: alpha(theme.palette.background.default, 0.98),
            backdropFilter: "blur(12px)",
            borderRadius: 2,
            zIndex: 10,
          }}
        >
          <Zoom in={showSuccessAnimation} timeout={400}>
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: alpha(theme.palette.success.main, 0.15),
                border: `2px solid ${alpha(theme.palette.success.main, 0.4)}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mb: 2,
              }}
            >
              <CheckCircleOutline sx={{ fontSize: 36, color: theme.palette.success.main }} />
            </Box>
          </Zoom>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>Welcome!</Typography>
          <Stack direction="row" alignItems="center" spacing={0.5} sx={{ color: "text.secondary" }}>
            <MailOutline sx={{ fontSize: 16 }} />
            <Typography variant="body2" sx={{ fontSize: "0.8rem" }}>Check email to verify</Typography>
          </Stack>
        </Box>
      </Fade>
    </Box>
  );
};

export default SignupForm;
