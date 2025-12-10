import { useState, useEffect } from "react";
import { Box, Typography, IconButton } from "@mui/material";
import { SwiperSlide } from "swiper/react";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import CloseIcon from "@mui/icons-material/Close";
import { Link } from "react-router-dom";

import AutoSwiper from "./AutoSwiper";
import { routesGen } from "../../routes/routes";
import tmdbConfigs from "../../api/configs/tmdb.configs";
import { MediaSliderSkeleton } from "./MediaSkeleton";

const STORAGE_KEY = "plhub_watch_history";
const MAX_HISTORY = 20;

/**
 * Get watch history from localStorage
 */
const getWatchHistory = () => {
  try {
    const history = localStorage.getItem(STORAGE_KEY);
    return history ? JSON.parse(history) : [];
  } catch {
    return [];
  }
};

/**
 * Add item to watch history
 */
export const addToWatchHistory = (media, mediaType) => {
  try {
    const history = getWatchHistory();
    
    // Remove if already exists (to move to front)
    const filteredHistory = history.filter(
      (item) => !(item.id === media.id && item.mediaType === mediaType)
    );
    
    // Add to front
    const newItem = {
      id: media.id,
      mediaType,
      title: media.title || media.name,
      poster_path: media.poster_path,
      backdrop_path: media.backdrop_path,
      vote_average: media.vote_average,
      timestamp: Date.now(),
    };
    
    const newHistory = [newItem, ...filteredHistory].slice(0, MAX_HISTORY);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
    
    return newHistory;
  } catch {
    return [];
  }
};

/**
 * Remove item from watch history
 */
const removeFromWatchHistory = (mediaId, mediaType) => {
  try {
    const history = getWatchHistory();
    const newHistory = history.filter(
      (item) => !(item.id === mediaId && item.mediaType === mediaType)
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
    return newHistory;
  } catch {
    return [];
  }
};

/**
 * ContinueWatching Component
 * - Shows recently viewed media for quick access.
 * - Only visible when user has watch history.
 * - Persists in localStorage.
 */
const ContinueWatching = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const watchHistory = getWatchHistory();
    setHistory(watchHistory);
    setLoading(false);
  }, []);

  const handleRemove = (e, mediaId, mediaType) => {
    e.preventDefault();
    e.stopPropagation();
    const newHistory = removeFromWatchHistory(mediaId, mediaType);
    setHistory(newHistory);
  };

  // Only show if there's history
  if (loading) {
    return <MediaSliderSkeleton count={4} />;
  }

  if (history.length === 0) {
    return null;
  }

  return (
    <AutoSwiper>
      {history.map((item) => (
        <SwiperSlide 
          key={`continue-${item.id}-${item.mediaType}`} 
          style={{ paddingInline: "0.5rem" }}
        >
          <Link to={routesGen.mediaDetail(item.mediaType, item.id)}>
            <Box
              sx={{
                position: "relative",
                paddingTop: "56.25%", // 16:9 aspect ratio for backdrop
                borderRadius: "0.5rem",
                overflow: "hidden",
                backgroundColor: "background.paper",
                "&:hover": {
                  "& .continue-overlay": {
                    opacity: 1,
                  },
                  "& .continue-play": {
                    opacity: 1,
                    transform: "translate(-50%, -50%) scale(1)",
                  },
                  "& .continue-image": {
                    transform: "scale(1.05)",
                  },
                },
              }}
            >
              {/* Backdrop Image */}
              <Box
                className="continue-image"
                component="img"
                src={tmdbConfigs.backdropPath(item.backdrop_path || item.poster_path)}
                alt={item.title}
                loading="lazy"
                sx={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  transition: "transform 0.3s ease",
                }}
              />

              {/* Overlay */}
              <Box
                className="continue-overlay"
                sx={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  background: "linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0) 100%)",
                  opacity: { xs: 1, md: 0.7 },
                  transition: "opacity 0.3s ease",
                }}
              />

              {/* Remove Button */}
              <IconButton
                size="small"
                onClick={(e) => handleRemove(e, item.id, item.mediaType)}
                sx={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  backgroundColor: "rgba(0,0,0,0.6)",
                  color: "white",
                  zIndex: 3,
                  "&:hover": {
                    backgroundColor: "rgba(0,0,0,0.8)",
                  },
                }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>

              {/* Play Button */}
              <IconButton
                className="continue-play"
                sx={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%) scale(0.9)",
                  opacity: { xs: 1, md: 0 },
                  transition: "all 0.25s ease",
                  backgroundColor: "rgba(255,255,255,0.95)",
                  color: "#000",
                  width: 48,
                  height: 48,
                  zIndex: 2,
                  "&:hover": {
                    backgroundColor: "white",
                    transform: "translate(-50%, -50%) scale(1.1)",
                  },
                }}
              >
                <PlayArrowIcon />
              </IconButton>

              {/* Title */}
              <Box
                sx={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  p: 1.5,
                  zIndex: 2,
                }}
              >
                <Typography
                  variant="body2"
                  fontWeight="600"
                  sx={{
                    color: "white",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    textShadow: "0 1px 3px rgba(0,0,0,0.8)",
                  }}
                >
                  {item.title}
                </Typography>
              </Box>
            </Box>
          </Link>
        </SwiperSlide>
      ))}
    </AutoSwiper>
  );
};

export default ContinueWatching;

