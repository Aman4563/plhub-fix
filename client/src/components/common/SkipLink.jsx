import { Box, useTheme } from "@mui/material";

/**
 * SkipLink Component
 * - Accessibility feature that allows keyboard users to skip directly to main content.
 * - Hidden by default, visible only when focused via keyboard navigation.
 */
const SkipLink = () => {
  const theme = useTheme();

  return (
    <Box
      component="a"
      href="#main-content"
      sx={{
        position: "absolute",
        top: "-100px",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 10000,
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.primary.contrastText,
        padding: "12px 24px",
        borderRadius: "0 0 8px 8px",
        textDecoration: "none",
        fontWeight: 600,
        fontSize: "0.875rem",
        boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
        transition: "top 0.2s ease",
        "&:focus": {
          top: 0,
          outline: `2px solid ${theme.palette.primary.light}`,
          outlineOffset: "2px",
        },
      }}
    >
      Skip to main content
    </Box>
  );
};

export default SkipLink;

