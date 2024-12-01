import { Button, Grid } from "@mui/material";
import { useEffect, useState } from "react";
import tmdbConfigs from "../../api/configs/tmdb.configs";
import personApi from "../../api/modules/person.api";
import MediaItem from "./MediaItem";
import { toast } from "react-toastify";

/**
 * PersonMediaGrid Component
 * - Displays a grid of media items associated with a specific person.
 * - Supports pagination with a "Load More" button.
 *
 * @param {Object} props - Component props.
 * @param {string} props.personId - The ID of the person whose media items are being displayed.
 */
const PersonMediaGrid = ({ personId }) => {
  const [medias, setMedias] = useState([]); // All media items
  const [filteredMedias, setFilteredMedias] = useState([]); // Paginated media items
  const [page, setPage] = useState(1); // Current page number
  const itemsPerPage = 8; // Number of items to display per page

  useEffect(() => {
    /**
     * Fetches media items for the person and sorts them by release date.
     */
    const fetchMedias = async () => {
      const { response, err } = await personApi.medias({ personId });

      if (err) {
        toast.error(err.message);
        return;
      }

      if (response) {
        // Sort media items by release date (newest first)
        const sortedMedias = response.cast.sort((a, b) => getReleaseDate(b) - getReleaseDate(a));
        setMedias(sortedMedias);
        setFilteredMedias(sortedMedias.slice(0, itemsPerPage));
      }
    };

    fetchMedias();
  }, [personId]);

  /**
   * Helper function to get the release date of a media item.
   * Returns the timestamp of the release date or first air date.
   *
   * @param {Object} media - Media object containing release date information.
   * @returns {number} - Timestamp of the release date.
   */
  const getReleaseDate = (media) => {
    const date =
      media.media_type === tmdbConfigs.mediaType.movie
        ? new Date(media.release_date)
        : new Date(media.first_air_date);
    return date.getTime();
  };

  /**
   * Handles loading more media items when the "Load More" button is clicked.
   */
  const onLoadMore = () => {
    const nextPageItems = medias.slice(page * itemsPerPage, (page + 1) * itemsPerPage);
    setFilteredMedias((prev) => [...prev, ...nextPageItems]);
    setPage((prev) => prev + 1);
  };

  return (
    <>
      <Grid container spacing={1} sx={{ marginRight: "-8px!important" }}>
        {filteredMedias.map((media, index) => (
          <Grid item xs={6} sm={4} md={3} key={index}>
            <MediaItem media={media} mediaType={media.media_type} />
          </Grid>
        ))}
      </Grid>
      {filteredMedias.length < medias.length && (
        <Button onClick={onLoadMore} sx={{ marginTop: 2 }}>
          Load More
        </Button>
      )}
    </>
  );
};

export default PersonMediaGrid;
