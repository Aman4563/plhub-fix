/**
 * Theme Configuration
 * Netflix/IMDb inspired design with modern typography and colors
 */

import { createTheme } from "@mui/material/styles";

export const themeModes = {
  dark: "dark",
  light: "light",
};

const themeConfigs = {
  custom: ({ mode }) => {
    const isDark = mode === themeModes.dark;

    // Color palette inspired by Netflix/IMDb
    const palette = isDark
      ? {
          primary: {
            main: "#E50914", // Netflix red
            light: "#F40612",
            dark: "#B20710",
            contrastText: "#ffffff",
          },
          secondary: {
            main: "#F5C518", // IMDb yellow
            light: "#FFD93D",
            dark: "#E6B800",
            contrastText: "#000000",
          },
          background: {
            default: "#0A0A0A",
            paper: "#141414",
          },
          text: {
            primary: "#FFFFFF",
            secondary: "#B3B3B3",
            disabled: "#666666",
          },
          divider: "rgba(255, 255, 255, 0.08)",
          action: {
            active: "#FFFFFF",
            hover: "rgba(255, 255, 255, 0.08)",
            selected: "rgba(255, 255, 255, 0.12)",
            disabled: "rgba(255, 255, 255, 0.26)",
            disabledBackground: "rgba(255, 255, 255, 0.12)",
          },
        }
      : {
          primary: {
            main: "#E50914",
            light: "#F40612",
            dark: "#B20710",
            contrastText: "#ffffff",
          },
          secondary: {
            main: "#F5C518",
            light: "#FFD93D",
            dark: "#E6B800",
            contrastText: "#000000",
          },
          background: {
            default: "#F5F5F5",
            paper: "#FFFFFF",
          },
          text: {
            primary: "#141414",
            secondary: "#666666",
            disabled: "#999999",
          },
          divider: "rgba(0, 0, 0, 0.08)",
        };

    return createTheme({
      palette: {
        mode,
        ...palette,
        warning: {
          main: "#F5C518", // IMDb yellow for ratings
          light: "#FFD93D",
          dark: "#E6B800",
        },
        success: {
          main: "#46D369", // Green for streaming
          light: "#6EE793",
          dark: "#2EAF4E",
        },
        info: {
          main: "#0080FF",
          light: "#33A0FF",
          dark: "#0066CC",
        },
        error: {
          main: "#E50914",
          light: "#F40612",
          dark: "#B20710",
        },
      },
      typography: {
        fontFamily: [
          "Netflix Sans",
          "Helvetica Neue",
          "Segoe UI",
          "Roboto",
          "Arial",
          "sans-serif",
        ].join(","),
        h1: {
          fontSize: "3.5rem",
          fontWeight: 700,
          letterSpacing: "-0.02em",
          lineHeight: 1.2,
        },
        h2: {
          fontSize: "2.5rem",
          fontWeight: 700,
          letterSpacing: "-0.01em",
          lineHeight: 1.3,
        },
        h3: {
          fontSize: "2rem",
          fontWeight: 600,
          letterSpacing: "-0.01em",
          lineHeight: 1.3,
        },
        h4: {
          fontSize: "1.5rem",
          fontWeight: 600,
          letterSpacing: "-0.01em",
          lineHeight: 1.4,
        },
        h5: {
          fontSize: "1.25rem",
          fontWeight: 600,
          lineHeight: 1.4,
        },
        h6: {
          fontSize: "1rem",
          fontWeight: 600,
          lineHeight: 1.5,
        },
        subtitle1: {
          fontSize: "1rem",
          fontWeight: 500,
          lineHeight: 1.5,
        },
        subtitle2: {
          fontSize: "0.875rem",
          fontWeight: 500,
          lineHeight: 1.5,
        },
        body1: {
          fontSize: "1rem",
          lineHeight: 1.6,
        },
        body2: {
          fontSize: "0.875rem",
          lineHeight: 1.6,
        },
        button: {
          textTransform: "none",
          fontWeight: 600,
          letterSpacing: "0.02em",
        },
        caption: {
          fontSize: "0.75rem",
          lineHeight: 1.5,
        },
      },
      shape: {
        borderRadius: 4,
      },
      shadows: [
        "none",
        "0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)",
        "0 3px 6px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.12)",
        "0 10px 20px rgba(0,0,0,0.15), 0 3px 6px rgba(0,0,0,0.10)",
        "0 15px 25px rgba(0,0,0,0.15), 0 5px 10px rgba(0,0,0,0.05)",
        "0 20px 40px rgba(0,0,0,0.2)",
        ...Array(19).fill("none"),
      ],
      components: {
        MuiCssBaseline: {
          styleOverrides: {
            body: {
              scrollbarColor: isDark ? "#6b6b6b #2b2b2b" : "#c1c1c1 #f1f1f1",
              "&::-webkit-scrollbar, & *::-webkit-scrollbar": {
                width: 8,
                height: 8,
              },
              "&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb": {
                borderRadius: 8,
                backgroundColor: isDark ? "#6b6b6b" : "#c1c1c1",
                minHeight: 24,
              },
              "&::-webkit-scrollbar-track, & *::-webkit-scrollbar-track": {
                backgroundColor: isDark ? "#2b2b2b" : "#f1f1f1",
              },
            },
          },
        },
        MuiButton: {
          defaultProps: {
            disableElevation: true,
          },
          styleOverrides: {
            root: {
              borderRadius: 4,
              padding: "8px 20px",
              transition: "all 0.2s ease-in-out",
            },
            contained: {
              "&:hover": {
                transform: "translateY(-1px)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
              },
            },
            outlined: {
              borderWidth: 2,
              "&:hover": {
                borderWidth: 2,
              },
            },
          },
        },
        MuiCard: {
          styleOverrides: {
            root: {
              borderRadius: 8,
              transition: "transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out",
              "&:hover": {
                transform: "scale(1.02)",
                boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
              },
            },
          },
        },
        MuiChip: {
          styleOverrides: {
            root: {
              borderRadius: 4,
              fontWeight: 500,
            },
          },
        },
        MuiPaper: {
          styleOverrides: {
            root: {
              backgroundImage: "none",
            },
          },
        },
        MuiAppBar: {
          styleOverrides: {
            root: {
              backgroundImage: "none",
            },
          },
        },
        MuiDialog: {
          styleOverrides: {
            paper: {
              borderRadius: 8,
            },
          },
        },
        MuiTooltip: {
          styleOverrides: {
            tooltip: {
              backgroundColor: isDark ? "rgba(97, 97, 97, 0.95)" : "rgba(33, 33, 33, 0.95)",
              fontSize: "0.75rem",
              borderRadius: 4,
            },
          },
        },
        MuiSkeleton: {
          styleOverrides: {
            root: {
              backgroundColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)",
            },
          },
        },
        MuiTab: {
          styleOverrides: {
            root: {
              textTransform: "none",
              fontWeight: 500,
              fontSize: "0.9375rem",
              minWidth: "auto",
              padding: "12px 16px",
            },
          },
        },
        MuiRating: {
          styleOverrides: {
            iconFilled: {
              color: "#F5C518", // IMDb yellow
            },
          },
        },
      },
    });
  },
};

export default themeConfigs;
