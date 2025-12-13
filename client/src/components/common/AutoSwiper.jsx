import { useEffect, useCallback, useRef, useState } from "react";
import { Box, IconButton, Tooltip, Typography } from "@mui/material";
import { Swiper } from "swiper/react";
import { Keyboard, A11y } from "swiper";
import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import tmdbConfigs from "../../api/configs/tmdb.configs";

/**
 * AutoSwiper Component
 * - A responsive swiper container for sliding elements.
 * - Includes image prefetching for smoother carousel experience.
 * - Full keyboard navigation support (Arrow keys, Home, End)
 * - Accessibility features (ARIA labels, focus management)
 * - Supports overflow for Netflix-style hover previews.
 */
const AutoSwiper = ({ 
  children, 
  onSlideChange, 
  prefetchImages = true, 
  allowOverflow = false,
  ariaLabel = "Media carousel",
  showNavButtons = true,
}) => {
  const swiperRef = useRef(null);
  const prefetchedImages = useRef(new Set());
  const containerRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);
  const [canGoPrev, setCanGoPrev] = useState(false);
  const [canGoNext, setCanGoNext] = useState(true);

  const prefetchUpcomingImages = useCallback((swiper) => {
    if (!prefetchImages || !swiper) return;

    const slides = swiper.slides || [];
    const activeIndex = swiper.activeIndex || 0;
    const slidesToPrefetch = 3;

    for (let i = 1; i <= slidesToPrefetch; i++) {
      const nextIndex = (activeIndex + i) % slides.length;
      const slide = slides[nextIndex];
      
      if (!slide) continue;

      const images = slide.querySelectorAll("img[data-src], img[src]");
      images.forEach((img) => {
        const src = img.dataset.src || img.src;
        if (src && !prefetchedImages.current.has(src)) {
          const prefetchImg = new Image();
          prefetchImg.src = src;
          prefetchedImages.current.add(src);
        }
      });

      const posterPath = slide.dataset?.posterPath;
      if (posterPath && !prefetchedImages.current.has(posterPath)) {
        const fullUrl = tmdbConfigs.posterPath(posterPath);
        if (fullUrl) {
          const prefetchImg = new Image();
          prefetchImg.src = fullUrl;
          prefetchedImages.current.add(posterPath);
        }
      }
    }
  }, [prefetchImages]);

  const handleSlideChange = useCallback((swiper) => {
    prefetchUpcomingImages(swiper);
    onSlideChange?.(swiper);
    // Update navigation state
    setCanGoPrev(!swiper.isBeginning);
    setCanGoNext(!swiper.isEnd);
  }, [prefetchUpcomingImages, onSlideChange]);

  const handleSwiperInit = useCallback((swiper) => {
    swiperRef.current = swiper;
    setTimeout(() => prefetchUpcomingImages(swiper), 100);
    // Set initial navigation state
    setCanGoPrev(!swiper.isBeginning);
    setCanGoNext(!swiper.isEnd);
  }, [prefetchUpcomingImages]);

  // Custom keyboard navigation handler
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

  useEffect(() => {
    const prefetchedSet = prefetchedImages.current;
    return () => {
      prefetchedSet.clear();
    };
  }, []);

  return (
    <Box
      ref={containerRef}
      role="region"
      aria-label={ariaLabel}
      aria-roledescription="carousel"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      sx={{
        position: "relative",
        marginBottom: allowOverflow ? "-2rem" : 0,
        outline: "none",
        "&:focus-visible": {
          outline: "2px solid",
          outlineColor: "primary.main",
          outlineOffset: 2,
          borderRadius: 1,
        },
        "& .swiper-slide": {
          width: {
            xs: "50%",
            sm: "35%",
            md: "25%",
            lg: "20.5%",
          },
          overflow: allowOverflow ? "visible" : "hidden",
        },
      }}
    >
      {/* Keyboard Navigation Hint (shows on focus) */}
      {isFocused && (
        <Typography
          variant="caption"
          sx={{
            position: "absolute",
            top: -24,
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "rgba(0,0,0,0.8)",
            color: "white",
            px: 1.5,
            py: 0.25,
            borderRadius: 1,
            zIndex: 20,
            whiteSpace: "nowrap",
            fontSize: "0.65rem",
          }}
        >
          ← → Arrow keys to navigate
        </Typography>
      )}

      {/* Accessible Navigation Buttons */}
      {showNavButtons && (
        <>
          <Tooltip title={canGoPrev ? "Previous (←)" : ""} placement="right">
            <span
              style={{
                position: "absolute",
                left: "0",
                top: "40%",
                transform: "translateY(-50%)",
                zIndex: 15,
                display: "inline-flex",
              }}
            >
              <IconButton
                onClick={goToPrev}
                disabled={!canGoPrev}
                aria-label="Go to previous items"
                sx={{
                  backgroundColor: "background.paper",
                  boxShadow: 3,
                  opacity: canGoPrev ? 0.9 : 0.3,
                  transition: "all 0.2s ease",
                  "&:hover": { 
                    opacity: 1, 
                    backgroundColor: "primary.main",
                    color: "primary.contrastText",
                  },
                  display: { xs: "none", md: "flex" },
                }}
              >
                <KeyboardArrowLeftIcon />
              </IconButton>
            </span>
          </Tooltip>

          <Tooltip title={canGoNext ? "Next (→)" : ""} placement="left">
            <span
              style={{
                position: "absolute",
                right: "0",
                top: "40%",
                transform: "translateY(-50%)",
                zIndex: 15,
                display: "inline-flex",
              }}
            >
              <IconButton
                onClick={goToNext}
                disabled={!canGoNext}
                aria-label="Go to next items"
                sx={{
                  backgroundColor: "background.paper",
                  boxShadow: 3,
                  opacity: canGoNext ? 0.9 : 0.3,
                  transition: "all 0.2s ease",
                  "&:hover": { 
                    opacity: 1, 
                    backgroundColor: "primary.main",
                    color: "primary.contrastText",
                  },
                  display: { xs: "none", md: "flex" },
                }}
              >
                <KeyboardArrowRightIcon />
              </IconButton>
            </span>
          </Tooltip>
        </>
      )}

      <Swiper
        slidesPerView="auto"
        grabCursor={true}
        spaceBetween={0}
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
        }}
        modules={[Keyboard, A11y]}
        onSwiper={handleSwiperInit}
        onSlideChange={handleSlideChange}
        onReachBeginning={() => setCanGoPrev(false)}
        onReachEnd={() => setCanGoNext(false)}
        onFromEdge={() => {
          setCanGoPrev(true);
          setCanGoNext(true);
        }}
        style={{
          width: "100%",
          height: "max-content",
          overflow: allowOverflow ? "visible" : "hidden",
          paddingBottom: allowOverflow ? "2rem" : "0",
        }}
      >
        {children}
      </Swiper>
    </Box>
  );
};

export default AutoSwiper;
