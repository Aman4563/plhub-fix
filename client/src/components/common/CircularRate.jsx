import { Box, Typography, CircularProgress } from "@mui/material";

/**
 * CircularRate Component
 * - Displays a circular progress bar to represent a percentage value.
 * - Shows the numeric value in the center of the circular progress.
 *
 * @param {Object} props - React props.
 * @param {number} props.value - The value to display as a percentage (e.g., `7.5` for 75%).
 */
const CircularRate = ({ value }) => {
  const displayValue = Math.round(value * 10) / 10; // Round to one decimal place

  return (
    <Box
      sx={{
        position: "relative",
        display: "inline-block",
        width: "max-content",
      }}
    >
      {/* Circular Progress Bar */}
      <CircularProgress
        variant="determinate"
        value={value * 10} // Convert value to percentage (e.g., 7.5 becomes 75)
        color="success"
        size={50} // Set the size of the progress circle
      />
      
      {/* Centered Text */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography
          variant="caption"
          component="div"
          fontWeight="700"
          sx={{ marginTop: "-5px" }} // Adjust text alignment
        >
          {displayValue}
        </Typography>
      </Box>
    </Box>
  );
};

export default CircularRate;
