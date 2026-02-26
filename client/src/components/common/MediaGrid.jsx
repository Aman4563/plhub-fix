import { Grid } from "@mui/material";
import MediaItem from "./MediaItem";

/**
 * MediaGrid Component
 * Displays a responsive grid of media items
 * Supports mixed media types when mediaType is "all" and shows media type badges
 */
const MediaGrid = ({ medias, mediaType, showMediaType = false }) => {
  const getItemMediaType = (media) => {
    if ((mediaType === "all" || showMediaType) && media.media_type) {
      return media.media_type === "person" ? "people" : media.media_type;
    }
    return mediaType;
  };

  // Auto-detect if we should show media type (for mixed results)
  const shouldShowMediaType = showMediaType || mediaType === "all" || medias.some(m => m.media_type);

  return (
    <Grid container spacing={{ xs: 1, sm: 1.5, md: 2 }} sx={{ marginRight: "-8px!important" }}>
      {medias.map((media, index) => (
        <Grid item xs={6} sm={4} md={3} lg={2.4} key={`${media.id}-${index}`}>
          <MediaItem 
            media={media} 
            mediaType={getItemMediaType(media)}
            showMediaType={shouldShowMediaType}
          />
        </Grid>
      ))}
    </Grid>
  );
};

export default MediaGrid;
