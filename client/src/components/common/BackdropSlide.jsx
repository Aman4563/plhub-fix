import { Box } from "@mui/material";
import ImageNotSupportedIcon from "@mui/icons-material/ImageNotSupported";
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
  // Filter out items without valid file paths
  const validBackdrops = backdrops.filter(item => item.file_path);

  if (validBackdrops.length === 0) {
    return null;
  }

  return (
    <NavigationSwiper>
      {validBackdrops.slice(0, 10).map((item, index) => {
        const imageUrl = tmdbConfigs.backdropPath(item.file_path);
        
        return (
          <SwiperSlide key={index}>
            <Box
              sx={{
                paddingTop: "60%",
                backgroundPosition: "top",
                backgroundSize: "cover",
                backgroundColor: "grey.900",
                backgroundImage: imageUrl ? `url(${imageUrl})` : "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
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
    </NavigationSwiper>
  );
};

export default BackdropSlide;
