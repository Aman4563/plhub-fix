import { Box, Typography } from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
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
          width: { xs: "50%", md: "25%", lg: "20.5%" },
          color: "primary.contrastText",
        },
      }}
    >
      <Swiper
        spaceBetween={10}
        slidesPerView={"auto"}
        grabCursor={true}
        style={{ width: "100%", height: "max-content" }}
      >
        {casts.map((cast, index) => {
          const profileUrl = tmdbConfigs.posterPath(cast.profile_path);
          const hasImage = !!profileUrl;
          
          return (
            <SwiperSlide key={index}>
              <Link to={routesGen.person(cast.id)}>
                <Box
                  sx={{
                    position: "relative",
                    paddingTop: "120%",
                    color: "text.primary",
                    ...uiConfigs.style.backgroundImage(profileUrl),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {/* Fallback icon for missing profile images */}
                  {!hasImage && (
                    <PersonIcon 
                      sx={{ 
                        fontSize: 64, 
                        color: "grey.600",
                        position: "absolute",
                        top: "40%",
                        left: "50%",
                        transform: "translate(-50%, -50%)"
                      }} 
                    />
                  )}
                  
                  {/* Cast name overlay */}
                  <Box
                    sx={{
                      position: "absolute",
                      width: "100%",
                      height: "max-content",
                      bottom: 0,
                      padding: "10px",
                      backgroundColor: "rgba(0,0,0,0.6)",
                    }}
                  >
                    <Typography sx={{ ...uiConfigs.style.typoLines(1, "left") }}>
                      {cast.name}
                    </Typography>
                  </Box>
                </Box>
              </Link>
            </SwiperSlide>
          );
        })}
      </Swiper>
    </Box>
  );
};

export default CastSlide;
