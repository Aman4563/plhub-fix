import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Box, Button, Chip, Divider, Stack, Typography } from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { toast } from "react-toastify";

import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderOutlinedIcon from "@mui/icons-material/FavoriteBorderOutlined";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";

import CircularRate from "../components/common/CircularRate";
import Container from "../components/common/Container";
import ImageHeader from "../components/common/ImageHeader";
import CastSlide from "../components/common/CastSlide";
import MediaVideosSlide from "../components/common/MediaVideosSlide";
import BackdropSlide from "../components/common/BackdropSlide";
import PosterSlide from "../components/common/PosterSlide";
import RecommendSlide from "../components/common/RecommendSlide";
import MediaSlide from "../components/common/MediaSlide";
import MediaReview from "../components/common/MediaReview";

import uiConfigs from "../configs/ui.configs";
import tmdbConfigs from "../api/configs/tmdb.configs";
import mediaApi from "../api/modules/media.api";
import favoriteApi from "../api/modules/favorite.api";

import { setGlobalLoading } from "../redux/features/globalLoadingSlice";
import { setAuthModalOpen } from "../redux/features/authModalSlice";
import { addFavorite, removeFavorite } from "../redux/features/userSlice";

/**
 * MediaDetail Component
 * - Displays detailed information about a specific media item (movie or TV show).
 * - Allows users to add/remove the media item to/from their favorites.
 * - Displays cast, videos, images, reviews, and recommendations related to the media item.
 */
const MediaDetail = () => {
  const { mediaType, mediaId } = useParams(); // Extract media type and ID from URL parameters
  const dispatch = useDispatch();
  const { user, listFavorites } = useSelector((state) => state.user);

  const [media, setMedia] = useState(null); // State to hold media details
  const [isFavorite, setIsFavorite] = useState(false); // State to track if media is in favorites
  const [onRequest, setOnRequest] = useState(false); // State to prevent multiple requests
  const [genres, setGenres] = useState([]); // State to hold media genres

  const videoRef = useRef(null); // Reference to the videos section

  useEffect(() => {
    // Fetch media details on component mount or when mediaType/mediaId changes
    const getMediaDetails = async () => {
      dispatch(setGlobalLoading(true));
      const { response, err } = await mediaApi.getDetail({ mediaType, mediaId });
      dispatch(setGlobalLoading(false));

      if (response) {
        setMedia(response);
        setIsFavorite(response.isFavorite);
        setGenres(response.genres.slice(0, 2)); // Take first two genres
      }

      if (err) {
        toast.error(err.message);
      }
    };

    window.scrollTo(0, 0); // Scroll to top on mount
    getMediaDetails();
  }, [mediaType, mediaId, dispatch]);

  /**
   * Handles adding or removing the media item from favorites.
   * - If the user is not logged in, opens the authentication modal.
   * - Prevents multiple requests by checking `onRequest` state.
   */
  const handleFavoriteClick = async () => {
    if (!user) {
      return dispatch(setAuthModalOpen(true));
    }

    if (onRequest) return;
    setOnRequest(true);

    if (isFavorite) {
      await removeFromFavorites();
    } else {
      await addToFavorites();
    }

    setOnRequest(false);
  };

  /**
   * Adds the media item to the user's favorites.
   */
  const addToFavorites = async () => {
    const favoriteData = {
      mediaId: media.id,
      mediaTitle: media.title || media.name,
      mediaType: mediaType,
      mediaPoster: media.poster_path,
      mediaRate: media.vote_average,
    };

    const { response, err } = await favoriteApi.add(favoriteData);

    if (err) {
      toast.error(err.message);
    } else if (response) {
      dispatch(addFavorite(response));
      setIsFavorite(true);
      toast.success("Added to favorites");
    }
  };

  /**
   * Removes the media item from the user's favorites.
   */
  const removeFromFavorites = async () => {
    const favorite = listFavorites.find(
      (item) => item.mediaId.toString() === media.id.toString()
    );

    if (!favorite) return;

    const { response, err } = await favoriteApi.remove({ favoriteId: favorite.id });

    if (err) {
      toast.error(err.message);
    } else if (response) {
      dispatch(removeFavorite(favorite));
      setIsFavorite(false);
      toast.success("Removed from favorites");
    }
  };

  return media ? (
    <>
      {/* Header image */}
      <ImageHeader
        imgPath={tmdbConfigs.backdropPath(media.backdrop_path || media.poster_path)}
      />

      {/* Main content */}
      <Box
        sx={{
          color: "primary.contrastText",
          ...uiConfigs.style.mainContent,
        }}
      >
        {/* Media content */}
        <Box
          sx={{
            marginTop: { xs: "-10rem", md: "-15rem", lg: "-20rem" },
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
            }}
          >
            {/* Poster */}
            <Box
              sx={{
                width: { xs: "70%", sm: "50%", md: "40%" },
                margin: { xs: "0 auto 2rem", md: "0 2rem 0 0" },
              }}
            >
              <Box
                sx={{
                  paddingTop: "140%",
                  ...uiConfigs.style.backgroundImage(
                    tmdbConfigs.posterPath(media.poster_path || media.backdrop_path)
                  ),
                }}
              />
            </Box>

            {/* Media Info */}
            <Box
              sx={{
                width: { xs: "100%", md: "60%" },
                color: "text.primary",
              }}
            >
              <Stack spacing={5}>
                {/* Title */}
                <Typography
                  variant="h4"
                  fontSize={{ xs: "2rem", md: "2rem", lg: "4rem" }}
                  fontWeight="700"
                  sx={{ ...uiConfigs.style.typoLines(2, "left") }}
                >
                  {`${media.title || media.name} (${media.release_date?.split("-")[0] || media.first_air_date?.split("-")[0] || "N/A"})`}
                </Typography>

                {/* Rating and Genres */}
                <Stack direction="row" spacing={1} alignItems="center">
                  {/* Rating */}
                  <CircularRate value={media.vote_average} />

                  <Divider orientation="vertical" flexItem />

                  {/* Genres */}
                  {genres.map((genre) => (
                    <Chip label={genre.name} variant="filled" color="primary" key={genre.id} />
                  ))}
                </Stack>

                {/* Overview */}
                <Typography variant="body1" sx={{ ...uiConfigs.style.typoLines(5) }}>
                  {media.overview}
                </Typography>

                {/* Action Buttons */}
                <Stack direction="row" spacing={1}>
                  <LoadingButton
                    variant="text"
                    sx={{ width: "max-content" }}
                    size="large"
                    startIcon={isFavorite ? <FavoriteIcon /> : <FavoriteBorderOutlinedIcon />}
                    loadingPosition="start"
                    loading={onRequest}
                    onClick={handleFavoriteClick}
                  >
                    {isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                  </LoadingButton>

                  <Button
                    variant="contained"
                    sx={{ width: "max-content" }}
                    size="large"
                    startIcon={<PlayArrowIcon />}
                    onClick={() => videoRef.current.scrollIntoView({ behavior: "smooth" })}
                  >
                    Watch Now
                  </Button>
                </Stack>

                {/* Cast */}
                <Container header="Cast">
                  <CastSlide casts={media.credits.cast} />
                </Container>
              </Stack>
            </Box>
          </Box>
        </Box>

        {/* Media Videos */}
        <div ref={videoRef} style={{ paddingTop: "2rem" }}>
          <Container header="Videos">
            <MediaVideosSlide videos={media.videos.results.slice(0, 5)} />
          </Container>
        </div>

        {/* Media Backdrops */}
        {media.images.backdrops.length > 0 && (
          <Container header="Backdrops">
            <BackdropSlide backdrops={media.images.backdrops} />
          </Container>
        )}

        {/* Media Posters */}
        {media.images.posters.length > 0 && (
          <Container header="Posters">
            <PosterSlide posters={media.images.posters} />
          </Container>
        )}

        {/* Media Reviews */}
        <MediaReview reviews={media.reviews} media={media} mediaType={mediaType} />

        {/* Media Recommendations */}
        <Container header="You May Also Like">
          {media.recommend.length > 0 ? (
            <RecommendSlide medias={media.recommend} mediaType={mediaType} />
          ) : (
            <MediaSlide
              mediaType={mediaType}
              mediaCategory={tmdbConfigs.mediaCategory.top_rated}
            />
          )}
        </Container>
      </Box>
    </>
  ) : null;
};

export default MediaDetail;
