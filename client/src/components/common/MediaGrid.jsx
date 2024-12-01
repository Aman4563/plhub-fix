import { Grid } from "@mui/material";
import MediaItem from "./MediaItem";

/**
 * MediaGrid Component
 * - Displays a responsive grid of media items.
 *
 * @param {Object} props - Component props.
 * @param {Array} props.medias - Array of media items to display.
 * @param {string} props.mediaType - Type of the media (e.g., "movie", "tv").
 */
const MediaGrid = ({ medias, mediaType }) => {
  return (
    <Grid container spacing={1} sx={{ marginRight: "-8px!important" }}>
      {medias.map((media, index) => (
        <Grid item xs={6} sm={4} md={3} key={index}>
          <MediaItem media={media} mediaType={mediaType} />
        </Grid>
      ))}
    </Grid>
  );
};

export default MediaGrid;
