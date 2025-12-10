import { Typography, Box } from "@mui/material";
import { Link } from "react-router-dom";

/**
 * Logo Component
 * - Displays a clickable logo that redirects to the home page using React Router.
 * - Supports optional size variant for different contexts (header vs footer).
 */
const Logo = ({ variant = "default" }) => {
  const sizes = {
    default: "7rem",
    small: "5rem",
    large: "9rem",
  };

  return (
    <Typography fontWeight="700" fontSize="1.7rem" component="div">
      <Box
        component={Link}
        to="/"
        sx={{
          display: "inline-block",
          textDecoration: "none",
          transition: "transform 0.2s ease, opacity 0.2s ease",
          "&:hover": {
            transform: "scale(1.02)",
            opacity: 0.9,
          },
        }}
      >
        <img
          src="/logo_v3.svg"
          alt="PLhub Logo"
          style={{
            width: sizes[variant] || sizes.default,
            height: "auto",
          }}
        />
      </Box>
    </Typography>
  );
};

export default Logo;
