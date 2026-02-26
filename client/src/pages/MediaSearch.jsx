import { LoadingButton } from "@mui/lab";
import {
  Box,
  Button,
  Stack,
  Toolbar,
  IconButton,
  Tooltip,
  InputAdornment,
  Autocomplete,
  TextField,
  Typography,
  Chip,
  Skeleton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Paper,
  Alert,
  Collapse,
} from "@mui/material";
// Note: Divider removed - unused
import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import mediaApi from "../api/modules/media.api";
import MediaGrid from "../components/common/MediaGrid";
import uiConfigs from "../configs/ui.configs";
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  Telegram,
  Reddit,
  Twitter,
  FilterList as FilterListIcon,
  Mic as MicIcon,
  MicOff as MicOffIcon,
  History as HistoryIcon,
  Movie as MovieIcon,
  Tv as TvIcon,
  Person as PersonIcon,
  Delete as DeleteIcon,
  AllInclusive as AllIcon,
  Star as StarIcon,
} from "@mui/icons-material";
import FilterOptions from "../components/common/FilterOptions";
import useSearchHistory from "../hooks/useSearchHistory";
import useVoiceSearch from "../hooks/useVoiceSearch";

const mediaTypes = ["all", "movie", "tv", "people"];
const DEBOUNCE_DELAY = 500;
const MIN_QUERY_LENGTH = 2;
const MAX_QUERY_LENGTH = 100;

const getMediaTypeIcon = (type, isSelected = false) => {
  const iconColor = isSelected ? "inherit" : undefined;
  
  switch (type) {
    case "all":
      return <AllIcon fontSize="small" sx={{ color: iconColor || "#9c27b0" }} />;
    case "movie":
      return <MovieIcon fontSize="small" sx={{ color: iconColor || "#ff6b6b" }} />;
    case "tv":
      return <TvIcon fontSize="small" sx={{ color: iconColor || "#46d369" }} />;
    case "person":
    case "people":
      return <PersonIcon fontSize="small" sx={{ color: iconColor || "#f5c518" }} />;
    default:
      return <MovieIcon fontSize="small" />;
  }
};

const MediaSearch = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const initialQuery = searchParams.get("q") || "";
  const initialType = searchParams.get("type") || mediaTypes[0];

  const [query, setQuery] = useState(initialQuery);
  const [inputValue, setInputValue] = useState(initialQuery);
  const [onSearch, setOnSearch] = useState(false);
  const [mediaType, setMediaType] = useState(
    mediaTypes.includes(initialType) ? initialType : mediaTypes[0]
  );
  const [medias, setMedias] = useState([]);
  const [page, setPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [advanceFilter, setAdvanceFilter] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [validationError, setValidationError] = useState("");

  const debounceTimerRef = useRef(null);
  const abortControllerRef = useRef(null);
  const suggestionsAbortRef = useRef(null);
  const inputRef = useRef(null);

  const { searchHistory, addToHistory, removeFromHistory, clearHistory } =
    useSearchHistory();

  const handleVoiceResult = useCallback((transcript) => {
    setInputValue(transcript);
    setQuery(transcript);
    toast.success(`Voice search: "${transcript}"`);
  }, []);

  const { isListening, isSupported, startListening, stopListening } =
    useVoiceSearch(handleVoiceResult);

  const validateQuery = useCallback((value) => {
    if (!value || value.trim().length === 0) {
      return { valid: true, error: "" };
    }
    if (value.trim().length < MIN_QUERY_LENGTH) {
      return {
        valid: false,
        error: `Search query must be at least ${MIN_QUERY_LENGTH} characters`,
      };
    }
    if (value.length > MAX_QUERY_LENGTH) {
      return {
        valid: false,
        error: `Search query must be less than ${MAX_QUERY_LENGTH} characters`,
      };
    }
    if (/[<>{}[\]\\]/.test(value)) {
      return { valid: false, error: "Search query contains invalid characters" };
    }
    return { valid: true, error: "" };
  }, []);

  const search = useCallback(async () => {
    const validation = validateQuery(query);
    if (!validation.valid) {
      setValidationError(validation.error);
      return;
    }
    setValidationError("");

    if (query.trim().length === 0) {
      setMedias([]);
      setPage(1);
      setTotalResults(0);
      setTotalPages(0);
      setHasSearched(false);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setOnSearch(true);
    setHasSearched(true);
    setShowHistory(false);

    let response, err;

    if (mediaType === "all") {
      const result = await mediaApi.multiSearch({ query, page });
      response = result.response;
      err = result.err;
    } else {
      const result = await mediaApi.search({ mediaType, query, page });
      response = result.response;
      err = result.err;
    }

    setOnSearch(false);

    if (err) {
      if (err.name !== "AbortError") {
        toast.error(err.message);
      }
      return;
    }

    if (response) {
      setMedias((prevMedias) =>
        page > 1 ? [...prevMedias, ...response.results] : response.results
      );
      setTotalResults(response.total_results || 0);
      setTotalPages(response.total_pages || 0);

      if (page === 1 && response.results.length > 0) {
        addToHistory(query, mediaType);
      }
    }
  }, [mediaType, query, page, addToHistory, validateQuery]);

  const fetchSuggestions = useCallback(
    async (input) => {
      if (!input || input.trim().length < MIN_QUERY_LENGTH) {
        setSuggestions([]);
        return;
      }

      if (suggestionsAbortRef.current) {
        suggestionsAbortRef.current.abort();
      }
      suggestionsAbortRef.current = new AbortController();

      let response, err;

      if (mediaType === "all") {
        const result = await mediaApi.multiSearch({ query: input, page: 1 });
        response = result.response;
        err = result.err;
      } else {
        const result = await mediaApi.search({ mediaType, query: input, page: 1 });
        response = result.response;
        err = result.err;
      }

      if (err) {
        if (err.name !== "AbortError") {
          console.error(err.message);
        }
        return;
      }

      if (response) {
        const suggestionList = response.results.slice(0, 8).map((item) => ({
          label: item.title || item.name,
          id: item.id,
          mediaType: item.media_type || mediaType,
          year:
            item.release_date?.split("-")[0] ||
            item.first_air_date?.split("-")[0] ||
            "",
          poster: item.poster_path || item.profile_path,
          rating: item.vote_average,
        }));
        setSuggestions(suggestionList);
      }
    },
    [mediaType]
  );

  useEffect(() => {
    search();
  }, [search]);

  useEffect(() => {
    setMedias([]);
    setPage(1);
    setSuggestions([]);
    setTotalResults(0);
    setTotalPages(0);
  }, [mediaType]);

  useEffect(() => {
    if (query) {
      setSearchParams({ q: query, type: mediaType });
    } else {
      setSearchParams({});
    }
  }, [query, mediaType, setSearchParams]);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (suggestionsAbortRef.current) {
        suggestionsAbortRef.current.abort();
      }
    };
  }, []);

  const onCategoryChange = (selectedCategory) => {
    if (selectedCategory !== mediaType) {
      setMediaType(selectedCategory);
    }
  };

  const onInputChange = (event, newValue, reason) => {
    const value = newValue ?? "";
    setInputValue(value);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (reason === "clear") {
      setQuery("");
      setSuggestions([]);
      setValidationError("");
      return;
    }

    const validation = validateQuery(value);
    setValidationError(validation.error);

    debounceTimerRef.current = setTimeout(() => {
      if (validation.valid) {
        fetchSuggestions(value);
      }
    }, DEBOUNCE_DELAY);
  };

  const onSearchSubmit = (event, newValue) => {
    if (typeof newValue === "string") {
      const validation = validateQuery(newValue);
      if (validation.valid) {
        setQuery(newValue);
      }
    } else if (newValue && newValue.label) {
      setQuery(newValue.label);
    }
  };

  const handleClearSearch = () => {
    setInputValue("");
    setQuery("");
    setMedias([]);
    setSuggestions([]);
    setPage(1);
    setTotalResults(0);
    setTotalPages(0);
    setHasSearched(false);
    setValidationError("");
  };

  const handleFilterClick = () => {
    setAdvanceFilter((prev) => !prev);
  };

  const handleHistoryItemClick = (item) => {
    setInputValue(item.query);
    setQuery(item.query);
    setMediaType(item.mediaType);
    setShowHistory(false);
  };

  const handleVoiceClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const renderLoadingSkeletons = () => (
    <Box
      sx={{ display: "flex", flexWrap: "wrap", gap: 2, justifyContent: "center" }}
    >
      {[...Array(8)].map((_, index) => (
        <Box key={index} sx={{ width: { xs: "45%", sm: "30%", md: "22%" } }}>
          <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
          <Skeleton variant="text" sx={{ mt: 1 }} />
          <Skeleton variant="text" width="60%" />
        </Box>
      ))}
    </Box>
  );

  const renderSearchHistory = () => {
    if (!showHistory || searchHistory.length === 0) return null;

    return (
      <Paper
        elevation={8}
        sx={{
          position: "absolute",
          top: "100%",
          left: 0,
          right: 0,
          zIndex: 1000,
          mt: 1,
          maxHeight: 400,
          overflow: "auto",
          bgcolor: "background.paper",
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            p: 1.5,
            borderBottom: 1,
            borderColor: "divider",
          }}
        >
          <Typography variant="subtitle2" color="text.secondary">
            <HistoryIcon fontSize="small" sx={{ mr: 1, verticalAlign: "middle" }} />
            Recent Searches
          </Typography>
          <Button size="small" onClick={clearHistory} color="error">
            Clear All
          </Button>
        </Box>
        <List dense>
          {searchHistory.map((item, index) => (
            <ListItem
              key={index}
              button
              onClick={() => handleHistoryItemClick(item)}
              sx={{
                "&:hover": {
                  bgcolor: "action.hover",
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                {getMediaTypeIcon(item.mediaType)}
              </ListItemIcon>
              <ListItemText
                primary={item.query}
                secondary={item.mediaType}
              />
              <ListItemSecondaryAction>
                <IconButton
                  edge="end"
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFromHistory(item.query);
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      </Paper>
    );
  };

  const renderEmptyState = () => {
    if (!hasSearched) {
      return (
        <Box textAlign="center" sx={{ py: 8 }}>
          <SearchIcon sx={{ fontSize: 80, color: "text.secondary", mb: 2 }} />
          <Typography variant="h5" color="text.secondary" gutterBottom>
            Search for Movies, TV Shows & People
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Enter a search term above to find your favorite content
          </Typography>

          {searchHistory.length > 0 && (
            <Box sx={{ maxWidth: 400, mx: "auto", mt: 4 }}>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                gutterBottom
                sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <HistoryIcon fontSize="small" sx={{ mr: 1 }} />
                Recent Searches
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="center" sx={{ mt: 1 }}>
                {searchHistory.slice(0, 5).map((item, index) => (
                  <Chip
                    key={index}
                    label={item.query}
                    icon={getMediaTypeIcon(item.mediaType)}
                    onClick={() => handleHistoryItemClick(item)}
                    variant="outlined"
                    sx={{ mb: 1 }}
                  />
                ))}
              </Stack>
            </Box>
          )}
        </Box>
      );
    }

    return (
      <Box textAlign="center" sx={{ py: 8 }}>
        <Typography variant="h5" color="text.secondary" gutterBottom>
          No results found for "{query}"
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          Try different keywords or check the spelling
        </Typography>
        <Button variant="outlined" onClick={handleClearSearch}>
          Clear Search
        </Button>
      </Box>
    );
  };

  return (
    <>
      {advanceFilter ? (
        <>
          <FilterOptions />
          <Button
            variant="contained"
            color="primary"
            onClick={handleFilterClick}
            sx={{
              position: "fixed",
              top: "5rem",
              right: "2rem",
              zIndex: 1000,
            }}
          >
            Back to Search
          </Button>
        </>
      ) : (
        <div>
          <Toolbar />
          <Box sx={{ ...uiConfigs.style.mainContent }}>
            <Stack spacing={2}>
              <Stack
                spacing={1}
                direction="row"
                justifyContent="center"
                sx={{ width: "100%" }}
              >
                {mediaTypes.map((type) => (
                  <Button
                    key={type}
                    size="medium"
                    variant={mediaType === type ? "contained" : "outlined"}
                    startIcon={getMediaTypeIcon(type, mediaType === type)}
                    sx={{
                      color: mediaType === type ? "primary.contrastText" : "text.primary",
                      borderColor: mediaType === type ? "primary.main" : "divider",
                      textTransform: "capitalize",
                      px: 2,
                      "&:hover": {
                        borderColor: "primary.main",
                      },
                    }}
                    onClick={() => onCategoryChange(type)}
                  >
                    {type}
                  </Button>
                ))}
              </Stack>

              <Box sx={{ position: "relative" }}>
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={1}
                  sx={{ width: "100%" }}
                >
                  <Autocomplete
                    freeSolo
                    sx={{ width: "100%" }}
                    options={suggestions}
                    inputValue={inputValue}
                    onInputChange={onInputChange}
                    onChange={onSearchSubmit}
                    onFocus={() => setShowHistory(true)}
                    onBlur={() => setTimeout(() => setShowHistory(false), 200)}
                    getOptionLabel={(option) =>
                      typeof option === "string" ? option : option.label
                    }
                    renderOption={(props, option) => (
                      <li {...props} key={option.id}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1.5,
                            width: "100%",
                          }}
                        >
                          {getMediaTypeIcon(option.mediaType)}
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="body1">{option.label}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {option.mediaType}
                              {option.year && ` • ${option.year}`}
                              {option.rating > 0 && (
                                <>
                                  {" • "}
                                  <StarIcon sx={{ fontSize: 12, color: "#f5c518", verticalAlign: "middle", mr: 0.25 }} />
                                  {option.rating.toFixed(1)}
                                </>
                              )}
                            </Typography>
                          </Box>
                        </Box>
                      </li>
                    )}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        inputRef={inputRef}
                        placeholder="Search PLhub..."
                        color="success"
                        error={Boolean(validationError)}
                        sx={{ flexGrow: 1, bgcolor: "background.paper", borderRadius: "4px" }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && inputValue && !validationError) {
                            setQuery(inputValue);
                          }
                        }}
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <InputAdornment position="end">
                              {inputValue && (
                                <IconButton
                                  onClick={handleClearSearch}
                                  size="small"
                                  sx={{ mr: 0.5 }}
                                >
                                  <ClearIcon />
                                </IconButton>
                              )}
                              {isSupported && (
                                <Tooltip title={isListening ? "Stop listening" : "Voice search"}>
                                  <IconButton
                                    onClick={handleVoiceClick}
                                    size="small"
                                    sx={{
                                      mr: 0.5,
                                      color: isListening ? "error.main" : "inherit",
                                      animation: isListening
                                        ? "pulse 1.5s infinite"
                                        : "none",
                                      "@keyframes pulse": {
                                        "0%": { opacity: 1 },
                                        "50%": { opacity: 0.5 },
                                        "100%": { opacity: 1 },
                                      },
                                    }}
                                  >
                                    {isListening ? <MicOffIcon /> : <MicIcon />}
                                  </IconButton>
                                </Tooltip>
                              )}
                              <IconButton
                                onClick={() => inputValue && !validationError && setQuery(inputValue)}
                              >
                                <SearchIcon color="primary" />
                              </IconButton>
                              <Button
                                variant="contained"
                                color="primary"
                                onClick={handleFilterClick}
                                startIcon={<FilterListIcon />}
                                sx={{
                                  padding: "1rem 1.5rem",
                                  height: "100%",
                                }}
                              >
                                Filter
                              </Button>
                            </InputAdornment>
                          ),
                        }}
                      />
                    )}
                  />
                </Stack>
                {renderSearchHistory()}
              </Box>

              <Collapse in={Boolean(validationError)}>
                <Alert severity="error" sx={{ mt: 1 }}>
                  {validationError}
                </Alert>
              </Collapse>

              {isListening && (
                <Alert
                  severity="info"
                  icon={<MicIcon />}
                  sx={{ animation: "pulse 1.5s infinite" }}
                >
                  Listening... Speak now
                </Alert>
              )}

              <Stack
                direction="row"
                spacing={1}
                justifyContent="center"
                sx={{ mt: 2 }}
              >
                <Tooltip title="Share on Telegram">
                  <IconButton color="primary">
                    <Telegram />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Share on Reddit">
                  <IconButton color="primary">
                    <Reddit />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Share on Twitter">
                  <IconButton color="primary">
                    <Twitter />
                  </IconButton>
                </Tooltip>
              </Stack>

              {query && totalResults > 0 && (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 1,
                  }}
                >
                  <Typography variant="h6" color="text.secondary">
                    {totalResults.toLocaleString()} results for "{query}"
                  </Typography>
                  <Chip
                    label={`Page ${page} of ${totalPages}`}
                    size="small"
                    variant="outlined"
                  />
                </Box>
              )}

              {onSearch && medias.length === 0 ? (
                renderLoadingSkeletons()
              ) : medias.length > 0 ? (
                <MediaGrid medias={medias} mediaType={mediaType} />
              ) : (
                renderEmptyState()
              )}

              {medias.length > 0 && page < totalPages && (
                <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
                  <LoadingButton
                    loading={onSearch}
                    variant="contained"
                    onClick={() => setPage((prevPage) => prevPage + 1)}
                  >
                    Load More ({medias.length} of {totalResults})
                  </LoadingButton>
                </Box>
              )}
            </Stack>
          </Box>
        </div>
      )}
    </>
  );
};

export default MediaSearch;
