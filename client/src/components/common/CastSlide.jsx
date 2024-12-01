import { Box, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import tmdbConfigs from "../../api/configs/tmdb.configs";
import uiConfigs from "../../configs/ui.configs";
import { routesGen } from "../../routes/routes";

/**
 * CastSlide Component
 * - Displays a horizontal slider showcasing cast members with their profile pictures and names.
 *
 * @param {Object} props - React props.
 * @param {Array} props.casts - Array of cast objects containing their `id`, `profile_path`, and `name`.
 */
const CastSlide = ({ casts }) => {
  return (
    <Box
      sx={{
        "& .swiper-slide": {
          width: { xs: "50%", md: "25%", lg: "20.5%" }, // Responsive slide widths
          color: "primary.contrastText",
        },
      }}
    >
      <Swiper
        spaceBetween={10} // Space between slides
        slidesPerView={"auto"} // Automatically adjusts the number of slides visible
        grabCursor={true} // Enables a grab cursor for better user interaction
        style={{ width: "100%", height: "max-content" }}
      >
        {casts.map((cast, index) => (
          <SwiperSlide key={index}>
            <Link to={routesGen.person(cast.id)}>
              <Box
                sx={{
                  position: "relative",
                  paddingTop: "120%", // Maintain aspect ratio for images
                  color: "text.primary",
                  ...uiConfigs.style.backgroundImage(
                    tmdbConfigs.posterPath(cast.profile_path)
                  ), // Dynamically set the background image
                }}
              >
                <Box
                  sx={{
                    position: "absolute",
                    width: "100%",
                    height: "max-content",
                    bottom: 0,
                    padding: "10px",
                    backgroundColor: "rgba(0,0,0,0.6)", // Add a semi-transparent background for the text
                  }}
                >
                  <Typography sx={{ ...uiConfigs.style.typoLines(1, "left") }}>
                    {cast.name}
                  </Typography>
                </Box>
              </Box>
            </Link>
          </SwiperSlide>
        ))}
      </Swiper>
    </Box>
  );
};

export default CastSlide;
