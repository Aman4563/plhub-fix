import { Box, Stack, Typography } from "@mui/material";
import React from "react";

/**
 * Container Component
 * - A reusable layout container that optionally displays a header with a decorative line.
 *
 * @param {Object} props - React props.
 * @param {string} [props.header] - Optional header text to display at the top.
 * @param {React.ReactNode} props.children - Child components or elements to render inside the container.
 */
const Container = ({ header, children }) => {
  return (
    <Box
      sx={{
        marginTop: "5rem",
        marginX: "auto",
        color: "text.primary",
      }}
    >
      <Stack spacing={4}>
        {header && (
          <Box
            sx={{
              position: "relative",
              paddingX: { xs: "20px", md: 0 }, // Responsive horizontal padding
              maxWidth: "1366px", // Maximum width of the container
              marginX: "auto",
              width: "100%",
              "&::before": {
                content: '""', // Decorative line below the header
                position: "absolute",
                left: { xs: "20px", md: "0" }, // Responsive alignment for the line
                top: "100%", // Position the line below the header
                height: "5px",
                width: "100px",
                backgroundColor: "primary.main", // Line color from the theme
              },
            }}
          >
            <Typography
              variant="h5"
              fontWeight="700"
              textTransform="uppercase"
            >
              {header}
            </Typography>
          </Box>
        )}
        {children}
      </Stack>
    </Box>
  );
};

export default Container;
