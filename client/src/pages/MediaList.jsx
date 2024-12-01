import { LoadingButton } from "@mui/lab";
import { Box, Button, Stack, Typography } from "@mui/material";
import { useEffect, useState, useMemo } from "react";
import { useDispatch } from "react-redux";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";

import tmdbConfigs from "../api/configs/tmdb.configs";
import mediaApi from "../api/modules/media.api";
import uiConfigs from "../configs/ui.configs";
import HeroSlide from "../components/common/HeroSlide";
import MediaGrid from "../components/common/MediaGrid";

import { setAppState } from "../redux/features/appStateSlice";
import { setGlobalLoading } from "../redux/features/globalLoadingSlice";
import usePrevious from "../hooks/usePrevious";

/**
 * MediaList Component
 * - Displays a list of movies or TV series based on the selected category.
 * - Fetches data from the API and supports pagination for loading more items.
 * - Allows users to switch between "popular" and "top-rated" categories.
 */
const MediaList = () => {
  const { mediaType } = useParams(); // Extract media type from route parameters
  const dispatch = useDispatch();

  const [medias, setMedias] = useState([]); // State to hold media items
  const [mediaLoading, setMediaLoading] = useState(false); // State to indicate if media is loading
  const [currCategory, setCurrCategory] = useState(0); // State for the current category (0: "popular", 1: "top-rated")
  const [currPage, setCurrPage] = useState(1); // State for the current page

  const prevMediaType = usePrevious(mediaType); // Track the previous media type
  const mediaCategories = useMemo(() => ["popular", "top_rated"], []); // Category keys for API
  const categoryLabels = ["Popular", "Top Rated"]; // Display labels for categories

  // Set the application state to the current media type on mount or when it changes
  useEffect(() => {
    dispatch(setAppState(mediaType));
    window.scrollTo(0, 0); // Scroll to the top of the page
  }, [mediaType, dispatch]);

  // Fetch media items based on the current category and page
  useEffect(() => {
    const fetchMedias = async () => {
      if (currPage === 1) dispatch(setGlobalLoading(true));
      setMediaLoading(true);

      const { response, err } = await mediaApi.getList({
        mediaType,
        mediaCategory: mediaCategories[currCategory],
        page: currPage,
      });

      setMediaLoading(false);
      dispatch(setGlobalLoading(false));

      if (err) {
        toast.error(err.message);
      } else if (response) {
        setMedias((prev) =>
          currPage === 1 ? response.results : [...prev, ...response.results]
        );
      }
    };

    // Reset category and page when media type changes
    if (mediaType !== prevMediaType) {
      setCurrCategory(0);
      setCurrPage(1);
    }

    fetchMedias();
  }, [mediaType, currCategory, currPage, mediaCategories, dispatch, prevMediaType]);

  /**
   * Handle category change.
   * - Resets the media list and page number for the selected category.
   * 
   * @param {number} categoryIndex - Index of the selected category.
   */
  const onCategoryChange = (categoryIndex) => {
    if (currCategory === categoryIndex) return;

    setMedias([]);
    setCurrPage(1);
    setCurrCategory(categoryIndex);
  };

  /**
   * Load more items by incrementing the current page number.
   */
  const onLoadMore = () => setCurrPage((prev) => prev + 1);

  return (
    <>
      {/* Hero Slide for the current category */}
      <HeroSlide
        mediaType={mediaType}
        mediaCategory={mediaCategories[currCategory]}
      />

      {/* Main Content */}
      <Box sx={{ ...uiConfigs.style.mainContent }}>
        {/* Category Selection and Header */}
        <Stack
          spacing={2}
          direction={{ xs: "column", md: "row" }}
          alignItems="center"
          justifyContent="space-between"
          sx={{ marginBottom: 4 }}
        >
          {/* Title */}
          <Typography fontWeight="700" variant="h5">
            {mediaType === tmdbConfigs.mediaType.movie ? "Movies" : "TV Series"}
          </Typography>

          {/* Category Buttons */}
          <Stack direction="row" spacing={2}>
            {categoryLabels.map((label, index) => (
              <Button
                key={index}
                size="large"
                variant={currCategory === index ? "contained" : "text"}
                sx={{
                  color:
                    currCategory === index
                      ? "primary.contrastText"
                      : "text.primary",
                }}
                onClick={() => onCategoryChange(index)}
              >
                {label}
              </Button>
            ))}
          </Stack>
        </Stack>

        {/* Media Grid */}
        <MediaGrid medias={medias} mediaType={mediaType} />

        {/* Load More Button */}
        <LoadingButton
          sx={{ marginTop: 8 }}
          fullWidth
          color="primary"
          loading={mediaLoading}
          onClick={onLoadMore}
        >
          Load More
        </LoadingButton>
      </Box>
    </>
  );
};

export default MediaList;
