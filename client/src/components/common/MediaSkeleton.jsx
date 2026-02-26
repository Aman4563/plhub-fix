/**
 * Media Skeleton Component
 * Displays loading placeholders for media items with enhanced shimmer animations
 */

import { Box, Skeleton, Stack, Grid, keyframes } from "@mui/material";

// Enhanced shimmer animation
const shimmer = keyframes`
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
`;

// Common shimmer styles
const shimmerStyles = {
  background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%)",
  backgroundSize: "200% 100%",
  animation: `${shimmer} 1.5s infinite`,
};

/**
 * Single media card skeleton with shimmer effect
 */
export const MediaCardSkeleton = () => (
  <Box sx={{ width: "100%", position: "relative" }}>
    <Skeleton
      variant="rectangular"
      sx={{
        paddingTop: "160%",
        borderRadius: "0.5rem",
        "&::after": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          ...shimmerStyles,
        },
      }}
      animation="wave"
    />
    <Box sx={{ pt: 1.5 }}>
      <Skeleton animation="wave" height={18} width="70%" sx={{ mb: 0.5 }} />
      <Skeleton animation="wave" height={14} width="40%" />
    </Box>
  </Box>
);

/**
 * Grid of media card skeletons
 */
export const MediaGridSkeleton = ({ count = 8 }) => (
  <Grid container spacing={2}>
    {[...Array(count)].map((_, index) => (
      <Grid item xs={6} sm={4} md={3} lg={2} key={`grid-skeleton-${index}`}>
        <MediaCardSkeleton />
      </Grid>
    ))}
  </Grid>
);

/**
 * Horizontal slider skeleton with improved spacing
 */
export const MediaSliderSkeleton = ({ count = 6 }) => (
  <Stack 
    direction="row" 
    spacing={2} 
    sx={{ 
      overflowX: "hidden",
      px: { xs: 2, md: 0 },
    }}
  >
    {[...Array(count)].map((_, index) => (
      <Box 
        key={`slider-skeleton-${index}`} 
        sx={{ 
          minWidth: { xs: "45%", sm: "30%", md: "20%", lg: "15%" },
          flexShrink: 0,
        }}
      >
        <MediaCardSkeleton />
      </Box>
    ))}
  </Stack>
);

/**
 * Hero section skeleton with improved layout
 */
export const HeroSkeleton = () => (
  <Box
    sx={{
      position: "relative",
      width: "100%",
      paddingTop: { xs: "130%", sm: "80%", md: "60%", lg: "45%" },
      overflow: "hidden",
    }}
  >
    <Skeleton
      variant="rectangular"
      sx={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        "&::after": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          ...shimmerStyles,
        },
      }}
      animation="wave"
    />
    
    {/* Content placeholder */}
    <Box
      sx={{
        position: "absolute",
        bottom: { xs: "15%", md: "20%" },
        left: { xs: "5%", md: "10%" },
        width: { xs: "90%", md: "40%", lg: "35%" },
        zIndex: 5,
      }}
    >
      {/* Title skeleton */}
      <Skeleton 
        animation="wave" 
        width="85%" 
        sx={{ height: { xs: 40, md: 60 }, mb: 1 }} 
      />
      <Skeleton 
        animation="wave" 
        width="60%" 
        sx={{ height: { xs: 40, md: 60 }, mb: 3 }} 
      />
      
      {/* Rating and genres */}
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
        <Skeleton 
          variant="circular" 
          width={50} 
          height={50} 
        />
        <Skeleton 
          variant="rounded" 
          width={70} 
          height={28} 
          sx={{ borderRadius: 1 }} 
        />
        <Skeleton 
          variant="rounded" 
          width={80} 
          height={28} 
          sx={{ borderRadius: 1 }} 
        />
      </Stack>
      
      {/* Overview */}
      <Skeleton animation="wave" height={18} sx={{ mb: 0.8 }} />
      <Skeleton animation="wave" height={18} sx={{ mb: 0.8 }} />
      <Skeleton animation="wave" height={18} width="75%" sx={{ mb: 3 }} />
      
      {/* Button */}
      <Skeleton 
        variant="rectangular" 
        width={160} 
        height={48} 
        sx={{ borderRadius: 1 }} 
      />
    </Box>

    {/* Slide indicators */}
    <Stack
      direction="row"
      spacing={1}
      sx={{
        position: "absolute",
        bottom: { xs: 40, md: 60 },
        right: { xs: 20, md: 60 },
        zIndex: 5,
      }}
    >
      {[...Array(5)].map((_, i) => (
        <Skeleton 
          key={`indicator-skeleton-${i}`}
          variant="rounded" 
          width={i === 0 ? 24 : 8} 
          height={8} 
          sx={{ borderRadius: 4 }} 
        />
      ))}
    </Stack>
  </Box>
);

/**
 * Media detail skeleton
 */
export const MediaDetailSkeleton = () => (
  <Box>
    {/* Backdrop */}
    <Skeleton
      variant="rectangular"
      sx={{
        width: "100%",
        height: { xs: "50vh", md: "70vh" },
        "&::after": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          ...shimmerStyles,
        },
      }}
      animation="wave"
    />
    
    {/* Content */}
    <Box sx={{ px: { xs: 2, md: 4 }, py: 4, mt: { xs: "-5rem", md: "-10rem" } }}>
      <Stack direction={{ xs: "column", md: "row" }} spacing={4}>
        {/* Poster */}
        <Box sx={{ width: { xs: "60%", md: "25%" }, mx: { xs: "auto", md: 0 } }}>
          <Skeleton
            variant="rectangular"
            sx={{ paddingTop: "150%", borderRadius: 2 }}
            animation="wave"
          />
        </Box>
        
        {/* Info */}
        <Box sx={{ flex: 1 }}>
          <Skeleton animation="wave" height={50} width="70%" sx={{ mb: 2 }} />
          <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
            <Skeleton variant="circular" width={60} height={60} />
            <Skeleton animation="wave" height={30} width={100} />
            <Skeleton animation="wave" height={30} width={100} />
          </Stack>
          <Skeleton animation="wave" height={20} sx={{ mb: 1 }} />
          <Skeleton animation="wave" height={20} sx={{ mb: 1 }} />
          <Skeleton animation="wave" height={20} width="80%" sx={{ mb: 3 }} />
          <Stack direction="row" spacing={2}>
            <Skeleton variant="rectangular" width={180} height={45} sx={{ borderRadius: 1 }} />
            <Skeleton variant="rectangular" width={150} height={45} sx={{ borderRadius: 1 }} />
          </Stack>
        </Box>
      </Stack>
    </Box>
  </Box>
);

/**
 * Cast slider skeleton
 */
export const CastSliderSkeleton = ({ count = 8 }) => (
  <Stack direction="row" spacing={2} sx={{ overflowX: "hidden" }}>
    {[...Array(count)].map((_, index) => (
      <Box key={`cast-skeleton-${index}`} sx={{ minWidth: 120, textAlign: "center" }}>
        <Skeleton
          variant="circular"
          width={100}
          height={100}
          sx={{ mx: "auto", mb: 1 }}
          animation="wave"
        />
        <Skeleton animation="wave" height={16} width="80%" sx={{ mx: "auto" }} />
        <Skeleton animation="wave" height={14} width="60%" sx={{ mx: "auto" }} />
      </Box>
    ))}
  </Stack>
);

/**
 * Review skeleton
 */
export const ReviewSkeleton = () => (
  <Box sx={{ mb: 3 }}>
    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
      <Skeleton variant="circular" width={50} height={50} />
      <Box sx={{ flex: 1 }}>
        <Skeleton animation="wave" height={20} width="30%" />
        <Skeleton animation="wave" height={16} width="20%" />
      </Box>
    </Stack>
    <Skeleton animation="wave" height={16} sx={{ mb: 0.5 }} />
    <Skeleton animation="wave" height={16} sx={{ mb: 0.5 }} />
    <Skeleton animation="wave" height={16} width="70%" />
  </Box>
);

const MediaSkeletons = {
  MediaCardSkeleton,
  MediaGridSkeleton,
  MediaSliderSkeleton,
  HeroSkeleton,
  MediaDetailSkeleton,
  CastSliderSkeleton,
  ReviewSkeleton,
};

export default MediaSkeletons;
