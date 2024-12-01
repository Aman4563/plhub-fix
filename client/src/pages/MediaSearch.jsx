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
} from "@mui/material";
import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "react-toastify";
import { debounce } from "lodash";
import mediaApi from "../api/modules/media.api";
import MediaGrid from "../components/common/MediaGrid";
import uiConfigs from "../configs/ui.configs";
import { Search as SearchIcon, Telegram, Reddit, Twitter } from "@mui/icons-material";
import FilterOptions from "../components/common/FilterOptions";

const mediaTypes = ["movie", "tv", "people"];

const MediaSearch = () => {
  const [query, setQuery] = useState("");
  const [onSearch, setOnSearch] = useState(false);
  const [mediaType, setMediaType] = useState(mediaTypes[0]);
  const [medias, setMedias] = useState([]);
  const [page, setPage] = useState(1);
  const [advanceFilter, setAdvanceFilter] = useState(false);
  const [suggestions, setSuggestions] = useState([]);

  /**
   * Fetches media results based on query, media type, and page.
   */
  const search = useCallback(async () => {
    if (query.trim().length === 0) {
      setMedias([]);
      setPage(1);
      return;
    }

    setOnSearch(true);

    const { response, err } = await mediaApi.search({
      mediaType,
      query,
      page,
    });

    setOnSearch(false);

    if (err) {
      toast.error(err.message);
      return;
    }

    if (response) {
      setMedias((prevMedias) =>
        page > 1 ? [...prevMedias, ...response.results] : response.results
      );
    }
  }, [mediaType, query, page]);

  /**
   * Fetches autocomplete suggestions based on the user's input.
   */
  const fetchSuggestions = useCallback(async (input) => {
    if (input.trim().length === 0) {
      setSuggestions([]);
      return;
    }

    const { response, err } = await mediaApi.search({
      mediaType,
      query: input,
      page: 1,
    });

    if (err) {
      console.error(err.message);
      return;
    }

    if (response) {
      setSuggestions(response.results.map((item) => item.title || item.name));
    }
  }, [mediaType]);

  /**
   * Debounced version of fetchSuggestions for better performance.
   */
  const debouncedFetchSuggestions = useMemo(
    () => debounce(fetchSuggestions, 500),
    [fetchSuggestions]
  );

  useEffect(() => {
    search();
  }, [search]);

  useEffect(() => {
    setMedias([]);
    setPage(1);
  }, [mediaType]);

  /**
   * Handles media type category changes.
   */
  const onCategoryChange = (selectedCategory) => {
    if (selectedCategory !== mediaType) {
      setMediaType(selectedCategory);
    }
  };

  /**
   * Handles query input changes and fetches suggestions.
   */
  const onQueryChange = (event, newValue) => {
    setQuery(newValue);
    debouncedFetchSuggestions(newValue);
  };

  /**
   * Toggles advanced filter visibility.
   */
  const handleFilterClick = () => {
    setAdvanceFilter((prev) => !prev);
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
            sx={{ position: "absolute", top: "13.1rem", right: "20rem", marginX: "auto" }}
          >
            Back to Search
          </Button>
        </>
      ) : (
        <div>
          <Toolbar />
          <Box sx={{ ...uiConfigs.style.mainContent }}>
            <Stack spacing={2}>
              {/* Media Type Selection */}
              <Stack
                spacing={2}
                direction="row"
                justifyContent="center"
                sx={{ width: "100%" }}
              >
                {mediaTypes.map((type) => (
                  <Button
                    key={type}
                    size="large"
                    variant={mediaType === type ? "contained" : "text"}
                    sx={{
                      color: mediaType === type ? "primary.contrastText" : "text.primary",
                    }}
                    onClick={() => onCategoryChange(type)}
                  >
                    {type}
                  </Button>
                ))}
              </Stack>

              {/* Search and Filter */}
              <Stack direction="row" alignItems="center" spacing={1} sx={{ width: "100%" }}>
                <Autocomplete
                  freeSolo
                  sx={{ width: "100%" }}
                  options={suggestions}
                  onInputChange={onQueryChange}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Search PLhub..."
                      color="success"
                      sx={{ flexGrow: 1, bgcolor: "#121212", borderRadius: "4px" }}
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton onClick={search}>
                              <SearchIcon color="primary" />
                            </IconButton>
                            <Button
                              variant="contained"
                              color="primary"
                              onClick={handleFilterClick}
                              sx={{ padding: "1.25rem", height: "100%", bgcolor: "#000" }}
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

              {/* Share Options */}
              <Stack direction="row" spacing={1} justifyContent="center" sx={{ mt: 2 }}>
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

              {/* Media Grid */}
              <MediaGrid medias={medias} mediaType={mediaType} />

              {/* Load More Button */}
              {medias.length > 0 && (
                <LoadingButton
                  loading={onSearch}
                  onClick={() => setPage((prevPage) => prevPage + 1)}
                >
                  Load More
                </LoadingButton>
              )}
            </Stack>
          </Box>
        </div>
      )}
    </>
  );
};

export default MediaSearch;
