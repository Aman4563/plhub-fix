import { useState, useEffect, useCallback, useMemo } from "react";
import { useDispatch } from "react-redux";
import { Link as RouterLink } from "react-router-dom";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import {
  Box,
  Button,
  Paper,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Tabs,
  Tab,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack,
  Chip,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Tooltip,
  alpha,
  useTheme,
  Fade,
  Badge,
  Card,
  CardMedia,
  CardContent,
  Skeleton,
} from "@mui/material";
import { LoadingButton } from "@mui/lab";
import DeleteIcon from "@mui/icons-material/Delete";
import RateReviewOutlinedIcon from "@mui/icons-material/RateReviewOutlined";
import RateReviewIcon from "@mui/icons-material/RateReview";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import SortIcon from "@mui/icons-material/Sort";
import MovieIcon from "@mui/icons-material/Movie";
import TvIcon from "@mui/icons-material/Tv";
import ExploreIcon from "@mui/icons-material/Explore";
import FilterListIcon from "@mui/icons-material/FilterList";
import StarIcon from "@mui/icons-material/Star";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import EditIcon from "@mui/icons-material/Edit";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

import Container from "../components/common/Container";
import uiConfigs from "../configs/ui.configs";
import reviewApi from "../api/modules/review.api";
import tmdbConfigs from "../api/configs/tmdb.configs";
import { setGlobalLoading } from "../redux/features/globalLoadingSlice";
import { routesGen } from "../routes/routes";
import { DisplayStarRating } from "../components/common/StarRating";

dayjs.extend(relativeTime);

const ITEMS_PER_PAGE = 10;

const sortOptions = [
  { value: "createdAt", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "rating", label: "Highest Rated" },
  { value: "title", label: "Title (A-Z)" },
];

/**
 * ReviewItemSkeleton - Loading skeleton for review items
 */
const ReviewItemSkeleton = () => {
  const theme = useTheme();

  return (
    <Card
      sx={{
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        bgcolor: alpha(theme.palette.background.paper, 0.6),
        borderRadius: 2,
        overflow: "hidden",
      }}
    >
      <Skeleton
        variant="rectangular"
            sx={{
          width: { xs: "100%", md: 120 },
          height: { xs: 180, md: 180 },
          flexShrink: 0,
        }}
      />
      <CardContent sx={{ flex: 1, p: 2 }}>
        <Skeleton variant="text" width="60%" height={28} />
        <Skeleton variant="text" width="30%" height={20} sx={{ mt: 1 }} />
        <Skeleton variant="text" width="100%" height={60} sx={{ mt: 1 }} />
      </CardContent>
    </Card>
  );
};

/**
 * ReviewItem Component
 * Displays a single review with poster and hover actions
 */
const ReviewItem = ({ review, onRemoveClick }) => {
  const theme = useTheme();
  const [isHovered, setIsHovered] = useState(false);

  const posterPath = tmdbConfigs.posterPath(review.mediaPoster);

  return (
    <Card
      sx={{
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        bgcolor: alpha(theme.palette.background.paper, 0.6),
        backdropFilter: "blur(8px)",
        borderRadius: 2,
        overflow: "hidden",
        position: "relative",
        transition: "transform 0.2s, box-shadow 0.2s",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: `0 8px 24px ${alpha(theme.palette.common.black, 0.2)}`,
        },
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Poster */}
      <Box
        component={RouterLink}
        to={routesGen.mediaDetail(review.mediaType, review.mediaId)}
        sx={{
          width: { xs: "100%", sm: 120 },
          minHeight: { xs: 180, sm: 180 },
          flexShrink: 0,
          position: "relative",
        }}
      >
        <CardMedia
          component="img"
          image={posterPath}
          alt={review.mediaTitle}
          sx={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
        {/* Media Type Badge */}
        <Chip
          icon={review.mediaType === "movie" ? <MovieIcon sx={{ fontSize: 12 }} /> : <TvIcon sx={{ fontSize: 12 }} />}
          label={review.mediaType === "movie" ? "Movie" : "TV"}
          size="small"
          sx={{
            position: "absolute",
            top: 8,
            left: 8,
            height: 22,
            fontSize: "0.65rem",
            fontWeight: 600,
            backgroundColor: alpha(theme.palette.background.paper, 0.9),
            backdropFilter: "blur(4px)",
          }}
        />
      </Box>

      {/* Content */}
      <CardContent sx={{ flex: 1, p: 2, position: "relative" }}>
        <Stack spacing={1.5}>
          {/* Title */}
          <Typography
            component={RouterLink}
            to={routesGen.mediaDetail(review.mediaType, review.mediaId)}
            variant="h6"
            sx={{
              color: "text.primary",
              textDecoration: "none",
              fontWeight: 600,
              fontSize: { xs: "1rem", md: "1.1rem" },
              "&:hover": { color: "primary.main" },
              ...uiConfigs.style.typoLines(1, "left"),
            }}
            >
              {review.mediaTitle}
            </Typography>

          {/* Rating and Date Row */}
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" gap={1}>
            {review.rating && (
              <DisplayStarRating value={review.rating} size="small" />
            )}
            {review.containsSpoilers && (
              <Chip
                icon={<WarningAmberIcon sx={{ fontSize: 14 }} />}
                label="Spoiler"
                size="small"
                color="warning"
                variant="outlined"
                sx={{ height: 22 }}
              />
            )}
            <Typography variant="caption" color="text.secondary">
              {dayjs(review.createdAt).fromNow()}
            </Typography>
            {review.helpfulVotes > 0 && (
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <ThumbUpIcon sx={{ fontSize: 14, color: "text.secondary" }} />
                <Typography variant="caption" color="text.secondary">
                  {review.helpfulVotes}
                </Typography>
              </Stack>
            )}
          </Stack>

          {/* Review Content */}
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              ...uiConfigs.style.typoLines(3, "left"),
              lineHeight: 1.6,
            }}
          >
            {review.content}
          </Typography>
        </Stack>

        {/* Hover Actions */}
        <Fade in={isHovered}>
          <Stack
            direction="row"
            spacing={1}
            sx={{
              position: "absolute",
              top: 8,
              right: 8,
              opacity: { xs: 1, md: 0 },
              transition: "opacity 0.2s",
              ".MuiCard-root:hover &": { opacity: 1 },
            }}
          >
            <Tooltip title="View & Edit" arrow>
              <IconButton
                component={RouterLink}
                to={routesGen.mediaDetail(review.mediaType, review.mediaId)}
                size="small"
                sx={{
                  bgcolor: alpha(theme.palette.primary.main, 0.9),
                  color: "white",
                  "&:hover": { bgcolor: theme.palette.primary.dark },
                }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Remove review" arrow>
              <IconButton
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onRemoveClick(review);
                }}
                size="small"
        sx={{
                  bgcolor: alpha(theme.palette.error.main, 0.9),
                  color: "white",
                  "&:hover": { bgcolor: theme.palette.error.dark },
                }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </Fade>
      </CardContent>
    </Card>
  );
};

/**
 * ReviewList Component
 * Displays user's reviews with filtering, sorting, search, and pagination
 */
const ReviewList = () => {
  const theme = useTheme();
  const dispatch = useDispatch();

  // State
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [mediaType, setMediaType] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    movies: 0,
    tvShows: 0,
    averageRating: null,
    totalHelpfulVotes: 0,
  });

  // Delete dialog
  const [deleteDialog, setDeleteDialog] = useState({ open: false, item: null });
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    const { response } = await reviewApi.getStats();
    if (response) {
      setStats(response);
    }
  }, []);

  // Fetch reviews with current filters
  const fetchReviews = useCallback(async (resetPage = false) => {
    const currentPage = resetPage ? 1 : page;
    if (resetPage) setPage(1);

    setLoading(true);

    const params = {
      page: currentPage,
      limit: ITEMS_PER_PAGE,
      sort: sortBy,
    };

    if (mediaType !== "all") {
      params.mediaType = mediaType;
    }

    if (searchQuery.trim()) {
      params.search = searchQuery.trim();
    }

    const { response, err } = await reviewApi.getList(params);

    if (err) {
      toast.error(err.message || "Failed to load reviews");
      setReviews([]);
    } else if (response) {
      setReviews(response.reviews || []);
      setTotalPages(response.pagination?.totalPages || 0);
      setTotalCount(response.pagination?.total || 0);
    }

    setLoading(false);
  }, [page, mediaType, sortBy, searchQuery]);

  // Initial load
  useEffect(() => {
      dispatch(setGlobalLoading(true));
    Promise.all([fetchReviews(true), fetchStats()]).finally(() => {
      dispatch(setGlobalLoading(false));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refetch when filters change
  useEffect(() => {
    fetchReviews(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediaType, sortBy, searchQuery]);

  // Handle page change
  useEffect(() => {
    if (page > 1) {
      fetchReviews();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // Handle search
  const handleSearch = () => {
    setSearchQuery(searchInput);
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setSearchQuery("");
  };

  // Handle delete
  const handleDeleteClick = (item) => {
    setDeleteDialog({ open: true, item });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.item) return;

    setDeleteLoading(true);
    const reviewId = deleteDialog.item.id || deleteDialog.item._id;

    const { response, err } = await reviewApi.remove({ reviewId });

    if (err) {
      toast.error(err.message || "Failed to remove review");
    } else if (response) {
      toast.success("Review removed successfully");
      await Promise.all([fetchReviews(), fetchStats()]);
    }

    setDeleteLoading(false);
    setDeleteDialog({ open: false, item: null });
  };

  // Tab counts with badges
  const tabCounts = useMemo(() => ({
    all: stats.total,
    movie: stats.movies,
    tv: stats.tvShows,
  }), [stats]);

  return (
    <Box sx={{ ...uiConfigs.style.mainContent }}>
      <Container header="Your Reviews">
        {/* Header Stats */}
        <Box sx={{ mb: 3 }}>
          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
            flexWrap="wrap"
            gap={1}
          >
            <Chip
              icon={<RateReviewIcon sx={{ fontSize: 16 }} />}
              label={`${stats.total} Reviews`}
              color="primary"
              variant="outlined"
            />
            <Chip
              icon={<MovieIcon sx={{ fontSize: 16 }} />}
              label={`${stats.movies} Movies`}
              variant="outlined"
            />
            <Chip
              icon={<TvIcon sx={{ fontSize: 16 }} />}
              label={`${stats.tvShows} TV Shows`}
              variant="outlined"
            />
            {stats.averageRating && (
              <Chip
                icon={<StarIcon sx={{ fontSize: 16, color: "#f5c518" }} />}
                label={`Avg Rating: ${stats.averageRating}/10`}
                variant="outlined"
                sx={{ borderColor: "#f5c518", color: "#f5c518" }}
              />
            )}
            {stats.totalHelpfulVotes > 0 && (
              <Chip
                icon={<ThumbUpIcon sx={{ fontSize: 16 }} />}
                label={`${stats.totalHelpfulVotes} Helpful Votes`}
                variant="outlined"
                color="success"
              />
            )}
          </Stack>
        </Box>

        {/* Filters Bar */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 3,
            bgcolor: alpha(theme.palette.background.paper, 0.8),
            backdropFilter: "blur(8px)",
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          }}
        >
          <Stack spacing={2}>
            {/* Search and Sort Row */}
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              alignItems={{ sm: "center" }}
              justifyContent="space-between"
            >
              {/* Search */}
              <TextField
                size="small"
                placeholder="Search your reviews..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyPress={handleSearchKeyPress}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="disabled" fontSize="small" />
                    </InputAdornment>
                  ),
                  endAdornment: searchInput && (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={handleClearSearch}>
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  minWidth: { xs: "100%", sm: 280 },
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                  },
                }}
                onBlur={handleSearch}
              />

              {/* Sort */}
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel>
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <SortIcon fontSize="small" />
                    <span>Sort By</span>
                  </Stack>
                </InputLabel>
                <Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  label="Sort By..."
                  sx={{ borderRadius: 2 }}
                >
                  {sortOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>

            {/* Media Type Tabs */}
            <Tabs
              value={mediaType}
              onChange={(e, val) => setMediaType(val)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                minHeight: 40,
                "& .MuiTab-root": {
                  minHeight: 40,
                  py: 0.5,
                  textTransform: "none",
                  fontWeight: 500,
                },
                "& .MuiTabs-indicator": {
                  height: 3,
                  borderRadius: 1.5,
                },
              }}
            >
              <Tab
                value="all"
                label={
                  <Badge badgeContent={tabCounts.all} color="primary" max={999}>
                    <Stack direction="row" spacing={0.5} alignItems="center" sx={{ pr: 1.5 }}>
                      <FilterListIcon fontSize="small" />
                      <span>All</span>
                    </Stack>
                  </Badge>
                }
              />
              <Tab
                value="movie"
                label={
                  <Badge badgeContent={tabCounts.movie} color="primary" max={999}>
                    <Stack direction="row" spacing={0.5} alignItems="center" sx={{ pr: 1.5 }}>
                      <MovieIcon fontSize="small" />
                      <span>Movies</span>
                    </Stack>
                  </Badge>
                }
              />
              <Tab
                value="tv"
                label={
                  <Badge badgeContent={tabCounts.tv} color="primary" max={999}>
                    <Stack direction="row" spacing={0.5} alignItems="center" sx={{ pr: 1.5 }}>
                      <TvIcon fontSize="small" />
                      <span>TV Shows</span>
                    </Stack>
                  </Badge>
                }
              />
            </Tabs>
          </Stack>
        </Paper>

        {/* Active Filters Indicator */}
        {(searchQuery || mediaType !== "all") && (
          <Stack direction="row" spacing={1} sx={{ mb: 2 }} flexWrap="wrap" gap={1}>
            {searchQuery && (
              <Chip
                label={`Search: "${searchQuery}"`}
                onDelete={handleClearSearch}
                size="small"
                color="primary"
                variant="outlined"
              />
            )}
            {mediaType !== "all" && (
              <Chip
                label={mediaType === "movie" ? "Movies only" : "TV Shows only"}
                onDelete={() => setMediaType("all")}
                size="small"
                color="primary"
                variant="outlined"
                icon={mediaType === "movie" ? <MovieIcon /> : <TvIcon />}
              />
            )}
            <Typography variant="body2" color="text.secondary" sx={{ alignSelf: "center" }}>
              {totalCount} result{totalCount !== 1 ? "s" : ""}
            </Typography>
          </Stack>
        )}

        {/* Content */}
        {loading ? (
          <Stack spacing={2}>
            {[...Array(3)].map((_, index) => (
              <ReviewItemSkeleton key={index} />
            ))}
          </Stack>
        ) : reviews.length === 0 ? (
          <Paper
            sx={{
              p: { xs: 4, md: 6 },
              textAlign: "center",
              backgroundColor: alpha(theme.palette.background.paper, 0.6),
              backdropFilter: "blur(8px)",
              borderRadius: 3,
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            }}
          >
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mx: "auto",
                mb: 3,
              }}
            >
              <RateReviewOutlinedIcon
                sx={{
                  fontSize: 40,
                  color: alpha(theme.palette.primary.main, 0.6),
                }}
              />
            </Box>

            {searchQuery ? (
              <>
                <Typography variant="h6" color="text.primary" gutterBottom>
                  No matches found
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  No reviews match "{searchQuery}". Try a different search term.
                </Typography>
                <Button
                  variant="outlined"
                  onClick={handleClearSearch}
                  startIcon={<ClearIcon />}
                >
                  Clear Search
                </Button>
              </>
            ) : mediaType !== "all" ? (
              <>
                <Typography variant="h6" color="text.primary" gutterBottom>
                  No {mediaType === "movie" ? "movie" : "TV show"} reviews yet
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  You haven't reviewed any {mediaType === "movie" ? "movies" : "TV shows"} yet.
                </Typography>
                <Stack direction="row" spacing={2} justifyContent="center">
                  <Button variant="outlined" onClick={() => setMediaType("all")}>
                    View All Reviews
                  </Button>
                  <Button
                    component={RouterLink}
                    to={`/${mediaType}`}
                    variant="contained"
                    startIcon={<ExploreIcon />}
                  >
                    Browse {mediaType === "movie" ? "Movies" : "TV Shows"}
                  </Button>
                </Stack>
              </>
            ) : (
              <>
                <Typography variant="h6" color="text.primary" gutterBottom>
              You haven't written any reviews yet
            </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 400, mx: "auto" }}>
                  Share your thoughts on movies and TV shows! Your reviews help others discover great content.
            </Typography>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={2}
                  justifyContent="center"
                >
                  <Button
                    component={RouterLink}
                    to="/movie"
                    variant="contained"
                    startIcon={<MovieIcon />}
                    sx={{ minWidth: 140 }}
                  >
                    Browse Movies
                  </Button>
                  <Button
                    component={RouterLink}
                    to="/tv"
                    variant="outlined"
                    startIcon={<TvIcon />}
                    sx={{ minWidth: 140 }}
                  >
                    Browse TV Shows
                  </Button>
                </Stack>
              </>
            )}
          </Paper>
        ) : (
          <>
          <Stack spacing={2}>
              {reviews.map((review) => (
                <ReviewItem
                  key={review.id || review._id}
                  review={review}
                  onRemoveClick={handleDeleteClick}
                />
              ))}
            </Stack>

            {/* Pagination */}
            {totalPages > 1 && (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  mt: 4,
                  pb: 2,
                }}
              >
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={(e, val) => setPage(val)}
                  color="primary"
                  size="large"
                  showFirstButton
                  showLastButton
                  sx={{
                    "& .MuiPaginationItem-root": {
                      borderRadius: 2,
                    },
                  }}
                />
              </Box>
            )}
          </>
        )}
      </Container>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => !deleteLoading && setDeleteDialog({ open: false, item: null })}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            bgcolor: theme.palette.background.paper,
          },
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <DeleteIcon color="error" />
            <span>Remove Review?</span>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to remove your review for{" "}
            <strong>"{deleteDialog.item?.mediaTitle}"</strong>? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setDeleteDialog({ open: false, item: null })}
            disabled={deleteLoading}
          >
            Cancel
          </Button>
          <LoadingButton
            onClick={handleDeleteConfirm}
            loading={deleteLoading}
            color="error"
            variant="contained"
            startIcon={<DeleteIcon />}
          >
            Remove
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ReviewList;
