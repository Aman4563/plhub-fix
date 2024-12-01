import { Box } from "@mui/material";
import { SwiperSlide } from "swiper/react";
import tmdbConfigs from "../../api/configs/tmdb.configs";
import AutoSwiper from "./AutoSwiper";

/**
 * PosterSlide Component
 * - Displays a carousel of movie or TV show posters.
 *
 * @param {Object} props - Component props.
 * @param {Array} props.posters - Array of poster objects containing file paths.
 */
const PosterSlide = ({ posters }) => {
  return (
    <AutoSwiper>
      {posters.slice(0, 10).map((item, index) => (
        <SwiperSlide key={index}>
          <Box
            sx={{
              paddingTop: "160%", // Maintain a consistent aspect ratio for the poster
              backgroundPosition: "center", // Center the image
              backgroundSize: "cover", // Ensure the image covers the box
              backgroundImage: `url(${tmdbConfigs.posterPath(item.file_path)})`, // Dynamically load poster image
            }}
          />
        </SwiperSlide>
      ))}
    </AutoSwiper>
  );
};

export default PosterSlide;
