/**
 * AdminProtectedPage Component
 * Wraps content that requires admin or moderator access
 */

import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Box, Typography, CircularProgress, Paper, Button } from "@mui/material";
import ShieldIcon from "@mui/icons-material/Shield";
import LockIcon from "@mui/icons-material/Lock";
import HomeIcon from "@mui/icons-material/Home";

/**
 * AdminProtectedPage Component
 * @param {Object} props
 * @param {ReactNode} props.children - Content to render if authorized
 * @param {string} props.requiredRole - Minimum role required ("moderator" | "admin")
 */
const AdminProtectedPage = ({ children, requiredRole = "moderator" }) => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.user);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const roleHierarchy = {
    user: 0,
    moderator: 1,
    admin: 2,
  };

  useEffect(() => {
    const checkAuthorization = () => {
      if (!user) {
        setIsAuthorized(false);
        setIsLoading(false);
        return;
      }

      const userLevel = roleHierarchy[user.role] ?? 0;
      const requiredLevel = roleHierarchy[requiredRole] ?? 1;

      setIsAuthorized(userLevel >= requiredLevel);
      setIsLoading(false);
    };

    checkAuthorization();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, requiredRole]);

  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
          p: 3,
        }}
      >
        <Paper
          sx={{
            p: 6,
            textAlign: "center",
            maxWidth: 450,
            background: "linear-gradient(135deg, rgba(229, 9, 20, 0.1) 0%, rgba(20, 20, 20, 0.95) 100%)",
            border: "1px solid rgba(229, 9, 20, 0.3)",
          }}
        >
          <LockIcon sx={{ fontSize: 72, color: "primary.main", mb: 2 }} />
          <Typography variant="h5" gutterBottom fontWeight={600}>
            Authentication Required
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Please sign in to access this page.
          </Typography>
          <Button
            variant="contained"
            startIcon={<HomeIcon />}
            onClick={() => navigate("/")}
          >
            Go to Home
          </Button>
        </Paper>
      </Box>
    );
  }

  if (!isAuthorized) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
          p: 3,
        }}
      >
        <Paper
          sx={{
            p: 6,
            textAlign: "center",
            maxWidth: 450,
            background: "linear-gradient(135deg, rgba(229, 9, 20, 0.1) 0%, rgba(20, 20, 20, 0.95) 100%)",
            border: "1px solid rgba(229, 9, 20, 0.3)",
          }}
        >
          <ShieldIcon sx={{ fontSize: 72, color: "error.main", mb: 2 }} />
          <Typography variant="h5" gutterBottom fontWeight={600}>
            Access Denied
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 1 }}>
            You don't have permission to access this page.
          </Typography>
          <Typography variant="caption" color="text.disabled" display="block" sx={{ mb: 3 }}>
            Required role: {requiredRole.charAt(0).toUpperCase() + requiredRole.slice(1)} or higher
          </Typography>
          <Button
            variant="contained"
            startIcon={<HomeIcon />}
            onClick={() => navigate("/")}
          >
            Go to Home
          </Button>
        </Paper>
      </Box>
    );
  }

  return children;
};

export default AdminProtectedPage;

