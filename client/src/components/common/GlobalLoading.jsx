import { useSelector } from "react-redux";
import { Paper, Box, LinearProgress, Toolbar } from "@mui/material";
import { useEffect, useState } from "react";
import Logo from "./Logo";

/**
 * GlobalLoading Component
 * - Displays a full-screen loading indicator when global loading is active.
 * - The loading indicator smoothly transitions in and out based on the loading state.
 */
const GlobalLoading = () => {
  const { globalLoading } = useSelector((state) => state.globalLoading); // Access global loading state
  const [isLoading, setIsLoading] = useState(false); // Local state to manage loading animation

  useEffect(() => {
    if (globalLoading) {
      setIsLoading(true); // Activate loading screen immediately when global loading is true
    } else {
      // Delay hiding the loading screen for smooth transition
      const timer = setTimeout(() => setIsLoading(false), 1000);
      return () => clearTimeout(timer); // Clean up timeout on unmount or re-render
    }
  }, [globalLoading]);

  return (
    <Paper
      sx={{
        opacity: isLoading ? 1 : 0, // Fade in/out based on loading state
        pointerEvents: "none", // Prevent interactions during loading
        transition: "opacity 0.3s ease", // Smooth opacity transition
        position: "fixed",
        width: "100vw",
        height: "100vh",
        zIndex: 999, // Ensure the loading screen is above other elements
      }}
    >
      <Toolbar />
      <LinearProgress /> {/* Progress bar at the top */}
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)", // Center the logo
        }}
      >
        <Logo />
      </Box>
    </Paper>
  );
};

export default GlobalLoading;
