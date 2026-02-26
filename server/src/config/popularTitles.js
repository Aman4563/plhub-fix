/**
 * Popular Titles Configuration
 * Maps popular movie/TV show titles to their TMDB IDs
 * This helps avoid unnecessary API calls for well-known titles
 * 
 * NOTE: This list should be periodically updated to include new popular content
 */

// Format: { "lowercase title": { id: number, mediaType: "movie" | "tv" } }
const POPULAR_TITLES = {
  // === POPULAR MOVIES ===
  
  // Classic/Iconic Films
  "inception": { id: 27205, mediaType: "movie" },
  "the dark knight": { id: 155, mediaType: "movie" },
  "interstellar": { id: 157336, mediaType: "movie" },
  "pulp fiction": { id: 680, mediaType: "movie" },
  "the matrix": { id: 603, mediaType: "movie" },
  "fight club": { id: 550, mediaType: "movie" },
  "forrest gump": { id: 13, mediaType: "movie" },
  "the godfather": { id: 238, mediaType: "movie" },
  "the shawshank redemption": { id: 278, mediaType: "movie" },
  
  // Superhero/Marvel/DC
  "avengers endgame": { id: 299536, mediaType: "movie" },
  "avengers: endgame": { id: 299536, mediaType: "movie" },
  "the avengers": { id: 24428, mediaType: "movie" },
  "joker": { id: 475557, mediaType: "movie" },
  "spider-man": { id: 557, mediaType: "movie" },
  "deadpool": { id: 293660, mediaType: "movie" },
  
  // Blockbusters
  "avatar": { id: 19995, mediaType: "movie" },
  "titanic": { id: 597, mediaType: "movie" },
  "parasite": { id: 496243, mediaType: "movie" },
  "the lion king": { id: 8587, mediaType: "movie" },
  "frozen": { id: 109445, mediaType: "movie" },
  "toy story": { id: 862, mediaType: "movie" },
  "finding nemo": { id: 12, mediaType: "movie" },
  "the lord of the rings": { id: 120, mediaType: "movie" },
  "harry potter": { id: 671, mediaType: "movie" },
  "star wars": { id: 11, mediaType: "movie" },
  "jurassic park": { id: 329, mediaType: "movie" },
  
  // Crime/Thriller Classics
  "gladiator": { id: 98, mediaType: "movie" },
  "the departed": { id: 1422, mediaType: "movie" },
  "goodfellas": { id: 769, mediaType: "movie" },
  "se7en": { id: 807, mediaType: "movie" },
  "seven": { id: 807, mediaType: "movie" },
  "whiplash": { id: 244786, mediaType: "movie" },
  "django unchained": { id: 68718, mediaType: "movie" },
  "john wick": { id: 245891, mediaType: "movie" },
  
  // Recent Hits (2023-2024)
  "oppenheimer": { id: 872585, mediaType: "movie" },
  "barbie": { id: 346698, mediaType: "movie" },
  "dune": { id: 438631, mediaType: "movie" },
  "dune part two": { id: 693134, mediaType: "movie" },
  "dune: part two": { id: 693134, mediaType: "movie" },
  
  // Animation
  "zootopia": { id: 269149, mediaType: "movie" },
  "zootopia 2": { id: 1084242, mediaType: "movie" },
  "moana": { id: 277834, mediaType: "movie" },
  "moana 2": { id: 1241674, mediaType: "movie" },
  "inside out": { id: 150540, mediaType: "movie" },
  "inside out 2": { id: 1022789, mediaType: "movie" },
  
  // Other Recent
  "wicked": { id: 402431, mediaType: "movie" },
  "gladiator 2": { id: 558449, mediaType: "movie" },
  "gladiator ii": { id: 558449, mediaType: "movie" },
  "venom": { id: 335983, mediaType: "movie" },
  "sonic the hedgehog": { id: 454626, mediaType: "movie" },
  "sonic the hedgehog 3": { id: 939243, mediaType: "movie" },
  
  // === POPULAR TV SHOWS ===
  
  // Drama Heavyweights
  "stranger things": { id: 66732, mediaType: "tv" },
  "breaking bad": { id: 1396, mediaType: "tv" },
  "game of thrones": { id: 1399, mediaType: "tv" },
  "the sopranos": { id: 1398, mediaType: "tv" },
  "the wire": { id: 1438, mediaType: "tv" },
  "succession": { id: 76331, mediaType: "tv" },
  "ozark": { id: 69740, mediaType: "tv" },
  
  // Comedy
  "the office": { id: 2316, mediaType: "tv" },
  "friends": { id: 1668, mediaType: "tv" },
  "ted lasso": { id: 97546, mediaType: "tv" },
  
  // Streaming Era Hits
  "the walking dead": { id: 1402, mediaType: "tv" },
  "the mandalorian": { id: 82856, mediaType: "tv" },
  "wednesday": { id: 119051, mediaType: "tv" },
  "squid game": { id: 93405, mediaType: "tv" },
  "money heist": { id: 71446, mediaType: "tv" },
  "la casa de papel": { id: 71446, mediaType: "tv" },
  "the witcher": { id: 71912, mediaType: "tv" },
  "peaky blinders": { id: 60574, mediaType: "tv" },
  "the crown": { id: 65494, mediaType: "tv" },
  "house of the dragon": { id: 94997, mediaType: "tv" },
  "the last of us": { id: 100088, mediaType: "tv" },
  "the boys": { id: 76479, mediaType: "tv" },
  "euphoria": { id: 85552, mediaType: "tv" },
  "bridgerton": { id: 91239, mediaType: "tv" },
  "emily in paris": { id: 100757, mediaType: "tv" },
  "cobra kai": { id: 77169, mediaType: "tv" },
  "you": { id: 78191, mediaType: "tv" },
  "suits": { id: 37680, mediaType: "tv" },
  
  // Marvel/Disney+
  "loki": { id: 84958, mediaType: "tv" },
  "wandavision": { id: 85271, mediaType: "tv" },
  
  // Critically Acclaimed
  "better call saul": { id: 60059, mediaType: "tv" },
  "true detective": { id: 46648, mediaType: "tv" },
  "westworld": { id: 63247, mediaType: "tv" },
  "chernobyl": { id: 87108, mediaType: "tv" },
  "dark": { id: 70523, mediaType: "tv" },
  "sherlock": { id: 19885, mediaType: "tv" },
  "black mirror": { id: 42009, mediaType: "tv" },
  
  // Animation/Anime
  "arcane": { id: 94605, mediaType: "tv" },
  "attack on titan": { id: 1429, mediaType: "tv" },
  "one piece": { id: 37854, mediaType: "tv" },
  "naruto": { id: 20, mediaType: "tv" },
  "demon slayer": { id: 85937, mediaType: "tv" },
  "the simpsons": { id: 456, mediaType: "tv" },
  "rick and morty": { id: 60625, mediaType: "tv" },
};

/**
 * Look up a title in the popular titles map
 * @param {string} query - Search query
 * @returns {object|null} - { id, mediaType } or null
 */
export function lookupPopularTitle(query) {
  if (!query) return null;
  const normalized = query.toLowerCase().trim();
  return POPULAR_TITLES[normalized] || null;
}

/**
 * Check if a title exists in popular titles
 * @param {string} query - Search query
 * @returns {boolean}
 */
export function isPopularTitle(query) {
  return lookupPopularTitle(query) !== null;
}

/**
 * Get all popular titles (for debugging/admin)
 * @returns {object} - The full popular titles map
 */
export function getAllPopularTitles() {
  return { ...POPULAR_TITLES };
}

/**
 * Get count of popular titles
 * @returns {object} - Count by media type
 */
export function getPopularTitlesStats() {
  const movies = Object.values(POPULAR_TITLES).filter(t => t.mediaType === "movie").length;
  const tvShows = Object.values(POPULAR_TITLES).filter(t => t.mediaType === "tv").length;
  return { movies, tvShows, total: movies + tvShows };
}

export { POPULAR_TITLES };

export default {
  POPULAR_TITLES,
  lookupPopularTitle,
  isPopularTitle,
  getAllPopularTitles,
  getPopularTitlesStats,
};

