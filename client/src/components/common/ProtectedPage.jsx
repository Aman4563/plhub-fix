import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Box, CircularProgress, Typography, alpha, useTheme } from "@mui/material";
import { setAuthModalOpen } from "../../redux/features/authModalSlice";

/**
 * ProtectedPage Component
 * - Wraps content that should only be accessible to authenticated users.
 * - Shows loading state while checking authentication.
 * - Opens the authentication modal if the user is not logged in.
 *
 * @param {Object} props - Component props.
 * @param {ReactNode} props.children - The child components to render if the user is authenticated.
 */
const ProtectedPage = ({ children }) => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const { user, isAuthenticating } = useSelector((state) => state.user);

  useEffect(() => {
    // Only check after auth has completed
    // If user is null and not authenticating, they need to log in
    if (!isAuthenticating && !user) {
      // Double-check token in case there's a race condition
      const token = localStorage.getItem("actkn");
      if (!token) {
        dispatch(setAuthModalOpen(true));
      }
    }
  }, [user, isAuthenticating, dispatch]);

  // Show loading state while checking authentication
  if (isAuthenticating) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
          gap: 2,
        }}
      >
        <CircularProgress 
          size={48} 
          thickness={4}
          sx={{ color: theme.palette.primary.main }}
        />
        <Typography 
          variant="body2" 
          sx={{ color: alpha(theme.palette.text.primary, 0.6) }}
        >
          Checking authentication...
        </Typography>
      </Box>
    );
  }

  // Render children if user is authenticated, otherwise show message
  if (!user) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
          gap: 2,
          textAlign: "center",
          px: 3,
        }}
      >
        <Typography variant="h6" sx={{ color: alpha(theme.palette.text.primary, 0.7) }}>
          Please sign in to access this page
        </Typography>
        <Typography variant="body2" sx={{ color: alpha(theme.palette.text.primary, 0.5) }}>
          You need to be logged in to view this content.
        </Typography>
      </Box>
    );
  }

  return children;
};

export default ProtectedPage;
