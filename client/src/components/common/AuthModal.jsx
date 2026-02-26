import { Box, Modal } from "@mui/material";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setAuthModalOpen, clearAuthError } from "../../redux/features/authModalSlice";
import Logo from "./Logo";
import SigninForm from "./SigninForm";
import SignupForm from "./SignupForm";
import userApi from "../../api/modules/user.api";

const actionState = {
  signin: "signin",
  signup: "signup",
};

/**
 * AuthModal Component
 * - Handles user authentication through signin/signup forms and Google OAuth.
 */
const AuthModal = () => {
  const { authModalOpen } = useSelector((state) => state.authModal);
  const dispatch = useDispatch();

  const [action, setAction] = useState(actionState.signin);

  /**
   * Sets up Google Sign-In and default action on modal open.
   */
  useEffect(() => {
    if (authModalOpen) {
      setAction(actionState.signin);
      dispatch(clearAuthError());
    }
  }, [authModalOpen, dispatch]);

  /**
   * Handles modal close event.
   */
  const handleClose = () => {
    dispatch(setAuthModalOpen(false));
    dispatch(clearAuthError());
  };

  /**
   * Switches between signin and signup forms.
   *
   * @param {string} state - The new action state.
   */
  const switchAuthState = (state) => {
    setAction(state);
    dispatch(clearAuthError());
  };

  /**
   * Handles Google Sign-In callback.
   *
   * @param {Object} response - Google OAuth response object.
   */
  const handleGoogleSignIn = async (response) => {
    try {
      const { credential: tokenId } = response;
      const { response: data, err } = await userApi.googleSignin({ tokenId });

      if (err) {
        dispatch(setAuthModalOpen(false));
      } else {
        dispatch(setAuthModalOpen(false));
      }
    } catch (error) {
      dispatch(setAuthModalOpen(false));
    }
  };

  return (
    <Modal open={authModalOpen} onClose={handleClose}>
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "100%",
          maxWidth: "600px",
          padding: 4,
          outline: "none",
        }}
      >
        <Box sx={{ padding: 4, boxShadow: 24, backgroundColor: "background.paper" }}>
          {/* Logo */}
          <Box sx={{ textAlign: "center", marginBottom: "2rem" }}>
            <Logo />
          </Box>

          {/* Test Content */}
          <Box sx={{ textAlign: "center" }}>
            <h2>Auth Modal Test</h2>
            <p>Modal is working!</p>
          </Box>

          {/* Signin Form */}
          {action === actionState.signin && (
            <>
              <SigninForm switchAuthState={() => switchAuthState(actionState.signup)} />
            </>
          )}

          {/* Signup Form */}
          {action === actionState.signup && (
            <>
              <SignupForm switchAuthState={() => switchAuthState(actionState.signin)} />
            </>
          )}
        </Box>
      </Box>
    </Modal>
  );
};

export default AuthModal;
