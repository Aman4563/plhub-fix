import { Box, Stack, Typography, Button, useTheme } from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { Link } from "react-router-dom";
import React from "react";

/**
 * Container Component
 * - A reusable layout container that displays a header with a decorative line.
 * - Optionally includes a "View All" button for navigation.
 *
 * @param {Object} props - React props.
 * @param {string} [props.header] - Optional header text to display at the top.
 * @param {string} [props.viewAllPath] - Optional path for the "View All" link.
 * @param {React.ReactNode} props.children - Child components or elements to render.
 */
const Container = ({ header, viewAllPath, children }) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        marginTop: "5rem",
        marginX: "auto",
        color: "text.primary",
        overflowX: "clip",
      }}
    >
      <Stack spacing={4}>
        {header && (
          <Box
            sx={{
              position: "relative",
              paddingX: { xs: "20px", md: 0 },
              maxWidth: "1366px",
              marginX: "auto",
              width: "100%",
            }}
          >
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
            >
              {/* Header with decorative line */}
              <Box
                sx={{
                  position: "relative",
                  "&::before": {
                    content: '""',
                    position: "absolute",
                    left: 0,
                    top: "100%",
                    marginTop: "8px",
                    height: "4px",
                    width: "60px",
                    background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                    borderRadius: "2px",
              },
            }}
          >
            <Typography
              variant="h5"
              fontWeight="700"
              textTransform="uppercase"
                  sx={{
                    fontSize: { xs: "1.1rem", md: "1.25rem" },
                    letterSpacing: "0.02em",
                  }}
            >
              {header}
            </Typography>
              </Box>

              {/* View All Button */}
              {viewAllPath && (
                <Button
                  component={Link}
                  to={viewAllPath}
                  endIcon={<ArrowForwardIcon sx={{ fontSize: "1rem" }} />}
                  sx={{
                    color: theme.palette.text.secondary,
                    textTransform: "none",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    padding: "4px 8px",
                    minWidth: "auto",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      color: theme.palette.primary.main,
                      backgroundColor: "transparent",
                      transform: "translateX(4px)",
                      "& .MuiButton-endIcon": {
                        transform: "translateX(2px)",
                      },
                    },
                    "& .MuiButton-endIcon": {
                      marginLeft: "4px",
                      transition: "transform 0.2s ease",
                    },
                  }}
                >
                  View All
                </Button>
              )}
            </Stack>
          </Box>
        )}
        {/* Children wrapper with same centering as header */}
        <Box
          sx={{
            paddingX: { xs: "20px", md: 0 },
            maxWidth: "1366px",
            marginX: "auto",
            width: "100%",
          }}
        >
          {children}
        </Box>
      </Stack>
    </Box>
  );
};

export default Container;
