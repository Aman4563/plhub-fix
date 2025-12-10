import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import ImageNotSupportedIcon from "@mui/icons-material/ImageNotSupported";
import { Box, Button, Chip, Divider, Stack, Typography, useTheme } from "@mui/material";
import { useEffect, useState, useRef } from "react";
import { useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import { Autoplay, EffectFade } from "swiper";
import { Swiper, SwiperSlide } from "swiper/react";
import { toast } from "react-toastify";

import { setGlobalLoading } from "../../redux/features/globalLoadingSlice";
import { routesGen } from "../../routes/routes";

import uiConfigs from "../../configs/ui.configs";

import CircularRate from "./CircularRate";
import { HeroSkeleton } from "./MediaSkeleton";

import tmdbConfigs from "../../api/configs/tmdb.configs";
import genreApi from "../../api/modules/genre.api";
import mediaApi from "../../api/modules/media.api";

import "swiper/css/effect-fade";

/**
 * HeroSlide Component
 * - Displays a carousel of featured media items with dynamic genres, ratings, and overviews.
 * - Supports both pre-fetched data (from HomePage) and self-fetching mode.
 * - Includes Ken Burns animation effect and improved transitions.
 */
const HeroSlide = ({ 
  mediaType, 
  mediaCategory, 
  movies: propMovies, 
  genres: propGenres 
}) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const abortControllerRef = useRef(null);

  const [movies, setMovies] = useState(propMovies || []);
  const [genres, setGenres] = useState(propGenres || []);
  const [loading, setLoading] = useState(!propMovies);
  const [imagesLoaded, setImagesLoaded] = useState({});
  const [imageErrors, setImageErrors] = useState({});
  const [activeIndex, setActiveIndex] = useState(0);

  // Only fetch if data wasn't provided as props
  useEffect(() => {
    if (propMovies && propGenres) {
      setMovies(propMovies);
      setGenres(propGenres);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      setLoading(true);
      dispatch(setGlobalLoading(true));

      try {
        // Fetch genres
        const genreResponse = await genreApi.getList({ mediaType });
        if (genreResponse.response) {
          setGenres(genreResponse.response.genres || []);
        } else if (genreResponse.err) {
          toast.error(genreResponse.err.message);
        }

        // Fetch media
        const mediaResponse = await mediaApi.getList({
        mediaType,
        mediaCategory,
        page: 1,
      });

        if (mediaResponse.response) {
          const validMovies = mediaResponse.response.results?.filter(
            (movie) => movie.backdrop_path || movie.poster_path
          ) || [];
        setMovies(validMovies);
        } else if (mediaResponse.err) {
          toast.error(mediaResponse.err.message);
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          toast.error("Failed to load hero content");
        }
      } finally {
        setLoading(false);
        dispatch(setGlobalLoading(false));
      }
    };

    if (mediaType && mediaCategory) {
      fetchData();
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [mediaType, mediaCategory, propMovies, propGenres, dispatch]);

  const handleImageLoad = (movieId) => {
    setImagesLoaded((prev) => ({ ...prev, [movieId]: true }));
  };

  const handleImageError = (movieId) => {
    setImageErrors((prev) => ({ ...prev, [movieId]: true }));
    setImagesLoaded((prev) => ({ ...prev, [movieId]: true }));
  };

  // Show skeleton while loading
  if (loading || movies.length === 0) {
    return <HeroSkeleton />;
  }

  return (
    <Box
      sx={{
        position: "relative",
        color: "primary.contrastText",
        "&::before": {
          content: '""',
          width: "100%",
          height: "30%",
          position: "absolute",
          bottom: 0,
          left: 0,
          zIndex: 2,
          pointerEvents: "none",
          ...uiConfigs.style.gradientBgImage[theme.palette.mode],
        },
      }}
    >
      <Swiper
        grabCursor
        loop
        modules={[Autoplay, EffectFade]}
        effect="fade"
        fadeEffect={{ crossFade: true }}
        autoplay={{ delay: 6000, disableOnInteraction: false }}
        onSlideChange={(swiper) => setActiveIndex(swiper.realIndex)}
        style={{ width: "100%", height: "max-content" }}
      >
        {movies.slice(0, 8).map((movie) => {
          const backdropUrl = tmdbConfigs.backdropPath(movie.backdrop_path || movie.poster_path);
          const hasValidImage = backdropUrl && !imageErrors[movie.id];
          
          return (
            <SwiperSlide key={`hero-${movie.id}`}>
              {/* Background Image with Ken Burns Effect */}
              <Box
                sx={{
                  position: "relative",
                  paddingTop: { xs: "130%", sm: "80%", md: "60%", lg: "45%" },
                  overflow: "hidden",
                }}
              >
                {/* Fallback for missing images */}
                {(!hasValidImage || imageErrors[movie.id]) && (
                  <Box
                    sx={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      backgroundColor: "grey.900",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <ImageNotSupportedIcon sx={{ fontSize: 80, color: "grey.700" }} />
                  </Box>
                )}

                {/* Ken Burns animated background image */}
                {hasValidImage && (
                  <Box
                    component="img"
                    src={backdropUrl}
                    alt={movie.title || movie.name}
                    onLoad={() => handleImageLoad(movie.id)}
                    onError={() => handleImageError(movie.id)}
                    loading="lazy"
                    decoding="async"
                    sx={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      objectPosition: "top",
                      opacity: imagesLoaded[movie.id] ? 1 : 0,
                      transition: "opacity 0.5s ease-in-out",
                      animation: "kenBurns 20s ease-in-out infinite",
                      "@keyframes kenBurns": {
                        "0%": { 
                          transform: "scale(1.0) translateX(0)",
                        },
                        "50%": { 
                          transform: "scale(1.08) translateX(-1%)",
                        },
                        "100%": { 
                          transform: "scale(1.0) translateX(0)",
                        },
                      },
                    }}
                  />
                )}
                
                {/* Placeholder while loading */}
                {hasValidImage && !imagesLoaded[movie.id] && (
                  <Box
                    sx={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      backgroundColor: "background.paper",
                    }}
                  />
                )}
              </Box>

              {/* Gradient Overlay */}
              <Box
                sx={{
                  width: "100%",
                  height: "100%",
                  position: "absolute",
                  top: 0,
                  left: 0,
                  ...uiConfigs.style.horizontalGradientBgImage[theme.palette.mode],
                }}
              />

              {/* Content Overlay */}
              <Box
                sx={{
                  width: "100%",
                  height: "100%",
                  position: "absolute",
                  top: 0,
                  left: 0,
                  paddingX: { sm: "10px", md: "5rem", lg: "10rem" },
                }}
              >
                <Box
                  sx={{
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    paddingX: "30px",
                    color: "text.primary",
                    width: { sm: "unset", md: "30%", lg: "40%" },
                  }}
                >
                  <Stack spacing={4}>
                    {/* Movie Title */}
                    <Typography
                      variant="h4"
                      fontSize={{ xs: "2rem", md: "2rem", lg: "4rem" }}
                      fontWeight="700"
                      sx={{ 
                        ...uiConfigs.style.typoLines(2, "left"),
                        textShadow: "2px 2px 8px rgba(0,0,0,0.5)",
                      }}
                    >
                      {movie.title || movie.name}
                    </Typography>

                    {/* Rating and Genres */}
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" gap={1}>
                      <CircularRate value={movie.vote_average} />
                      <Divider orientation="vertical" sx={{ height: 28 }} />
                      {movie.genre_ids?.slice(0, 2).map((genreId) => {
                        const genre = genres.find((g) => g.id === genreId);
                        return genre ? (
                        <Chip
                          variant="filled"
                          color="primary"
                            key={`genre-${genreId}`}
                            label={genre.name}
                          size="small"
                            sx={{
                              fontWeight: 500,
                              backdropFilter: "blur(10px)",
                            }}
                        />
                        ) : null;
                      })}
                    </Stack>

                    {/* Overview */}
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        ...uiConfigs.style.typoLines(3),
                        textShadow: "1px 1px 4px rgba(0,0,0,0.3)",
                        opacity: 0.9,
                      }}
                    >
                      {movie.overview}
                    </Typography>

                    {/* Watch Now Button */}
                    <Button
                      variant="contained"
                      size="large"
                      startIcon={<PlayArrowIcon />}
                      component={Link}
                      to={routesGen.mediaDetail(mediaType, movie.id)}
                      sx={{ 
                        width: "max-content",
                        px: 4,
                        py: 1.5,
                        fontSize: "1rem",
                        fontWeight: 600,
                        boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
                        "&:hover": {
                          transform: "scale(1.02)",
                          boxShadow: "0 6px 24px rgba(0,0,0,0.4)",
                        },
                        transition: "all 0.2s ease",
                      }}
                    >
                      Watch Now
                    </Button>
                  </Stack>
                </Box>
              </Box>
            </SwiperSlide>
          );
        })}
      </Swiper>

      {/* Slide Indicators */}
      <Box
        sx={{
          position: "absolute",
          bottom: { xs: 40, md: 60 },
          right: { xs: 20, md: 60 },
          zIndex: 10,
          display: "flex",
          gap: 1,
        }}
      >
        {movies.slice(0, 8).map((_, index) => (
          <Box
            key={`indicator-${index}`}
            sx={{
              width: activeIndex === index ? 24 : 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: activeIndex === index ? "primary.main" : "rgba(255,255,255,0.4)",
              transition: "all 0.3s ease",
            }}
          />
        ))}
      </Box>
    </Box>
  );
};

export default HeroSlide;
