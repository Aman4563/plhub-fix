import React, { useCallback, useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Box, Chip, Stack, useTheme, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

import HeroSlide from "../components/common/HeroSlide";
import Container from "../components/common/Container";
import MediaSlide from "../components/common/MediaSlide";
import ContinueWatching from "../components/common/ContinueWatching";
import LazySection from "../components/common/LazySection";
import { HeroSkeleton, MediaSliderSkeleton } from "../components/common/MediaSkeleton";

import tmdbConfigs from "../api/configs/tmdb.configs";
import uiConfigs from "../configs/ui.configs";
import { useHomePageData } from "../hooks/useMediaQueries";

const ContinueWatchingSection = () => {
  const [hasHistory, setHasHistory] = useState(false);

  useEffect(() => {
    try {
      const history = localStorage.getItem("plhub_watch_history");
      const parsed = history ? JSON.parse(history) : [];
      setHasHistory(parsed.length > 0);
    } catch {
      setHasHistory(false);
    }
  }, []);

  if (!hasHistory) return null;

  return (
    <Box sx={{ mb: 2 }}>
      <Container header="Continue Watching">
        <ContinueWatching />
      </Container>
    </Box>
  );
};

const HomePage = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  const { 
    data: homeData, 
    isLoading, 
    isError,
    error 
  } = useHomePageData({
    refetchOnWindowFocus: false,
    retry: 2,
  });

  const {
    genres = [],
    popularMovies = [],
    popularTv = [],
    topRatedMovies = [],
    topRatedTv = [],
    nowPlaying = [],
    upcoming = [],
    trending = [],
  } = homeData || {};

  const handleGenreClick = useCallback((genreId) => {
    navigate(`/movie?genre=${genreId}`);
  }, [navigate]);

  const heroMovies = popularMovies.filter(
    (movie) => movie.backdrop_path || movie.poster_path
  );

  return (
    <>
      <Helmet>
        <title>PLhub - Discover Movies & TV Shows | Streaming Guide</title>
        <meta 
          name="description" 
          content="Discover popular movies, trending TV shows, and top-rated content. Find where to watch your favorite movies and shows with PLhub - your ultimate streaming guide." 
        />
        <meta 
          name="keywords" 
          content="movies, TV shows, streaming, watch online, popular movies, trending series, top rated, PLhub" 
        />
        <meta property="og:title" content="PLhub - Discover Movies & TV Shows" />
        <meta 
          property="og:description" 
          content="Your ultimate streaming guide to discover and watch movies and TV shows." 
        />
        <meta property="og:type" content="website" />
        <link rel="canonical" href={window.location.origin} />
      </Helmet>

      {isLoading ? (
        <HeroSkeleton />
      ) : (
      <HeroSlide
          movies={heroMovies}
          genres={genres}
        mediaType={tmdbConfigs.mediaType.movie}
      />
      )}

      <Box marginTop="-4rem" sx={{ ...uiConfigs.style.mainContent }}>
        {genres.length > 0 && (
          <Box
            sx={{
              mb: 4,
              mt: 6,
              px: { xs: 2, md: 0 },
              overflowX: "auto",
              "&::-webkit-scrollbar": { display: "none" },
              scrollbarWidth: "none",
            }}
          >
            <Stack
              direction="row"
              spacing={1}
              sx={{
                pb: 1,
                minWidth: "max-content",
              }}
            >
              {genres.slice(0, 12).map((genre) => (
                <Chip
                  key={genre.id}
                  label={genre.name}
                  onClick={() => handleGenreClick(genre.id)}
                  variant="outlined"
                  sx={{
                    cursor: "pointer",
                    borderColor: theme.palette.divider,
                    color: theme.palette.text.secondary,
                    transition: "all 0.2s ease",
                    "&:hover": {
                      borderColor: theme.palette.primary.main,
                      color: theme.palette.primary.main,
                      backgroundColor: theme.palette.action.hover,
                      transform: "translateY(-2px)",
                    },
                  }}
                />
              ))}
            </Stack>
          </Box>
        )}

        <ContinueWatchingSection />

        <Container header="Trending This Week" viewAllPath="/movie">
          {isLoading ? (
            <MediaSliderSkeleton count={6} />
          ) : (
            <MediaSlide
              medias={trending}
              mediaType="movie"
              genres={genres}
            />
          )}
        </Container>

        <Container header="Now Playing in Theaters" viewAllPath="/movie">
          {isLoading ? (
            <MediaSliderSkeleton count={6} />
          ) : (
            <MediaSlide
              medias={nowPlaying}
              mediaType={tmdbConfigs.mediaType.movie}
              genres={genres}
            />
          )}
        </Container>

        <Container header="Popular Movies" viewAllPath="/movie">
          {isLoading ? (
            <MediaSliderSkeleton count={6} />
          ) : (
            <MediaSlide
              medias={popularMovies}
              mediaType={tmdbConfigs.mediaType.movie}
              genres={genres}
            />
          )}
        </Container>

        <Container header="Coming Soon" viewAllPath="/movie">
          {isLoading ? (
            <MediaSliderSkeleton count={6} />
          ) : (
          <MediaSlide
              medias={upcoming}
            mediaType={tmdbConfigs.mediaType.movie}
              genres={genres}
          />
          )}
        </Container>

        <Container header="Popular Series" viewAllPath="/tv">
          <LazySection>
            {isLoading ? (
              <MediaSliderSkeleton count={6} />
            ) : (
          <MediaSlide
                medias={popularTv}
            mediaType={tmdbConfigs.mediaType.tv}
                genres={genres}
          />
            )}
          </LazySection>
        </Container>

        <Container header="Top Rated Movies" viewAllPath="/movie">
          <LazySection>
            {isLoading ? (
              <MediaSliderSkeleton count={6} />
            ) : (
          <MediaSlide
                medias={topRatedMovies}
            mediaType={tmdbConfigs.mediaType.movie}
                genres={genres}
          />
            )}
          </LazySection>
        </Container>

        <Container header="Top Rated Series" viewAllPath="/tv">
          <LazySection>
            {isLoading ? (
              <MediaSliderSkeleton count={6} />
            ) : (
          <MediaSlide
                medias={topRatedTv}
            mediaType={tmdbConfigs.mediaType.tv}
                genres={genres}
          />
            )}
          </LazySection>
        </Container>

        {isError && (
          <Box 
            sx={{ 
              textAlign: "center", 
              py: 4,
              color: "text.secondary",
            }}
          >
            <Typography variant="body1">
              {error?.message || "Failed to load content. Please try again later."}
            </Typography>
          </Box>
        )}
      </Box>
    </>
  );
};

export default HomePage;
