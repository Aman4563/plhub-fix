import { Box } from "@mui/material";
import { SwiperSlide } from "swiper/react";
import tmdbConfigs from "../../api/configs/tmdb.configs";
import NavigationSwiper from "./NavigationSwiper";

/**
 * BackdropSlide Component
 * - Displays a slider showcasing a maximum of 10 backdrop images.
 *
 * @param {Object} props - React props.
 * @param {Array} props.backdrops - Array of backdrop objects containing image file paths.
 */
const BackdropSlide = ({ backdrops }) => {
  return (
    <NavigationSwiper>
      {[...backdrops].slice(0, 10).map((item, index) => (
        <SwiperSlide key={index}>
          <Box
            sx={{
              paddingTop: "60%", // Ensures the box maintains a 16:9 aspect ratio
              backgroundPosition: "top", // Focuses on the top of the image
              backgroundSize: "cover", // Ensures the image covers the box entirely
              backgroundImage: `url(${tmdbConfigs.backdropPath(item.file_path)})`, // Dynamically sets the background image
            }}
          />
        </SwiperSlide>
      ))}
    </NavigationSwiper>
  );
};

export default BackdropSlide;
