import { useState, useEffect, useRef, memo } from "react";
import { Box } from "@mui/material";
import { MediaSliderSkeleton } from "./MediaSkeleton";

/**
 * LazySection Component
 * - Uses Intersection Observer to lazy-load content when it comes into view.
 * - Improves initial page load performance by deferring off-screen content.
 * - Shows skeleton placeholder until content is loaded.
 */
const LazySection = memo(({ 
  children, 
  threshold = 0.1, 
  rootMargin = "100px",
  skeletonCount = 6,
  minHeight = 300,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const currentRef = sectionRef.current;
    
    if (!currentRef) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          setHasLoaded(true);
          observer.disconnect();
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(currentRef);

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
      observer.disconnect();
    };
  }, [threshold, rootMargin]);

  return (
    <Box 
      ref={sectionRef} 
      sx={{ 
        minHeight: hasLoaded ? "auto" : minHeight,
        transition: "min-height 0.3s ease",
      }}
    >
      {isVisible ? children : <MediaSliderSkeleton count={skeletonCount} />}
    </Box>
  );
});

LazySection.displayName = "LazySection";

export default LazySection;

