import { Box } from "@mui/material";
import ImageNotSupportedIcon from "@mui/icons-material/ImageNotSupported";
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
  // Filter out items without valid file paths
  const validPosters = posters.filter(item => item.file_path);

  if (validPosters.length === 0) {
    return null;
  }

  return (
    <AutoSwiper>
      {validPosters.slice(0, 10).map((item, index) => {
        const imageUrl = tmdbConfigs.posterPath(item.file_path);
        
        return (
          <SwiperSlide key={index}>
            <Box
              sx={{
                paddingTop: "160%",
                backgroundPosition: "center",
                backgroundSize: "cover",
                backgroundColor: "grey.900",
                backgroundImage: imageUrl ? `url(${imageUrl})` : "none",
                position: "relative",
              }}
            >
              {!imageUrl && (
                <ImageNotSupportedIcon 
                  sx={{ 
                    fontSize: 48, 
                    color: "grey.600",
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)"
                  }} 
                />
              )}
            </Box>
          </SwiperSlide>
        );
      })}
    </AutoSwiper>
  );
};

export default PosterSlide;
