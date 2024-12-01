import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Select, MenuItem, Grid, Chip, Paper, InputLabel, FormControl
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { fetchGenres, fetchCertifications } from '../../redux/features/appStateSlice';
import mediaApi from '../../api/modules/media.api';
import uiConfigs from '../../configs/ui.configs';
import FilterMediaList from './FilterMediaList';
import { LoadingButton } from '@mui/lab';
import { toast } from 'react-toastify';

// Constants
const scoreLabels = [
  "Appalling", "Horrible", "Very Bad", "Bad", "Average",
  "Fine", "Good", "Very Good", "Great", "Masterpiece"
];

const languageOptions = [
  { value: "en", label: "English" },
  { value: "fr", label: "French" },
  { value: "es", label: "Spanish" },
  { value: "de", label: "German" },
  { value: "ja", label: "Japanese" },
];

const sortOptions = [
  { value: "popularity.desc", label: "Popularity" },
  { value: "release_date.desc", label: "Release Date" },
  { value: "vote_average.desc", label: "Rating" },
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 50 }, (_, i) => currentYear - i);
const months = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
const days = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));

const FilterOptions = () => {
  const dispatch = useDispatch();
  const genres = useSelector((state) => state.appState.genres);
  const certifications = useSelector((state) => state.appState.certifications);

  const [mediaType, setMediaType] = useState("movie");
  const [filters, setFilters] = useState({
    genre: [],
    language: '',
    startYear: '',
    startMonth: '',
    startDay: '',
    endYear: '',
    endMonth: '',
    endDay: '',
    score: '',
    sortBy: 'popularity.desc',
    certification: '',
  });
  const [results, setResults] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filterAttempted, setFilterAttempted] = useState(0);

  // Retry logic for API calls
  const retryApiCall = async (apiCall, retries = 3, delay = 1000) => {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await apiCall();
        return response;
      } catch (err) {
        console.warn(`Retry ${i + 1} failed. Retrying...`);
        if (i < retries - 1) {
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }
    throw new Error("All retries failed.");
  };

  // Fetch certifications with retry
  useEffect(() => {
    const fetchCertificationsWithRetry = async () => {
      try {
        await retryApiCall(() => dispatch(fetchCertifications()));
      } catch (error) {
        console.error("Failed to fetch certifications after retries:", error);
        toast.error("Failed to load certifications.");
      }
    };

    fetchCertificationsWithRetry();
  }, [dispatch]);

  // Fetch genres with retry
  useEffect(() => {
    const fetchGenresWithRetry = async () => {
      try {
        await retryApiCall(() => dispatch(fetchGenres(mediaType)));
      } catch (error) {
        console.error("Failed to fetch genres after retries:", error);
        toast.error("Failed to load genres.");
      }
    };

    fetchGenresWithRetry();
  }, [dispatch, mediaType]);

  const handleMediaTypeSwitch = (type) => {
    setMediaType(type);
    setFilters({
      genre: [],
      language: '',
      startYear: '',
      startMonth: '',
      startDay: '',
      endYear: '',
      endMonth: '',
      endDay: '',
      score: '',
      sortBy: 'popularity.desc',
      certification: '',
    });
    setResults([]);
    setPage(1);
    setTotalPages(0);
    setFilterAttempted(0);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleGenreChange = (genreId) => {
    setFilters((prev) => {
      const genre = prev.genre.includes(genreId)
        ? prev.genre.filter((id) => id !== genreId)
        : [...prev.genre, genreId];
      return { ...prev, genre };
    });
  };

  const handleSearch = async () => {
    setPage(1);
    setTotalPages(0);
    setResults([]);

    const {
      startYear, startMonth, startDay,
      endYear, endMonth, endDay,
      genre, ...restFilters
    } = filters;

    const params = {
      ...restFilters,
      genre: genre.join(','),
    };

    if (startYear && startMonth && startDay) {
      params.startDate = `${startYear}-${startMonth}-${startDay}`;
    }

    if (endYear && endMonth && endDay) {
      params.endDate = `${endYear}-${endMonth}-${endDay}`;
    }

    try {
      setLoading(true);
      const { response, err } = await mediaApi.filterMedia({ mediaType, params: { ...params, page: 1 } });

      console.log(response)
      if (err || !response) {
        setResults([]);
        setTotalPages(0);
        toast.info("No results found or failed to fetch results.");
        return;
      }

      setResults(response.results || []);
      setTotalPages(response.total_pages || 0);

      if (!response.results || response.results.length === 0) {
        toast.info("No results found for the given filters.");
      }
    } catch (error) {
      console.error("Error in handleSearch:", error);
      toast.error("Failed to fetch results.");
    } finally {
      setLoading(false);
      setFilterAttempted(prev=>prev+1);
    }
  };

  const fetchMoreMedia = async () => {
    if (page >= totalPages || loading) return;

    try {
      setLoading(true);
      const { response, err } = await mediaApi.filterMedia({
        mediaType,
        params: { ...filters, genre: filters.genre.join(','), page: page + 1 },
      });

      if (err || !response) {
        toast.info("Failed to load more content.");
        return;
      }

      setResults((prevResults) => [...prevResults, ...(response.results || [])]);
      setPage((prevPage) => prevPage + 1);
    } catch (error) {
      console.error("Error in fetchMoreMedia:", error);
      toast.error("Failed to load more content.");
    } finally {
      setLoading(false);
    }
  };

  const renderResults = () => {
    // If no search has been performed yet
    if (!results.length && !loading && filterAttempted === 0) {
      return (
        <Box textAlign="center" sx={{ mt: 3 }}>
          <Typography variant="h6" color="textSecondary">
            Use the filters above to explore movies or TV shows.
          </Typography>
        </Box>
      );
    }
  
    // If filters yield no results
    if (!results.length && !loading && filterAttempted > 0) {
      return (
        <Box textAlign="center" sx={{ mt: 3, display:"flex", justifyContent: "center" }}>
          <Typography variant="h6" color="textSecondary">
            No results found. Try adjusting your filters.
          </Typography>
        </Box>
      );
    }
  
    // Render results if available
    return results.map((item) => (
      <Grid item xs={12} sm={6} md={4} lg={3} key={item.id}>
        <FilterMediaList
          item={item}
          genres={genres[mediaType] || []}
          mediaType={mediaType}
        />
      </Grid>
    ));
  };
  

  const renderDateSelectors = (type) => {
    const lowerType = type.toLowerCase();
    return (
      <Box display="flex" gap={2}>
        <FormControl fullWidth>
          <InputLabel>{`${type} Year`}</InputLabel>
          <Select
            name={`${lowerType}Year`}
            value={filters[`${lowerType}Year`]}
            onChange={handleFilterChange}
            displayEmpty
          >
            {years.map((year) => (
              <MenuItem key={year} value={year}>{year}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth>
          <InputLabel>{`${type} Month`}</InputLabel>
          <Select
            name={`${lowerType}Month`}
            value={filters[`${lowerType}Month`]}
            onChange={handleFilterChange}
            displayEmpty
          >
            {months.map((month) => (
              <MenuItem key={month} value={month}>{month}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth>
          <InputLabel>{`${type} Day`}</InputLabel>
          <Select
            name={`${lowerType}Day`}
            value={filters[`${lowerType}Day`]}
            onChange={handleFilterChange}
            displayEmpty
          >
            {days.map((day) => (
              <MenuItem key={day} value={day}>{day}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
    );
  };

  return (
    <Box sx={uiConfigs.style.mainContent}>
      <Typography variant="h4" color="primary" gutterBottom sx={{ mt: "4rem" }}>
        Filter
      </Typography>

      <Paper elevation={2} sx={{ padding: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Type
        </Typography>
        <Box display="flex" gap={2} mb={3}>
          <Button
            variant={mediaType === "movie" ? "contained" : "outlined"}
            onClick={() => handleMediaTypeSwitch("movie")}
            sx={{ width: '120px' }}
          >
            Movie
          </Button>
          <Button
            variant={mediaType === "tv" ? "contained" : "outlined"}
            onClick={() => handleMediaTypeSwitch("tv")}
            sx={{ width: '120px' }}
          >
            TV Show
          </Button>
        </Box>

        <Typography variant="h6" gutterBottom>
          Filters
        </Typography>
        <Box
          display="grid"
          gridTemplateColumns={{ xs: '1fr', md: 'repeat(3, 1fr)' }}
          gap={3}
          mb={3}
        >
          <FormControl fullWidth>
            <InputLabel>Score</InputLabel>
            <Select
              name="score"
              value={filters.score}
              onChange={handleFilterChange}
              displayEmpty
            >
              {scoreLabels.map((label, index) => (
                <MenuItem key={index + 1} value={index + 1}>
                  ({index + 1}) {label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Language</InputLabel>
            <Select
              name="language"
              value={filters.language}
              onChange={handleFilterChange}
              displayEmpty
            >
              {languageOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Certification</InputLabel>
            <Select
              name="certification"
              value={filters.certification}
              onChange={handleFilterChange}
              displayEmpty
            >
              {(certifications || []).map((cert) => (
                <MenuItem key={cert.certification} value={cert.certification}>
                  {cert.certification}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {renderDateSelectors('Start')}
          {renderDateSelectors('End')}

          <FormControl fullWidth>
            <InputLabel>Sort By</InputLabel>
            <Select
              name="sortBy"
              value={filters.sortBy}
              onChange={handleFilterChange}
            >
              {sortOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Typography variant="h6" gutterBottom>
          Genres
        </Typography>
        <Box display="flex" flexWrap="wrap" gap={1}>
          {(genres[mediaType] || []).map((genre) => (
            <Chip
              key={genre.id}
              label={genre.name}
              onClick={() => handleGenreChange(genre.id)}
              color={filters.genre.includes(genre.id) ? 'primary' : 'default'}
            />
          ))}
        </Box>
      </Paper>

      <Button
        variant="contained"
        color="primary"
        sx={{ mt: 3 }}
        onClick={handleSearch}
        disabled={loading}
      >
        {loading ? 'Searching...' : 'Filter'}
      </Button>

      <Box mt={4}>
        <Typography variant="h5" gutterBottom>
          Filter Results
        </Typography>
        <Grid container spacing={2} display="flex" justifyContent="center">
          {renderResults()}
        </Grid>
        {page < totalPages && (
          <Box mt={2} display="flex" justifyContent="center">
            <LoadingButton
              loading={loading}
              onClick={fetchMoreMedia}
              variant="contained"
              color="primary"
            >
              Load More
            </LoadingButton>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default FilterOptions;
