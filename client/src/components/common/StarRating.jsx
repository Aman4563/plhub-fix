/**
 * Star Rating Component
 * IMDb-style 1-10 rating with interactive stars
 */

import { useState } from "react";
import { Box, Typography, Stack, IconButton, Tooltip } from "@mui/material";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import StarHalfIcon from "@mui/icons-material/StarHalf";

/**
 * Interactive Star Rating
 * Allows users to rate from 1-10
 */
export const InteractiveStarRating = ({
  value = 0,
  onChange,
  size = "medium",
  disabled = false,
  showLabel = true,
}) => {
  const [hoverValue, setHoverValue] = useState(0);

  const sizes = {
    small: { icon: 20, fontSize: "0.875rem" },
    medium: { icon: 28, fontSize: "1rem" },
    large: { icon: 36, fontSize: "1.25rem" },
  };

  const currentSize = sizes[size] || sizes.medium;
  const displayValue = hoverValue || value;

  const handleClick = (rating) => {
    if (!disabled && onChange) {
      // Toggle off if clicking same rating
      onChange(rating === value ? 0 : rating);
    }
  };

  const getRatingLabel = (rating) => {
    const labels = {
      1: "Appalling",
      2: "Horrible",
      3: "Very Bad",
      4: "Bad",
      5: "Average",
      6: "Fine",
      7: "Good",
      8: "Very Good",
      9: "Great",
      10: "Masterpiece",
    };
    return labels[rating] || "";
  };

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={0.5}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
          <Tooltip key={rating} title={`${rating} - ${getRatingLabel(rating)}`} arrow>
            <IconButton
              size="small"
              onClick={() => handleClick(rating)}
              onMouseEnter={() => !disabled && setHoverValue(rating)}
              onMouseLeave={() => setHoverValue(0)}
              disabled={disabled}
              sx={{
                p: 0.25,
                color: rating <= displayValue ? "warning.main" : "action.disabled",
                transition: "transform 0.1s, color 0.2s",
                "&:hover": {
                  transform: disabled ? "none" : "scale(1.2)",
                  backgroundColor: "transparent",
                },
              }}
            >
              {rating <= displayValue ? (
                <StarIcon sx={{ fontSize: currentSize.icon }} />
              ) : (
                <StarBorderIcon sx={{ fontSize: currentSize.icon }} />
              )}
            </IconButton>
          </Tooltip>
        ))}
      </Stack>
      
      {showLabel && displayValue > 0 && (
        <Typography
          variant="body2"
          sx={{
            mt: 0.5,
            fontSize: currentSize.fontSize,
            color: "text.secondary",
            fontWeight: 500,
          }}
        >
          {displayValue}/10 - {getRatingLabel(displayValue)}
        </Typography>
      )}
    </Box>
  );
};

/**
 * Display-only Star Rating
 * Shows rating with filled/half/empty stars
 */
export const DisplayStarRating = ({
  value = 0,
  maxStars = 5,
  size = "small",
  showValue = true,
  totalRatings = null,
}) => {
  const sizes = {
    small: { icon: 16, fontSize: "0.75rem" },
    medium: { icon: 20, fontSize: "0.875rem" },
    large: { icon: 24, fontSize: "1rem" },
  };

  const currentSize = sizes[size] || sizes.small;
  
  // Convert 1-10 scale to 5-star scale
  const normalizedValue = (value / 10) * maxStars;
  const fullStars = Math.floor(normalizedValue);
  const hasHalfStar = normalizedValue % 1 >= 0.5;
  const emptyStars = maxStars - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <Stack direction="row" alignItems="center" spacing={0.5}>
      <Stack direction="row" spacing={0}>
        {[...Array(fullStars)].map((_, i) => (
          <StarIcon
            key={`full-${i}`}
            sx={{ fontSize: currentSize.icon, color: "warning.main" }}
          />
        ))}
        {hasHalfStar && (
          <StarHalfIcon
            sx={{ fontSize: currentSize.icon, color: "warning.main" }}
          />
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <StarBorderIcon
            key={`empty-${i}`}
            sx={{ fontSize: currentSize.icon, color: "action.disabled" }}
          />
        ))}
      </Stack>
      
      {showValue && (
        <Typography
          variant="body2"
          sx={{
            fontSize: currentSize.fontSize,
            color: "text.secondary",
            fontWeight: 500,
          }}
        >
          {value.toFixed(1)}
          {totalRatings !== null && (
            <span style={{ opacity: 0.7 }}> ({totalRatings.toLocaleString()})</span>
          )}
        </Typography>
      )}
    </Stack>
  );
};

/**
 * Compact Rating Badge
 * Shows rating in a badge format like IMDb
 */
export const RatingBadge = ({ value, size = "medium" }) => {
  const sizes = {
    small: { width: 36, height: 36, fontSize: "0.75rem", iconSize: 12 },
    medium: { width: 48, height: 48, fontSize: "1rem", iconSize: 16 },
    large: { width: 60, height: 60, fontSize: "1.25rem", iconSize: 20 },
  };

  const currentSize = sizes[size] || sizes.medium;

  return (
    <Box
      sx={{
        width: currentSize.width,
        height: currentSize.height,
        borderRadius: "8px",
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        border: "1px solid rgba(255, 255, 255, 0.1)",
      }}
    >
      <StarIcon sx={{ fontSize: currentSize.iconSize, color: "warning.main" }} />
      <Typography
        sx={{
          fontSize: currentSize.fontSize,
          fontWeight: 700,
          color: "white",
          lineHeight: 1,
        }}
      >
        {value?.toFixed(1) || "N/A"}
      </Typography>
    </Box>
  );
};

const StarRatingComponents = {
  InteractiveStarRating,
  DisplayStarRating,
  RatingBadge,
};

export default StarRatingComponents;

