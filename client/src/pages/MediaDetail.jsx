/**
 * MediaDetail Component
 * Displays detailed information about a movie or TV show
 * Includes Watchlist, Favorites, Watch Providers, User Ratings, External Links, and Season Info
 */

import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useParams, Link as RouterLink } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Box,
  Button,
  Chip,
  Divider,
  Stack,
  Typography,
  IconButton,
  Tooltip,
  Paper,
  Collapse,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemButton,
  Avatar,
  Dialog,
  DialogContent,
  Alert,
} from "@mui/material";
import { Helmet } from "react-helmet-async";
import { LoadingButton } from "@mui/lab";
import { toast } from "react-toastify";

import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderOutlinedIcon from "@mui/icons-material/FavoriteBorderOutlined";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import ShareIcon from "@mui/icons-material/Share";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import TwitterIcon from "@mui/icons-material/Twitter";
import FacebookIcon from "@mui/icons-material/Facebook";
import LinkIcon from "@mui/icons-material/Link";
import MovieIcon from "@mui/icons-material/Movie";
import TvIcon from "@mui/icons-material/Tv";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import LanguageIcon from "@mui/icons-material/Language";
import RefreshIcon from "@mui/icons-material/Refresh";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import CloseIcon from "@mui/icons-material/Close";
import EventIcon from "@mui/icons-material/Event";

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
import WatchlistButton from "../components/common/WatchlistButton";
import WatchProviders from "../components/common/WatchProviders";
import { DisplayStarRating } from "../components/common/StarRating";
import { MediaDetailSkeleton } from "../components/common/MediaSkeleton";

import uiConfigs from "../configs/ui.configs";
import tmdbConfigs from "../api/configs/tmdb.configs";
import mediaApi from "../api/modules/media.api";
import favoriteApi from "../api/modules/favorite.api";
import { addToWatchHistory } from "../components/common/ContinueWatching";

import { setGlobalLoading } from "../redux/features/globalLoadingSlice";
import { setAuthModalOpen } from "../redux/features/authModalSlice";
import { addFavorite, removeFavorite } from "../redux/features/userSlice";

// Format currency for budget/revenue
const formatCurrency = (amount) => {
  if (!amount) return null;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
};

// Format runtime to hours and minutes
const formatRuntime = (minutes) => {
  if (!minutes) return null;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
};

// Error Display Component
const ErrorDisplay = ({ error, onRetry }) => (
  <Box
    sx={{
      minHeight: "60vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      textAlign: "center",
      px: 3,
    }}
  >
    <ErrorOutlineIcon sx={{ fontSize: 80, color: "error.main", mb: 2 }} />
    <Typography variant="h5" gutterBottom>
      Oops! Something went wrong
    </Typography>
    <Typography color="text.secondary" sx={{ mb: 3, maxWidth: 400 }}>
      {error || "We couldn't load the details for this title. Please try again."}
    </Typography>
    <Button
      variant="contained"
      startIcon={<RefreshIcon />}
      onClick={onRetry}
      size="large"
    >
      Try Again
    </Button>
    <Button
      component={RouterLink}
      to="/"
      sx={{ mt: 2 }}
      color="inherit"
    >
      Go to Homepage
    </Button>
  </Box>
);

// Season Selector Component for TV Shows
const SeasonSelector = ({ seasons, currentSeason, onSeasonChange, tvId }) => {
  const [expanded, setExpanded] = useState(false);
  const [seasonDetails, setSeasonDetails] = useState(null);
  const [loadingSeasons, setLoadingSeasons] = useState(false);

  const validSeasons = seasons?.filter((s) => s.season_number > 0) || [];

  const fetchSeasonDetails = useCallback(async (seasonNumber) => {
    if (!tvId || !seasonNumber) return;
    setLoadingSeasons(true);
    try {
      const { response } = await mediaApi.getSeasonDetail({ tvId, seasonNumber });
      if (response) {
        setSeasonDetails(response);
      }
    } catch (err) {
      console.error("Failed to fetch season details:", err);
    } finally {
      setLoadingSeasons(false);
    }
  }, [tvId]);

  useEffect(() => {
    if (expanded && currentSeason && tvId) {
      fetchSeasonDetails(currentSeason);
    }
  }, [expanded, currentSeason, tvId, fetchSeasonDetails]);

  if (!validSeasons.length) return null;

  return (
    <Paper sx={{ mt: 4, p: 2, backgroundColor: "background.paper" }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        onClick={() => setExpanded(!expanded)}
        sx={{ cursor: "pointer" }}
      >
        <Typography variant="h6" fontWeight={600}>
          Seasons ({validSeasons.length})
        </Typography>
        <IconButton size="small">
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Stack>

      <Collapse in={expanded}>
        <Box sx={{ mt: 2 }}>
          <Tabs
            value={currentSeason || validSeasons[0]?.season_number}
            onChange={(_, value) => {
              onSeasonChange(value);
              fetchSeasonDetails(value);
            }}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ mb: 2 }}
          >
            {validSeasons.map((season) => (
              <Tab
                key={season.id}
                value={season.season_number}
                label={`Season ${season.season_number}`}
              />
            ))}
          </Tabs>

          {loadingSeasons ? (
            <Typography color="text.secondary">Loading episodes...</Typography>
          ) : seasonDetails?.episodes?.length > 0 ? (
            <List sx={{ maxHeight: 400, overflow: "auto" }}>
              {seasonDetails.episodes.map((episode) => (
                <ListItem key={episode.id} disablePadding>
                  <ListItemButton sx={{ py: 1.5 }}>
                    <Avatar
                      src={tmdbConfigs.posterPath(episode.still_path)}
                      variant="rounded"
                      sx={{ width: 100, height: 56, mr: 2 }}
                    >
                      <TvIcon />
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="subtitle2" noWrap>
                        {episode.episode_number}. {episode.name}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ ...uiConfigs.style.typoLines(2) }}
                      >
                        {episode.overview || "No description available."}
                      </Typography>
                      <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                        {episode.runtime && (
                          <Typography variant="caption" color="text.secondary">
                            {formatRuntime(episode.runtime)}
                          </Typography>
                        )}
                        {episode.air_date && (
                          <Typography variant="caption" color="text.secondary">
                            • {episode.air_date}
                          </Typography>
                        )}
                      </Stack>
                    </Box>
                    {episode.vote_average > 0 && (
                      <Chip
                        label={episode.vote_average.toFixed(1)}
                        size="small"
                        color="primary"
                        sx={{ ml: 1 }}
                      />
                    )}
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography color="text.secondary">
              No episode information available.
            </Typography>
          )}
        </Box>
      </Collapse>
    </Paper>
  );
};

// Share Menu Component
const ShareMenu = ({ media, mediaType }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const shareUrl = window.location.href;
  const shareTitle = media?.title || media?.name || "Check this out!";
  const shareText = `Check out "${shareTitle}" on PLHub!`;

  const handleShare = (platform) => {
    setAnchorEl(null);
    
    const urls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      copy: null,
    };

    if (platform === "copy") {
      navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied to clipboard!");
    } else if (urls[platform]) {
      window.open(urls[platform], "_blank", "width=600,height=400");
    }
  };

  return (
    <>
      <Tooltip title="Share">
        <IconButton
          onClick={(e) => setAnchorEl(e.currentTarget)}
          aria-label="Share this title"
        >
          <ShareIcon />
        </IconButton>
      </Tooltip>
      <Menu anchorEl={anchorEl} open={open} onClose={() => setAnchorEl(null)}>
        <MenuItem onClick={() => handleShare("twitter")}>
          <ListItemIcon><TwitterIcon /></ListItemIcon>
          <ListItemText>Twitter</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleShare("facebook")}>
          <ListItemIcon><FacebookIcon /></ListItemIcon>
          <ListItemText>Facebook</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleShare("copy")}>
          <ListItemIcon><ContentCopyIcon /></ListItemIcon>
          <ListItemText>Copy Link</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
};

// External Links Component
const ExternalLinks = ({ externalIds, homepage }) => {
  const links = [];

  if (externalIds?.imdb_id) {
    links.push({
      name: "IMDB",
      url: `https://www.imdb.com/title/${externalIds.imdb_id}`,
      icon: <MovieIcon />,
    });
  }

  if (homepage) {
    links.push({
      name: "Official Site",
      url: homepage,
      icon: <LinkIcon />,
    });
  }

  if (externalIds?.facebook_id) {
    links.push({
      name: "Facebook",
      url: `https://www.facebook.com/${externalIds.facebook_id}`,
      icon: <FacebookIcon />,
    });
  }

  if (externalIds?.twitter_id) {
    links.push({
      name: "Twitter",
      url: `https://twitter.com/${externalIds.twitter_id}`,
      icon: <TwitterIcon />,
    });
  }

  if (links.length === 0) return null;

  return (
    <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
      {links.map((link) => (
        <Tooltip key={link.name} title={link.name}>
          <IconButton
            component="a"
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            size="small"
            sx={{
              backgroundColor: "action.hover",
              "&:hover": { backgroundColor: "action.selected" },
            }}
            aria-label={`Visit ${link.name}`}
          >
            {link.icon}
          </IconButton>
        </Tooltip>
      ))}
    </Stack>
  );
};

// Trailer Modal Component
const TrailerModal = ({ open, onClose, video }) => {
  if (!video) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: "transparent",
          boxShadow: "none",
          overflow: "hidden",
        },
      }}
    >
      <DialogContent sx={{ p: 0, position: "relative" }}>
        <IconButton
          onClick={onClose}
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
            zIndex: 1,
            backgroundColor: "rgba(0,0,0,0.7)",
            color: "white",
            "&:hover": { backgroundColor: "rgba(0,0,0,0.9)" },
          }}
        >
          <CloseIcon />
        </IconButton>
        <Box
          sx={{
            position: "relative",
            paddingTop: "56.25%", // 16:9 aspect ratio
            backgroundColor: "#000",
          }}
        >
          <iframe
            src={`https://www.youtube.com/embed/${video.key}?autoplay=1&rel=0`}
            title={video.name}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
            }}
          />
        </Box>
        <Box sx={{ p: 2, backgroundColor: "background.paper" }}>
          <Typography variant="subtitle1" fontWeight={600}>
            {video.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {video.type} • {video.site}
          </Typography>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

// Next Episode Info Component for TV Shows
const NextEpisodeInfo = ({ nextEpisode, showName }) => {
  if (!nextEpisode) return null;

  const airDate = new Date(nextEpisode.air_date);
  const today = new Date();
  const daysUntil = Math.ceil((airDate - today) / (1000 * 60 * 60 * 24));

  const formatDate = (date) => {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  return (
    <Alert
      severity="info"
      icon={<EventIcon />}
      sx={{ mt: 2, mb: 2 }}
    >
      <Typography variant="subtitle2" fontWeight={600}>
        Next Episode: S{nextEpisode.season_number}E{nextEpisode.episode_number}
        {nextEpisode.name && ` - "${nextEpisode.name}"`}
      </Typography>
      <Typography variant="body2">
        Airs on {formatDate(airDate)}
        {daysUntil > 0 && daysUntil <= 30 && (
          <Chip
            label={daysUntil === 1 ? "Tomorrow" : `In ${daysUntil} days`}
            size="small"
            color="primary"
            sx={{ ml: 1 }}
          />
        )}
      </Typography>
    </Alert>
  );
};

// Production Companies Component
const ProductionCompanies = ({ companies }) => {
  if (!companies?.length) return null;

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        Production
      </Typography>
      <Stack direction="row" spacing={2} flexWrap="wrap" gap={1}>
        {companies.slice(0, 5).map((company) => (
          <Tooltip key={company.id} title={company.name}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                backgroundColor: "background.paper",
                px: 1.5,
                py: 0.5,
                borderRadius: 1,
              }}
            >
              {company.logo_path ? (
                <Box
                  component="img"
                  src={tmdbConfigs.posterPath(company.logo_path)}
                  alt={company.name}
                  sx={{
                    height: 20,
                    maxWidth: 60,
                    objectFit: "contain",
                    filter: "brightness(0) invert(0.7)",
                  }}
                />
              ) : (
                <Typography variant="caption" color="text.secondary">
                  {company.name}
                </Typography>
              )}
            </Box>
          </Tooltip>
        ))}
      </Stack>
    </Box>
  );
};

const MediaDetail = () => {
  const { mediaType, mediaId } = useParams();
  const dispatch = useDispatch();
  const { user, listFavorites } = useSelector((state) => state.user);

  const [media, setMedia] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [onRequest, setOnRequest] = useState(false);
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Watchlist state
  const [inWatchlist, setInWatchlist] = useState(false);
  const [watchlistStatus, setWatchlistStatus] = useState(null);
  const [watchlistId, setWatchlistId] = useState(null);

  // User rating state
  const [userRating, setUserRating] = useState(null);
  const [userRatingStats, setUserRatingStats] = useState(null);

  // Watch providers state
  const [watchProviders, setWatchProviders] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState("US");

  // TV show state
  const [currentSeason, setCurrentSeason] = useState(1);

  // Show more videos
  const [showAllVideos, setShowAllVideos] = useState(false);

  // Trailer modal state
  const [trailerModalOpen, setTrailerModalOpen] = useState(false);
  const [selectedTrailer, setSelectedTrailer] = useState(null);

  const videoRef = useRef(null);

  const fetchMediaDetails = useCallback(async () => {
    setLoading(true);
    setError(null);
    dispatch(setGlobalLoading(true));

    const { response, err } = await mediaApi.getDetail({ mediaType, mediaId });

    dispatch(setGlobalLoading(false));
    setLoading(false);

    if (response) {
      setMedia(response);
      setIsFavorite(response.isFavorite || false);
      setGenres(response.genres || []);

      // Set watchlist state
      setInWatchlist(response.inWatchlist || false);
      setWatchlistStatus(response.watchlistStatus || null);
      setWatchlistId(response.watchlistId || response.watchlist_id || null);

      // Set user rating state
      setUserRating(response.userRating || null);
      setUserRatingStats(response.userRatingStats || null);

      // Set watch providers
      setWatchProviders(response.watchProviders || null);

      // Add to watch history
      addToWatchHistory(response, mediaType);
    }

    if (err) {
      setError(err.message || "Failed to load media details");
      toast.error(err.message || "Failed to load media details");
    }
  }, [mediaType, mediaId, dispatch]);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchMediaDetails();
  }, [fetchMediaDetails]);

  // Find the best trailer for auto-play
  const mainTrailer = useMemo(() => {
    if (!media?.videos?.results?.length) return null;
    const trailer = media.videos.results.find(
      (v) => v.type === "Trailer" && v.site === "YouTube"
    );
    return trailer || media.videos.results[0];
  }, [media]);

  // Open trailer modal
  const handleWatchTrailer = () => {
    if (mainTrailer) {
      setSelectedTrailer(mainTrailer);
      setTrailerModalOpen(true);
    }
  };

  // Handle region change for watch providers
  const handleRegionChange = useCallback(async (newRegion) => {
    setSelectedRegion(newRegion);
    
    // Fetch new watch providers for the selected region
    const { response } = await mediaApi.getWatchProviders({
      mediaType,
      mediaId,
      region: newRegion,
    });

    if (response?.providers) {
      setWatchProviders((prev) => ({
        ...prev,
        [newRegion]: response.providers,
      }));
    }
  }, [mediaType, mediaId]);

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
      if (response.alreadyFavorited) {
        toast.info("Already in favorites");
      } else {
      toast.success("Added to favorites");
      }
    }
  };

  const removeFromFavorites = async () => {
    const favorite = listFavorites.find(
      (item) => item.mediaId.toString() === media.id.toString()
    );

    if (!favorite) return;

    const { response, err } = await favoriteApi.remove({
      favoriteId: favorite.id || favorite._id,
    });

    if (err) {
      toast.error(err.message);
    } else if (response) {
      dispatch(removeFavorite(favorite));
      setIsFavorite(false);
      toast.success("Removed from favorites");
    }
  };

  const handleWatchlistUpdate = ({
    inWatchlist: newInWatchlist,
    status,
    watchlistId: newWatchlistId,
  }) => {
    setInWatchlist(newInWatchlist);
    setWatchlistStatus(status);
    if (newWatchlistId !== undefined) {
      setWatchlistId(newWatchlistId);
    }
  };

  // Show skeleton while loading
  if (loading) {
    return <MediaDetailSkeleton />;
  }

  // Show error state
  if (error || !media) {
    return <ErrorDisplay error={error} onRetry={fetchMediaDetails} />;
  }

  const releaseYear =
    media.release_date?.split("-")[0] ||
    media.first_air_date?.split("-")[0] ||
    "N/A";

  const currentProviders =
    watchProviders?.[selectedRegion] ||
    watchProviders?.US ||
    watchProviders?.GB ||
    (watchProviders && Object.values(watchProviders)[0]);

  const videosToShow = showAllVideos
    ? media.videos?.results
    : media.videos?.results?.slice(0, 6);

  // Generate SEO data
  const seoTitle = media
    ? `${media.title || media.name}${releaseYear !== "N/A" ? ` (${releaseYear})` : ""} - PLHub`
    : "Loading... - PLHub";
  const seoDescription = media?.overview?.slice(0, 160) || "Watch movies and TV shows on PLHub";
  const seoImage = media?.backdrop_path
    ? tmdbConfigs.backdropPath(media.backdrop_path)
    : media?.poster_path
    ? tmdbConfigs.posterPath(media.poster_path)
    : null;

  return (
    <>
      {/* SEO Meta Tags */}
      <Helmet>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:type" content={mediaType === "movie" ? "video.movie" : "video.tv_show"} />
        <meta property="og:url" content={window.location.href} />
        {seoImage && <meta property="og:image" content={seoImage} />}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seoTitle} />
        <meta name="twitter:description" content={seoDescription} />
        {seoImage && <meta name="twitter:image" content={seoImage} />}
        {media?.keywords?.length > 0 && (
          <meta name="keywords" content={media.keywords.map(k => k.name).join(", ")} />
        )}
      </Helmet>

      {/* Trailer Modal */}
      <TrailerModal
        open={trailerModalOpen}
        onClose={() => setTrailerModalOpen(false)}
        video={selectedTrailer}
      />

      {/* Header image */}
      <ImageHeader
        imgPath={tmdbConfigs.backdropPath(
          media.backdrop_path || media.poster_path
        )}
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
                width: { xs: "70%", sm: "50%", md: "35%" },
                margin: { xs: "0 auto 2rem", md: "0 2rem 0 0" },
              }}
            >
              <Box
                sx={{
                  paddingTop: "150%",
                  borderRadius: 2,
                  overflow: "hidden",
                  boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
                  ...uiConfigs.style.backgroundImage(
                    tmdbConfigs.posterPath(
                      media.poster_path || media.backdrop_path
                    )
                  ),
                }}
              />
            </Box>

            {/* Media Info */}
            <Box
              sx={{
                width: { xs: "100%", md: "65%" },
                color: "text.primary",
              }}
            >
              <Stack spacing={3}>
                {/* Title and Year */}
                <Box>
                  <Stack
                    direction="row"
                    alignItems="flex-start"
                    justifyContent="space-between"
                  >
                    <Typography
                      variant="h3"
                      fontSize={{ xs: "1.75rem", md: "2.5rem", lg: "3rem" }}
                      fontWeight="700"
                      sx={{ ...uiConfigs.style.typoLines(2, "left") }}
                    >
                      {media.title || media.name}
                    </Typography>
                    <ShareMenu media={media} mediaType={mediaType} />
                  </Stack>

                  {/* Tagline */}
                  {media.tagline && (
                    <Typography
                      variant="subtitle1"
                      color="text.secondary"
                      fontStyle="italic"
                      sx={{ mt: 1 }}
                    >
                      "{media.tagline}"
                    </Typography>
                  )}
                </Box>

                {/* Quick Info Row */}
                <Stack
                  direction="row"
                  spacing={2}
                  alignItems="center"
                  flexWrap="wrap"
                  gap={1}
                >
                  {/* Content Rating */}
                  {media.certification && (
                    <Chip
                      label={media.certification}
                      size="small"
                      variant="outlined"
                      sx={{ fontWeight: 600 }}
                    />
                  )}

                  {/* Year */}
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <CalendarTodayIcon
                      sx={{ fontSize: 16, color: "text.secondary" }}
                    />
                    <Typography variant="body2">{releaseYear}</Typography>
                  </Stack>

                  {/* Runtime */}
                  {media.runtime && (
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <AccessTimeIcon
                        sx={{ fontSize: 16, color: "text.secondary" }}
                      />
                      <Typography variant="body2">
                        {formatRuntime(media.runtime)}
                      </Typography>
                    </Stack>
                  )}

                  {/* TV Seasons/Episodes */}
                  {media.number_of_seasons && (
                    <Chip
                      icon={<TvIcon sx={{ fontSize: 16 }} />}
                      label={`${media.number_of_seasons} Season${
                        media.number_of_seasons > 1 ? "s" : ""
                      } • ${media.number_of_episodes || 0} Episodes`}
                      size="small"
                      variant="outlined"
                    />
                  )}

                  {/* Language */}
                  {media.original_language && (
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <LanguageIcon
                        sx={{ fontSize: 16, color: "text.secondary" }}
                      />
                      <Typography variant="body2">
                        {media.original_language.toUpperCase()}
                      </Typography>
                    </Stack>
                  )}

                  {/* Status */}
                  {media.status && (
                    <Chip
                      label={media.status}
                      size="small"
                      color={
                        media.status === "Released" || media.status === "Ended"
                          ? "success"
                          : "warning"
                      }
                      variant="outlined"
                    />
                  )}
                </Stack>

                {/* Rating Row */}
                <Stack
                  direction="row"
                  spacing={2}
                  alignItems="center"
                  flexWrap="wrap"
                  gap={1}
                >
                  {/* TMDB Rating */}
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <CircularRate value={media.vote_average} />
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        TMDB Rating
                      </Typography>
                      <Typography variant="body2">
                        {media.vote_count?.toLocaleString() || 0} votes
                      </Typography>
                    </Box>
                  </Stack>

                  <Divider orientation="vertical" flexItem />

                  {/* User Rating Stats */}
                  {userRatingStats?.averageRating && (
                    <>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <DisplayStarRating
                          value={userRatingStats.averageRating}
                          size="medium"
                          totalRatings={userRatingStats.totalRatings}
                        />
                      </Stack>
                      <Divider orientation="vertical" flexItem />
                    </>
                  )}

                  {/* External Links */}
                  <ExternalLinks
                    externalIds={media.external_ids}
                    homepage={media.homepage}
                  />
                </Stack>

                {/* Genres */}
                <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                  {genres.map((genre) => (
                    <Chip
                      label={genre.name}
                      variant="filled"
                      color="primary"
                      key={genre.id}
                      size="small"
                      clickable
                      component={RouterLink}
                      to={`/${mediaType}?genre=${genre.id}`}
                    />
                  ))}
                </Stack>

                {/* Overview */}
                <Box>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                  >
                    Overview
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{ lineHeight: 1.8 }}
                  >
                    {media.overview || "No overview available."}
                  </Typography>
                </Box>

                {/* Budget & Revenue (Movies only) */}
                {(media.budget > 0 || media.revenue > 0) && (
                  <Stack direction="row" spacing={4}>
                    {media.budget > 0 && (
                      <Box>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                        >
                          Budget
                        </Typography>
                        <Typography variant="body1" fontWeight={600}>
                          {formatCurrency(media.budget)}
                        </Typography>
                      </Box>
                    )}
                    {media.revenue > 0 && (
                      <Box>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                        >
                          Box Office
                        </Typography>
                        <Typography variant="body1" fontWeight={600}>
                          {formatCurrency(media.revenue)}
                        </Typography>
                      </Box>
                    )}
                  </Stack>
                )}

                {/* Action Buttons */}
                <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                  {/* Favorite Button */}
                  <LoadingButton
                    variant={isFavorite ? "contained" : "outlined"}
                    sx={{ minWidth: 120 }}
                    size="large"
                    startIcon={
                      isFavorite ? (
                        <FavoriteIcon />
                      ) : (
                        <FavoriteBorderOutlinedIcon />
                      )
                    }
                    loadingPosition="start"
                    loading={onRequest}
                    onClick={handleFavoriteClick}
                    color={isFavorite ? "error" : "inherit"}
                    aria-label={
                      isFavorite ? "Remove from favorites" : "Add to favorites"
                    }
                  >
                    {isFavorite ? "Favorited" : "Favorite"}
                  </LoadingButton>

                  {/* Watchlist Button */}
                  <WatchlistButton
                    media={media}
                    mediaType={mediaType}
                    inWatchlist={inWatchlist}
                    watchlistStatus={watchlistStatus}
                    watchlistId={watchlistId}
                    onUpdate={handleWatchlistUpdate}
                    size="large"
                  />

                  {/* Watch Trailer Button */}
                  {mainTrailer && (
                    <Button
                      variant="contained"
                      sx={{ minWidth: 140 }}
                      size="large"
                      startIcon={<PlayArrowIcon />}
                      onClick={handleWatchTrailer}
                      aria-label="Watch trailer"
                    >
                      Watch Trailer
                    </Button>
                  )}
                </Stack>

                {/* Production Companies */}
                <ProductionCompanies companies={media.production_companies} />
              </Stack>
            </Box>
          </Box>
        </Box>

        {/* Cast Section */}
        {media.credits?.cast?.length > 0 && (
          <Box sx={{ mt: 6 }}>
            <Container header="Top Billed Cast">
              <CastSlide casts={media.credits.cast.slice(0, 15)} />
            </Container>
          </Box>
        )}

        {/* Next Episode Air Date for TV Shows */}
        {mediaType === "tv" && media.next_episode_to_air && (
          <NextEpisodeInfo
            nextEpisode={media.next_episode_to_air}
            showName={media.name}
          />
        )}

        {/* TV Show Seasons */}
        {mediaType === "tv" && media.seasons?.length > 0 && (
          <SeasonSelector
            seasons={media.seasons}
            currentSeason={currentSeason}
            onSeasonChange={setCurrentSeason}
            tvId={media.id}
          />
        )}

        {/* Where to Watch */}
        {watchProviders && Object.keys(watchProviders).length > 0 && (
          <Box sx={{ mt: 4 }}>
            <Container header="Where to Watch">
              <WatchProviders
                providers={currentProviders}
                allRegions={Object.keys(watchProviders)}
                onRegionChange={handleRegionChange}
              />
            </Container>
          </Box>
        )}

        {/* Videos Section */}
        <div ref={videoRef} style={{ paddingTop: "2rem" }}>
          {media.videos?.results?.length > 0 && (
            <Container
              header={`Videos (${media.videos.results.length})`}
            >
              <MediaVideosSlide videos={videosToShow} />
              {media.videos.results.length > 6 && (
                <Box sx={{ textAlign: "center", mt: 2 }}>
                  <Button
                    onClick={() => setShowAllVideos(!showAllVideos)}
                    endIcon={
                      showAllVideos ? <ExpandLessIcon /> : <ExpandMoreIcon />
                    }
                  >
                    {showAllVideos
                      ? "Show Less"
                      : `Show All ${media.videos.results.length} Videos`}
                  </Button>
                </Box>
              )}
            </Container>
          )}
        </div>

        {/* Backdrops */}
        {media.images?.backdrops?.length > 0 && (
          <Container header={`Backdrops (${media.images.backdrops.length})`}>
            <BackdropSlide backdrops={media.images.backdrops} />
          </Container>
        )}

        {/* Posters */}
        {media.images?.posters?.length > 0 && (
          <Container header={`Posters (${media.images.posters.length})`}>
            <PosterSlide posters={media.images.posters} />
          </Container>
        )}

        {/* Reviews */}
        <MediaReview
          reviews={media.reviews || []}
          media={media}
          mediaType={mediaType}
          userRating={userRating}
        />

        {/* Similar Titles */}
        {media.similar?.length > 0 && (
          <Container header="Similar Titles">
            <RecommendSlide medias={media.similar} mediaType={mediaType} />
          </Container>
        )}

        {/* Recommendations */}
        <Container header="You May Also Like">
          {media.recommend?.length > 0 ? (
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
  );
};

export default MediaDetail;
