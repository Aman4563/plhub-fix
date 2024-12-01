import { useEffect, useState } from "react";
import { SwiperSlide } from "swiper/react";
import { toast } from "react-toastify";
import mediaApi from "../../api/modules/media.api";
import AutoSwiper from "./AutoSwiper";
import MediaItem from "./MediaItem";

/**
 * MediaSlide Component
 * - Displays a carousel of media items (movies or TV shows) based on the provided type and category.
 * - Fetches media data dynamically using the TMDB API.
 *
 * @param {Object} props - Component props.
 * @param {string} props.mediaType - Type of the media (e.g., "movie" or "tv").
 * @param {string} props.mediaCategory - Category of the media (e.g., "popular", "top_rated").
 */
const MediaSlide = ({ mediaType, mediaCategory }) => {
  const [medias, setMedias] = useState([]);

  useEffect(() => {
    /**
     * Fetches media items based on the provided type and category.
     */
    const fetchMedias = async () => {
      const { response, err } = await mediaApi.getList({
        mediaType,
        mediaCategory,
        page: 1,
      });

      if (response) {
        setMedias(response.results);
      } else if (err) {
        toast.error(err.message);
      }
    };

    fetchMedias();
  }, [mediaType, mediaCategory]);

  return (
    <AutoSwiper>
      {medias.map((media, index) => (
        <SwiperSlide key={index} style={{ paddingInline: "0.5rem" }}>
          <MediaItem media={media} mediaType={mediaType} />
        </SwiperSlide>
      ))}
    </AutoSwiper>
  );
};

export default MediaSlide;
