import { useState, useEffect, useCallback, useMemo } from "react";
import { useDispatch } from "react-redux";
import { Link as RouterLink } from "react-router-dom";
import { toast } from "react-toastify";
import {
  Box,
  Button,
  Grid,
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
  Menu,
  alpha,
  useTheme,
  Fade,
  Badge,
} from "@mui/material";
import { LoadingButton } from "@mui/lab";
import DeleteIcon from "@mui/icons-material/Delete";
import DeleteSweepIcon from "@mui/icons-material/DeleteSweep";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import FavoriteIcon from "@mui/icons-material/Favorite";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import SortIcon from "@mui/icons-material/Sort";
import MovieIcon from "@mui/icons-material/Movie";
import TvIcon from "@mui/icons-material/Tv";
import ExploreIcon from "@mui/icons-material/Explore";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import FilterListIcon from "@mui/icons-material/FilterList";

import MediaItem from "../components/common/MediaItem";
import Container from "../components/common/Container";
import { MediaGridSkeleton } from "../components/common/MediaSkeleton";
import uiConfigs from "../configs/ui.configs";
import favoriteApi from "../api/modules/favorite.api";
import { setGlobalLoading } from "../redux/features/globalLoadingSlice";
import { removeFavorite, removeFavoritesByType } from "../redux/features/userSlice";

const ITEMS_PER_PAGE = 20;

const sortOptions = [
  { value: "createdAt", label: "Date Added", order: "desc" },
  { value: "mediaTitle", label: "Title (A-Z)", order: "asc" },
  { value: "mediaTitle-desc", label: "Title (Z-A)", order: "desc" },
  { value: "mediaRate", label: "Rating (High-Low)", order: "desc" },
  { value: "mediaRate-asc", label: "Rating (Low-High)", order: "asc" },
];

/**
 * FavoriteItem Component
 * Displays a single favorite item with hover-reveal delete button
 */
const FavoriteItem = ({ media, onRemoveClick }) => {
  const theme = useTheme();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Box
      sx={{
        position: "relative",
        "&:hover .remove-overlay": {
          opacity: 1,
        },
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <MediaItem media={media} mediaType={media.mediaType} showMediaType={true} />
      
      {/* Hover overlay with delete button */}
      <Fade in={isHovered}>
        <Box
          className="remove-overlay"
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "flex-end",
            p: 1,
            opacity: { xs: 1, md: 0 },
            transition: "opacity 0.2s ease-in-out",
            pointerEvents: "none",
            borderRadius: "0.75rem",
            zIndex: 10,
          }}
        >
          <Tooltip title="Remove from favorites" arrow>
            <IconButton
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onRemoveClick(media);
              }}
              sx={{
                pointerEvents: "auto",
                bgcolor: alpha(theme.palette.error.main, 0.9),
                color: "white",
                backdropFilter: "blur(4px)",
                "&:hover": {
                  bgcolor: theme.palette.error.dark,
                  transform: "scale(1.1)",
                },
                transition: "all 0.2s ease",
                boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
              }}
              size="small"
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Fade>
    </Box>
  );
};

/**
 * FavoriteList Component
 * Displays user's favorites with filtering, sorting, search, and pagination
 */
const FavoriteList = () => {
  const theme = useTheme();
  const dispatch = useDispatch();

  // State
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  
  // Filters
  const [mediaType, setMediaType] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  
  // Counts by type
  const [counts, setCounts] = useState({ total: 0, movies: 0, tvShows: 0 });
  
  // Delete dialog
  const [deleteDialog, setDeleteDialog] = useState({ open: false, item: null });
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  // Bulk delete
  const [bulkDeleteDialog, setBulkDeleteDialog] = useState({ open: false, type: null });
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);
  
  // More menu
  const [moreMenuAnchor, setMoreMenuAnchor] = useState(null);

  // Fetch counts
  const fetchCounts = useCallback(async () => {
    const { response } = await favoriteApi.getCount();
    if (response) {
      setCounts(response);
    }
  }, []);

  // Fetch favorites with current filters
  const fetchFavorites = useCallback(async (resetPage = false) => {
    const currentPage = resetPage ? 1 : page;
    if (resetPage) setPage(1);
    
    setLoading(true);
    
    const params = {
      page: currentPage,
      limit: ITEMS_PER_PAGE,
      sortBy: sortBy.replace("-desc", "").replace("-asc", ""),
      sortOrder,
    };
    
    if (mediaType !== "all") {
      params.mediaType = mediaType;
    }
    
    if (searchQuery.trim()) {
      params.search = searchQuery.trim();
    }
    
    const { response, err } = await favoriteApi.getList(params);
    
    if (err) {
      toast.error(err.message || "Failed to load favorites");
      setFavorites([]);
    } else if (response) {
      setFavorites(response.favorites || []);
      setTotalPages(response.pagination?.totalPages || 0);
      setTotalCount(response.pagination?.total || 0);
    }
    
    setLoading(false);
  }, [page, mediaType, sortBy, sortOrder, searchQuery]);

  // Initial load
  useEffect(() => {
      dispatch(setGlobalLoading(true));
    Promise.all([fetchFavorites(true), fetchCounts()]).finally(() => {
      dispatch(setGlobalLoading(false));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refetch when filters change
  useEffect(() => {
    fetchFavorites(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediaType, sortBy, sortOrder, searchQuery]);

  // Handle page change
  useEffect(() => {
    if (page > 1) {
      fetchFavorites();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // Handle sort change
  const handleSortChange = (event) => {
    const value = event.target.value;
    setSortBy(value);
    
    const option = sortOptions.find(o => o.value === value);
    if (option) {
      setSortOrder(option.order);
    }
  };

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

  // Handle delete single
  const handleDeleteClick = (item) => {
    setDeleteDialog({ open: true, item });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.item) return;
    
    setDeleteLoading(true);
    const favoriteId = deleteDialog.item.id || deleteDialog.item._id;
    
    const { response, err } = await favoriteApi.remove({ favoriteId });
    
    if (err) {
      toast.error(err.message || "Failed to remove favorite");
    } else if (response) {
      dispatch(removeFavorite({ mediaId: deleteDialog.item.mediaId }));
      toast.success("Removed from favorites");
      
      // Refresh list and counts
      await Promise.all([fetchFavorites(), fetchCounts()]);
    }
    
    setDeleteLoading(false);
    setDeleteDialog({ open: false, item: null });
  };

  // Handle bulk delete
  const handleBulkDeleteClick = (type) => {
    setBulkDeleteDialog({ open: true, type });
    setMoreMenuAnchor(null);
  };

  const handleBulkDeleteConfirm = async () => {
    setBulkDeleteLoading(true);
    
    const { response, err } = await favoriteApi.removeByType({ 
      mediaType: bulkDeleteDialog.type 
    });
    
    if (err) {
      toast.error(err.message || "Failed to remove favorites");
    } else if (response) {
      toast.success(`Removed ${response.deletedCount} ${bulkDeleteDialog.type === "movie" ? "movies" : "TV shows"} from favorites`);
      
      // Update Redux store
      dispatch(removeFavoritesByType({ mediaType: bulkDeleteDialog.type }));
      
      // Refresh list and counts
      await Promise.all([fetchFavorites(true), fetchCounts()]);
    }
    
    setBulkDeleteLoading(false);
    setBulkDeleteDialog({ open: false, type: null });
  };

  // Tab counts with badges
  const tabCounts = useMemo(() => ({
    all: counts.total,
    movie: counts.movies,
    tv: counts.tvShows,
  }), [counts]);

  return (
    <Box sx={{ ...uiConfigs.style.mainContent }}>
      <Container header="Your Favorites">
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
              icon={<FavoriteIcon sx={{ fontSize: 16 }} />}
              label={`${counts.total} Total`}
              color="error"
              variant="outlined"
            />
            <Chip
              icon={<MovieIcon sx={{ fontSize: 16 }} />}
              label={`${counts.movies} Movies`}
              variant="outlined"
            />
            <Chip
              icon={<TvIcon sx={{ fontSize: 16 }} />}
              label={`${counts.tvShows} TV Shows`}
              variant="outlined"
            />
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
                placeholder="Search your favorites..."
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

              <Stack direction="row" spacing={1} alignItems="center">
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
                    onChange={handleSortChange}
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

                {/* More Actions */}
                <Tooltip title="More actions">
                  <IconButton
                    onClick={(e) => setMoreMenuAnchor(e.currentTarget)}
                    sx={{
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      "&:hover": {
                        bgcolor: alpha(theme.palette.primary.main, 0.2),
                      },
                    }}
                  >
                    <MoreVertIcon />
                  </IconButton>
                </Tooltip>
                
                <Menu
                  anchorEl={moreMenuAnchor}
                  open={Boolean(moreMenuAnchor)}
                  onClose={() => setMoreMenuAnchor(null)}
                  transformOrigin={{ horizontal: "right", vertical: "top" }}
                  anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
                >
                  <MenuItem 
                    onClick={() => handleBulkDeleteClick("movie")}
                    disabled={counts.movies === 0}
                  >
                    <DeleteSweepIcon sx={{ mr: 1, color: "error.main" }} fontSize="small" />
                    Remove All Movies ({counts.movies})
                  </MenuItem>
                  <MenuItem 
                    onClick={() => handleBulkDeleteClick("tv")}
                    disabled={counts.tvShows === 0}
                  >
                    <DeleteSweepIcon sx={{ mr: 1, color: "error.main" }} fontSize="small" />
                    Remove All TV Shows ({counts.tvShows})
                  </MenuItem>
                </Menu>
              </Stack>
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
          <MediaGridSkeleton count={ITEMS_PER_PAGE} />
        ) : favorites.length === 0 ? (
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
                bgcolor: alpha(theme.palette.error.main, 0.1),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mx: "auto",
                mb: 3,
            }}
          >
              <FavoriteBorderIcon 
                sx={{ 
                  fontSize: 40, 
                  color: alpha(theme.palette.error.main, 0.6),
                }} 
              />
            </Box>
            
            {searchQuery ? (
              <>
                <Typography variant="h6" color="text.primary" gutterBottom>
                  No matches found
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  No favorites match "{searchQuery}". Try a different search term.
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
                  No {mediaType === "movie" ? "movies" : "TV shows"} in favorites
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  You haven't added any {mediaType === "movie" ? "movies" : "TV shows"} to your favorites yet.
                </Typography>
                <Stack direction="row" spacing={2} justifyContent="center">
                  <Button
                    variant="outlined"
                    onClick={() => setMediaType("all")}
                  >
                    View All Favorites
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
              Your favorites list is empty
            </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 400, mx: "auto" }}>
                  Start exploring and add movies & TV shows to your favorites to keep track of what you love!
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
            <Grid container spacing={2}>
              {favorites.map((media) => (
                <Grid item xs={6} sm={4} md={3} lg={2.4} key={media.id || media._id}>
                  <FavoriteItem 
                    media={media} 
                    onRemoveClick={handleDeleteClick}
                  />
                </Grid>
              ))}
            </Grid>

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
            <span>Remove from Favorites?</span>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to remove{" "}
            <strong>"{deleteDialog.item?.mediaTitle}"</strong> from your favorites?
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

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog
        open={bulkDeleteDialog.open}
        onClose={() => !bulkDeleteLoading && setBulkDeleteDialog({ open: false, type: null })}
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
            <DeleteSweepIcon color="error" />
            <span>Remove All {bulkDeleteDialog.type === "movie" ? "Movies" : "TV Shows"}?</span>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will remove all{" "}
            <strong>
              {bulkDeleteDialog.type === "movie" 
                ? `${counts.movies} movies` 
                : `${counts.tvShows} TV shows`}
            </strong>{" "}
            from your favorites. This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button 
            onClick={() => setBulkDeleteDialog({ open: false, type: null })}
            disabled={bulkDeleteLoading}
          >
            Cancel
          </Button>
          <LoadingButton
            onClick={handleBulkDeleteConfirm}
            loading={bulkDeleteLoading}
            color="error"
            variant="contained"
            startIcon={<DeleteSweepIcon />}
          >
            Remove All
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FavoriteList;
