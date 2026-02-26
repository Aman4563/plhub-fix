import { useEffect, useState, useRef } from "react";
import { SwiperSlide } from "swiper/react";
import { toast } from "react-toastify";
import mediaApi from "../../api/modules/media.api";
import AutoSwiper from "./AutoSwiper";
import MediaItem from "./MediaItem";
import MediaItemWithPreview from "./MediaItemWithPreview";
import { MediaSliderSkeleton } from "./MediaSkeleton";

/**
 * MediaSlide Component
 * - Displays a carousel of media items (movies or TV shows).
 * - Supports both pre-fetched data (medias prop) and self-fetching mode.
 * - Supports Netflix-style hover previews with withPreview prop.
 */
const MediaSlide = ({ 
  mediaType, 
  mediaCategory, 
  medias: propMedias,
  genres = [],
  withPreview = true,
}) => {
  const [medias, setMedias] = useState(propMedias || []);
  const [loading, setLoading] = useState(!propMedias);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    if (propMedias) {
      setMedias(propMedias);
      setLoading(false);
      return;
    }

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

    if (mediaType && mediaCategory) {
      fetchMedias();
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [mediaType, mediaCategory, propMedias]);

  if (loading) {
    return <MediaSliderSkeleton count={6} />;
  }

  const ItemComponent = withPreview ? MediaItemWithPreview : MediaItem;

  return (
    <AutoSwiper allowOverflow={withPreview}>
      {medias.map((media, index) => (
        <SwiperSlide 
          key={`media-${media.id}-${media.media_type || mediaType}`} 
          style={{ 
            paddingInline: "0.5rem",
            paddingTop: withPreview ? "0.5rem" : "0",
            paddingBottom: withPreview ? "2rem" : "0",
          }}
        >
          <ItemComponent 
            media={media} 
            mediaType={mediaType} 
            genres={genres}
            cardIndex={index}
            totalCards={medias.length}
          />
        </SwiperSlide>
      ))}
    </AutoSwiper>
  );
};

export default MediaSlide;
