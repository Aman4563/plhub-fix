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
 * SignupForm Component
 * - Allows users to sign up with manual inputs or Google OAuth.
 * - Includes ReCAPTCHA validation for added security.
 *
 * @param {Object} props - Component props.
 * @param {Function} props.switchAuthState - Function to switch to the Sign In form.
 */
const SignupForm = ({ switchAuthState }) => {
  const dispatch = useDispatch();

  const [isSignupRequest, setIsSignupRequest] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [captchaToken, setCaptchaToken] = useState(null);

  /**
   * Handles Google Sign-In.
   * @param {Object} response - Google Sign-In response containing the credential (JWT token).
   */
  const handleGoogleSignIn = async (response) => {
    try {
      setIsSignupRequest(true);
      const { credential: tokenId } = response;
      const { response: data, err } = await userApi.googleSignin({ tokenId });

      if (err) {
        setErrorMessage("Google Sign-in failed. Please try again.");
        toast.error("Google Sign-in failed.");
      } else if (data?.token) {
        // Save the JWT token and update Redux state
        localStorage.setItem("actkn", data.token);
        dispatch(setUser(data));
        dispatch(setAuthModalOpen(false));
        toast.success("Google Sign-in successful!");
      } else {
        setErrorMessage("Google Sign-in failed. Please try again.");
        toast.error("Google Sign-in failed.");
      }
    } catch (error) {
      setErrorMessage("Google Sign-in error. Please try again.");
      toast.error("Google Sign-in error.");
    } finally {
      setIsSignupRequest(false);
    }
  };

  // Initialize Google OAuth with the custom hook
  // useGoogleOAuth(
  //   process.env.REACT_APP_GOOGLE_CLIENT_ID,
  //   "googleSignInButton",
  //   handleGoogleSignIn
  // );

  /**
   * Handles ReCAPTCHA token change.
   * @param {string} token - The ReCAPTCHA token.
   */
  const handleCaptchaChange = (token) => {
    setCaptchaToken(token);
  };

  // Formik form management for manual signup
  const signupForm = useFormik({
    initialValues: {
      username: "",
      email: "",
      displayName: "",
      password: "",
      confirmPassword: "",
    },
    validationSchema: Yup.object({
      username: Yup.string()
        .min(8, "Username must be at least 8 characters")
        .required("Username is required"),
      email: Yup.string()
        .email("Invalid email address")
        .required("Email is required"),
      displayName: Yup.string()
        .min(8, "Display name must be at least 8 characters")
        .required("Display name is required"),
      password: Yup.string()
        .min(8, "Password must be at least 8 characters")
        .required("Password is required"),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref("password")], "Passwords must match")
        .required("Confirm password is required"),
    }),
    onSubmit: async (values) => {
      setErrorMessage(null);

      // Bypass captcha check for development
      // if (!captchaToken) {
      //   setErrorMessage("Please complete the CAPTCHA");
      //   return;
      // }

      setIsSignupRequest(true);
      const { response, err } = await userApi.signup({ ...values, captchaToken: "bypass-token" });
      setIsSignupRequest(false);

      if (response) {
        signupForm.resetForm();
        dispatch(setUser(response));
        dispatch(setAuthModalOpen(false));
        toast.success("Sign up successful!");
      } else if (err) {
        setErrorMessage(err.message);
      }
    },
  });

  return (
    <Box component="form" onSubmit={signupForm.handleSubmit}>
      <Stack spacing={3}>
        {/* Input Fields */}
        <TextField
          type="text"
          placeholder="Username"
          name="username"
          fullWidth
          value={signupForm.values.username}
          onChange={signupForm.handleChange}
          error={Boolean(signupForm.touched.username && signupForm.errors.username)}
          helperText={signupForm.touched.username && signupForm.errors.username}
        />
        <TextField
          type="email"
          placeholder="Email"
          name="email"
          fullWidth
          value={signupForm.values.email}
          onChange={signupForm.handleChange}
          error={Boolean(signupForm.touched.email && signupForm.errors.email)}
          helperText={signupForm.touched.email && signupForm.errors.email}
        />
        <TextField
          type="text"
          placeholder="Display Name"
          name="displayName"
          fullWidth
          value={signupForm.values.displayName}
          onChange={signupForm.handleChange}
          error={Boolean(signupForm.touched.displayName && signupForm.errors.displayName)}
          helperText={signupForm.touched.displayName && signupForm.errors.displayName}
        />
        <TextField
          type="password"
          placeholder="Password"
          name="password"
          fullWidth
          value={signupForm.values.password}
          onChange={signupForm.handleChange}
          error={Boolean(signupForm.touched.password && signupForm.errors.password)}
          helperText={signupForm.touched.password && signupForm.errors.password}
        />
        <TextField
          type="password"
          placeholder="Confirm Password"
          name="confirmPassword"
          fullWidth
          value={signupForm.values.confirmPassword}
          onChange={signupForm.handleChange}
          error={Boolean(signupForm.touched.confirmPassword && signupForm.errors.confirmPassword)}
          helperText={signupForm.touched.confirmPassword && signupForm.errors.confirmPassword}
        />

        {/* ReCAPTCHA - Commented out for development */}
        {/* <ReCAPTCHA
          sitekey={process.env.REACT_APP_RECAPTCHA_SITE_KEY}
          onChange={handleCaptchaChange}
        /> */}
      </Stack>

      {/* Signup Button */}
      <LoadingButton
        type="submit"
        fullWidth
        size="large"
        variant="contained"
        sx={{ marginTop: 4 }}
        loading={isSignupRequest}
      >
        Sign up
      </LoadingButton>

      {/* Google Sign-In Button - Commented out for development */}
      {/* <Box id="googleSignInButton" sx={{ marginTop: 2, textAlign: "center" }} /> */}

      {/* Switch to Sign In */}
      <Button fullWidth sx={{ marginTop: 1 }} onClick={switchAuthState}>
        Sign in
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

export default SignupForm;
