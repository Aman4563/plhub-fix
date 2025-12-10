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
  Skeleton,
  Fade,
  alpha,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useFormik } from "formik";
import { useState, useRef, useEffect } from "react";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import * as Yup from "yup";
import userApi from "../../api/modules/user.api";
import { setAuthModalOpen } from "../../redux/features/authModalSlice";
import { setUser } from "../../redux/features/userSlice";
import ReCAPTCHA from "react-google-recaptcha";
import useGoogleOAuth from "../../hooks/useGoogleOAuth";

/**
 * SigninForm Component - Clean Design
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

  useEffect(() => {
    const checkGoogleButton = () => {
      const button = document.getElementById("signinGoogleButton");
      if (button && button.children.length > 0) setGoogleButtonLoaded(true);
    };
    const interval = setInterval(checkGoogleButton, 100);
    const timeout = setTimeout(() => { clearInterval(interval); setGoogleButtonLoaded(true); }, 3000);
    return () => { clearInterval(interval); clearTimeout(timeout); };
  }, []);

  const handleGoogleSignIn = async (response) => {
    try {
      setIsLoginRequest(true);
      const { credential: tokenId } = response;
      const { response: data, err } = await userApi.googleSignin({ tokenId });
      if (err) {
        setErrorMessage("Google Sign-in failed.");
        toast.error("Google Sign-in failed.");
      } else {
        if (data && data.token) localStorage.setItem("actkn", data.token);
        dispatch(setUser(data));
        dispatch(setAuthModalOpen(false));
        toast.success("Welcome back!");
      }
    } catch {
      setErrorMessage("Google Sign-in error.");
    } finally {
      setIsLoginRequest(false);
    }
  };

  useGoogleOAuth(process.env.REACT_APP_GOOGLE_CLIENT_ID, "signinGoogleButton", handleGoogleSignIn);

  const handleCaptchaChange = (token) => { setCaptchaToken(token); if (token) setErrorMessage(null); };
  const handleCaptchaExpired = () => { setCaptchaToken(null); setErrorMessage("CAPTCHA expired."); };
  const handleCaptchaError = () => { setCaptchaToken(null); setErrorMessage("CAPTCHA error."); };
  const resetCaptcha = () => { if (recaptchaRef.current) recaptchaRef.current.reset(); setCaptchaToken(null); };

  const signinForm = useFormik({
    initialValues: { username: "", password: "" },
    validationSchema: Yup.object({
      username: Yup.string().min(3, "Min 3 chars").max(30, "Max 30 chars").required("Required"),
      password: Yup.string().min(8, "Min 8 chars").max(128).required("Required"),
    }),
    onSubmit: async (values) => {
      setErrorMessage(null);
      if (!captchaToken) { setErrorMessage("Complete CAPTCHA."); return; }
      setIsLoginRequest(true);
      const { response, err } = await userApi.signin({ ...values, captchaToken });
      setIsLoginRequest(false);
      resetCaptcha();
      if (response) {
        signinForm.resetForm();
        dispatch(setUser(response));
        dispatch(setAuthModalOpen(false));
        toast.success("Welcome back!");
      }
      if (err) setErrorMessage(err.message || "Sign in failed.");
    },
  });

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
    <Box component="form" onSubmit={signinForm.handleSubmit}>
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
            id="signinGoogleButton" 
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
        <TextField
          label="Username"
          name="username"
          size="medium"
          fullWidth
          value={signinForm.values.username}
          onChange={signinForm.handleChange}
          onBlur={signinForm.handleBlur}
          error={signinForm.touched.username && Boolean(signinForm.errors.username)}
          helperText={signinForm.touched.username && signinForm.errors.username}
          autoComplete="username"
          sx={inputSx}
        />

        <Box>
          <TextField
            type={showPassword ? "text" : "password"}
            label="Password"
            name="password"
            size="medium"
            fullWidth
            value={signinForm.values.password}
            onChange={signinForm.handleChange}
            onBlur={signinForm.handleBlur}
            error={signinForm.touched.password && Boolean(signinForm.errors.password)}
            helperText={signinForm.touched.password && signinForm.errors.password}
            autoComplete="current-password"
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

          {/* Forgot Password Link */}
          <Box sx={{ textAlign: "right", mt: 1 }}>
            <Button
              size="small"
              onClick={onForgotPassword}
              type="button"
              sx={{ 
                textTransform: "none",
                color: alpha("#fff", 0.6),
                fontSize: "0.8rem",
                p: 0,
                minWidth: "auto",
                "&:hover": { color: theme.palette.primary.main, background: "transparent" }
              }}
            >
              Forgot password?
            </Button>
          </Box>
        </Box>

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
        loading={isLoginRequest}
        disabled={!captchaToken}
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
        Sign In
      </LoadingButton>

      {/* Switch to Sign Up */}
      <Box sx={{ textAlign: "center", mt: 2.5 }}>
        <Typography variant="body2" sx={{ color: alpha("#fff", 0.6), fontSize: "0.9rem" }}>
          Don't have an account?{" "}
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
            Sign up
          </Button>
        </Typography>
      </Box>
    </Box>
  );
};

export default SigninForm;
