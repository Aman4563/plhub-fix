import { SwiperSlide } from "swiper/react";
import AutoSwiper from "./AutoSwiper";
import MediaItem from "./MediaItem";

/**
 * RecommendSlide Component
 * - Displays a carousel of recommended media items.
 *
 * @param {Object} props - Component props.
 * @param {Array} props.medias - Array of recommended media items.
 * @param {string} props.mediaType - The type of media (e.g., "movie" or "tv").
 */
const RecommendSlide = ({ medias, mediaType }) => {
  return (
    <AutoSwiper>
      {medias.map((media, index) => (
        <SwiperSlide key={index}>
          <MediaItem media={media} mediaType={mediaType} />
        </SwiperSlide>
      ))}
    </AutoSwiper>
  );
};

export default RecommendSlide;
