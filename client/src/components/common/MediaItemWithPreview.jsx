import { useState, useRef, useEffect, memo, useCallback } from "react";
import { Box, IconButton, Typography, Stack, Skeleton, Fade, CircularProgress } from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import AddIcon from "@mui/icons-material/Add";
import CheckIcon from "@mui/icons-material/Check";
import ThumbUpOutlinedIcon from "@mui/icons-material/ThumbUpOutlined";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";
import FavoriteIcon from "@mui/icons-material/Favorite";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { toast } from "react-toastify";

import tmdbConfigs from "../../api/configs/tmdb.configs";
import { routesGen } from "../../routes/routes";
import mediaApi from "../../api/modules/media.api";
import favoriteApi from "../../api/modules/favorite.api";
import { addFavorite, removeFavorite } from "../../redux/features/userSlice";
import { setAuthModalOpen } from "../../redux/features/authModalSlice";
import favoriteUtils from "../../utils/favorite.utils";

const HOVER_DELAY = 3000;

const MediaItemWithPreview = memo(({ media, mediaType: propMediaType, genres = [], cardIndex = 0, totalCards = 20 }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, listFavorites } = useSelector((state) => state.user);
  
  const [isHovered, setIsHovered] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [videoKey, setVideoKey] = useState(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [onRequest, setOnRequest] = useState(false);
  
  const hoverTimeoutRef = useRef(null);
  const cardRef = useRef(null);

  // Use actual media type from TMDB response (for mixed content like trending), fallback to prop
  const mediaType = media.media_type || propMediaType;

  const title = media.title || media.name;
  const posterPath = tmdbConfigs.posterPath(media.poster_path);
  const backdropPath = tmdbConfigs.backdropPath(media.backdrop_path || media.poster_path);
  const releaseYear = (media.release_date || media.first_air_date)?.split("-")[0];
  const isFavorite = favoriteUtils.check({ listFavorites, mediaId: media.id });
  
  const mediaGenres = media.genre_ids
    ?.slice(0, 3)
    .map((id) => genres.find((g) => g.id === id)?.name)
    .filter(Boolean) || [];

  const fetchVideo = useCallback(async () => {
    if (videoKey || isLoadingVideo) return;
    
    setIsLoadingVideo(true);
    try {
      const { response } = await mediaApi.getDetail({ mediaType, mediaId: media.id });
      
      if (response?.videos?.results) {
        const trailer = response.videos.results.find(
          (v) => v.type === "Trailer" && v.site === "YouTube"
        ) || response.videos.results.find(
          (v) => v.type === "Teaser" && v.site === "YouTube"
        );
        
        if (trailer) {
          setVideoKey(trailer.key);
        }
      }
    } catch (error) {
      console.error("Failed to fetch video:", error);
    } finally {
      setIsLoadingVideo(false);
    }
  }, [mediaType, media.id, videoKey, isLoadingVideo]);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    
    hoverTimeoutRef.current = setTimeout(() => {
      setShowPreview(true);
      fetchVideo();
    }, HOVER_DELAY);
  }, [fetchVideo]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    setShowPreview(false);
    
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    const timeoutRef = hoverTimeoutRef.current;
    return () => {
      if (timeoutRef) {
        clearTimeout(timeoutRef);
      }
    };
  }, []);

  const handlePlayClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(routesGen.mediaDetail(mediaType, media.id));
  };

  const handleMoreInfo = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(routesGen.mediaDetail(mediaType, media.id));
  };

  const handleFavoriteClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      return dispatch(setAuthModalOpen(true));
    }

    if (onRequest) return;
    setOnRequest(true);

    if (isFavorite) {
      const favorite = listFavorites.find(
        (item) => item.mediaId.toString() === media.id.toString()
      );
      if (favorite) {
        const { response, err } = await favoriteApi.remove({ favoriteId: favorite.id || favorite._id });
        if (response) {
          dispatch(removeFavorite(favorite));
          toast.success("Removed from favorites");
        }
        if (err) toast.error(err.message);
      }
    } else {
      const { response, err } = await favoriteApi.add({
        mediaId: media.id,
        mediaTitle: title,
        mediaType,
        mediaPoster: media.poster_path,
        mediaRate: media.vote_average,
      });
      if (response) {
        dispatch(addFavorite(response));
        if (response.alreadyFavorited) {
          toast.info("Already in favorites");
        } else {
        toast.success("Added to favorites");
        }
      }
      if (err) toast.error(err.message);
    }

    setOnRequest(false);
  };

  const handleMuteToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsMuted(!isMuted);
  };

  return (
    <Box
      ref={cardRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      sx={{
        position: "relative",
        width: "100%",
        cursor: "pointer",
        zIndex: showPreview ? 50 : 1,
        transition: "z-index 0s 0.3s",
        "&:hover": {
          zIndex: 50,
          transition: "z-index 0s 0s",
        },
      }}
    >
      {/* Card Container */}
      <Box
        sx={{
          position: "relative",
          transform: showPreview ? "scale(1.15)" : "scale(1)",
          transformOrigin: "center top",
          width: "100%",
          transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease",
          borderRadius: showPreview ? "6px" : "4px",
          overflow: "visible",
          boxShadow: showPreview 
            ? "0 14px 36px rgba(0,0,0,0.85), 0 10px 20px rgba(0,0,0,0.6)" 
            : "0 2px 8px rgba(0,0,0,0.3)",
        }}
      >
        <Link 
          to={routesGen.mediaDetail(mediaType, media.id)}
          style={{ textDecoration: "none" }}
        >
          {/* Media Image Container */}
          <Box
            sx={{
              position: "relative",
              paddingTop: showPreview ? "100%" : "150%",
              borderRadius: showPreview ? "6px 6px 0 0" : "4px",
              overflow: "hidden",
              backgroundColor: "#181818",
              transition: "padding-top 0.3s cubic-bezier(0.4, 0, 0.2, 1), border-radius 0.3s ease",
            }}
          >
            {/* Skeleton Loader */}
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
                  bgcolor: "#2a2a2a",
                }}
              />
            )}

            {/* Poster Image (default state) */}
            {!showPreview && (
              <Box
                component="img"
                src={posterPath}
                alt={title}
                onLoad={() => setImageLoaded(true)}
                loading="lazy"
                sx={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  opacity: imageLoaded ? 1 : 0,
                  transition: "opacity 0.3s ease, transform 0.4s ease",
                  transform: isHovered && !showPreview ? "scale(1.05)" : "scale(1)",
                }}
              />
            )}

            {/* Backdrop Image (preview state) */}
            {showPreview && (
              <Box
                component="img"
                src={backdropPath}
                alt={title}
                sx={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            )}

            {/* Video Preview */}
            {showPreview && videoKey && (
              <Fade in timeout={500}>
                <Box
                  sx={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    backgroundColor: "#000",
                    overflow: "hidden",
                  }}
                >
                  <Box
                    component="iframe"
                    src={`https://www.youtube.com/embed/${videoKey}?autoplay=1&mute=${isMuted ? 1 : 0}&controls=0&loop=1&playlist=${videoKey}&modestbranding=1&showinfo=0&rel=0&iv_load_policy=3&disablekb=1`}
                    title={title}
                    frameBorder="0"
                    allow="autoplay; encrypted-media"
                    sx={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      width: "180%",
                      height: "180%",
                      transform: "translate(-50%, -50%)",
                      pointerEvents: "none",
                      border: "none",
                    }}
                  />
                </Box>
              </Fade>
            )}

            {/* Video Loading Spinner */}
            {showPreview && isLoadingVideo && !videoKey && (
              <Box
                sx={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  zIndex: 5,
                }}
              >
                <CircularProgress size={32} sx={{ color: "#e50914" }} />
              </Box>
            )}

            {/* Mute Button (only when video is playing) */}
            {showPreview && videoKey && (
              <IconButton
                size="small"
                onClick={handleMuteToggle}
                sx={{
                  position: "absolute",
                  bottom: 8,
                  right: 8,
                  backgroundColor: "rgba(20,20,20,0.7)",
                  border: "1px solid rgba(255,255,255,0.5)",
                  color: "white",
                  width: 26,
                  height: 26,
                  zIndex: 10,
                  "&:hover": {
                    backgroundColor: "rgba(40,40,40,0.9)",
                    borderColor: "white",
                  },
                }}
              >
                {isMuted ? <VolumeOffIcon sx={{ fontSize: 14 }} /> : <VolumeUpIcon sx={{ fontSize: 14 }} />}
              </IconButton>
            )}

            {/* Rating Badge (poster state only) */}
            {!showPreview && media.vote_average > 0 && (
              <Box
                sx={{
                  position: "absolute",
                  top: 8,
                  left: 8,
                  backgroundColor: media.vote_average >= 7 ? "#46d369" : media.vote_average >= 5 ? "#ffc107" : "#f44336",
                  color: media.vote_average >= 7 ? "#000" : "#fff",
                  px: 0.8,
                  py: 0.3,
                  borderRadius: "3px",
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  zIndex: 5,
                }}
              >
                {media.vote_average.toFixed(1)}
              </Box>
            )}

            {/* Favorite Icon */}
            {isFavorite && !showPreview && (
              <FavoriteIcon
                sx={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  fontSize: "1.2rem",
                  color: "#e50914",
                  filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))",
                  zIndex: 5,
                }}
              />
            )}

            {/* Hover Gradient Overlay (poster state) */}
            {!showPreview && (
              <Box
                sx={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: "60%",
                  background: "linear-gradient(to top, rgba(20,20,20,0.95) 0%, rgba(20,20,20,0.7) 30%, transparent 100%)",
                  opacity: isHovered ? 1 : 0.7,
                  transition: "opacity 0.3s ease",
                  pointerEvents: "none",
                }}
              />
            )}

            {/* Title on Poster (non-preview state) */}
            {!showPreview && (
              <Box
                sx={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  p: 1.2,
                  zIndex: 3,
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    color: "white",
                    fontWeight: 600,
                    fontSize: "0.85rem",
                    lineHeight: 1.3,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    textShadow: "0 1px 3px rgba(0,0,0,0.8)",
                  }}
                >
                  {title}
                </Typography>
                {releaseYear && (
                  <Typography
                    variant="caption"
                    sx={{
                      color: "rgba(255,255,255,0.7)",
                      fontSize: "0.7rem",
                    }}
                  >
                    {releaseYear}
                  </Typography>
                )}
              </Box>
            )}
          </Box>
        </Link>

        {/* Expanded Info Panel */}
        {showPreview && (
          <Box
            sx={{
              backgroundColor: "#181818",
              borderRadius: "0 0 6px 6px",
              p: 1.25,
            }}
          >
            {/* Action Buttons Row */}
            <Stack direction="row" spacing={0.6} alignItems="center" sx={{ mb: 1 }}>
              {/* Play Button */}
              <IconButton
                size="small"
                onClick={handlePlayClick}
                sx={{
                  backgroundColor: "white",
                  color: "#141414",
                  width: 30,
                  height: 30,
                  "&:hover": { 
                    backgroundColor: "rgba(255,255,255,0.85)",
                    transform: "scale(1.05)",
                  },
                  transition: "all 0.15s ease",
                }}
              >
                <PlayArrowIcon sx={{ fontSize: 18 }} />
              </IconButton>

              {/* Add to List Button */}
              <IconButton
                size="small"
                onClick={handleFavoriteClick}
                disabled={onRequest}
                sx={{
                  border: "2px solid rgba(255,255,255,0.5)",
                  color: isFavorite ? "#e50914" : "white",
                  backgroundColor: isFavorite ? "rgba(229,9,20,0.15)" : "transparent",
                  width: 30,
                  height: 30,
                  "&:hover": { 
                    borderColor: "white",
                    backgroundColor: isFavorite ? "rgba(229,9,20,0.25)" : "rgba(255,255,255,0.1)",
                  },
                  transition: "all 0.15s ease",
                }}
              >
                {isFavorite ? <CheckIcon sx={{ fontSize: 16 }} /> : <AddIcon sx={{ fontSize: 16 }} />}
              </IconButton>

              {/* Like Button */}
              <IconButton
                size="small"
                sx={{
                  border: "2px solid rgba(255,255,255,0.5)",
                  color: "white",
                  width: 30,
                  height: 30,
                  "&:hover": { 
                    borderColor: "white",
                    backgroundColor: "rgba(255,255,255,0.1)",
                  },
                  transition: "all 0.15s ease",
                }}
              >
                <ThumbUpOutlinedIcon sx={{ fontSize: 14 }} />
              </IconButton>

              <Box sx={{ flex: 1 }} />

              {/* More Info Button */}
              <IconButton
                size="small"
                onClick={handleMoreInfo}
                sx={{
                  border: "2px solid rgba(255,255,255,0.5)",
                  color: "white",
                  width: 30,
                  height: 30,
                  "&:hover": { 
                    borderColor: "white",
                    backgroundColor: "rgba(255,255,255,0.1)",
                  },
                  transition: "all 0.15s ease",
                }}
              >
                <ExpandMoreIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Stack>

            {/* Match & Year Info */}
            <Stack direction="row" spacing={0.8} alignItems="center" sx={{ mb: 0.6 }}>
              {media.vote_average > 0 && (
                <Typography
                  variant="caption"
                  sx={{
                    color: media.vote_average >= 7 ? "#46d369" : media.vote_average >= 5 ? "#ffc107" : "#f44336",
                    fontWeight: 700,
                    fontSize: "0.7rem",
                  }}
                >
                  {Math.round(media.vote_average * 10)}% Match
                </Typography>
              )}
              {releaseYear && (
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: "rgba(255,255,255,0.7)",
                    fontSize: "0.7rem",
                  }}
                >
                  {releaseYear}
                </Typography>
              )}
              <Box
                sx={{
                  border: "1px solid rgba(255,255,255,0.4)",
                  px: 0.4,
                  py: 0.05,
                  borderRadius: "2px",
                  fontSize: "0.6rem",
                  color: "rgba(255,255,255,0.7)",
                }}
              >
                HD
              </Box>
            </Stack>

            {/* Genres */}
            {mediaGenres.length > 0 && (
              <Stack direction="row" spacing={0.4} flexWrap="wrap" alignItems="center">
                {mediaGenres.map((genre, idx) => (
                  <Box key={genre} sx={{ display: "flex", alignItems: "center" }}>
                    {idx > 0 && (
                      <Box 
                        component="span" 
                        sx={{ 
                          width: 3, 
                          height: 3, 
                          borderRadius: "50%", 
                          backgroundColor: "rgba(255,255,255,0.4)",
                          mx: 0.4,
                        }} 
                      />
                    )}
                    <Typography
                      variant="caption"
                      sx={{ 
                        color: "rgba(255,255,255,0.9)",
                        fontSize: "0.65rem",
                      }}
                    >
                      {genre}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            )}
          </Box>
        )}
      </Box>
      
    </Box>
  );
});

MediaItemWithPreview.displayName = "MediaItemWithPreview";

export default MediaItemWithPreview;
