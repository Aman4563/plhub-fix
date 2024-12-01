import { Typography } from "@mui/material";

/**
 * Logo Component
 * - Displays a clickable logo that redirects to the home page.
 * - The logo supports a gradient effect for styling.
 */
const Logo = () => {
  return (
    <Typography fontWeight="700" fontSize="1.7rem">
      <a href="/" style={{ textDecoration: "none" }}>
        <img
          src="/logo_v3.svg"
          alt="Logo"
          style={{
            background: "linear-gradient(45deg, #864d25, #FFD700)", // Gradient effect
            WebkitBackgroundClip: "text", // Apply gradient to text for WebKit browsers
            WebkitTextFillColor: "transparent", // Make text transparent to show gradient
            width: "7rem", // Set logo width
            height: "auto", // Maintain aspect ratio
          }}
        />
      </a>
    </Typography>
  );
};

export default Logo;
