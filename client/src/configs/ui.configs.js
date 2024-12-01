/**
 * UI Configurations
 * - Contains reusable styles and sizes for consistent UI design.
 */
const uiConfigs = {
  style: {
    /**
     * Vertical Gradient Background Image
     * - Applies a gradient background that fades vertically.
     */
    gradientBgImage: {
      dark: {
        backgroundImage: "linear-gradient(to top, rgba(0,0,0,1), rgba(0,0,0,0))",
      },
      light: {
        backgroundImage: "linear-gradient(to top, rgba(245,245,245,1), rgba(0,0,0,0))",
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
      maxWidth: "1366px",
      margin: "auto",
      padding: 2,
    },

    /**
     * Background Image Styling
     * - Applies a styled background image with cover and centered positioning.
     *
     * @param {string} imgPath - Path to the background image.
     * @returns {Object} - CSS style object.
     */
    backgroundImage: (imgPath) => ({
      position: "relative",
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundColor: "darkgrey",
      backgroundImage: `url(${imgPath})`,
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
    contentMaxWidth: "1366px",
  },
};

export default uiConfigs;
