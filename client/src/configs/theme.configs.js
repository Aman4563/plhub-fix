import { createTheme } from "@mui/material/styles";
import { colors } from "@mui/material";

/**
 * Theme Modes
 * - Defines available theme modes: `dark` and `light`.
 */
export const themeModes = {
  dark: "dark",
  light: "light",
};

/**
 * Theme Configurations
 * - Generates a custom Material-UI theme based on the selected mode (dark or light).
 */
const themeConfigs = {
  /**
   * Creates a custom theme configuration based on the mode.
   *
   * @param {Object} config - Configuration object.
   * @param {string} config.mode - Theme mode, either "dark" or "light".
   * @returns {Object} - A Material-UI theme object.
   */
  custom: ({ mode }) => {
    // Define palette for dark and light modes
    const customPalette =
      mode === themeModes.dark
        ? {
            primary: {
              main: "#ff4136", // Primary color for dark mode
              contrastText: "#ffffff", // Text color for buttons and other components
            },
            secondary: {
              main: "#ff851b", // Secondary color for dark mode
              contrastText: "#ffffff",
            },
            background: {
              default: "#000000", // Background for the main content
              paper: "#131313", // Background for cards and dialogs
            },
          }
        : {
            primary: {
              main: "#ff4136", // Primary color for light mode
              contrastText: "#ffffff",
            },
            secondary: {
              main: "#ff851b", // Secondary color for light mode
            },
            background: {
              default: colors.grey["100"], // Light gray background for main content
            },
          };

    // Create and return the custom Material-UI theme
    return createTheme({
      palette: {
        mode, // Set mode dynamically based on the input
        ...customPalette,
      },
      components: {
        MuiButton: {
          defaultProps: {
            disableElevation: true, // Disable button shadow for a cleaner UI
          },
        },
      },
    });
  },
};

export default themeConfigs;
