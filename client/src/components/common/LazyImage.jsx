/**
 * Lazy Image Component
 * Optimized image loading with placeholder and fade-in animation
 */

import { useState, useRef, useEffect } from "react";
import { Box, Skeleton } from "@mui/material";
import BrokenImageIcon from "@mui/icons-material/BrokenImage";

const LazyImage = ({
  src,
  alt,
  aspectRatio = "150%", // Default poster aspect ratio
  borderRadius = "0.5rem",
  objectFit = "cover",
  objectPosition = "center",
  fallbackSrc = null,
  onLoad,
  onError,
  sx = {},
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: "100px", // Start loading 100px before entering viewport
        threshold: 0,
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleLoad = () => {
    setIsLoaded(true);
    setHasError(false);
    if (onLoad) onLoad();
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(true);
    if (onError) onError();
  };

  // Generate optimized image URL with size variants
  const getOptimizedSrc = (originalSrc) => {
    if (!originalSrc) return null;
    
    // TMDB image optimization
    if (originalSrc.includes("image.tmdb.org")) {
      // Use smaller image for thumbnails
      return originalSrc.replace("/original/", "/w500/");
    }
    
    return originalSrc;
  };

  const optimizedSrc = getOptimizedSrc(src);

  return (
    <Box
      ref={imgRef}
      sx={{
        position: "relative",
        paddingTop: aspectRatio,
        overflow: "hidden",
        borderRadius,
        backgroundColor: "background.paper",
        ...sx,
      }}
      {...props}
    >
      {/* Skeleton placeholder */}
      {!isLoaded && (
        <Skeleton
          variant="rectangular"
          animation="wave"
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
          }}
        />
      )}

      {/* Error state */}
      {hasError && !fallbackSrc && (
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "action.hover",
          }}
        >
          <BrokenImageIcon sx={{ fontSize: 48, color: "text.disabled" }} />
        </Box>
      )}

      {/* Actual image */}
      {isInView && !hasError && (
        <Box
          component="img"
          src={optimizedSrc}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit,
            objectPosition,
            opacity: isLoaded ? 1 : 0,
            transition: "opacity 0.3s ease-in-out",
          }}
          loading="lazy"
          decoding="async"
        />
      )}

      {/* Fallback image on error */}
      {hasError && fallbackSrc && (
        <Box
          component="img"
          src={fallbackSrc}
          alt={alt}
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit,
            objectPosition,
          }}
        />
      )}
    </Box>
  );
};

/**
 * Backdrop Image with gradient overlay
 */
export const BackdropImage = ({
  src,
  alt,
  gradientDirection = "to top",
  children,
  sx = {},
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        ...sx,
      }}
      {...props}
    >
      <LazyImage
        src={src}
        alt={alt}
        aspectRatio="56.25%" // 16:9 aspect ratio
        borderRadius={0}
        onLoad={() => setIsLoaded(true)}
      />
      
      {/* Gradient overlay */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: `linear-gradient(${gradientDirection}, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0) 100%)`,
          opacity: isLoaded ? 1 : 0,
          transition: "opacity 0.5s ease-in-out",
        }}
      />
      
      {children}
    </Box>
  );
};

/**
 * Avatar Image with loading state
 */
export const AvatarImage = ({
  src,
  alt,
  size = 100,
  sx = {},
  ...props
}) => {
  return (
    <LazyImage
      src={src}
      alt={alt}
      aspectRatio="100%"
      borderRadius="50%"
      sx={{
        width: size,
        height: size,
        ...sx,
      }}
      {...props}
    />
  );
};

export default LazyImage;

