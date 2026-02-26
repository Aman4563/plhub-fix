import { Box, IconButton, Tooltip, Typography } from "@mui/material";
import { Navigation, Pagination, Keyboard, A11y } from "swiper";
import { Swiper } from "swiper/react";
import { useRef, useCallback, useState } from "react";
import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";

/**
 * NavigationSwiper Component
 * - A reusable swiper component with navigation buttons and pagination.
 * - Full keyboard navigation support (Arrow keys, Home, End)
 * - Accessibility features (ARIA labels, focus management)
 * - Supports child elements (slides) for dynamic content.
 *
 * @param {Object} props - Component props.
 * @param {ReactNode} props.children - Child elements to render as slides within the swiper.
 * @param {string} props.ariaLabel - Accessibility label for the carousel.
 * @param {boolean} props.showKeyboardHint - Whether to show keyboard hint on focus.
 */
const NavigationSwiper = ({ children, ariaLabel = "Content carousel", showKeyboardHint = true }) => {
  const swiperRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(1);
  const [totalSlides, setTotalSlides] = useState(0);

  const handleSwiperInit = useCallback((swiper) => {
    swiperRef.current = swiper;
    setTotalSlides(swiper.slides.length);
  }, []);

  const handleSlideChange = useCallback((swiper) => {
    setCurrentSlide(swiper.activeIndex + 1);
  }, []);

  const handleKeyDown = useCallback((e) => {
    if (!swiperRef.current) return;

    switch (e.key) {
      case "ArrowLeft":
        e.preventDefault();
        swiperRef.current.slidePrev();
        break;
      case "ArrowRight":
        e.preventDefault();
        swiperRef.current.slideNext();
        break;
      case "Home":
        e.preventDefault();
        swiperRef.current.slideTo(0);
        break;
      case "End":
        e.preventDefault();
        swiperRef.current.slideTo(swiperRef.current.slides.length - 1);
        break;
      default:
        break;
    }
  }, []);

  const goToPrev = useCallback(() => {
    swiperRef.current?.slidePrev();
  }, []);

  const goToNext = useCallback(() => {
    swiperRef.current?.slideNext();
  }, []);

  return (
    <Box
      role="region"
      aria-label={ariaLabel}
      aria-roledescription="carousel"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      sx={{
        position: "relative",
        outline: "none",
        "&:focus-visible": {
          outline: "2px solid",
          outlineColor: "primary.main",
          outlineOffset: 4,
          borderRadius: 1,
        },
        "& .swiper-slide": {
          width: "100%",
          opacity: 0.6,
          paddingBottom: "3rem",
        },
        "& .swiper-slide-active": {
          opacity: 1,
        },
        "& .swiper-pagination-bullet": {
          backgroundColor: "text.primary",
        },
        "& .swiper-button-next, & .swiper-button-prev": {
          color: "text.primary",
          "&::after": {
            fontSize: { xs: "1rem", md: "2rem" },
          },
        },
        "& .swiper": {
          paddingX: { xs: "1rem", md: "4rem" },
        },
      }}
    >
      {/* Keyboard Navigation Hint */}
      {showKeyboardHint && isFocused && (
        <Box
          sx={{
            position: "absolute",
            top: -30,
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "background.paper",
            px: 2,
            py: 0.5,
            borderRadius: 1,
            boxShadow: 2,
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <Typography variant="caption" color="text.secondary">
            Use ← → keys to navigate • Home/End for first/last
          </Typography>
        </Box>
      )}

      {/* Accessible Navigation Buttons */}
      <Tooltip title="Previous slide (←)">
        <IconButton
          onClick={goToPrev}
          aria-label="Go to previous slide"
          sx={{
            position: "absolute",
            left: { xs: -5, md: 0 },
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 10,
            backgroundColor: "background.paper",
            boxShadow: 2,
            opacity: 0.8,
            "&:hover": { opacity: 1, backgroundColor: "background.paper" },
            display: { xs: "none", sm: "flex" },
          }}
        >
          <KeyboardArrowLeftIcon />
        </IconButton>
      </Tooltip>

      <Tooltip title="Next slide (→)">
        <IconButton
          onClick={goToNext}
          aria-label="Go to next slide"
          sx={{
            position: "absolute",
            right: { xs: -5, md: 0 },
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 10,
            backgroundColor: "background.paper",
            boxShadow: 2,
            opacity: 0.8,
            "&:hover": { opacity: 1, backgroundColor: "background.paper" },
            display: { xs: "none", sm: "flex" },
          }}
        >
          <KeyboardArrowRightIcon />
        </IconButton>
      </Tooltip>

      {/* Screen Reader Announcement */}
      <Box
        aria-live="polite"
        aria-atomic="true"
        sx={{
          position: "absolute",
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: "hidden",
          clip: "rect(0, 0, 0, 0)",
          whiteSpace: "nowrap",
          border: 0,
        }}
      >
        Slide {currentSlide} of {totalSlides}
      </Box>

      <Swiper
        spaceBetween={10}
        grabCursor
        pagination={{ clickable: true }}
        navigation
        keyboard={{
          enabled: true,
          onlyInViewport: true,
        }}
        a11y={{
          enabled: true,
          prevSlideMessage: "Previous slide",
          nextSlideMessage: "Next slide",
          firstSlideMessage: "This is the first slide",
          lastSlideMessage: "This is the last slide",
          paginationBulletMessage: "Go to slide {{index}}",
        }}
        modules={[Navigation, Pagination, Keyboard, A11y]}
        onSwiper={handleSwiperInit}
        onSlideChange={handleSlideChange}
        style={{ width: "100%", height: "max-content" }}
      >
        {children}
      </Swiper>

      {/* Slide Counter (visible) */}
      {totalSlides > 1 && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            position: "absolute",
            bottom: 8,
            right: 16,
            backgroundColor: "rgba(0,0,0,0.6)",
            color: "white",
            px: 1,
            py: 0.25,
            borderRadius: 1,
            fontSize: "0.7rem",
          }}
        >
          {currentSlide} / {totalSlides}
        </Typography>
      )}
    </Box>
  );
};

export default NavigationSwiper;
