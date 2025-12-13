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
  Divider,
  Fade,
  alpha,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useFormik } from "formik";
import { useState, useRef, useEffect, useCallback } from "react";
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
} from "../../utils/formStyles";

const GOOGLE_BUTTON_ID = "google-signin-button";

/**
 * SigninForm Component
 */
const SigninForm = ({ switchAuthState, onForgotPassword }) => {
  const dispatch = useDispatch();
  const theme = useTheme();

  const [isLoginRequest, setIsLoginRequest] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [captchaToken, setCaptchaToken] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [googleButtonLoaded, setGoogleButtonLoaded] = useState(false);

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
      } else {
        if (data && data.token) localStorage.setItem("actkn", data.token);
        dispatch(setUser(data));
        dispatch(setAuthModalOpen(false));
        toast.success("Welcome back!");
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
            text: "continue_with",
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

  const signinForm = useFormik({
    initialValues: { username: "", password: "" },
    validateOnBlur: true,
    validateOnChange: false,
    validationSchema: Yup.object({
      username: Yup.string()
        .min(3, validationMessages.username.min)
        .max(30, validationMessages.username.max)
        .required(validationMessages.username.required),
      password: Yup.string()
        .min(8, validationMessages.password.min)
        .max(128)
        .required(validationMessages.password.required),
    }),
    onSubmit: async (values) => {
      setErrorMessage(null);
      if (!captchaToken) {
        setErrorMessage(validationMessages.captcha.required);
        return;
      }
      setIsLoginRequest(true);
      const { response, err } = await userApi.signin({
        ...values,
        captchaToken,
      });
      setIsLoginRequest(false);
      resetCaptcha();
      if (response) {
        signinForm.resetForm();
        dispatch(setUser(response));
        dispatch(setAuthModalOpen(false));
        toast.success("Welcome back!");
      }
      if (err) setErrorMessage(err.message || "Sign in failed. Please try again.");
    },
  });

  const inputSx = getInputSx(theme);
  const primaryButtonSx = getPrimaryButtonSx(theme);
  const linkButtonSx = getLinkButtonSx(theme);
  const alertSx = getAlertSx(theme);
  const dividerSx = getDividerSx();
  const dividerTextSx = getDividerTextSx();
  const switchAuthContainerSx = getSwitchAuthContainerSx();
  const switchAuthTextSx = getSwitchAuthTextSx();

  return (
    <Box
      component="form"
      onSubmit={signinForm.handleSubmit}
      role="form"
      aria-label="Sign in form"
      sx={{ width: "100%" }}
    >
      {/* Custom Google Sign-In Button */}
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
          Continue with Google
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
        <TextField
          label="Username"
          name="username"
          fullWidth
          value={signinForm.values.username}
          onChange={signinForm.handleChange}
          onBlur={signinForm.handleBlur}
          error={signinForm.touched.username && Boolean(signinForm.errors.username)}
          helperText={signinForm.touched.username && signinForm.errors.username}
          autoComplete="username"
          inputRef={usernameInputRef}
          sx={inputSx}
        />

        <Box sx={{ width: "100%" }}>
          <TextField
            type={showPassword ? "text" : "password"}
            label="Password"
            name="password"
            fullWidth
            value={signinForm.values.password}
            onChange={signinForm.handleChange}
            onBlur={signinForm.handleBlur}
            error={signinForm.touched.password && Boolean(signinForm.errors.password)}
            helperText={
              (signinForm.touched.password && signinForm.errors.password) ||
              (!signinForm.values.password && validationMessages.password.helper)
            }
            autoComplete="current-password"
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

          {/* Forgot Password Link */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              mt: 1.5,
              width: "100%",
            }}
          >
            <Button
              size="small"
              onClick={onForgotPassword}
              type="button"
              sx={{
                textTransform: "none",
                color: alpha("#fff", 0.65),
                fontSize: "0.9rem",
                p: 0,
                minWidth: "auto",
                "&:hover": {
                  color: theme.palette.primary.main,
                  background: "transparent",
                },
              }}
            >
              Forgot password?
            </Button>
          </Box>
        </Box>

        {/* reCAPTCHA */}
        <Box
          sx={{
            width: "100%",
            display: "flex",
            justifyContent: "center",
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
        loading={isLoginRequest}
        disabled={!captchaToken}
        sx={primaryButtonSx}
      >
        Sign In
      </LoadingButton>

      {/* Switch to Sign Up */}
      <Box sx={switchAuthContainerSx}>
        <Typography variant="body2" sx={switchAuthTextSx}>
          Don&apos;t have an account?{" "}
          <Button onClick={switchAuthState} sx={linkButtonSx}>
            Sign up
          </Button>
        </Typography>
      </Box>
    </Box>
  );
};

export default SigninForm;
