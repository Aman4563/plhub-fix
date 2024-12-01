import DeleteIcon from "@mui/icons-material/Delete";
import { LoadingButton } from "@mui/lab";
import { Box, Button, Grid } from "@mui/material";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import MediaItem from "../components/common/MediaItem";
import Container from "../components/common/Container";
import uiConfigs from "../configs/ui.configs";
import favoriteApi from "../api/modules/favorite.api";
import { setGlobalLoading } from "../redux/features/globalLoadingSlice";
import { removeFavorite } from "../redux/features/userSlice";

/**
 * Component representing an individual favorite item.
 * - Displays the media item and provides functionality to remove it from the favorites list.
 *
 * @param {Object} props - Component props.
 * @param {Object} props.media - The media object representing the favorite.
 * @param {Function} props.onRemoved - Callback invoked when the item is removed.
 */
const FavoriteItem = ({ media, onRemoved }) => {
  const dispatch = useDispatch();
  const [onRequest, setOnRequest] = useState(false);

  const onRemove = async () => {
    if (onRequest) return;

    setOnRequest(true);
    const { response, err } = await favoriteApi.remove({ favoriteId: media.id });
    setOnRequest(false);

    if (err) {
      toast.error(err.message);
    } else if (response) {
      toast.success("Favorite removed successfully");
      dispatch(removeFavorite({ mediaId: media.mediaId }));
      onRemoved(media.id);
    }
  };

  return (
    <>
      <MediaItem media={media} mediaType={media.mediaType} />
      <LoadingButton
        fullWidth
        variant="contained"
        sx={{ marginTop: 2 }}
        startIcon={<DeleteIcon />}
        loadingPosition="start"
        loading={onRequest}
        onClick={onRemove}
      >
        Remove
      </LoadingButton>
    </>
  );
};

/**
 * Component representing the list of favorite items.
 * - Fetches the user's favorites from the API and displays them.
 * - Provides functionality to load more items and remove items.
 */
const FavoriteList = () => {
  const [medias, setMedias] = useState([]);
  const [filteredMedias, setFilteredMedias] = useState([]);
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);
  const dispatch = useDispatch();

  const itemsPerPage = 8;

  useEffect(() => {
    const fetchFavorites = async () => {
      dispatch(setGlobalLoading(true));
      const { response, err } = await favoriteApi.getList();
      dispatch(setGlobalLoading(false));

      if (err) {
        toast.error(err.message);
      } else if (response) {
        setCount(response.length);
        setMedias(response);
        setFilteredMedias(response.slice(0, itemsPerPage));
      }
    };

    fetchFavorites();
  }, [dispatch]);

  const onLoadMore = () => {
    const nextPageItems = medias.slice(page * itemsPerPage, (page + 1) * itemsPerPage);
    setFilteredMedias((prev) => [...prev, ...nextPageItems]);
    setPage((prev) => prev + 1);
  };

  const onRemoved = (id) => {
    const updatedMedias = medias.filter((media) => media.id !== id);
    setMedias(updatedMedias);
    setFilteredMedias(updatedMedias.slice(0, page * itemsPerPage));
    setCount((prev) => prev - 1);
  };

  return (
    <Box sx={{ ...uiConfigs.style.mainContent }}>
      <Container header={`Your Favorites (${count})`}>
        <Grid container spacing={1} sx={{ marginRight: "-8px!important" }}>
          {filteredMedias.map((media) => (
            <Grid item xs={6} sm={4} md={3} key={media.id}>
              <FavoriteItem media={media} onRemoved={onRemoved} />
            </Grid>
          ))}
        </Grid>
        {filteredMedias.length < medias.length && (
          <Button onClick={onLoadMore}>Load More</Button>
        )}
      </Container>
    </Box>
  );
};

export default FavoriteList;
