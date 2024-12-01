import { Box, useTheme } from "@mui/material";
import uiConfigs from "../../configs/ui.configs";

/**
 * ImageHeader Component
 * - Displays a responsive background image with a gradient overlay.
 * - Gradient adjusts based on the theme mode (light/dark).
 *
 * @param {Object} props - Component props.
 * @param {string} props.imgPath - The URL of the image to be used as the background.
 */
const ImageHeader = ({ imgPath }) => {
  const theme = useTheme(); // Access the current theme mode (light or dark)

  return (
    <Box
      sx={{
        zIndex: -1, // Ensure the image is behind other content
        position: "relative", // Required for absolute positioning of the gradient overlay
        paddingTop: { xs: "60%", sm: "40%", md: "35%" }, // Responsive aspect ratio
        backgroundPosition: "top", // Align the image to the top
        backgroundSize: "cover", // Ensure the image covers the container
        backgroundImage: `url(${imgPath})`, // Set the background image
        backgroundAttachment: "fixed", // Fix the image position during scrolling
        "&::before": {
          content: '""', // Creates the gradient overlay
          position: "absolute",
          left: 0,
          bottom: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none", // Prevent interactions with the overlay
          ...uiConfigs.style.gradientBgImage[theme.palette.mode], // Gradient styling based on theme mode
        },
      }}
    />
  );
};

export default ImageHeader;
