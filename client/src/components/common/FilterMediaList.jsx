import React, { useState, useEffect, useMemo } from "react";
import { Box, Typography, Chip, IconButton, Button } from "@mui/material";
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
import { setGlobalLoading } from "../../redux/features/globalLoadingSlice";
import mediaApi from "../../api/modules/media.api";

const FilterMediaList = ({ item, genres, mediaType }) => {
  const [hovered, setHovered] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [onRequest, setOnRequest] = useState(false);

  const dispatch = useDispatch();
  const { user, listFavorites } = useSelector((state) => state.user);

  // Memoize genre mapping for better performance
  const genreMap = useMemo(
    () =>
      genres.reduce((acc, genre) => {
        acc[genre.id] = genre.name;
        return acc;
      }, {}),
    [genres]
  );

  // Fetch favorite status for the current media item
  useEffect(() => {
    const fetchFavoriteStatus = async () => {
      dispatch(setGlobalLoading(true));
      const { response, err } = await mediaApi.getDetail({
        mediaType,
        mediaId: item.id,
      });
      dispatch(setGlobalLoading(false));

      if (response) setIsFavorite(response.isFavorite);
      if (err) toast.error(err.message);
    };

    fetchFavoriteStatus();
  }, [dispatch, item.id, mediaType]);

  // Handle adding/removing favorites
  const onFavoriteClick = async () => {
    if (!user) {
      dispatch(setAuthModalOpen(true));
      return;
    }

    if (onRequest) return;

    setOnRequest(true);

    try {
      if (isFavorite) {
        // Remove from favorites
        const favorite = listFavorites.find((fav) => fav.mediaId === item.id);
        const { err } = await favoriteApi.remove({
          favoriteId: favorite.id,
        });

        if (err) throw new Error(err.message);

        dispatch(removeFavorite(favorite));
        setIsFavorite(false);
        toast.success("Removed from favorites");
      } else {
        // Add to favorites
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
        setIsFavorite(true);
        toast.success("Added to favorites");
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setOnRequest(false);
    }
  };

  return (
    <Box
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      sx={{
        position: "relative",
        borderRadius: "12px",
        overflow: "hidden",
        cursor: "pointer",
        boxShadow: 4,
        transition: "transform 0.3s ease, box-shadow 0.3s ease",
        "&:hover": {
          transform: "scale(1.02)",
          boxShadow: "0px 10px 20px rgba(0, 0, 0, 0.5)",
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
        <Box
          component="img"
          src={`https://image.tmdb.org/t/p/w500${item.poster_path}`}
          alt={item.title || item.name}
          sx={{
            width: "100%",
            height: "400px",
            objectFit: "cover",
            transition: "transform 0.3s ease",
            filter: "brightness(70%)",
            "&:hover": { transform: "scale(1.05)" },
          }}
        />
      </Link>

      {hovered && (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to top, rgba(0, 0, 0, 0.9), rgba(0, 0, 0, 0.6), transparent)",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            gap: "10px",
            color: "white",
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1 }}>
            {item.title || item.name}
          </Typography>
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            {item.vote_average && (
              <Box display="flex" alignItems="center" gap={0.5}>
                <StarIcon sx={{ color: "#ffeb3b" }} />
                <Typography variant="body2" sx={{ color: "white" }}>
                  {item.vote_average.toFixed(2)}
                </Typography>
              </Box>
            )}
            <Chip
              label="HD"
              sx={{
                backgroundColor: "#ff4081",
                color: "#fff",
                fontSize: "12px",
              }}
            />
          </Box>
          <Typography
            variant="body2"
            sx={{
              color: "#ccc",
              mb: 2,
              lineClamp: 2,
              overflow: "hidden",
            }}
          >
            {item.overview || "No description available."}
          </Typography>
          <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
            {item.genre_ids?.map((genreId) => (
              <Chip
                key={genreId}
                label={genreMap[genreId] || "Unknown Genre"}
                sx={{
                  backgroundColor: "rgba(255, 255, 255, 0.2)",
                  color: "white",
                  fontSize: "10px",
                  borderRadius: "8px",
                  padding: "2px 6px",
                }}
              />
            ))}
          </Box>
          <Box display="flex" gap={1} mt="auto">
            <Link
              to={
                mediaType !== "people"
                  ? routesGen.mediaDetail(mediaType, item.id)
                  : routesGen.person(item.id)
              }
              style={{ textDecoration: "none", flexGrow: 1 }}
            >
              <Button
                startIcon={<PlayArrowIcon />}
                sx={{
                  width: "100%",
                  backgroundColor: "#ff4081",
                  "&:hover": { backgroundColor: "#ff79b0" },
                  color: "white",
                  fontSize: "14px",
                }}
              >
                Watch Now
              </Button>
            </Link>
            <IconButton
              onClick={onFavoriteClick}
              sx={{
                color: isFavorite ? "#ff4081" : "#fff",
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.2)" },
              }}
            >
              {isFavorite ? <FavoriteIcon /> : <FavoriteBorderOutlinedIcon />}
            </IconButton>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default FilterMediaList;
