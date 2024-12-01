import { Box } from "@mui/material";
import { Swiper } from "swiper/react";

/**
 * AutoSwiper Component
 * - A responsive swiper container for sliding elements.
 *
 * @param {Object} props - React props.
 * @param {React.ReactNode} props.children - Child components to be rendered within the swiper.
 */
const AutoSwiper = ({ children }) => {
  return (
    <Box
      sx={{
        "& .swiper-slide": {
          width: {
            xs: "50%", // 50% width for extra small screens
            sm: "35%", // 35% width for small screens
            md: "25%", // 25% width for medium screens
            lg: "20.5%", // 20.5% width for large screens
          },
        },
      }}
    >
      <Swiper
        slidesPerView="auto" // Automatically adjusts the number of slides visible
        grabCursor={true} // Enables a grab cursor for better user experience
        style={{
          width: "100%", // Ensures the swiper takes up full width of the parent
          height: "max-content", // Adapts height based on the content
        }}
      >
        {children}
      </Swiper>
    </Box>
  );
};

export default AutoSwiper;
