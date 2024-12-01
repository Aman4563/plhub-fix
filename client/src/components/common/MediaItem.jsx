import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import FavoriteIcon from "@mui/icons-material/Favorite";
import { Box, Button, Stack, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";

import tmdbConfigs from "../../api/configs/tmdb.configs";
import uiConfigs from "../../configs/ui.configs";
import { routesGen } from "../../routes/routes";
import CircularRate from "./CircularRate";
import favoriteUtils from "../../utils/favorite.utils";

/**
 * MediaItem Component
 * - Displays a single media item with poster, title, release date, and rating.
 * - Supports movies, TV shows, and people (actors).
 *
 * @param {Object} props - Component props.
 * @param {Object} props.media - Media data object.
 * @param {string} props.mediaType - Type of the media (e.g., "movie", "tv", "people").
 */
const MediaItem = ({ media, mediaType }) => {
  const { listFavorites } = useSelector((state) => state.user);

  const [title, setTitle] = useState("");
  const [posterPath, setPosterPath] = useState("");
  const [releaseDate, setReleaseDate] = useState(null);
  const [rate, setRate] = useState(null);

  useEffect(() => {
    // Set the media title
    setTitle(media.title || media.name || media.mediaTitle);

    // Set the poster image path
    setPosterPath(
      tmdbConfigs.posterPath(
        media.poster_path || media.backdrop_path || media.mediaPoster || media.profile_path
      )
    );

    // Set the release date based on the media type
    if (mediaType === tmdbConfigs.mediaType.movie) {
      setReleaseDate(media.release_date?.split("-")[0]);
    } else {
      setReleaseDate(media.first_air_date?.split("-")[0]);
    }

    // Set the rating
    setRate(media.vote_average || media.mediaRate);
  }, [media, mediaType]);

  return (
    <Link
      to={
        mediaType !== "people"
          ? routesGen.mediaDetail(mediaType, media.mediaId || media.id)
          : routesGen.person(media.id)
      }
    >
      <Box
        sx={{
          ...uiConfigs.style.backgroundImage(posterPath),
          paddingTop: "160%", // Aspect ratio
          "&:hover .media-info": { opacity: 1, bottom: 0 },
          "&:hover .media-back-drop, &:hover .media-play-btn": { opacity: 1 },
          color: "primary.contrastText",
          borderRadius: "0.5rem",
        }}
      >
        {/* Movies or TV Shows */}
        {mediaType !== "people" && (
          <>
            {/* Favorite Icon */}
            {favoriteUtils.check({ listFavorites, mediaId: media.id }) && (
              <FavoriteIcon
                color="primary"
                sx={{
                  position: "absolute",
                  top: 2,
                  right: 2,
                  fontSize: "2rem",
                }}
              />
            )}

            {/* Backdrop Overlay */}
            <Box
              className="media-back-drop"
              sx={{
                opacity: { xs: 1, md: 0 },
                transition: "all 0.3s ease",
                width: "100%",
                height: "100%",
                position: "absolute",
                top: 0,
                left: 0,
                backgroundImage: "linear-gradient(to top, rgba(0,0,0,1), rgba(0,0,0,0))",
              }}
            />

            {/* Play Button */}
            <Button
              className="media-play-btn"
              variant="contained"
              startIcon={<PlayArrowIcon />}
              sx={{
                display: { xs: "none", md: "flex" },
                opacity: 0,
                transition: "all 0.3s ease",
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                "& .MuiButton-startIcon": { marginRight: "-4px" },
              }}
            />

            {/* Media Info */}
            <Box
              className="media-info"
              sx={{
                transition: "all 0.3s ease",
                opacity: { xs: 1, md: 0 },
                position: "absolute",
                bottom: { xs: 0, md: "-20px" },
                width: "100%",
                height: "max-content",
                boxSizing: "border-box",
                padding: { xs: "10px", md: "2rem 1rem" },
              }}
            >
              <Stack spacing={{ xs: 1, md: 2 }}>
                {/* Rating */}
                {rate && <CircularRate value={rate} />}

                {/* Release Date */}
                <Typography>{releaseDate}</Typography>

                {/* Title */}
                <Typography
                  variant="body1"
                  fontWeight="700"
                  sx={{
                    fontSize: "1rem",
                    ...uiConfigs.style.typoLines(1, "left"),
                  }}
                >
                  {title}
                </Typography>
              </Stack>
            </Box>
          </>
        )}

        {/* People (Actors) */}
        {mediaType === "people" && (
          <Box
            sx={{
              position: "absolute",
              width: "100%",
              height: "max-content",
              bottom: 0,
              padding: "10px",
              backgroundColor: "rgba(0,0,0,0.6)",
            }}
          >
            <Typography sx={{ ...uiConfigs.style.typoLines(1, "left") }}>
              {media.name}
            </Typography>
          </Box>
        )}
      </Box>
    </Link>
  );
};

export default MediaItem;
