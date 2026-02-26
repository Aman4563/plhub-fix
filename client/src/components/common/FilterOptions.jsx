import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Select,
  MenuItem,
  Grid,
  Chip,
  Paper,
  InputLabel,
  FormControl,
  Slider,
  Badge,
  Divider,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  Stack,
  Pagination,
  Tabs,
  Tab,
  Collapse,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Autocomplete,
  Avatar,
  Skeleton,
  CircularProgress,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchGenres,
  fetchCertifications,
  fetchTvCertifications,
} from '../../redux/features/appStateSlice';
import mediaApi from '../../api/modules/media.api';
import collectionApi from '../../api/modules/collection.api';
import uiConfigs from '../../configs/ui.configs';
import FilterMediaList from './FilterMediaList';
import VirtualizedMediaGrid from './VirtualizedMediaGrid';
import { LoadingButton } from '@mui/lab';
import { toast } from 'react-toastify';
import {
  RestartAlt as ResetIcon,
  Search as SearchIcon,
  TrendingUp as TrendingIcon,
  Star as StarIcon,
  NewReleases as NewReleasesIcon,
  LocalFireDepartment as HotIcon,
  Save as SaveIcon,
  Restore as RestoreIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  FilterAlt as FilterIcon,
  Movie as MovieIcon,
  Tv as TvIcon,
  Tune as TuneIcon,
  BookmarkAdd as CollectionIcon,
  Person as PersonIcon,
  ViewModule as GridIcon,
  ViewList as VirtualIcon,
} from '@mui/icons-material';
import useFilterStorage from '../../hooks/useFilterStorage';
import tmdbConfigs from '../../api/configs/tmdb.configs';

const languageOptions = [
  { value: "", label: "Any Language" },
  { value: "en", label: "English" },
  { value: "fr", label: "French" },
  { value: "es", label: "Spanish" },
  { value: "de", label: "German" },
  { value: "ja", label: "Japanese" },
  { value: "ko", label: "Korean" },
  { value: "hi", label: "Hindi" },
  { value: "zh", label: "Chinese" },
  { value: "it", label: "Italian" },
  { value: "pt", label: "Portuguese" },
  { value: "ru", label: "Russian" },
  { value: "ar", label: "Arabic" },
  { value: "th", label: "Thai" },
];

const sortOptions = [
  { value: "popularity.desc", label: "Most Popular" },
  { value: "popularity.asc", label: "Least Popular" },
  { value: "vote_average.desc", label: "Highest Rated" },
  { value: "vote_average.asc", label: "Lowest Rated" },
  { value: "primary_release_date.desc", label: "Newest First" },
  { value: "primary_release_date.asc", label: "Oldest First" },
  { value: "revenue.desc", label: "Highest Revenue" },
  { value: "vote_count.desc", label: "Most Votes" },
];

const FILTER_PRESETS = [
  {
    id: 'top_rated',
    label: 'Top Rated',
    icon: <StarIcon fontSize="small" />,
    color: '#f5c518',
    filters: { minScore: 8, sortBy: 'vote_average.desc' },
  },
  {
    id: 'new_releases',
    label: 'New Releases',
    icon: <NewReleasesIcon fontSize="small" />,
    color: '#46d369',
    filters: { year: new Date().getFullYear(), sortBy: 'primary_release_date.desc' },
  },
  {
    id: 'trending',
    label: 'Trending Now',
    icon: <TrendingIcon fontSize="small" />,
    color: '#e50914',
    filters: { sortBy: 'popularity.desc' },
  },
  {
    id: 'hidden_gems',
    label: 'Hidden Gems',
    icon: <HotIcon fontSize="small" />,
    color: '#ff6b35',
    filters: { minScore: 7, maxScore: 10, sortBy: 'vote_count.asc' },
  },
];

const currentYear = new Date().getFullYear();
const years = ["", ...Array.from({ length: 100 }, (_, i) => currentYear - i)];

const MENU_PROPS = {
  PaperProps: {
    sx: {
      maxHeight: 280,
      overflow: 'auto',
      '& .MuiMenuItem-root': {
        whiteSpace: 'normal',
        wordBreak: 'break-word',
      },
    },
  },
  anchorOrigin: {
    vertical: 'bottom',
    horizontal: 'left',
  },
  transformOrigin: {
    vertical: 'top',
    horizontal: 'left',
  },
};

const INITIAL_FILTERS = {
  genre: [],
  language: '',
  year: '',
  minScore: 0,
  maxScore: 10,
  sortBy: 'popularity.desc',
  certification: '',
  minRuntime: 0,
  maxRuntime: 400,
  keywords: '',
  voteCountMin: 0,
  watchProviders: [],
  withCast: null,
};

const FilterOptions = () => {
  const dispatch = useDispatch();
  const genres = useSelector((state) => state.appState.genres);
  const certifications = useSelector((state) => state.appState.certifications);
  const { user } = useSelector((state) => state.user);

  const [mediaType, setMediaType] = useState("movie");
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [results, setResults] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalResults, setTotalResults] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filterAttempted, setFilterAttempted] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activePreset, setActivePreset] = useState(null);
  
  const [watchProviders, setWatchProviders] = useState([]);
  const [watchProvidersLoading, setWatchProvidersLoading] = useState(false);
  
  const [personSearchQuery, setPersonSearchQuery] = useState('');
  const [personSearchResults, setPersonSearchResults] = useState([]);
  const [personSearchLoading, setPersonSearchLoading] = useState(false);
  
  const [collectionDialogOpen, setCollectionDialogOpen] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [userCollections, setUserCollections] = useState([]);
  const [collectionsLoading, setCollectionsLoading] = useState(false);
  const [savingCollection, setSavingCollection] = useState(false);
  
  const [useVirtualization, setUseVirtualization] = useState(false);

  const { saveFilters, loadFilters, clearSavedFilters, hasStoredFilters } =
    useFilterStorage();

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.genre.length > 0) count++;
    if (filters.language) count++;
    if (filters.year) count++;
    if (filters.minScore > 0 || filters.maxScore < 10) count++;
    if (filters.certification) count++;
    if (filters.minRuntime > 0 || filters.maxRuntime < 400) count++;
    if (filters.sortBy !== 'popularity.desc') count++;
    if (filters.keywords) count++;
    if (filters.voteCountMin > 0) count++;
    if (filters.watchProviders.length > 0) count++;
    if (filters.withCast) count++;
    return count;
  }, [filters]);

  const currentCertifications = useMemo(() => {
    return certifications?.[mediaType] || [];
  }, [certifications, mediaType]);

  useEffect(() => {
    dispatch(fetchGenres(mediaType));
    if (mediaType === "movie") {
      dispatch(fetchCertifications());
    } else {
      dispatch(fetchTvCertifications());
    }
  }, [dispatch, mediaType]);

  useEffect(() => {
    const fetchWatchProviders = async () => {
      setWatchProvidersLoading(true);
      try {
        const { response, err } = await mediaApi.getWatchProvidersList(mediaType);
        if (response && response.providers) {
          setWatchProviders(response.providers);
        }
        if (err) {
          console.error('Failed to fetch watch providers:', err);
        }
      } catch (error) {
        console.error('Failed to fetch watch providers:', error);
      } finally {
        setWatchProvidersLoading(false);
      }
    };
    fetchWatchProviders();
  }, [mediaType]);

  useEffect(() => {
    const searchPerson = async () => {
      if (!personSearchQuery || personSearchQuery.trim().length < 2) {
        setPersonSearchResults([]);
        return;
      }
      setPersonSearchLoading(true);
      try {
        const { response, err } = await mediaApi.searchPerson({ query: personSearchQuery, page: 1 });
        if (response && response.results) {
          setPersonSearchResults(response.results.slice(0, 10));
        }
        if (err) {
          console.error('Failed to search person:', err);
        }
      } catch (error) {
        console.error('Failed to search person:', error);
      } finally {
        setPersonSearchLoading(false);
      }
    };
    
    const timer = setTimeout(searchPerson, 300);
    return () => clearTimeout(timer);
  }, [personSearchQuery]);

  // Load saved filters only on initial mount
  useEffect(() => {
    const saved = loadFilters();
    if (saved) {
      setFilters(saved.filters);
      setMediaType(saved.mediaType);
      toast.info('Previous filters restored');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleMediaTypeSwitch = (type) => {
    if (type === mediaType) return;
    setMediaType(type);
    setFilters(INITIAL_FILTERS);
    setResults([]);
    setPage(1);
    setTotalPages(0);
    setTotalResults(0);
    setFilterAttempted(false);
    setActivePreset(null);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setActivePreset(null);
  };

  const handleScoreChange = (event, newValue) => {
    setFilters((prev) => ({
      ...prev,
      minScore: newValue[0],
      maxScore: newValue[1],
    }));
    setActivePreset(null);
  };

  const handleRuntimeChange = (event, newValue) => {
    setFilters((prev) => ({
      ...prev,
      minRuntime: newValue[0],
      maxRuntime: newValue[1],
    }));
    setActivePreset(null);
  };

  const handleGenreChange = (genreId) => {
    setFilters((prev) => {
      const genre = prev.genre.includes(genreId)
        ? prev.genre.filter((id) => id !== genreId)
        : [...prev.genre, genreId];
      return { ...prev, genre };
    });
    setActivePreset(null);
  };

  const handleResetFilters = () => {
    setFilters(INITIAL_FILTERS);
    setResults([]);
    setPage(1);
    setTotalPages(0);
    setTotalResults(0);
    setFilterAttempted(false);
    setActivePreset(null);
    clearSavedFilters();
  };

  const handleSaveFilters = () => {
    saveFilters(filters, mediaType);
    toast.success('Filters saved!');
  };

  const handleRestoreFilters = () => {
    const saved = loadFilters();
    if (saved) {
      setFilters(saved.filters);
      setMediaType(saved.mediaType);
      toast.success('Filters restored!');
    }
  };

  const handlePresetClick = (preset) => {
    setActivePreset(preset.id);
    setFilters((prev) => ({
      ...INITIAL_FILTERS,
      ...preset.filters,
    }));
  };

  const handleWatchProviderToggle = (providerId) => {
    setFilters((prev) => {
      const providers = prev.watchProviders.includes(providerId)
        ? prev.watchProviders.filter((id) => id !== providerId)
        : [...prev.watchProviders, providerId];
      return { ...prev, watchProviders: providers };
    });
    setActivePreset(null);
  };

  const handlePersonSelect = (person) => {
    setFilters((prev) => ({
      ...prev,
      withCast: person ? { id: person.id, name: person.name } : null,
    }));
    setPersonSearchQuery('');
    setPersonSearchResults([]);
    setActivePreset(null);
  };

  const fetchUserCollections = async () => {
    if (!user) return;
    setCollectionsLoading(true);
    try {
      const { response, err } = await collectionApi.getAll();
      if (response) {
        setUserCollections(response);
      }
      if (err) {
        console.error('Failed to fetch collections:', err);
      }
    } catch (error) {
      console.error('Failed to fetch collections:', error);
    } finally {
      setCollectionsLoading(false);
    }
  };

  const handleOpenCollectionDialog = () => {
    if (!user) {
      toast.error('Please login to save collections');
      return;
    }
    fetchUserCollections();
    setCollectionDialogOpen(true);
  };

  const handleSaveAsCollection = async () => {
    if (!newCollectionName.trim()) {
      toast.error('Please enter a collection name');
      return;
    }
    setSavingCollection(true);
    try {
      const { response, err } = await collectionApi.create({
        name: newCollectionName.trim(),
        description: `Saved filter: ${activeFilterCount} filters applied`,
        isPublic: false,
        savedFilters: {
          mediaType,
          genre: filters.genre,
          language: filters.language,
          year: filters.year ? parseInt(filters.year) : undefined,
          minScore: filters.minScore,
          maxScore: filters.maxScore,
          sortBy: filters.sortBy,
          certification: filters.certification,
          minRuntime: filters.minRuntime,
          maxRuntime: filters.maxRuntime,
          keywords: filters.keywords,
          watchProviders: filters.watchProviders,
        },
      });
      if (response) {
        toast.success('Collection created successfully!');
        setCollectionDialogOpen(false);
        setNewCollectionName('');
      }
      if (err) {
        toast.error(err.message || 'Failed to create collection');
      }
    } catch (error) {
      toast.error('Failed to create collection');
    } finally {
      setSavingCollection(false);
    }
  };

  const handleLoadFromCollection = async (collection) => {
    if (collection.savedFilters) {
      const sf = collection.savedFilters;
      setMediaType(sf.mediaType || 'movie');
      setFilters({
        ...INITIAL_FILTERS,
        genre: sf.genre || [],
        language: sf.language || '',
        year: sf.year ? sf.year.toString() : '',
        minScore: sf.minScore || 0,
        maxScore: sf.maxScore || 10,
        sortBy: sf.sortBy || 'popularity.desc',
        certification: sf.certification || '',
        minRuntime: sf.minRuntime || 0,
        maxRuntime: sf.maxRuntime || 400,
        keywords: sf.keywords || '',
        watchProviders: sf.watchProviders || [],
        withCast: null,
        voteCountMin: 0,
      });
      toast.success(`Loaded filters from "${collection.name}"`);
      setCollectionDialogOpen(false);
    }
  };

  const buildFilterParams = useCallback((pageNum = 1) => {
    const params = {
      genre: filters.genre.join(','),
      language: filters.language,
      sortBy: filters.sortBy,
      certification: filters.certification,
      score: filters.minScore > 0 ? filters.minScore : undefined,
      maxScore: filters.maxScore < 10 ? filters.maxScore : undefined,
      minRuntime: filters.minRuntime > 0 ? filters.minRuntime : undefined,
      maxRuntime: filters.maxRuntime < 400 ? filters.maxRuntime : undefined,
      keywords: filters.keywords || undefined,
      voteCountMin: filters.voteCountMin > 0 ? filters.voteCountMin : undefined,
      watchProviders: filters.watchProviders.length > 0 ? filters.watchProviders.join('|') : undefined,
      watchRegion: filters.watchProviders.length > 0 ? 'US' : undefined,
      withCast: filters.withCast ? filters.withCast.id : undefined,
      page: pageNum,
    };

    if (filters.year) {
      params.startDate = `${filters.year}-01-01`;
      params.endDate = `${filters.year}-12-31`;
    }

    Object.keys(params).forEach((key) => {
      if (params[key] === undefined || params[key] === '') {
        delete params[key];
      }
    });

    return params;
  }, [filters]);

  const handleSearch = async (pageNum = 1) => {
    if (pageNum === 1) {
      setPage(1);
      setTotalPages(0);
      setTotalResults(0);
      setResults([]);
    }

    const params = buildFilterParams(pageNum);

    try {
      setLoading(true);
      const { response, err } = await mediaApi.filterMedia({ mediaType, params });

      if (err || !response) {
        if (pageNum === 1) {
          setResults([]);
          setTotalPages(0);
          setTotalResults(0);
        }
        toast.info("No results found or failed to fetch results.");
        return;
      }

      if (pageNum === 1) {
        setResults(response.results || []);
      } else {
        setResults((prev) => [...prev, ...(response.results || [])]);
      }
      
      setTotalPages(response.total_pages || 0);
      setTotalResults(response.total_results || 0);
      setPage(pageNum);

      if (!response.results || response.results.length === 0) {
        toast.info("No results found for the given filters.");
      }
    } catch (error) {
      console.error("Error in handleSearch:", error);
      toast.error("Failed to fetch results.");
    } finally {
      setLoading(false);
      setFilterAttempted(true);
    }
  };

  const handlePageChange = (event, newPage) => {
    handleSearch(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPresets = () => (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mb: 1.5 }}>
        Quick Filters
      </Typography>
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        {FILTER_PRESETS.map((preset) => (
          <Chip
            key={preset.id}
            icon={preset.icon}
            label={preset.label}
            onClick={() => handlePresetClick(preset)}
            variant={activePreset === preset.id ? "filled" : "outlined"}
            sx={{
              borderColor: preset.color,
              color: activePreset === preset.id ? '#fff' : preset.color,
              bgcolor: activePreset === preset.id ? preset.color : 'transparent',
              '&:hover': {
                bgcolor: activePreset === preset.id ? preset.color : `${preset.color}20`,
              },
              '& .MuiChip-icon': {
                color: activePreset === preset.id ? '#fff' : preset.color,
              },
            }}
          />
        ))}
      </Stack>
    </Box>
  );

  const renderResults = () => {
    if (!results.length && !loading && !filterAttempted) {
      return (
        <Box 
          sx={{ 
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            py: 6,
            width: '100%',
          }}
        >
          <FilterIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Discover Your Next Favorite
          </Typography>
          <Typography variant="body2" color="text.disabled" sx={{ mb: 2, maxWidth: 400 }}>
            Use the filters above or try a quick filter to find amazing content
          </Typography>
          <Stack direction="row" spacing={1} justifyContent="center">
            {FILTER_PRESETS.slice(0, 2).map((preset) => (
              <Button
                key={preset.id}
                variant="outlined"
                size="small"
                startIcon={preset.icon}
                onClick={() => {
                  handlePresetClick(preset);
                  setTimeout(() => handleSearch(1), 100);
                }}
                sx={{
                  borderColor: preset.color,
                  color: preset.color,
                  '&:hover': {
                    borderColor: preset.color,
                    bgcolor: `${preset.color}15`,
                  },
                }}
              >
                {preset.label}
              </Button>
            ))}
          </Stack>
        </Box>
      );
    }

    if (!results.length && !loading && filterAttempted) {
      return (
        <Box 
          sx={{ 
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            py: 6,
            width: '100%',
          }}
        >
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No results found
          </Typography>
          <Typography variant="body2" color="text.disabled" sx={{ mb: 2 }}>
            Try adjusting your filters
          </Typography>
          <Stack direction="row" spacing={1} justifyContent="center">
            <Button
              variant="outlined"
              size="small"
              onClick={handleResetFilters}
              startIcon={<ResetIcon />}
            >
              Reset
            </Button>
            <Button
              variant="contained"
              size="small"
              onClick={() => {
                handlePresetClick(FILTER_PRESETS[0]);
                setTimeout(() => handleSearch(1), 100);
              }}
              startIcon={<StarIcon />}
            >
              Top Rated
            </Button>
          </Stack>
        </Box>
      );
    }

    return results.map((item) => (
      <Grid item xs={6} sm={4} md={3} lg={2.4} key={item.id}>
        <FilterMediaList
          item={item}
          genres={genres[mediaType] || []}
          mediaType={mediaType}
        />
      </Grid>
    ));
  };

  return (
    <Box sx={{ ...uiConfigs.style.mainContent, pt: 2 }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mt: "4rem",
          mb: 2,
          flexWrap: 'wrap',
          gap: 1,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TuneIcon sx={{ fontSize: 28, color: 'primary.main' }} />
          <Typography variant="h5" fontWeight="bold">
            Advanced Filter
          </Typography>
        </Box>
        <Stack direction="row" spacing={0.5} alignItems="center">
          {user && (
            <Tooltip title="Save as Collection">
              <IconButton onClick={handleOpenCollectionDialog} size="small" color="primary">
                <CollectionIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {hasStoredFilters && (
            <Tooltip title="Restore saved filters">
              <IconButton onClick={handleRestoreFilters} size="small" color="primary">
                <RestoreIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Save current filters">
            <IconButton onClick={handleSaveFilters} size="small" color="primary">
              <SaveIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {activeFilterCount > 0 && (
            <Badge badgeContent={activeFilterCount} color="error" sx={{ ml: 1 }}>
              <Button
                variant="text"
                color="error"
                onClick={handleResetFilters}
                startIcon={<ResetIcon />}
                size="small"
              >
                Reset
              </Button>
            </Badge>
          )}
        </Stack>
      </Box>

      {/* Main Filter Card */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          bgcolor: 'background.paper',
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        {/* Media Type Tabs */}
        <Tabs
          value={mediaType}
          onChange={(e, val) => handleMediaTypeSwitch(val)}
          sx={{ 
            mb: 2,
            minHeight: 36,
            '& .MuiTab-root': {
              minHeight: 36,
              py: 0.5,
            },
          }}
          TabIndicatorProps={{ sx: { height: 2 } }}
        >
          <Tab
            value="movie"
            label="Movies"
            icon={<MovieIcon fontSize="small" />}
            iconPosition="start"
            sx={{ fontSize: '0.875rem' }}
          />
          <Tab
            value="tv"
            label="TV Shows"
            icon={<TvIcon fontSize="small" />}
            iconPosition="start"
            sx={{ fontSize: '0.875rem' }}
          />
        </Tabs>

        {/* Presets */}
        {renderPresets()}

        <Divider sx={{ my: 2 }} />

        {/* Basic Filters */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={6} sm={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Year</InputLabel>
              <Select
                name="year"
                value={filters.year}
                onChange={handleFilterChange}
                label="Year"
                MenuProps={MENU_PROPS}
              >
                <MenuItem value="">Any</MenuItem>
                {years.slice(1, 51).map((year) => (
                  <MenuItem key={year} value={year}>{year}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={6} sm={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Language</InputLabel>
              <Select
                name="language"
                value={filters.language}
                onChange={handleFilterChange}
                label="Language"
                MenuProps={MENU_PROPS}
              >
                {languageOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={6} sm={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Certification</InputLabel>
              <Select
                name="certification"
                value={filters.certification}
                onChange={handleFilterChange}
                label="Certification"
                MenuProps={MENU_PROPS}
              >
                <MenuItem value="">Any</MenuItem>
                {currentCertifications.map((cert) => (
                  <MenuItem key={cert.certification} value={cert.certification}>
                    {cert.certification}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={6} sm={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Sort By</InputLabel>
              <Select
                name="sortBy"
                value={filters.sortBy}
                onChange={handleFilterChange}
                label="Sort By"
                MenuProps={MENU_PROPS}
              >
                {sortOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {/* Rating and Runtime on same row */}
        <Grid container spacing={3} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6}>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
              Rating: {filters.minScore} - {filters.maxScore}
            </Typography>
            <Slider
              value={[filters.minScore, filters.maxScore]}
              onChange={handleScoreChange}
              valueLabelDisplay="auto"
              min={0}
              max={10}
              step={0.5}
              size="small"
              marks={[
                { value: 0, label: '0' },
                { value: 5, label: '5' },
                { value: 10, label: '10' },
              ]}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
              Runtime: {filters.minRuntime} - {filters.maxRuntime === 400 ? '400+' : filters.maxRuntime} min
            </Typography>
            <Slider
              value={[filters.minRuntime, filters.maxRuntime]}
              onChange={handleRuntimeChange}
              valueLabelDisplay="auto"
              min={0}
              max={400}
              step={15}
              size="small"
              marks={[
                { value: 0, label: '0' },
                { value: 120, label: '2h' },
                { value: 400, label: '400+' },
              ]}
            />
          </Grid>
        </Grid>

        {/* Advanced Filters Toggle */}
        <Button
          onClick={() => setShowAdvanced(!showAdvanced)}
          endIcon={showAdvanced ? <CollapseIcon /> : <ExpandIcon />}
          size="small"
          sx={{ mb: 1 }}
        >
          {showAdvanced ? 'Less Options' : 'More Options'}
        </Button>

        <Collapse in={showAdvanced}>
          <Grid container spacing={3} sx={{ pt: 1 }}>
            {/* Keywords */}
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                Keywords
              </Typography>
              <TextField
                fullWidth
                size="small"
                placeholder="e.g., superhero, romance..."
                name="keywords"
                value={filters.keywords}
                onChange={handleFilterChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" color="disabled" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            {/* Vote Count */}
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                Min. Votes: {filters.voteCountMin.toLocaleString()}
              </Typography>
              <Slider
                value={filters.voteCountMin}
                onChange={(e, val) => setFilters(prev => ({ ...prev, voteCountMin: val }))}
                valueLabelDisplay="auto"
                min={0}
                max={10000}
                step={500}
                size="small"
                marks={[
                  { value: 0, label: '0' },
                  { value: 5000, label: '5K' },
                  { value: 10000, label: '10K' },
                ]}
                sx={{ mt: 1 }}
              />
            </Grid>

            {/* Search by Cast/Crew */}
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                Filter by Actor/Director
              </Typography>
              {filters.withCast ? (
                <Chip
                  icon={<PersonIcon />}
                  label={filters.withCast.name}
                  onDelete={() => handlePersonSelect(null)}
                  color="primary"
                  sx={{ mt: 0.5 }}
                />
              ) : (
                <Autocomplete
                  freeSolo
                  size="small"
                  options={personSearchResults}
                  getOptionLabel={(option) => option.name || ''}
                  inputValue={personSearchQuery}
                  onInputChange={(e, value) => setPersonSearchQuery(value)}
                  onChange={(e, value) => handlePersonSelect(value)}
                  loading={personSearchLoading}
                  renderOption={(props, option) => (
                    <li {...props} key={option.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar
                          src={option.profile_path ? tmdbConfigs.posterPath(option.profile_path) : undefined}
                          sx={{ width: 32, height: 32 }}
                        >
                          <PersonIcon fontSize="small" />
                        </Avatar>
                        <Box>
                          <Typography variant="body2">{option.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {option.known_for_department}
                          </Typography>
                        </Box>
                      </Box>
                    </li>
                  )}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Search actor or director..."
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <InputAdornment position="start">
                            <PersonIcon fontSize="small" color="disabled" />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <>
                            {personSearchLoading ? <CircularProgress color="inherit" size={16} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                />
              )}
            </Grid>

            {/* Watch Providers */}
            <Grid item xs={12}>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                Streaming Services {filters.watchProviders.length > 0 && `(${filters.watchProviders.length} selected)`}
              </Typography>
              {watchProvidersLoading ? (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} variant="circular" width={40} height={40} />
                  ))}
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {watchProviders.slice(0, 15).map((provider) => (
                    <Tooltip key={provider.id} title={provider.name}>
                      <IconButton
                        onClick={() => handleWatchProviderToggle(provider.id)}
                        sx={{
                          width: 44,
                          height: 44,
                          border: '2px solid',
                          borderColor: filters.watchProviders.includes(provider.id) ? 'primary.main' : 'transparent',
                          borderRadius: 1,
                          p: 0.25,
                          bgcolor: filters.watchProviders.includes(provider.id) ? 'rgba(25, 118, 210, 0.2)' : 'transparent',
                          '&:hover': {
                            bgcolor: 'action.hover',
                          },
                        }}
                      >
                        <Avatar
                          src={provider.logo ? tmdbConfigs.posterPath(provider.logo) : undefined}
                          alt={provider.name}
                          sx={{ width: 36, height: 36, borderRadius: 0.5 }}
                        />
                      </IconButton>
                    </Tooltip>
                  ))}
                </Box>
              )}
            </Grid>
          </Grid>
        </Collapse>

        <Divider sx={{ my: 2 }} />

        {/* Genres */}
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Genres
        </Typography>
        <Box display="flex" flexWrap="wrap" gap={1} sx={{ mb: 2 }}>
          {(genres[mediaType] || []).map((genre) => (
            <Chip
              key={genre.id}
              label={genre.name}
              onClick={() => handleGenreChange(genre.id)}
              color={filters.genre.includes(genre.id) ? 'primary' : 'default'}
              variant={filters.genre.includes(genre.id) ? 'filled' : 'outlined'}
              sx={{
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: 'scale(1.05)',
                },
              }}
            />
          ))}
        </Box>

        {/* Action Button */}
        <LoadingButton
          variant="contained"
          color="primary"
          onClick={() => handleSearch(1)}
          loading={loading}
          startIcon={<SearchIcon />}
          fullWidth
          sx={{ mt: 1 }}
        >
          Apply Filters
        </LoadingButton>
      </Paper>

      {/* Results Section */}
      <Box mt={3}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 2,
          }}
        >
          <Typography variant="subtitle1" fontWeight="bold">
            Results
            {totalResults > 0 && (
              <Typography
                component="span"
                variant="body2"
                color="text.secondary"
                sx={{ ml: 1, fontWeight: 'normal' }}
              >
                ({totalResults.toLocaleString()})
              </Typography>
            )}
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            {totalResults > 50 && (
              <Tooltip title={useVirtualization ? 'Standard Grid' : 'Virtualized Grid (faster for large lists)'}>
                <IconButton
                  size="small"
                  onClick={() => setUseVirtualization(!useVirtualization)}
                  color={useVirtualization ? 'primary' : 'default'}
                >
                  {useVirtualization ? <VirtualIcon /> : <GridIcon />}
                </IconButton>
              </Tooltip>
            )}
            {totalPages > 1 && (
              <Typography variant="caption" color="text.secondary">
                Page {page} of {totalPages}
              </Typography>
            )}
          </Stack>
        </Box>

        {useVirtualization && results.length > 0 ? (
          <VirtualizedMediaGrid
            items={results}
            genres={genres[mediaType] || []}
            mediaType={mediaType}
            minHeight={Math.min(results.length * 80, 800)}
          />
        ) : (
          <Grid container spacing={1.5}>
            {renderResults()}
          </Grid>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Pagination
              count={Math.min(totalPages, 500)}
              page={page}
              onChange={handlePageChange}
              color="primary"
              size="medium"
              showFirstButton
              showLastButton
            />
          </Box>
        )}
      </Box>

      {/* Save as Collection Dialog */}
      <Dialog
        open={collectionDialogOpen}
        onClose={() => setCollectionDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Save Filters as Collection</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Collection Name"
            value={newCollectionName}
            onChange={(e) => setNewCollectionName(e.target.value)}
            placeholder="My Favorite Filters"
            sx={{ mt: 2, mb: 2 }}
          />
          
          {activeFilterCount > 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              This collection will save {activeFilterCount} active filter(s).
            </Typography>
          )}

          {userCollections.length > 0 && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Or load from existing collection:
              </Typography>
              {collectionsLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : (
                <Stack spacing={1} sx={{ mt: 1 }}>
                  {userCollections.filter(c => c.savedFilters).map((collection) => (
                    <Paper
                      key={collection.id}
                      variant="outlined"
                      sx={{
                        p: 1.5,
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'action.hover' },
                      }}
                      onClick={() => handleLoadFromCollection(collection)}
                    >
                      <Typography variant="body2" fontWeight="bold">
                        {collection.name}
                      </Typography>
                      {collection.description && (
                        <Typography variant="caption" color="text.secondary">
                          {collection.description}
                        </Typography>
                      )}
                    </Paper>
                  ))}
                </Stack>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCollectionDialogOpen(false)}>Cancel</Button>
          <LoadingButton
            onClick={handleSaveAsCollection}
            loading={savingCollection}
            variant="contained"
            disabled={!newCollectionName.trim()}
          >
            Create Collection
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FilterOptions;
