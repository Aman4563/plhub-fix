import { Box, Typography, CircularProgress, Tooltip } from "@mui/material";
import { useMemo } from "react";

/**
 * Get color based on rating value
 * @param {number} value - Rating value (0-10)
 * @returns {object} - Color configuration
 */
const getRatingColor = (value) => {
  if (value >= 7) {
    return {
      color: "success",
      bgColor: "rgba(46, 125, 50, 0.15)",
      textColor: "#2e7d32",
      label: "Good",
    };
  }
  if (value >= 5) {
    return {
      color: "warning",
      bgColor: "rgba(237, 108, 2, 0.15)",
      textColor: "#ed6c02",
      label: "Average",
    };
  }
  if (value > 0) {
    return {
      color: "error",
      bgColor: "rgba(211, 47, 47, 0.15)",
      textColor: "#d32f2f",
      label: "Poor",
    };
  }
  return {
    color: "inherit",
    bgColor: "rgba(158, 158, 158, 0.15)",
    textColor: "#9e9e9e",
    label: "Not Rated",
  };
};

/**
 * CircularRate Component
 * Displays a circular progress bar with color-coded ratings
 *
 * @param {Object} props - React props
 * @param {number} props.value - The rating value (0-10 scale)
 * @param {string} props.size - Size variant: "small" | "medium" | "large"
 * @param {boolean} props.showLabel - Whether to show the rating label tooltip
 */
const CircularRate = ({ value, size = "medium", showLabel = true }) => {
  const displayValue = useMemo(() => {
    if (value === null || value === undefined || isNaN(value)) return "NR";
    return Math.round(value * 10) / 10;
  }, [value]);

  const percentage = useMemo(() => {
    if (typeof displayValue !== "number") return 0;
    return displayValue * 10;
  }, [displayValue]);

  const ratingConfig = useMemo(() => getRatingColor(value || 0), [value]);

  // Size configurations
  const sizeConfig = useMemo(() => {
    switch (size) {
      case "small":
        return { circleSize: 40, fontSize: "0.7rem", thickness: 3 };
      case "large":
        return { circleSize: 70, fontSize: "1.1rem", thickness: 4 };
      default:
        return { circleSize: 50, fontSize: "0.85rem", thickness: 3.5 };
    }
  }, [size]);

  const content = (
    <Box
      sx={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      role="img"
      aria-label={`Rating: ${displayValue} out of 10${ratingConfig.label ? ` - ${ratingConfig.label}` : ""}`}
    >
      {/* Background circle */}
      <CircularProgress
        variant="determinate"
        value={100}
        size={sizeConfig.circleSize}
        thickness={sizeConfig.thickness}
        sx={{
          color: ratingConfig.bgColor,
          position: "absolute",
        }}
      />

      {/* Foreground progress */}
      <CircularProgress
        variant="determinate"
        value={percentage}
        size={sizeConfig.circleSize}
        thickness={sizeConfig.thickness}
        color={ratingConfig.color}
        sx={{
          transition: "all 0.3s ease",
          "& .MuiCircularProgress-circle": {
            strokeLinecap: "round",
          },
        }}
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
          component="span"
          fontWeight="700"
          sx={{
            fontSize: sizeConfig.fontSize,
            color: ratingConfig.textColor,
            lineHeight: 1,
          }}
        >
          {displayValue}
        </Typography>
      </Box>
    </Box>
  );

  if (showLabel && typeof displayValue === "number") {
    return (
      <Tooltip
        title={`${ratingConfig.label} (${displayValue}/10)`}
        arrow
        placement="top"
      >
        {content}
      </Tooltip>
    );
  }

  return content;
};

/**
 * Compact rating badge for use in cards
 */
export const RatingBadge = ({ value, size = "small" }) => {
  const displayValue = useMemo(() => {
    if (value === null || value === undefined || isNaN(value)) return "NR";
    return Math.round(value * 10) / 10;
  }, [value]);

  const ratingConfig = useMemo(() => getRatingColor(value || 0), [value]);

  const sizeStyles = useMemo(() => {
    switch (size) {
      case "small":
        return { px: 0.75, py: 0.25, fontSize: "0.7rem" };
      case "large":
        return { px: 1.5, py: 0.5, fontSize: "0.9rem" };
      default:
        return { px: 1, py: 0.35, fontSize: "0.8rem" };
    }
  }, [size]);

  return (
    <Tooltip title={`Rating: ${displayValue}/10`} arrow>
      <Box
        sx={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: ratingConfig.bgColor,
          color: ratingConfig.textColor,
          borderRadius: 1,
          fontWeight: 700,
          ...sizeStyles,
        }}
        role="img"
        aria-label={`Rating: ${displayValue} out of 10`}
      >
        ★ {displayValue}
      </Box>
    </Tooltip>
  );
};

export default CircularRate;
