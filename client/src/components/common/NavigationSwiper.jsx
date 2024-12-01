import { Box } from "@mui/material";
import { Navigation, Pagination } from "swiper";
import { Swiper } from "swiper/react";

/**
 * NavigationSwiper Component
 * - A reusable swiper component with navigation buttons and pagination.
 * - Supports child elements (slides) for dynamic content.
 *
 * @param {Object} props - Component props.
 * @param {ReactNode} props.children - Child elements to render as slides within the swiper.
 */
const NavigationSwiper = ({ children }) => {
  return (
    <Box
      sx={{
        "& .swiper-slide": {
          width: "100%",
          opacity: 0.6,
          paddingBottom: "3rem", // Adjust spacing between slides and pagination
        },
        "& .swiper-slide-active": {
          opacity: 1, // Highlight active slide
        },
        "& .swiper-pagination-bullet": {
          backgroundColor: "text.primary", // Pagination bullets color
        },
        "& .swiper-button-next, & .swiper-button-prev": {
          color: "text.primary", // Navigation arrows color
          "&::after": {
            fontSize: { xs: "1rem", md: "2rem" }, // Responsive arrow size
          },
        },
        "& .swiper": {
          paddingX: { xs: "1rem", md: "4rem" }, // Adjust swiper padding
        },
      }}
    >
      <Swiper
        spaceBetween={10} // Space between slides
        grabCursor // Enable grabbing cursor for better UX
        pagination={{ clickable: true }} // Enable clickable pagination bullets
        navigation // Enable next/prev navigation
        modules={[Navigation, Pagination]} // Include required Swiper modules
        style={{ width: "100%", height: "max-content" }}
      >
        {children}
      </Swiper>
    </Box>
  );
};

export default NavigationSwiper;
