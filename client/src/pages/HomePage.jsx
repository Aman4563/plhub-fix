import React from "react";
import HeroSlide from "../components/common/HeroSlide";
import tmdbConfigs from "../api/configs/tmdb.configs";
import { Box } from "@mui/material";
import uiConfigs from "../configs/ui.configs";
import Container from "../components/common/Container";
import MediaSlide from "../components/common/MediaSlide";

/**
 * HomePage Component
 * - Displays a hero slide and various categorized media slides.
 * - Includes sections for popular movies, popular series, top-rated movies, and top-rated series.
 */
const HomePage = () => {
  return (
    <>
      {/* Hero Slide showcasing popular movies */}
      <HeroSlide
        mediaType={tmdbConfigs.mediaType.movie}
        mediaCategory={tmdbConfigs.mediaCategory.popular}
      />

      {/* Main content section with categorized media slides */}
      <Box marginTop="-4rem" sx={{ ...uiConfigs.style.mainContent }}>
        {/* Section for popular movies */}
        <Container header="Popular Movies">
          <MediaSlide
            mediaType={tmdbConfigs.mediaType.movie}
            mediaCategory={tmdbConfigs.mediaCategory.popular}
          />
        </Container>

        {/* Section for popular series */}
        <Container header="Popular Series">
          <MediaSlide
            mediaType={tmdbConfigs.mediaType.tv}
            mediaCategory={tmdbConfigs.mediaCategory.popular}
          />
        </Container>

        {/* Section for top-rated movies */}
        <Container header="Top Rated Movies">
          <MediaSlide
            mediaType={tmdbConfigs.mediaType.movie}
            mediaCategory={tmdbConfigs.mediaCategory.top_rated}
          />
        </Container>

        {/* Section for top-rated series */}
        <Container header="Top Rated Series">
          <MediaSlide
            mediaType={tmdbConfigs.mediaType.tv}
            mediaCategory={tmdbConfigs.mediaCategory.top_rated}
          />
        </Container>
      </Box>
    </>
  );
};

export default HomePage;
