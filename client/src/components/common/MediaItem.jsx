import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import FavoriteIcon from "@mui/icons-material/Favorite";
import ImageNotSupportedIcon from "@mui/icons-material/ImageNotSupported";
import MovieIcon from "@mui/icons-material/Movie";
import TvIcon from "@mui/icons-material/Tv";
import { Box, IconButton, Stack, Typography, Skeleton, Chip, Tooltip } from "@mui/material";
import { useEffect, useState, memo, useMemo } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";

import tmdbConfigs from "../../api/configs/tmdb.configs";
import uiConfigs from "../../configs/ui.configs";
import { routesGen } from "../../routes/routes";
import CircularRate from "./CircularRate";
import favoriteUtils from "../../utils/favorite.utils";

/**
 * MediaItem Component
 * Displays a single media item with poster, title, release date, rating, and media type badge
 * Supports movies, TV shows, and people (actors)
 * Uses lazy loading for images with skeleton placeholder
 * Memoized to prevent unnecessary re-renders
 */
const MediaItem = memo(({ media, mediaType, showMediaType = false }) => {
  const { listFavorites } = useSelector((state) => state.user);

  const [title, setTitle] = useState("");
  const [posterPath, setPosterPath] = useState("");
  const [releaseDate, setReleaseDate] = useState(null);
  const [rate, setRate] = useState(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Determine actual media type (for mixed results like multi-search)
  const actualMediaType = useMemo(() => {
    if (media.media_type) {
      return media.media_type === "person" ? "people" : media.media_type;
    }
    return mediaType;
  }, [media.media_type, mediaType]);

  useEffect(() => {
    // Set the media title
    setTitle(media.title || media.name || media.mediaTitle || "Unknown");

    // Get the raw poster path - check all possible fields
    const rawPosterPath = media.poster_path || media.backdrop_path || media.mediaPoster || media.profile_path;
    
    // Set the poster image path using tmdbConfigs
    const generatedPath = tmdbConfigs.posterPath(rawPosterPath);
    
    // Only update if the path actually changed
    if (generatedPath !== posterPath) {
      setPosterPath(generatedPath);
      
      // If no valid path, mark as error immediately
      if (!generatedPath) {
        setImageError(true);
        setImageLoaded(true);
      } else {
        setImageError(false);
        setImageLoaded(false);
      }
    }

    // Set the release date based on the media type
    if (actualMediaType === tmdbConfigs.mediaType.movie || actualMediaType === "movie") {
      setReleaseDate(media.release_date?.split("-")[0]);
    } else if (actualMediaType !== "people") {
      setReleaseDate(media.first_air_date?.split("-")[0]);
    }

    // Set the rating
    setRate(media.vote_average || media.mediaRate);
  }, [media, actualMediaType, posterPath]);

  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoaded(true);
  };

  // Get media ID for routing
  const getMediaId = () => media.mediaId || media.id;

  // Check if favorite
  const isFavorite = favoriteUtils.check({ 
    listFavorites, 
    mediaId: media.id || media.mediaId 
  });

  // Get media type display info
  const getMediaTypeInfo = () => {
    if (actualMediaType === "movie") {
      return { icon: <MovieIcon sx={{ fontSize: 12 }} />, label: "Movie" };
    }
    if (actualMediaType === "tv") {
      return { icon: <TvIcon sx={{ fontSize: 12 }} />, label: "TV" };
    }
    return null;
  };

  const mediaTypeInfo = getMediaTypeInfo();

  return (
    <Link
      to={
        actualMediaType !== "people"
          ? routesGen.mediaDetail(actualMediaType, getMediaId())
          : routesGen.person(media.id)
      }
      aria-label={`View details for ${title}`}
    >
      <Box
        sx={{
          position: "relative",
          paddingTop: "150%",
          color: "primary.contrastText",
          borderRadius: "0.75rem",
          overflow: "hidden",
          backgroundColor: "background.paper",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          transition: "transform 0.3s ease, box-shadow 0.3s ease",
          "&:hover": {
            transform: "translateY(-4px)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
            "& .media-info": { 
              opacity: 1, 
              bottom: 0,
            },
            "& .media-back-drop": { 
              opacity: 1,
            },
            "& .media-play-btn": { 
              opacity: 1,
              transform: "translate(-50%, -50%) scale(1)",
            },
            "& .media-poster": {
              transform: "scale(1.08)",
            },
          },
        }}
      >
        {/* Skeleton placeholder - show while loading */}
        {!imageLoaded && (
          <Skeleton
            variant="rectangular"
            animation="wave"
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
            }}
          />
        )}

        {/* Fallback for missing/broken images */}
        {imageError && (
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "grey.900",
              gap: 1,
            }}
          >
            <ImageNotSupportedIcon sx={{ fontSize: 48, color: "grey.600" }} />
            <Typography 
              variant="caption" 
              color="grey.500"
              sx={{ 
                textAlign: "center", 
                px: 1,
                ...uiConfigs.style.typoLines(2, "center")
              }}
            >
              {title}
            </Typography>
          </Box>
        )}

        {/* Actual image - only render if we have a valid path */}
        {posterPath && !imageError && (
          <Box
            className="media-poster"
            component="img"
            src={posterPath}
            alt={title}
            onLoad={handleImageLoad}
            onError={handleImageError}
            loading="lazy"
            decoding="async"
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: imageLoaded ? 1 : 0,
              transition: "opacity 0.3s ease-in-out, transform 0.4s ease-out",
              transform: "scale(1)",
            }}
          />
        )}

        {/* Movies or TV Shows */}
        {actualMediaType !== "people" && (
          <>
            {/* Top badges row */}
            <Box
              sx={{
                position: "absolute",
                top: 8,
                left: 8,
                right: 8,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                zIndex: 3,
              }}
            >
              {/* Media Type Badge */}
              {showMediaType && mediaTypeInfo && (
                <Chip
                  icon={mediaTypeInfo.icon}
                  label={mediaTypeInfo.label}
                  size="small"
                  sx={{
                    height: 22,
                    fontSize: "0.65rem",
                    fontWeight: 600,
                    backgroundColor: "rgba(0,0,0,0.7)",
                    color: "white",
                    backdropFilter: "blur(4px)",
                    "& .MuiChip-icon": {
                      color: "white",
                    },
                  }}
                />
              )}

              {/* Favorite Icon */}
              {isFavorite && (
                <Tooltip title="In Favorites" arrow>
                  <FavoriteIcon
                    sx={{
                      fontSize: "1.4rem",
                      color: "error.main",
                      filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))",
                      ml: "auto",
                    }}
                  />
                </Tooltip>
              )}
            </Box>

            {/* Backdrop Overlay */}
            <Box
              className="media-back-drop"
              sx={{
                opacity: { xs: 1, md: 0 },
                transition: "opacity 0.3s ease-in-out",
                width: "100%",
                height: "100%",
                position: "absolute",
                top: 0,
                left: 0,
                backgroundImage: "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.5) 40%, rgba(0,0,0,0) 100%)",
                pointerEvents: "none",
              }}
            />

            {/* Play Button - Netflix style circular button */}
            <IconButton
              className="media-play-btn"
              aria-label={`Play ${title}`}
              sx={{
                display: { xs: "none", md: "flex" },
                opacity: 0,
                position: "absolute",
                top: "45%",
                left: "50%",
                transform: "translate(-50%, -50%) scale(0.8)",
                transition: "opacity 0.25s ease-in-out, transform 0.25s ease-out",
                zIndex: 3,
                width: 52,
                height: 52,
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                color: "#000",
                "&:hover": {
                  backgroundColor: "rgba(255, 255, 255, 1)",
                  transform: "translate(-50%, -50%) scale(1.1)",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
                },
              }}
            >
              <PlayArrowIcon sx={{ fontSize: 28 }} />
            </IconButton>

            {/* Media Info */}
            <Box
              className="media-info"
              sx={{
                transition: "opacity 0.3s ease-in-out, bottom 0.3s ease-out",
                opacity: { xs: 1, md: 0 },
                position: "absolute",
                bottom: { xs: 0, md: -10 },
                width: "100%",
                height: "max-content",
                boxSizing: "border-box",
                padding: { xs: "10px", md: "1rem" },
                zIndex: 2,
                pointerEvents: "none",
              }}
            >
              <Stack spacing={0.5}>
                {/* Rating and Year Row */}
                <Stack direction="row" alignItems="center" spacing={1}>
                  {rate > 0 && <CircularRate value={rate} size="small" />}
                  {releaseDate && (
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        color: "rgba(255,255,255,0.8)",
                        fontSize: "0.7rem",
                        fontWeight: 500,
                      }}
                    >
                      {releaseDate}
                    </Typography>
                  )}
                </Stack>

                {/* Title */}
                <Typography
                  variant="body2"
                  fontWeight="600"
                  sx={{
                    fontSize: { xs: "0.8rem", md: "0.85rem" },
                    color: "white",
                    textShadow: "0 1px 3px rgba(0,0,0,0.8)",
                    lineHeight: 1.3,
                    ...uiConfigs.style.typoLines(2, "left"),
                  }}
                >
                  {title}
                </Typography>
              </Stack>
            </Box>
          </>
        )}

        {/* People (Actors) */}
        {actualMediaType === "people" && (
          <Box
            sx={{
              position: "absolute",
              width: "100%",
              height: "max-content",
              bottom: 0,
              padding: "10px",
              backgroundColor: "rgba(0,0,0,0.75)",
              backdropFilter: "blur(4px)",
              zIndex: 2,
            }}
          >
            <Typography 
              sx={{ 
                ...uiConfigs.style.typoLines(1, "left"),
                fontSize: "0.85rem",
                fontWeight: 500,
              }}
            >
              {media.name}
            </Typography>
            {media.known_for_department && (
              <Typography 
                variant="caption" 
                color="grey.400"
                sx={{ fontSize: "0.7rem" }}
              >
                {media.known_for_department}
              </Typography>
            )}
          </Box>
        )}
      </Box>
    </Link>
  );
}, (prevProps, nextProps) => {
  // Custom comparison - only re-render if these specific props changed
  const prevMedia = prevProps.media;
  const nextMedia = nextProps.media;
  
  return (
    prevProps.mediaType === nextProps.mediaType &&
    prevProps.showMediaType === nextProps.showMediaType &&
    prevMedia.id === nextMedia.id &&
    prevMedia.mediaId === nextMedia.mediaId &&
    prevMedia.poster_path === nextMedia.poster_path &&
    prevMedia.mediaPoster === nextMedia.mediaPoster &&
    prevMedia.title === nextMedia.title &&
    prevMedia.name === nextMedia.name &&
    prevMedia.vote_average === nextMedia.vote_average &&
    prevMedia.mediaRate === nextMedia.mediaRate &&
    prevMedia.media_type === nextMedia.media_type
  );
});

MediaItem.displayName = "MediaItem";

export default MediaItem;
