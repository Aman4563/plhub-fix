/**
 * MediaList Component
 * Displays a paginated list of movies or TV series with category filters
 * Supports all TMDB categories: popular, top_rated, now_playing/on_the_air, upcoming/airing_today
 * Includes advanced filters: genre, year, rating with infinite scroll option
 */

import { LoadingButton } from "@mui/lab";
import {
  Box,
  Button,
  Stack,
  Typography,
  Chip,
  Fab,
  Zoom,
  Skeleton,
  Alert,
  Drawer,
  IconButton,
  Slider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  Badge,
  Paper,
} from "@mui/material";
import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useDispatch } from "react-redux";
import { useParams, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import RefreshIcon from "@mui/icons-material/Refresh";
import FilterListIcon from "@mui/icons-material/FilterList";
import CloseIcon from "@mui/icons-material/Close";
import TuneIcon from "@mui/icons-material/Tune";
import ClearAllIcon from "@mui/icons-material/ClearAll";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";

import tmdbConfigs from "../api/configs/tmdb.configs";
import mediaApi from "../api/modules/media.api";
import uiConfigs from "../configs/ui.configs";
import HeroSlide from "../components/common/HeroSlide";
import MediaGrid from "../components/common/MediaGrid";

import { setAppState } from "../redux/features/appStateSlice";
import { setGlobalLoading } from "../redux/features/globalLoadingSlice";
import usePrevious from "../hooks/usePrevious";

// Category configurations by media type
const CATEGORY_CONFIG = {
  movie: [
    { value: "popular", label: "Popular", description: "Most popular movies right now" },
    { value: "top_rated", label: "Top Rated", description: "Highest rated movies of all time" },
    { value: "now_playing", label: "Now Playing", description: "Currently in theaters" },
    { value: "upcoming", label: "Upcoming", description: "Coming soon to theaters" },
  ],
  tv: [
    { value: "popular", label: "Popular", description: "Most popular TV shows right now" },
    { value: "top_rated", label: "Top Rated", description: "Highest rated TV shows of all time" },
    { value: "on_the_air", label: "On The Air", description: "Currently airing shows" },
    { value: "airing_today", label: "Airing Today", description: "Episodes airing today" },
  ],
};

// Sort options
const SORT_OPTIONS = [
  { value: "popularity.desc", label: "Most Popular" },
  { value: "popularity.asc", label: "Least Popular" },
  { value: "vote_average.desc", label: "Highest Rated" },
  { value: "vote_average.asc", label: "Lowest Rated" },
  { value: "primary_release_date.desc", label: "Newest First" },
  { value: "primary_release_date.asc", label: "Oldest First" },
];

// Generate year options (current year to 1900)
const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: currentYear - 1900 + 2 }, (_, i) => currentYear + 1 - i);

const MediaList = () => {
  const { mediaType } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const dispatch = useDispatch();

  const [medias, setMedias] = useState([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [currCategory, setCurrCategory] = useState(0);
  const [currPage, setCurrPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalResults, setTotalResults] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Filter states
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [genres, setGenres] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [ratingRange, setRatingRange] = useState([0, 10]);
  const [sortBy, setSortBy] = useState("popularity.desc");
  const [useFilters, setUseFilters] = useState(false);

  // Watch providers filter
  const [watchProviders, setWatchProviders] = useState([]);
  const [selectedProviders, setSelectedProviders] = useState([]);

  // Infinite scroll
  const [infiniteScroll, setInfiniteScroll] = useState(false);
  const observerRef = useRef(null);
  const loadMoreRef = useRef(null);

  const prevMediaType = usePrevious(mediaType);

  // Get categories based on media type
  const categories = useMemo(
    () => CATEGORY_CONFIG[mediaType] || CATEGORY_CONFIG.movie,
    [mediaType]
  );

  // Get category values for API
  const categoryValues = useMemo(
    () => categories.map((c) => c.value),
    [categories]
  );

  // Fetch genres and watch providers on mount
  useEffect(() => {
    const fetchFiltersData = async () => {
      // Fetch genres
      const genresRes = await mediaApi.getGenres({ mediaType });
      if (genresRes.response?.genres) {
        setGenres(genresRes.response.genres);
      }

      // Fetch watch providers
      const providersRes = await mediaApi.getWatchProvidersList(mediaType);
      if (providersRes.response?.results) {
        // Sort by display priority and take top providers
        const sortedProviders = providersRes.response.results
          .sort((a, b) => (a.display_priority || 999) - (b.display_priority || 999))
          .slice(0, 30);
        setWatchProviders(sortedProviders);
      }
    };
    fetchFiltersData();
  }, [mediaType]);

  // Handle scroll to show/hide "back to top" button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 500);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Infinite scroll observer
  useEffect(() => {
    if (!infiniteScroll || !hasMore || mediaLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !mediaLoading) {
          setCurrPage((prev) => prev + 1);
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    observerRef.current = observer;

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [infiniteScroll, hasMore, mediaLoading]);

  // Set the application state and document title
  useEffect(() => {
    dispatch(setAppState(mediaType));
    window.scrollTo(0, 0);
    
    // Update document title for SEO
    const title = mediaType === "movie" ? "Movies" : "TV Series";
    const category = categories[currCategory]?.label || "Popular";
    document.title = `${category} ${title} - PLHub`;
    
    return () => {
      document.title = "PLHub - Movies & TV Shows";
    };
  }, [mediaType, currCategory, categories, dispatch]);

  // Handle URL params for category
  useEffect(() => {
    const categoryParam = searchParams.get("category");
    if (categoryParam) {
      const categoryIndex = categoryValues.indexOf(categoryParam);
      if (categoryIndex !== -1 && categoryIndex !== currCategory) {
        setCurrCategory(categoryIndex);
        setMedias([]);
        setCurrPage(1);
      }
    }
  }, [searchParams, categoryValues, currCategory]);

  // Track if initial setup is complete (genres loaded + URL params checked)
  const [isInitialized, setIsInitialized] = useState(false);
  const initialGenreProcessedRef = useRef(false);

  // Handle URL params for genre filter (from detail page genre clicks)
  // This runs when genres are loaded and checks for genre in URL
  useEffect(() => {
    // Wait for genres to load before checking URL params
    if (genres.length === 0) return;
    
    const genreParam = searchParams.get("genre");
    
    // Process initial genre from URL
    if (genreParam && !initialGenreProcessedRef.current) {
      const genreExists = genres.find(g => g.id.toString() === genreParam);
      if (genreExists) {
        initialGenreProcessedRef.current = true;
        setSelectedGenre(genreParam);
        setUseFilters(true);
      }
    }
    
    // Mark as initialized (genres loaded, URL checked)
    if (!isInitialized) {
      setIsInitialized(true);
    }
    
    // Handle when genre is removed from URL (after initial processing)
    if (!genreParam && selectedGenre && initialGenreProcessedRef.current) {
      setSelectedGenre("");
      if (!selectedYear && ratingRange[0] === 0 && ratingRange[1] === 10 && selectedProviders.length === 0) {
        setUseFilters(false);
      }
    }
  }, [searchParams, genres, selectedGenre, selectedYear, ratingRange, selectedProviders, isInitialized]);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return selectedGenre || selectedYear || ratingRange[0] > 0 || ratingRange[1] < 10 || selectedProviders.length > 0;
  }, [selectedGenre, selectedYear, ratingRange, selectedProviders]);

  // Fetch media items (with or without filters)
  const fetchMedias = useCallback(async () => {
    if (currPage === 1) dispatch(setGlobalLoading(true));
    setMediaLoading(true);
    setError(null);

    let result;

    if (useFilters && hasActiveFilters) {
      // Use filterMedia endpoint with all advanced filters
      result = await mediaApi.filterMedia({
        mediaType,
        params: {
          page: currPage,
          genre: selectedGenre,
          sortBy,
          score: ratingRange[0] > 0 ? ratingRange[0] : undefined,
          maxScore: ratingRange[1] < 10 ? ratingRange[1] : undefined,
          watchProviders: selectedProviders.length > 0 ? selectedProviders.join("|") : undefined,
          watchRegion: "US",
          startDate: selectedYear ? `${selectedYear}-01-01` : undefined,
          endDate: selectedYear ? `${selectedYear}-12-31` : undefined,
        },
      });
    } else {
      // Use category list endpoint
      result = await mediaApi.getList({
        mediaType,
        mediaCategory: categoryValues[currCategory],
        page: currPage,
      });
    }

    const { response, err } = result;

    setMediaLoading(false);
    dispatch(setGlobalLoading(false));

    if (err) {
      setError(err.message || "Failed to load content");
      toast.error(err.message || "Failed to load content");
    } else if (response) {
      setMedias((prev) =>
        currPage === 1 ? response.results : [...prev, ...response.results]
      );
      setTotalPages(response.total_pages || 0);
      setTotalResults(response.total_results || 0);
      setHasMore(response.hasMore !== undefined ? response.hasMore : response.page < response.total_pages);
    }
  }, [mediaType, currCategory, currPage, categoryValues, dispatch, useFilters, hasActiveFilters, selectedGenre, selectedYear, ratingRange, sortBy, selectedProviders]);

  // Fetch on mount and when dependencies change
  useEffect(() => {
    // Wait for initialization before first fetch (ensures URL genre param is applied)
    if (!isInitialized) return;
    
    // Reset when media type changes (but preserve URL genre param)
    if (mediaType !== prevMediaType && prevMediaType !== undefined) {
      setCurrCategory(0);
      setCurrPage(1);
      setMedias([]);
      
      // Don't clear genre from URL - let it be processed by the genre useEffect
      const genreParam = searchParams.get("genre");
      if (!genreParam) {
      setSearchParams({});
      }
      
      // Reset filter states (will be re-applied from URL if genre exists)
      setSelectedGenre("");
      setSelectedYear("");
      setRatingRange([0, 10]);
      setSelectedProviders([]);
      setUseFilters(false);
      
      // Reset the genre processed flag so URL genre can be re-applied
      initialGenreProcessedRef.current = false;
      setIsInitialized(false); // Re-initialize to process new genre
      return; // Don't fetch yet, wait for re-initialization
    }

    fetchMedias();
  }, [mediaType, currCategory, currPage, prevMediaType, fetchMedias, setSearchParams, searchParams, isInitialized]);

  // Apply filters
  const handleApplyFilters = () => {
    setUseFilters(true);
    setMedias([]);
    setCurrPage(1);
    setFilterDrawerOpen(false);
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSelectedGenre("");
    setSelectedYear("");
    setRatingRange([0, 10]);
    setSortBy("popularity.desc");
    setSelectedProviders([]);
    setUseFilters(false);
    setMedias([]);
    setCurrPage(1);
    setFilterDrawerOpen(false);
    // Clear genre from URL if it was set
    if (searchParams.has("genre")) {
      searchParams.delete("genre");
      setSearchParams(searchParams);
    }
  };

  // Toggle watch provider selection
  const handleProviderToggle = (providerId) => {
    setSelectedProviders((prev) =>
      prev.includes(providerId)
        ? prev.filter((id) => id !== providerId)
        : [...prev, providerId]
    );
  };

  // Toggle infinite scroll
  const handleToggleInfiniteScroll = () => {
    setInfiniteScroll((prev) => !prev);
  };

  /**
   * Handle category change
   */
  const onCategoryChange = (categoryIndex) => {
    if (currCategory === categoryIndex) return;

    setMedias([]);
    setCurrPage(1);
    setCurrCategory(categoryIndex);
    setSearchParams({ category: categoryValues[categoryIndex] });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /**
   * Load more items
   */
  const onLoadMore = () => {
    if (!hasMore || mediaLoading) return;
    setCurrPage((prev) => prev + 1);
  };

  /**
   * Scroll to top
   */
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /**
   * Retry on error
   */
  const handleRetry = () => {
    fetchMedias();
  };

  return (
    <>
      {/* Hero Slide for the current category */}
      <HeroSlide
        mediaType={mediaType}
        mediaCategory={categoryValues[currCategory]}
      />

      {/* Main Content */}
      <Box sx={{ ...uiConfigs.style.mainContent }}>
        {/* Header Section */}
        <Stack
          spacing={2}
          direction={{ xs: "column", md: "row" }}
          alignItems={{ xs: "flex-start", md: "center" }}
          justifyContent="space-between"
          sx={{ marginBottom: 4 }}
        >
          {/* Title and Results Count */}
          <Box>
            <Typography fontWeight="700" variant="h4" component="h1">
              {mediaType === tmdbConfigs.mediaType.movie ? "Movies" : "TV Series"}
            </Typography>
            {totalResults > 0 && !mediaLoading && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {totalResults.toLocaleString()} titles found
              </Typography>
            )}
          </Box>

          {/* Category Filter Chips and Filter Button */}
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" gap={1}>
            {!useFilters && categories.map((category, index) => (
              <Chip
                key={category.value}
                label={category.label}
                onClick={() => onCategoryChange(index)}
                color={currCategory === index ? "primary" : "default"}
                variant={currCategory === index ? "filled" : "outlined"}
                sx={{
                  fontWeight: currCategory === index ? 600 : 400,
                  transition: "all 0.2s ease",
                  "&:hover": {
                    transform: "scale(1.05)",
                  },
                }}
              />
            ))}
            
            {/* Filter Button */}
            <Badge
              badgeContent={hasActiveFilters && useFilters ? "!" : 0}
              color="error"
            >
              <Chip
                icon={<TuneIcon />}
                label="Filters"
                onClick={() => setFilterDrawerOpen(true)}
                color={useFilters ? "secondary" : "default"}
                variant={useFilters ? "filled" : "outlined"}
                sx={{ fontWeight: useFilters ? 600 : 400 }}
              />
            </Badge>

            {/* Clear Filters */}
            {useFilters && hasActiveFilters && (
              <Chip
                icon={<ClearAllIcon />}
                label="Clear"
                onClick={handleClearFilters}
                color="error"
                variant="outlined"
                size="small"
              />
            )}
          </Stack>
        </Stack>

        {/* Category Description */}
        {categories[currCategory]?.description && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 3, fontStyle: "italic" }}
          >
            {categories[currCategory].description}
          </Typography>
        )}

        {/* Error State */}
        {error && (
          <Alert
            severity="error"
            action={
              <Button
                color="inherit"
                size="small"
                startIcon={<RefreshIcon />}
                onClick={handleRetry}
              >
                Retry
              </Button>
            }
            sx={{ mb: 3 }}
          >
            {error}
          </Alert>
        )}

        {/* Loading State (Initial) */}
        {mediaLoading && medias.length === 0 && (
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 2 }}>
            {[...Array(12)].map((_, i) => (
              <Box key={i}>
                <Skeleton variant="rectangular" sx={{ paddingTop: "150%", borderRadius: 1 }} />
                <Skeleton width="80%" sx={{ mt: 1 }} />
                <Skeleton width="40%" />
              </Box>
            ))}
          </Box>
        )}

        {/* Media Grid */}
        {medias.length > 0 && (
          <MediaGrid medias={medias} mediaType={mediaType} />
        )}

        {/* No Results */}
        {!mediaLoading && medias.length === 0 && !error && (
          <Box sx={{ textAlign: "center", py: 8 }}>
            <Typography variant="h6" color="text.secondary">
              No {mediaType === "movie" ? "movies" : "TV shows"} found in this category.
            </Typography>
          </Box>
        )}

        {/* Load More Section */}
        <Box sx={{ mt: 6, textAlign: "center" }}>
          {/* Pagination Info */}
          {medias.length > 0 && totalPages > 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Showing {medias.length.toLocaleString()} of {totalResults.toLocaleString()} results
              {" • "}Page {currPage} of {totalPages.toLocaleString()}
            </Typography>
          )}

          {/* Load More Button */}
          {hasMore && medias.length > 0 && (
            <LoadingButton
              variant="outlined"
              size="large"
              loading={mediaLoading}
              onClick={onLoadMore}
              sx={{ minWidth: 200 }}
            >
              Load More
            </LoadingButton>
          )}

          {/* End of List Message */}
          {!hasMore && medias.length > 0 && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                py: 2,
                borderTop: 1,
                borderColor: "divider",
                mt: 2,
              }}
            >
              <CheckCircleOutlineIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: "middle" }} />
              You've seen all {medias.length.toLocaleString()} titles in this category!
            </Typography>
          )}
        </Box>
      </Box>

      {/* Infinite Scroll Observer Element */}
      {infiniteScroll && hasMore && (
        <Box ref={loadMoreRef} sx={{ height: 20, mt: 4 }} />
      )}

      {/* Back to Top FAB */}
      <Zoom in={showScrollTop}>
        <Fab
          color="primary"
          size="medium"
          onClick={scrollToTop}
          aria-label="Scroll to top"
          sx={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 1000,
          }}
        >
          <KeyboardArrowUpIcon />
        </Fab>
      </Zoom>

      {/* Filter Drawer */}
      <Drawer
        anchor="right"
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        PaperProps={{
          sx: { width: { xs: "100%", sm: 360 }, p: 3 },
        }}
      >
        <Stack spacing={3}>
          {/* Header */}
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" fontWeight={700}>
              <FilterListIcon sx={{ mr: 1, verticalAlign: "middle" }} />
              Filters
            </Typography>
            <IconButton onClick={() => setFilterDrawerOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Stack>

          <Divider />

          {/* Genre Filter */}
          <FormControl fullWidth>
            <InputLabel>Genre</InputLabel>
            <Select
              value={selectedGenre}
              label="Genre"
              onChange={(e) => setSelectedGenre(e.target.value)}
            >
              <MenuItem value="">All Genres</MenuItem>
              {genres.map((genre) => (
                <MenuItem key={genre.id} value={genre.id.toString()}>
                  {genre.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Year Filter */}
          <FormControl fullWidth>
            <InputLabel>Year</InputLabel>
            <Select
              value={selectedYear}
              label="Year"
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              <MenuItem value="">All Years</MenuItem>
              {YEAR_OPTIONS.map((year) => (
                <MenuItem key={year} value={year.toString()}>
                  {year}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Rating Range Filter */}
          <Box>
            <Typography gutterBottom>
              Rating: {ratingRange[0]} - {ratingRange[1]}
            </Typography>
            <Slider
              value={ratingRange}
              onChange={(_, newValue) => setRatingRange(newValue)}
              valueLabelDisplay="auto"
              min={0}
              max={10}
              step={0.5}
              marks={[
                { value: 0, label: "0" },
                { value: 5, label: "5" },
                { value: 10, label: "10" },
              ]}
            />
          </Box>

          {/* Sort By */}
          <FormControl fullWidth>
            <InputLabel>Sort By</InputLabel>
            <Select
              value={sortBy}
              label="Sort By"
              onChange={(e) => setSortBy(e.target.value)}
            >
              {SORT_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Divider />

          {/* Watch Providers Filter */}
          <Box>
            <Typography variant="subtitle2" gutterBottom sx={{ mb: 1 }}>
              Streaming Services {selectedProviders.length > 0 && `(${selectedProviders.length})`}
            </Typography>
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 1,
                maxHeight: 200,
                overflowY: "auto",
                p: 1,
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 1,
              }}
            >
              {watchProviders.map((provider) => (
                <Chip
                  key={provider.provider_id}
                  avatar={
                    provider.logo_path ? (
                      <Box
                        component="img"
                        src={`https://image.tmdb.org/t/p/w45${provider.logo_path}`}
                        alt={provider.provider_name}
                        sx={{ borderRadius: "50%" }}
                      />
                    ) : undefined
                  }
                  label={provider.provider_name}
                  onClick={() => handleProviderToggle(provider.provider_id)}
                  color={selectedProviders.includes(provider.provider_id) ? "primary" : "default"}
                  variant={selectedProviders.includes(provider.provider_id) ? "filled" : "outlined"}
                  size="small"
                  sx={{
                    "& .MuiChip-avatar": { width: 20, height: 20 },
                    cursor: "pointer",
                  }}
                />
              ))}
              {watchProviders.length === 0 && (
                <Typography variant="caption" color="text.secondary">
                  Loading providers...
                </Typography>
              )}
            </Box>
          </Box>

          <Divider />

          {/* Infinite Scroll Toggle */}
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography>Infinite Scroll</Typography>
            <Chip
              label={infiniteScroll ? "On" : "Off"}
              onClick={handleToggleInfiniteScroll}
              color={infiniteScroll ? "primary" : "default"}
              variant={infiniteScroll ? "filled" : "outlined"}
              size="small"
            />
          </Stack>

          <Divider />

          {/* Action Buttons */}
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              fullWidth
              onClick={handleClearFilters}
              startIcon={<ClearAllIcon />}
            >
              Clear All
            </Button>
            <Button
              variant="contained"
              fullWidth
              onClick={handleApplyFilters}
              startIcon={<FilterListIcon />}
            >
              Apply Filters
            </Button>
          </Stack>

          {/* Active Filters Summary */}
          {hasActiveFilters && (
            <Paper sx={{ p: 2, backgroundColor: "action.hover" }}>
              <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                Active Filters:
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={0.5}>
                {selectedGenre && (
                  <Chip
                    size="small"
                    label={genres.find((g) => g.id.toString() === selectedGenre)?.name}
                    onDelete={() => {
                      setSelectedGenre("");
                      // Also clear from URL if present
                      if (searchParams.has("genre")) {
                        searchParams.delete("genre");
                        setSearchParams(searchParams);
                      }
                    }}
                  />
                )}
                {selectedYear && (
                  <Chip
                    size="small"
                    label={selectedYear}
                    onDelete={() => setSelectedYear("")}
                  />
                )}
                {selectedProviders.length > 0 && (
                  <Chip
                    size="small"
                    label={`${selectedProviders.length} provider${selectedProviders.length > 1 ? "s" : ""}`}
                    onDelete={() => setSelectedProviders([])}
                  />
                )}
                {(ratingRange[0] > 0 || ratingRange[1] < 10) && (
                  <Chip
                    size="small"
                    label={`${ratingRange[0]}-${ratingRange[1]} ★`}
                    onDelete={() => setRatingRange([0, 10])}
                  />
                )}
              </Stack>
            </Paper>
          )}
        </Stack>
      </Drawer>
    </>
  );
};

export default MediaList;
