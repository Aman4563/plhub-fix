import { useEffect, useState, useRef } from "react";
import { SwiperSlide } from "swiper/react";
import { Box } from "@mui/material";
import { toast } from "react-toastify";
import mediaApi from "../../api/modules/media.api";
import genreApi from "../../api/modules/genre.api";
import AutoSwiper from "./AutoSwiper";
import MediaItemWithPreview from "./MediaItemWithPreview";
import { MediaSliderSkeleton } from "./MediaSkeleton";

/**
 * MediaSlideWithPreview Component
 * - Similar to MediaSlide but uses MediaItemWithPreview for Netflix-style hover effects.
 * - Includes video preview on hover after delay.
 * - Note: This requires more resources, use sparingly for featured sections.
 */
const MediaSlideWithPreview = ({ 
  mediaType, 
  mediaCategory, 
  medias: propMedias,
  genres: propGenres,
}) => {
  const [medias, setMedias] = useState(propMedias || []);
  const [genres, setGenres] = useState(propGenres || []);
  const [loading, setLoading] = useState(!propMedias);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    // If medias were provided as props, use them directly
    if (propMedias) {
      setMedias(propMedias);
      setLoading(false);
    }
    
    if (propGenres) {
      setGenres(propGenres);
    }

    // Fetch genres if not provided
    if (!propGenres && mediaType) {
      const fetchGenres = async () => {
        const { response } = await genreApi.getList({ mediaType });
        if (response?.genres) {
          setGenres(response.genres);
        }
      };
      fetchGenres();
    }

    // Fetch media if not provided
    if (!propMedias && mediaType && mediaCategory) {
      const fetchMedias = async () => {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        setLoading(true);

        try {
          const { response, err } = await mediaApi.getList({
            mediaType,
            mediaCategory,
            page: 1,
          });

          if (response) {
            setMedias(response.results || []);
          } else if (err) {
            toast.error(err.message || "Failed to load content");
          }
        } catch (error) {
          if (error.name !== "AbortError") {
            toast.error("Failed to load content");
          }
        } finally {
          setLoading(false);
        }
      };

      fetchMedias();
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [mediaType, mediaCategory, propMedias, propGenres]);

  if (loading) {
    return <MediaSliderSkeleton count={6} />;
  }

  return (
    <Box
      sx={{
        // Extra padding for hover expansion
        py: 4,
        my: -2,
        overflow: "visible",
      }}
    >
      <AutoSwiper>
        {medias.map((media) => (
          <SwiperSlide 
            key={`preview-${media.id}-${mediaType}`} 
            style={{ 
              paddingInline: "0.5rem",
              overflow: "visible",
            }}
          >
            <MediaItemWithPreview 
              media={media} 
              mediaType={media.media_type || mediaType}
              genres={genres}
            />
          </SwiperSlide>
        ))}
      </AutoSwiper>
    </Box>
  );
};

export default MediaSlideWithPreview;

