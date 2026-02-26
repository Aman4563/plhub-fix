/**
 * UI Configurations
 * - Contains reusable styles and sizes for consistent UI design.
 */
const uiConfigs = {
  style: {
    /**
     * Vertical Gradient Background Image
     * - Applies a smooth gradient background that fades vertically.
     * - Uses multiple color stops for a gradual, seamless transition.
     */
    gradientBgImage: {
      dark: {
        backgroundImage: "linear-gradient(to top, #000000 0%, rgba(0,0,0,0.95) 10%, rgba(0,0,0,0.8) 30%, rgba(0,0,0,0.5) 55%, rgba(0,0,0,0.25) 75%, rgba(0,0,0,0.1) 90%, transparent 100%)",
      },
      light: {
        backgroundImage: "linear-gradient(to top, #f5f5f5 0%, rgba(245,245,245,0.95) 10%, rgba(245,245,245,0.8) 30%, rgba(245,245,245,0.5) 55%, rgba(245,245,245,0.25) 75%, rgba(245,245,245,0.1) 90%, transparent 100%)",
      },
    },

    /**
     * Horizontal Gradient Background Image
     * - Applies a gradient background that fades horizontally.
     */
    horizontalGradientBgImage: {
      dark: {
        backgroundImage: "linear-gradient(to right, rgba(0,0,0,1), rgba(0,0,0,0))",
      },
      light: {
        backgroundImage: "linear-gradient(to right, rgba(245,245,245,1), rgba(0,0,0,0))",
      },
    },

    /**
     * Truncated Typography
     * - Limits the number of lines displayed for text with ellipsis for overflow.
     *
     * @param {number} lines - Number of lines to display.
     * @param {string} [textAlign="justify"] - Text alignment style.
     * @returns {Object} - CSS style object.
     */
    typoLines: (lines, textAlign = "justify") => ({
      textAlign,
      display: "-webkit-box",
      overflow: "hidden",
      WebkitBoxOrient: "vertical",
      WebkitLineClamp: lines,
    }),

    /**
     * Main Content Styling
     * - Applies consistent styling for the main content area.
     */
    mainContent: {
      maxWidth: "1600px",
      margin: "auto",
      padding: 2,
    },

    /**
     * Background Image Styling
     * - Applies a styled background image with cover and centered positioning.
     * - Handles empty/null image paths gracefully.
     *
     * @param {string} imgPath - Path to the background image.
     * @returns {Object} - CSS style object.
     */
    backgroundImage: (imgPath) => ({
      position: "relative",
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundColor: "#1a1a1a",
      backgroundImage: imgPath ? `url(${imgPath})` : "none",
    }),
  },

  size: {
    /**
     * Sidebar Width
     */
    sidebarWidth: "300px",

    /**
     * Maximum Width for Main Content
     */
    contentMaxWidth: "1600px",
  },
};

export default uiConfigs;
