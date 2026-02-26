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
  Zoom,
  alpha,
  LinearProgress,
  FormControlLabel,
  Checkbox,
  Link,
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
import {
  getInputSx,
  getPrimaryButtonSx,
  getLinkButtonSx,
  getAlertSx,
  getDividerSx,
  getDividerTextSx,
  getSwitchAuthContainerSx,
  getSwitchAuthTextSx,
  validationMessages,
  passwordHelperText,
} from "../../utils/formStyles";

const GOOGLE_BUTTON_ID = "google-signup-button";

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

/**
 * Password Strength Indicator
 */
const PasswordStrengthIndicator = ({ password }) => {
  const theme = useTheme();

  const checks = useMemo(
    () => ({
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
    }),
    [password]
  );

  const passedChecks = Object.values(checks).filter(Boolean).length;
  const strength = passedChecks / 4;

  const getStrengthInfo = () => {
    if (strength <= 0.25) return { label: "Weak", color: theme.palette.error.main, text: passwordHelperText.weak };
    if (strength <= 0.5) return { label: "Fair", color: theme.palette.warning.main, text: passwordHelperText.fair };
    if (strength <= 0.75) return { label: "Good", color: theme.palette.info.main, text: passwordHelperText.good };
    return { label: "Strong", color: theme.palette.success.main, text: passwordHelperText.strong };
  };

  const { label, color, text } = getStrengthInfo();

  if (!password) return null;

  return (
    <Box
      sx={{
        width: "100%",
        p: 2,
        borderRadius: 2,
        backgroundColor: alpha("#fff", 0.03),
        border: `1px solid ${alpha("#fff", 0.08)}`,
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
            backgroundColor: alpha("#fff", 0.1),
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
              color: checks[key] ? theme.palette.success.main : alpha("#fff", 0.4),
              fontSize: "0.85rem",
            }}
          >
            <Check sx={{ fontSize: 16 }} />
            {checkLabel}
          </Box>
        ))}
      </Box>
      <Typography sx={{ mt: 1.5, fontSize: "0.8rem", color: alpha("#fff", 0.5), fontStyle: "italic" }}>
        {text}
      </Typography>
    </Box>
  );
};

/**
 * SignupForm Component
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
  const usernameInputRef = useRef(null);
  const googleInitializedRef = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (usernameInputRef.current) {
        usernameInputRef.current.focus();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  // Google OAuth callback
  const handleGoogleResponse = useCallback(async (response) => {
    try {
      const { credential: tokenId } = response;
      const { response: data, err } = await userApi.googleSignin({ tokenId });
      if (err) {
        setErrorMessage("Google Sign-in failed. Please try again.");
        toast.error("Google Sign-in failed.");
      } else if (data?.token) {
        localStorage.setItem("actkn", data.token);
        dispatch(setUser(data));
        dispatch(setAuthModalOpen(false));
        toast.success("Welcome to PLhub!");
      }
    } catch {
      setErrorMessage("An error occurred during Google Sign-in.");
    }
  }, [dispatch]);

  // Initialize Google OAuth and render button
  useEffect(() => {
    if (googleInitializedRef.current) return;

    const initializeGoogleButton = () => {
      const buttonContainer = document.getElementById(GOOGLE_BUTTON_ID);
      if (!window.google || !buttonContainer) return;

      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        try {
          window.google.accounts.id.initialize({
            client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
            callback: handleGoogleResponse,
          });

          // Always use max width (400) - CSS will stretch it to full container width
          window.google.accounts.id.renderButton(buttonContainer, {
            type: "standard",
            theme: "filled_black",
            size: "large",
            text: "signup_with",
            shape: "rectangular",
            logo_alignment: "left",
            width: 400,
          });

          googleInitializedRef.current = true;
          setGoogleButtonLoaded(true);
        } catch (error) {
          console.error("Error initializing Google button:", error);
        }
      });
    };

    const loadGoogleScript = () => {
      const existingScript = document.getElementById("google-oauth-script");

      if (existingScript && window.google) {
        // Delay to ensure container is rendered with proper width
        setTimeout(initializeGoogleButton, 150);
        return;
      }

      if (!existingScript) {
        const script = document.createElement("script");
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        script.id = "google-oauth-script";
        script.onload = () => setTimeout(initializeGoogleButton, 150);
        document.body.appendChild(script);
      } else {
        // Script exists but Google not ready - wait for it
        const checkInterval = setInterval(() => {
          if (window.google) {
            clearInterval(checkInterval);
            setTimeout(initializeGoogleButton, 150);
          }
        }, 100);
        setTimeout(() => clearInterval(checkInterval), 5000);
      }
    };

    loadGoogleScript();

    return () => {
      googleInitializedRef.current = false;
    };
  }, [handleGoogleResponse]);

  const handleCaptchaChange = useCallback((token) => {
    setCaptchaToken(token);
    if (token) setErrorMessage(null);
  }, []);

  const handleCaptchaExpired = useCallback(() => {
    setCaptchaToken(null);
    setErrorMessage(validationMessages.captcha.expired);
  }, []);

  const handleCaptchaError = useCallback(() => {
    setCaptchaToken(null);
    setErrorMessage(validationMessages.captcha.error);
  }, []);

  const resetCaptcha = useCallback(() => {
    if (recaptchaRef.current) recaptchaRef.current.reset();
    setCaptchaToken(null);
  }, []);

  const signupForm = useFormik({
    initialValues: {
      username: "",
      email: "",
      displayName: "",
      password: "",
      confirmPassword: "",
      acceptedTerms: false,
    },
    validateOnBlur: true,
    validateOnChange: false,
    validationSchema: Yup.object({
      username: Yup.string()
        .min(3, validationMessages.username.min)
        .max(30, validationMessages.username.max)
        .matches(/^[a-zA-Z0-9_]+$/, validationMessages.username.pattern)
        .required(validationMessages.username.required),
      email: Yup.string()
        .email(validationMessages.email.invalid)
        .required(validationMessages.email.required),
      displayName: Yup.string()
        .min(2, validationMessages.displayName.min)
        .max(50, validationMessages.displayName.max)
        .required(validationMessages.displayName.required),
      password: Yup.string()
        .min(8, validationMessages.password.min)
        .max(128)
        .matches(/[a-z]/, validationMessages.password.lowercase)
        .matches(/[A-Z]/, validationMessages.password.uppercase)
        .matches(/\d/, validationMessages.password.number)
        .required(validationMessages.password.required),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref("password")], validationMessages.confirmPassword.match)
        .required(validationMessages.confirmPassword.required),
      acceptedTerms: Yup.boolean()
        .oneOf([true], "You must accept the Terms of Service and Privacy Policy")
        .required("You must accept the Terms of Service and Privacy Policy"),
    }),
    onSubmit: async (values) => {
      setErrorMessage(null);
      if (!captchaToken) {
        setErrorMessage(validationMessages.captcha.required);
        return;
      }
      if (usernameAvailability.status === "unavailable" || emailAvailability.status === "unavailable") {
        setErrorMessage("Please fix the validation errors before continuing.");
        return;
      }
      if (!values.acceptedTerms) {
        setErrorMessage("You must accept the Terms of Service and Privacy Policy");
        return;
      }
      setIsSignupRequest(true);
      const { response, err } = await userApi.signup({
        username: values.username,
        email: values.email,
        displayName: values.displayName,
        password: values.password,
        captchaToken,
        acceptedTerms: values.acceptedTerms,
      });
      setIsSignupRequest(false);
      resetCaptcha();
      if (response) {
        setShowSuccessAnimation(true);
        setTimeout(() => {
          signupForm.resetForm();
          dispatch(setUser(response));
          dispatch(setAuthModalOpen(false));
          toast.success("Welcome! Please check your email to verify.");
        }, 1500);
      } else if (err) {
        setErrorMessage(err.message || "Sign up failed. Please try again.");
      }
    },
  });

  const debouncedUsername = useDebounce(signupForm.values.username, 500);
  const debouncedEmail = useDebounce(signupForm.values.email, 500);

  const checkUsername = useCallback(async (username) => {
    if (!username || username.length < 3 || !/^[a-zA-Z0-9_]+$/.test(username)) {
      setUsernameAvailability({ status: "idle", message: null });
      return;
    }
    setUsernameAvailability({ status: "checking", message: null });
    try {
      const { response, err } = await userApi.checkUsername(username);
      if (err) {
        setUsernameAvailability({ status: "idle", message: null });
        return;
      }
      setUsernameAvailability(
        response.available
          ? { status: "available", message: "Available" }
          : { status: "unavailable", message: response.reason || "Taken" }
      );
    } catch {
      setUsernameAvailability({ status: "idle", message: null });
    }
  }, []);

  const checkEmail = useCallback(async (email) => {
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      setEmailAvailability({ status: "idle", message: null });
      return;
    }
    setEmailAvailability({ status: "checking", message: null });
    try {
      const { response, err } = await userApi.checkEmail(email);
      if (err) {
        setEmailAvailability({ status: "idle", message: null });
        return;
      }
      setEmailAvailability(
        response.available
          ? { status: "available", message: "Available" }
          : { status: "unavailable", message: response.reason || "Registered" }
      );
    } catch {
      setEmailAvailability({ status: "idle", message: null });
    }
  }, []);

  useEffect(() => { checkUsername(debouncedUsername); }, [debouncedUsername, checkUsername]);
  useEffect(() => { checkEmail(debouncedEmail); }, [debouncedEmail, checkEmail]);

  const getAvailabilityIcon = (status) => {
    if (status === "checking") return <CircularProgress size={20} thickness={4} />;
    if (status === "available") return <CheckCircle sx={{ color: "success.main", fontSize: 22 }} />;
    if (status === "unavailable") return <Cancel sx={{ color: "error.main", fontSize: 22 }} />;
    return null;
  };

  const isFormValid =
    signupForm.isValid &&
    captchaToken &&
    signupForm.values.acceptedTerms &&
    usernameAvailability.status !== "unavailable" &&
    emailAvailability.status !== "unavailable" &&
    usernameAvailability.status !== "checking" &&
    emailAvailability.status !== "checking";

  const inputSx = getInputSx(theme);
  const primaryButtonSx = getPrimaryButtonSx(theme);
  const linkButtonSx = getLinkButtonSx(theme);
  const alertSx = getAlertSx(theme);
  const dividerSx = getDividerSx();
  const dividerTextSx = getDividerTextSx();
  const switchAuthContainerSx = getSwitchAuthContainerSx();
  const switchAuthTextSx = getSwitchAuthTextSx();

  const passwordsMatch =
    signupForm.values.password &&
    signupForm.values.confirmPassword &&
    signupForm.values.password === signupForm.values.confirmPassword;

  const twoColumnRowSx = {
    display: "flex",
    gap: 2,
    width: "100%",
    flexDirection: { xs: "column", sm: "row" },
    "& > *": { flex: { xs: "1 1 100%", sm: "1 1 50%" }, minWidth: 0 },
  };

  return (
    <Box
      component="form"
      onSubmit={signupForm.handleSubmit}
      sx={{ position: "relative", width: "100%" }}
    >
      {/* Custom Google Sign-Up Button */}
      <Box sx={{ width: "100%", position: "relative" }}>
        {/* Hidden official Google button for OAuth functionality */}
        <Box
          id={GOOGLE_BUTTON_ID}
          sx={{
            position: "absolute",
            opacity: 0,
            pointerEvents: "none",
            height: 0,
            overflow: "hidden",
          }}
        />
        
        {/* Visible custom-styled button */}
        <Button
          fullWidth
          onClick={() => {
            // Try to click the hidden Google button, fallback to prompt
            const googleBtn = document.querySelector(`#${GOOGLE_BUTTON_ID} [role="button"]`) ||
                              document.querySelector(`#${GOOGLE_BUTTON_ID} div[tabindex="0"]`);
            if (googleBtn) {
              googleBtn.click();
            } else if (window.google) {
              window.google.accounts.id.prompt();
            }
          }}
          disabled={!googleButtonLoaded}
          sx={{
            height: 52,
            borderRadius: 2,
            bgcolor: alpha("#1a1a1a", 0.9),
            border: `1px solid ${alpha("#fff", 0.12)}`,
            color: "#fff",
            textTransform: "none",
            fontSize: "1rem",
            fontWeight: 500,
            gap: 1.5,
            transition: "all 0.2s ease",
            "&:hover": {
              bgcolor: alpha("#2a2a2a", 0.95),
              borderColor: alpha("#fff", 0.2),
            },
            "&:disabled": {
              bgcolor: alpha("#1a1a1a", 0.5),
              color: alpha("#fff", 0.4),
            },
          }}
        >
          {/* Colored Google "G" Logo */}
          <Box sx={{ width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
          </Box>
          Sign up with Google
        </Button>
      </Box>

      {/* Divider */}
      <Divider sx={dividerSx}>
        <Typography variant="caption" sx={dividerTextSx}>
          or continue with email
        </Typography>
      </Divider>

      {/* Form Fields */}
      <Stack spacing={2.5} sx={{ width: "100%" }}>
        {/* Row 1: Username + Display Name */}
        <Box sx={twoColumnRowSx}>
          <TextField
            label="Username"
            name="username"
            fullWidth
            value={signupForm.values.username}
            onChange={signupForm.handleChange}
            onBlur={signupForm.handleBlur}
            error={Boolean(
              (signupForm.touched.username && signupForm.errors.username) ||
                usernameAvailability.status === "unavailable"
            )}
            helperText={
              (signupForm.touched.username && signupForm.errors.username) ||
              (usernameAvailability.status === "unavailable" && usernameAvailability.message) ||
              (usernameAvailability.status === "available" && (
                <Typography component="span" sx={{ color: "success.main", fontSize: "0.8rem" }}>
                  ✓ {usernameAvailability.message}
                </Typography>
              )) ||
              "Letters, numbers, underscores"
            }
            autoComplete="username"
            inputRef={usernameInputRef}
            sx={inputSx}
            InputProps={{
              endAdornment: signupForm.values.username.length >= 3 && (
                <InputAdornment position="end">
                  {getAvailabilityIcon(usernameAvailability.status)}
                </InputAdornment>
              ),
            }}
          />
          <TextField
            label="Display Name"
            name="displayName"
            fullWidth
            value={signupForm.values.displayName}
            onChange={signupForm.handleChange}
            onBlur={signupForm.handleBlur}
            error={Boolean(signupForm.touched.displayName && signupForm.errors.displayName)}
            helperText={
              (signupForm.touched.displayName && signupForm.errors.displayName) ||
              "How others see you"
            }
            autoComplete="name"
            sx={inputSx}
          />
        </Box>

        {/* Row 2: Email */}
        <TextField
          label="Email"
          name="email"
          type="email"
          fullWidth
          value={signupForm.values.email}
          onChange={signupForm.handleChange}
          onBlur={signupForm.handleBlur}
          error={Boolean(
            (signupForm.touched.email && signupForm.errors.email) ||
              emailAvailability.status === "unavailable"
          )}
          helperText={
            (signupForm.touched.email && signupForm.errors.email) ||
            (emailAvailability.status === "unavailable" && emailAvailability.message) ||
            (emailAvailability.status === "available" && (
              <Typography component="span" sx={{ color: "success.main", fontSize: "0.8rem" }}>
                ✓ {emailAvailability.message}
              </Typography>
            )) ||
            "We'll send a verification link"
          }
          autoComplete="email"
          sx={inputSx}
          InputProps={{
            endAdornment: signupForm.values.email.includes("@") && (
              <InputAdornment position="end">
                {getAvailabilityIcon(emailAvailability.status)}
              </InputAdornment>
            ),
          }}
        />

        {/* Row 3: Password + Confirm Password */}
        <Box sx={twoColumnRowSx}>
          <TextField
            type={showPassword ? "text" : "password"}
            label="Password"
            name="password"
            fullWidth
            value={signupForm.values.password}
            onChange={signupForm.handleChange}
            onBlur={signupForm.handleBlur}
            error={Boolean(signupForm.touched.password && signupForm.errors.password)}
            helperText={
              (signupForm.touched.password && signupForm.errors.password) ||
              (!signupForm.values.password && "Min 8 chars, mixed case + number")
            }
            autoComplete="new-password"
            sx={inputSx}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                    tabIndex={-1}
                    size="small"
                    sx={{ color: alpha("#fff", 0.6), "&:hover": { color: alpha("#fff", 0.9) } }}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <TextField
            type={showConfirmPassword ? "text" : "password"}
            label="Confirm Password"
            name="confirmPassword"
            fullWidth
            value={signupForm.values.confirmPassword}
            onChange={signupForm.handleChange}
            onBlur={signupForm.handleBlur}
            error={Boolean(signupForm.touched.confirmPassword && signupForm.errors.confirmPassword)}
            helperText={
              (signupForm.touched.confirmPassword && signupForm.errors.confirmPassword) ||
              (passwordsMatch && (
                <Typography component="span" sx={{ color: "success.main", fontSize: "0.8rem" }}>
                  ✓ Passwords match
                </Typography>
              )) ||
              "Re-enter your password"
            }
            autoComplete="new-password"
            sx={inputSx}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    edge="end"
                    tabIndex={-1}
                    size="small"
                    sx={{ color: alpha("#fff", 0.6), "&:hover": { color: alpha("#fff", 0.9) } }}
                  >
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {/* Password Strength */}
        <PasswordStrengthIndicator password={signupForm.values.password} />

        {/* Terms and Conditions Checkbox */}
        <Box sx={{ width: "100%" }}>
          <FormControlLabel
            control={
              <Checkbox
                name="acceptedTerms"
                checked={signupForm.values.acceptedTerms}
                onChange={signupForm.handleChange}
                sx={{
                  color: alpha("#fff", 0.5),
                  "&.Mui-checked": {
                    color: theme.palette.primary.main,
                  },
                }}
              />
            }
            label={
              <Typography sx={{ fontSize: "0.9rem", color: alpha("#fff", 0.7) }}>
                I agree to the{" "}
                <Link
                  href="/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ color: theme.palette.primary.main }}
                >
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                  href="/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ color: theme.palette.primary.main }}
                >
                  Privacy Policy
                </Link>
              </Typography>
            }
          />
          {signupForm.touched.acceptedTerms && signupForm.errors.acceptedTerms && (
            <Typography sx={{ color: "error.main", fontSize: "0.75rem", mt: 0.5, ml: 2 }}>
              {signupForm.errors.acceptedTerms}
            </Typography>
          )}
        </Box>

        {/* reCAPTCHA */}
        <Box sx={{ width: "100%", display: "flex", justifyContent: "center" }}>
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
        <Box sx={{ mt: 2.5, width: "100%" }}>
          {errorMessage && (
            <Alert
              severity="error"
              variant="filled"
              sx={alertSx}
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
        sx={primaryButtonSx}
      >
        Create Account
      </LoadingButton>

      {/* Switch to Sign In */}
      <Box sx={switchAuthContainerSx}>
        <Typography variant="body2" sx={switchAuthTextSx}>
          Already have an account?{" "}
          <Button onClick={switchAuthState} sx={linkButtonSx}>
            Sign in
          </Button>
        </Typography>
      </Box>

      {/* Success Animation */}
      <Fade in={showSuccessAnimation}>
        <Box
          sx={{
            position: "absolute",
            inset: -16,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: alpha(theme.palette.background.default, 0.95),
            backdropFilter: "blur(16px)",
            borderRadius: 3,
            zIndex: 10,
          }}
        >
          <Zoom in={showSuccessAnimation} timeout={400}>
            <Box
              sx={{
                width: 88,
                height: 88,
                borderRadius: "50%",
                background: alpha(theme.palette.success.main, 0.15),
                border: `2px solid ${alpha(theme.palette.success.main, 0.4)}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mb: 3,
              }}
            >
              <CheckCircleOutline sx={{ fontSize: 48, color: theme.palette.success.main }} />
            </Box>
          </Zoom>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1.5, fontSize: "1.5rem" }}>
            Welcome!
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "text.secondary" }}>
            <MailOutline sx={{ fontSize: 22 }} />
            <Typography sx={{ fontSize: "1rem" }}>Check your email to verify</Typography>
          </Box>
        </Box>
      </Fade>
    </Box>
  );
};

export default SignupForm;
