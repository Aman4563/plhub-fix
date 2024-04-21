import { createTheme } from "@mui/material/styles";
import { colors } from "@mui/material";

export const themeModes = {
  dark: "dark",
  light: "light"
};

const themeConfigs = {
  custom: ({ mode }) => {
    const customPalette = mode === themeModes.dark
      ? {
        primary: {
          main: "#ff4136", // Solid gold color for both dark and light modes
          contrastText: "#ffffff"
        },
        secondary: {
          main: "#ff851b",
          contrastText: "#ffffff"
        },
        background: {
          default: "#000000",
          paper: "#131313"
        }
      }
      : {
        primary: {
          main: "#ff4136", // Solid gold color for both dark and light modes
          contrastText: "#ffffff"
        },
        secondary: {
          main: "#ff851b"
        },
        background: {
          default: colors.grey["100"],
        }
      };

    return createTheme({
      palette: {
        mode,
        ...customPalette
      },
      components: {
        MuiButton: {
          defaultProps: { disableElevation: true }
        }
      }
    });
  }
};

export default themeConfigs;
