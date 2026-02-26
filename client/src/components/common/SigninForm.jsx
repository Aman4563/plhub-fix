import { LoadingButton } from "@mui/lab";
import { Alert, Box, Button, Stack, TextField } from "@mui/material";
import { useFormik } from "formik";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import * as Yup from "yup";
import userApi from "../../api/modules/user.api";
import { setAuthModalOpen } from "../../redux/features/authModalSlice";
import { setUser } from "../../redux/features/userSlice";
// import ReCAPTCHA from "react-google-recaptcha";
// import useGoogleOAuth from "../../hooks/useGoogleOAuth";

/**
 * SigninForm Component
 * - Handles user authentication with username/password and Google OAuth.
 * - Includes ReCAPTCHA validation for added security.
 *
 * @param {Object} props - Component props.
 * @param {Function} props.switchAuthState - Function to switch to the Sign Up form.
 */
const SigninForm = ({ switchAuthState }) => {
  const dispatch = useDispatch();

  const [isLoginRequest, setIsLoginRequest] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [captchaToken, setCaptchaToken] = useState(null);

  /**
   * Handles successful Google Sign-In.
   *
   * @param {Object} response - Google Sign-In response object containing the credential (JWT token).
   */
  const handleGoogleSignIn = async (response) => {
    try {
      const { credential: tokenId } = response;
      const { response: data, err } = await userApi.googleSignin({ tokenId });

      if (err) {
        setErrorMessage("Google Sign-in failed. Please try again.");
        toast.error("Google Sign-in failed.");
      } else {
        // Store JWT token in local storage
        if (data && data.token) {
          localStorage.setItem("actkn", data.token);
        }

        // Update Redux state with user information
        dispatch(setUser(data));
        dispatch(setAuthModalOpen(false));
        toast.success("Google Sign-in successful!");
      }
    } catch (error) {
      setErrorMessage("Google Sign-in error. Please try again.");
      toast.error("Google Sign-in error.");
    }
  };

  // Initialize Google OAuth hook
  // useGoogleOAuth(
  //   process.env.REACT_APP_GOOGLE_CLIENT_ID,
  //   "googleSignInButton",
  //   handleGoogleSignIn
  // );

  /**
   * Handles ReCAPTCHA token change.
   *
   * @param {string} token - ReCAPTCHA token.
   */
  const handleCaptchaChange = (token) => {
    setCaptchaToken(token);
  };

  // Formik form management
  const signinForm = useFormik({
    initialValues: {
      username: "",
      password: "",
    },
    validationSchema: Yup.object({
      username: Yup.string()
        .min(8, "Username must be at least 8 characters")
        .required("Username is required"),
      password: Yup.string()
        .min(8, "Password must be at least 8 characters")
        .required("Password is required"),
    }),
    onSubmit: async (values) => {
      setErrorMessage(null);

      // Bypass captcha check for development
      // if (!captchaToken) {
      //   setErrorMessage("Please complete the CAPTCHA.");
      //   return;
      // }

      setIsLoginRequest(true);
      const { response, err } = await userApi.signin({ ...values, captchaToken: "bypass-token" });
      setIsLoginRequest(false);

      if (response) {
        signinForm.resetForm();
        dispatch(setUser(response));
        dispatch(setAuthModalOpen(false));
        toast.success("Sign in successful!");
      }

      if (err) setErrorMessage(err.message);
    },
  });

  return (
    <Box component="form" onSubmit={signinForm.handleSubmit}>
      <Stack spacing={3}>
        {/* Username Input */}
        <TextField
          type="text"
          placeholder="Username"
          name="username"
          fullWidth
          value={signinForm.values.username}
          onChange={signinForm.handleChange}
          color="success"
          error={signinForm.touched.username && Boolean(signinForm.errors.username)}
          helperText={signinForm.touched.username && signinForm.errors.username}
        />

        {/* Password Input */}
        <TextField
          type="password"
          placeholder="Password"
          name="password"
          fullWidth
          value={signinForm.values.password}
          onChange={signinForm.handleChange}
          color="success"
          error={signinForm.touched.password && Boolean(signinForm.errors.password)}
          helperText={signinForm.touched.password && signinForm.errors.password}
        />

        {/* ReCAPTCHA - Commented out for development */}
        {/* <ReCAPTCHA
          sitekey={process.env.REACT_APP_RECAPTCHA_SITE_KEY}
          onChange={handleCaptchaChange}
        /> */}
      </Stack>

      {/* Sign In Button */}
      <LoadingButton
        type="submit"
        fullWidth
        size="large"
        variant="contained"
        sx={{ marginTop: 4 }}
        loading={isLoginRequest}
      >
        Sign in
      </LoadingButton>

      {/* Google Sign-In Button - Commented out for development */}
      {/* <Box id="googleSignInButton" sx={{ marginTop: 2, textAlign: "center" }} /> */}

      {/* Switch to Sign Up */}
      <Button fullWidth sx={{ marginTop: 1 }} onClick={switchAuthState}>
        Sign up
      </Button>

      {/* Error Message */}
      {errorMessage && (
        <Box sx={{ marginTop: 2 }}>
          <Alert severity="error" variant="outlined">
            {errorMessage}
          </Alert>
        </Box>
      )}
    </Box>
  );
};

export default SigninForm;
