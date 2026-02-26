import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Box, Typography, Chip, IconButton, Button, Skeleton } from "@mui/material";
import StarIcon from "@mui/icons-material/Star";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderOutlinedIcon from "@mui/icons-material/FavoriteBorderOutlined";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { routesGen } from "../../routes/routes";
import favoriteApi from "../../api/modules/favorite.api";
import { addFavorite, removeFavorite } from "../../redux/features/userSlice";
import { setAuthModalOpen } from "../../redux/features/authModalSlice";
import tmdbConfigs from "../../api/configs/tmdb.configs";

const FilterMediaList = ({ item, genres, mediaType }) => {
  const [hovered, setHovered] = useState(false);
  const [onRequest, setOnRequest] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const containerRef = useRef(null);

  const dispatch = useDispatch();
  const { user, listFavorites } = useSelector((state) => state.user);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '100px',
        threshold: 0.1,
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const genreMap = useMemo(
    () =>
      genres.reduce((acc, genre) => {
        acc[genre.id] = genre.name;
        return acc;
      }, {}),
    [genres]
  );

  const isFavorite = useMemo(() => {
    if (!listFavorites || !item.id) return false;
    return listFavorites.some(
      (fav) => fav.mediaId === item.id.toString() || fav.mediaId === item.id
    );
  }, [listFavorites, item.id]);

  const favoriteItem = useMemo(() => {
    if (!listFavorites || !item.id) return null;
    return listFavorites.find(
      (fav) => fav.mediaId === item.id.toString() || fav.mediaId === item.id
    );
  }, [listFavorites, item.id]);

  const posterUrl = useMemo(() => {
    if (!item.poster_path) return null;
    return tmdbConfigs.posterPath(item.poster_path);
  }, [item.poster_path]);

  const onFavoriteClick = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      dispatch(setAuthModalOpen(true));
      return;
    }

    if (onRequest) return;

    setOnRequest(true);

    try {
      if (isFavorite && favoriteItem) {
        const { err } = await favoriteApi.remove({
          favoriteId: favoriteItem.id,
        });

        if (err) throw new Error(err.message);

        dispatch(removeFavorite(favoriteItem));
        toast.success("Removed from favorites");
      } else {
        const body = {
          mediaId: item.id,
          mediaTitle: item.title || item.name,
          mediaType,
          mediaPoster: item.poster_path,
          mediaRate: item.vote_average,
        };

        const { response, err } = await favoriteApi.add(body);

        if (err) throw new Error(err.message);

        dispatch(addFavorite(response));
        if (response.alreadyFavorited) {
          toast.info("Already in favorites");
        } else {
          toast.success("Added to favorites");
        }
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setOnRequest(false);
    }
  }, [user, onRequest, isFavorite, favoriteItem, item, mediaType, dispatch]);

  if (!item) return null;

  return (
    <Box
      ref={containerRef}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      sx={{
        position: "relative",
        borderRadius: 2,
        overflow: "hidden",
        cursor: "pointer",
        boxShadow: 2,
        transition: "all 0.25s ease",
        bgcolor: "background.paper",
        aspectRatio: "2/3",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: "0px 8px 16px rgba(0, 0, 0, 0.4)",
        },
      }}
    >
      <Link
        to={
          mediaType !== "people"
            ? routesGen.mediaDetail(mediaType, item.id)
            : routesGen.person(item.id)
        }
        style={{ textDecoration: "none" }}
      >
        {(!imageLoaded || !isInView) && (
          <Skeleton
            variant="rectangular"
            animation="wave"
            sx={{
              width: "100%",
              height: "100%",
              position: "absolute",
              top: 0,
              left: 0,
              bgcolor: 'grey.900',
            }}
          />
        )}
        {isInView && (
          <Box
            component="img"
            src={posterUrl || "/placeholder-poster.png"}
            alt={item.title || item.name}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            onError={(e) => {
              e.target.src = "/placeholder-poster.png";
              setImageLoaded(true);
            }}
            sx={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transition: "all 0.25s ease",
              filter: "brightness(85%)",
              opacity: imageLoaded ? 1 : 0,
            }}
          />
        )}
      </Link>

      {hovered && (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to top, rgba(0, 0, 0, 0.95) 0%, rgba(0, 0, 0, 0.7) 50%, transparent 100%)",
            p: 1.5,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            gap: 0.5,
            color: "white",
          }}
        >
          <Typography 
            variant="subtitle2" 
            sx={{ 
              fontWeight: "bold", 
              lineHeight: 1.2,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {item.title || item.name}
          </Typography>
          
          <Box display="flex" alignItems="center" gap={0.5} flexWrap="wrap">
            {item.vote_average != null && item.vote_average > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                <StarIcon sx={{ color: "#f5c518", fontSize: 14 }} />
                <Typography variant="caption" fontWeight="bold" color="#f5c518">
                  {item.vote_average.toFixed(1)}
                </Typography>
              </Box>
            )}
            {(item.release_date || item.first_air_date) && (
              <Typography variant="caption" color="grey.400">
                • {(item.release_date || item.first_air_date).split("-")[0]}
              </Typography>
            )}
          </Box>

          <Typography
            variant="caption"
            sx={{
              color: "grey.400",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              lineHeight: 1.3,
            }}
          >
            {item.overview || "No description available."}
          </Typography>

          <Box display="flex" flexWrap="wrap" gap={0.25} sx={{ mt: 0.5 }}>
            {item.genre_ids?.slice(0, 2).map((genreId) => (
              <Chip
                key={genreId}
                label={genreMap[genreId] || "Unknown"}
                size="small"
                sx={{
                  backgroundColor: "rgba(255, 255, 255, 0.15)",
                  color: "white",
                  fontSize: "9px",
                  height: "18px",
                  '& .MuiChip-label': { px: 0.75 },
                }}
              />
            ))}
          </Box>

          <Box display="flex" gap={0.5} mt={0.5}>
            <Link
              to={
                mediaType !== "people"
                  ? routesGen.mediaDetail(mediaType, item.id)
                  : routesGen.person(item.id)
              }
              style={{ textDecoration: "none", flexGrow: 1 }}
            >
              <Button
                fullWidth
                size="small"
                startIcon={<PlayArrowIcon fontSize="small" />}
                sx={{
                  backgroundColor: "primary.main",
                  "&:hover": { backgroundColor: "primary.dark" },
                  color: "white",
                  fontWeight: "bold",
                  fontSize: "0.7rem",
                  py: 0.5,
                }}
              >
                View
              </Button>
            </Link>
            <IconButton
              onClick={onFavoriteClick}
              disabled={onRequest}
              size="small"
              sx={{
                color: isFavorite ? "error.main" : "#fff",
                backgroundColor: isFavorite 
                  ? "rgba(229, 9, 20, 0.2)" 
                  : "rgba(255, 255, 255, 0.1)",
                "&:hover": { 
                  backgroundColor: isFavorite 
                    ? "rgba(229, 9, 20, 0.3)" 
                    : "rgba(255, 255, 255, 0.2)" 
                },
                "&:disabled": { opacity: 0.5 },
              }}
            >
              {isFavorite ? <FavoriteIcon fontSize="small" /> : <FavoriteBorderOutlinedIcon fontSize="small" />}
            </IconButton>
          </Box>
        </Box>
      )}

      {/* Always visible rating badge */}
      {!hovered && item.vote_average != null && item.vote_average > 0 && (
        <Box
          sx={{
            position: 'absolute',
            top: 6,
            right: 6,
            bgcolor: 'rgba(0, 0, 0, 0.75)',
            borderRadius: 0.75,
            px: 0.5,
            py: 0.25,
            display: 'flex',
            alignItems: 'center',
            gap: 0.25,
          }}
        >
          <StarIcon sx={{ color: '#f5c518', fontSize: 12 }} />
          <Typography variant="caption" fontWeight="bold" color="white" fontSize="0.65rem">
            {item.vote_average.toFixed(1)}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default FilterMediaList;
