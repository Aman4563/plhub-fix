/**
 * TypeScript Type Definitions for API Responses
 * These types can be used alongside JavaScript for better IDE support
 */

// Media Types
export type MediaType = "movie" | "tv" | "person" | "people";

// Base Media Item
export interface MediaItem {
  id: number;
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  overview?: string;
  poster_path?: string;
  backdrop_path?: string;
  profile_path?: string;
  vote_average?: number;
  vote_count?: number;
  popularity?: number;
  release_date?: string;
  first_air_date?: string;
  genre_ids?: number[];
  media_type?: MediaType;
  adult?: boolean;
  original_language?: string;
}

// Movie-specific
export interface Movie extends MediaItem {
  title: string;
  release_date?: string;
  runtime?: number;
  budget?: number;
  revenue?: number;
  tagline?: string;
  status?: string;
  imdb_id?: string;
}

// TV Show-specific
export interface TVShow extends MediaItem {
  name: string;
  first_air_date?: string;
  last_air_date?: string;
  number_of_seasons?: number;
  number_of_episodes?: number;
  episode_run_time?: number[];
  status?: string;
  in_production?: boolean;
  networks?: Network[];
}

// Person
export interface Person {
  id: number;
  name: string;
  profile_path?: string;
  known_for_department?: string;
  popularity?: number;
  biography?: string;
  birthday?: string;
  deathday?: string;
  place_of_birth?: string;
  known_for?: MediaItem[];
}

// Genre
export interface Genre {
  id: number;
  name: string;
}

// Certification
export interface Certification {
  certification: string;
  meaning: string;
  order: number;
}

// Watch Provider
export interface WatchProvider {
  id: number;
  name: string;
  logo: string;
  priority?: number;
}

// Network (for TV)
export interface Network {
  id: number;
  name: string;
  logo_path?: string;
  origin_country?: string;
}

// Paginated Response
export interface PaginatedResponse<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

// Search Results
export type SearchResponse = PaginatedResponse<MediaItem>;

// Multi-Search Results
export interface MultiSearchResult extends MediaItem {
  media_type: MediaType;
}
export type MultiSearchResponse = PaginatedResponse<MultiSearchResult>;

// Filter Parameters
export interface FilterParams {
  genre?: string;
  language?: string;
  sortBy?: string;
  certification?: string;
  score?: number;
  maxScore?: number;
  minRuntime?: number;
  maxRuntime?: number;
  keywords?: string;
  voteCountMin?: number;
  watchProviders?: string;
  watchRegion?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
}

// Credits
export interface CastMember {
  id: number;
  name: string;
  character?: string;
  profile_path?: string;
  order?: number;
  known_for_department?: string;
}

export interface CrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path?: string;
}

export interface Credits {
  cast: CastMember[];
  crew: CrewMember[];
}

// Person Credits
export interface PersonCredits {
  cast: MediaItem[];
  crew: MediaItem[];
}

// Collection
export interface Collection {
  id: string;
  user: string;
  name: string;
  description?: string;
  isPublic: boolean;
  coverImage?: string;
  items: CollectionItem[];
  savedFilters?: FilterParams;
  createdAt: string;
  updatedAt: string;
}

export interface CollectionItem {
  mediaId: string;
  mediaType: "movie" | "tv";
  mediaTitle: string;
  mediaPoster?: string;
  mediaRate?: number;
  addedAt: string;
}

// User Favorite
export interface Favorite {
  id: string;
  mediaId: string;
  mediaType: "movie" | "tv";
  mediaTitle: string;
  mediaPoster: string;
  mediaRate: number;
}

// Watchlist Item
export interface WatchlistItem {
  id: string;
  mediaId: string;
  mediaType: "movie" | "tv";
  mediaTitle: string;
  mediaPoster: string;
  mediaBackdrop?: string;
  mediaRate?: number;
  status: "want_to_watch" | "watching" | "completed" | "on_hold" | "dropped";
  currentSeason?: number;
  currentEpisode?: number;
  notes?: string;
  priority?: number;
  reminderDate?: string;
}

// API Response Wrapper
export interface ApiResponse<T> {
  response?: T;
  err?: {
    message: string;
    status?: number;
  };
}

// Video
export interface Video {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
  official: boolean;
}

// Review
export interface Review {
  id: string;
  user: {
    displayName?: string;
    username?: string;
  };
  content: string;
  rating?: number;
  createdAt: string;
}

// Media Detail Response (combined)
export interface MediaDetailResponse extends MediaItem {
  credits?: Credits;
  videos?: { results: Video[] };
  images?: {
    backdrops: { file_path: string }[];
    posters: { file_path: string }[];
  };
  recommend?: MediaItem[];
  similar?: MediaItem[];
  watchProviders?: Record<string, {
    flatrate?: WatchProvider[];
    rent?: WatchProvider[];
    buy?: WatchProvider[];
  }>;
  reviews?: Review[];
  genres?: Genre[];
  isFavorite?: boolean;
  inWatchlist?: boolean;
  watchlistStatus?: string;
  watchlistId?: string;
  userRating?: number;
  userReviewId?: string;
  userRatingStats?: {
    averageRating?: number;
    totalRatings: number;
  };
}

