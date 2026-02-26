import { useEffect, useState, useRef } from "react";
import { SwiperSlide } from "swiper/react";
import { toast } from "react-toastify";
import mediaApi from "../../api/modules/media.api";
import AutoSwiper from "./AutoSwiper";
import MediaItem from "./MediaItem";
import { MediaSliderSkeleton } from "./MediaSkeleton";

/**
 * TrendingSlide Component
 * - Displays trending media items (movies, TV, or all) in a carousel.
 * - Uses the TMDB trending endpoint.
 */
const TrendingSlide = ({ mediaType = "all", timeWindow = "week" }) => {
  const [medias, setMedias] = useState([]);
  const [loading, setLoading] = useState(true);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    const fetchTrending = async () => {
      // Abort any previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      setLoading(true);
      
      try {
        const { response, err } = await mediaApi.getTrending({
          mediaType,
          timeWindow,
        });

        if (response) {
          setMedias(response.results || []);
        } else if (err) {
          toast.error(err.message || "Failed to load trending content");
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          toast.error("Failed to load trending content");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTrending();

    // Cleanup
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [mediaType, timeWindow]);

  if (loading) {
    return <MediaSliderSkeleton count={6} />;
  }

  return (
    <AutoSwiper>
      {medias.map((media) => (
        <SwiperSlide key={`trending-${media.id}`} style={{ paddingInline: "0.5rem" }}>
          <MediaItem 
            media={media} 
            mediaType={media.media_type || mediaType} 
          />
        </SwiperSlide>
      ))}
    </AutoSwiper>
  );
};

export default TrendingSlide;

