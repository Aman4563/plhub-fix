import { LoadingButton } from "@mui/lab";
import { Box, Button, Stack, TextField, Toolbar, IconButton, Tooltip, InputAdornment } from "@mui/material";
import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import mediaApi from "../../api/modules/media.api";
import MediaGrid from "../../components/common/MediaGrid";
import uiConfigs from "../../configs/ui.configs";
import { Search as SearchIcon, FilterList as FilterListIcon, Telegram, Reddit, Twitter } from "@mui/icons-material";
import FilterOptions from "../../components/common/FilterOptions";

const mediaTypes = ["movie", "tv", "people"];
let timer;
const timeout = 500;

const BasicSearch = () => {
  const [query, setQuery] = useState("");
  const [onSearch, setOnSearch] = useState(false);
  const [mediaType, setMediaType] = useState(mediaTypes[0]);
  const [medias, setMedias] = useState([]);
  const [page, setPage] = useState(1);
  const [advanceFilter, setAdvanceFilter] = useState(false);

  const search = useCallback(
    async () => {
      setOnSearch(true);

      const { response, err } = await mediaApi.search({
        mediaType,
        query,
        page
      });

      setOnSearch(false);

      if (err) toast.error(err.message);
      if (response) {
        if (page > 1) setMedias(m => [...m, ...response.results]);
        else setMedias([...response.results]);
      }
    },
    [mediaType, query, page],
  );

  useEffect(() => {
    if (query.trim().length === 0) {
      setMedias([]);
      setPage(1);
    } else search();
  }, [search, query, mediaType, page]);

  useEffect(() => {
    setMedias([]);
    setPage(1);
  }, [mediaType]);

  const onCategoryChange = (selectedCategory) => setMediaType(selectedCategory);

  const onQueryChange = (e) => {
    const newQuery = e.target.value;
    clearTimeout(timer);

    timer = setTimeout(() => {
      setQuery(newQuery);
    }, timeout);
  };

  const handleFilterClick = () => {
    setAdvanceFilter(!advanceFilter);
  };

  return (
    <>
      {advanceFilter ? <FilterOptions/> : <div>
      <Toolbar />
      <Box sx={{ ...uiConfigs.style.mainContent }}>
        <Stack spacing={2}>
          <Stack
            spacing={2}
            direction="row"
            justifyContent="center"
            sx={{ width: "100%" }}
          >
            {mediaTypes.map((item, index) => (
              <Button
                size="large"
                key={index}
                variant={mediaType === item ? "contained" : "text"}
                sx={{
                  color: mediaType === item ? "primary.contrastText" : "text.primary"
                }}
                onClick={() => onCategoryChange(item)}
              >
                {item}
              </Button>
            ))}
          </Stack>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ width: "100%" }}>
            <TextField
              color="success"
              placeholder="Search PLhub..."
              sx={{ flexGrow: 1, bgcolor: "#121212", borderRadius: "4px" }}
              autoFocus
              onChange={onQueryChange}
              InputProps={{
                endAdornment: (
                  <>
                  <InputAdornment position="start">
                    <IconButton onClick={search}>
                      <SearchIcon color="primary" />
                    </IconButton>
                  </InputAdornment>
                  <Button
              variant="contained"
              color="primary"
              onClick={handleFilterClick}
              sx={{ height: "100%", bgcolor: "#000" }}
            >
              Filter
            </Button>
                  </>
                ),
              }}
            />
            <Stack direction="row" spacing={1} alignItems="center" justifyContent="center" sx={{ mt: 2 }}>
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

            
          </Stack>

          <MediaGrid medias={medias} mediaType={mediaType} />

          {medias.length > 0 && (
            <LoadingButton
              loading={onSearch}
              onClick={() => setPage(page + 1)}
            >
              load more
            </LoadingButton>
          )}
        </Stack>
      </Box>
      </div>}
    </>
  );
};

export default BasicSearch;