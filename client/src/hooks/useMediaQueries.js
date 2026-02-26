import { useQuery, useQueryClient } from "@tanstack/react-query";
import mediaApi from '../api/modules/media.api';

import genreApi from '../api/modules/genre.api';

/**
 * Query keys for caching
 */
export const mediaQueryKeys = {
  all: ['media'],
  list: (mediaType, mediaCategory, page) => ['media', 'list', mediaType, mediaCategory, page],
  search: (mediaType, query, page) => ['media', 'search', mediaType, query, page],
  multiSearch: (query, page) => ['media', 'multi-search', query, page],
  filter: (mediaType, params) => ['media', 'filter', mediaType, params],
  detail: (mediaType, mediaId) => ['media', 'detail', mediaType, mediaId],
  genres: (mediaType) => ['media', 'genres', mediaType],
  certifications: (mediaType) => ['media', 'certifications', mediaType],
  watchProviders: (mediaType) => ['media', 'watchProviders', mediaType],
  trending: (mediaType, timeWindow) => ['media', 'trending', mediaType, timeWindow],
  personCredits: (personId) => ['person', 'credits', personId],
  homeData: () => ['home', 'data'],
};

/**
 * Hook for searching media with caching
 */
export const useSearchMedia = (mediaType, query, page, options = {}) => {
  return useQuery({
    queryKey: mediaQueryKeys.search(mediaType, query, page),
    queryFn: async () => {
      const { response, err } = await mediaApi.search({ mediaType, query, page });
      if (err) throw new Error(err.message || 'Search failed');
      return response;
    },
    enabled: !!query && query.trim().length >= 2,
    ...options,
  });
};

/**
 * Hook for multi-search (movies, TV, people)
 */
export const useMultiSearch = (query, page, options = {}) => {
  return useQuery({
    queryKey: mediaQueryKeys.multiSearch(query, page),
    queryFn: async () => {
      const { response, err } = await mediaApi.multiSearch({ query, page });
      if (err) throw new Error(err.message || 'Multi-search failed');
      return response;
    },
    enabled: !!query && query.trim().length >= 2,
    ...options,
  });
};

/**
 * Hook for filtering media with caching
 */
export const useFilterMedia = (mediaType, params, options = {}) => {
  return useQuery({
    queryKey: mediaQueryKeys.filter(mediaType, params),
    queryFn: async () => {
      const { response, err } = await mediaApi.filterMedia({ mediaType, params });
      if (err) throw new Error(err.message || 'Filter failed');
      return response;
    },
    enabled: options.enabled !== false,
    ...options,
  });
};

/**
 * Hook for fetching media detail with caching
 */
export const useMediaDetail = (mediaType, mediaId, options = {}) => {
  return useQuery({
    queryKey: mediaQueryKeys.detail(mediaType, mediaId),
    queryFn: async () => {
      const { response, err } = await mediaApi.getDetail({ mediaType, mediaId });
      if (err) throw new Error(err.message || 'Failed to fetch details');
      return response;
    },
    enabled: !!mediaType && !!mediaId,
    ...options,
  });
};

/**
 * Hook for fetching genres with caching
 */
export const useGenres = (mediaType, options = {}) => {
  return useQuery({
    queryKey: mediaQueryKeys.genres(mediaType),
    queryFn: async () => {
      const { response, err } = await mediaApi.getGenres({ mediaType });
      if (err) throw new Error(err.message || 'Failed to fetch genres');
      return response;
    },
    enabled: !!mediaType,
    staleTime: 24 * 60 * 60 * 1000,
    ...options,
  });
};

/**
 * Hook for fetching watch providers list
 */
export const useWatchProviders = (mediaType, options = {}) => {
  return useQuery({
    queryKey: mediaQueryKeys.watchProviders(mediaType),
    queryFn: async () => {
      const { response, err } = await mediaApi.getWatchProvidersList(mediaType);
      if (err) throw new Error(err.message || 'Failed to fetch watch providers');
      return response;
    },
    enabled: !!mediaType,
    staleTime: 24 * 60 * 60 * 1000,
    ...options,
  });
};

/**
 * Hook for fetching trending media
 */
export const useTrending = (mediaType, timeWindow = 'week', options = {}) => {
  return useQuery({
    queryKey: mediaQueryKeys.trending(mediaType, timeWindow),
    queryFn: async () => {
      const { response, err } = await mediaApi.getTrending({ mediaType, timeWindow });
      if (err) throw new Error(err.message || 'Failed to fetch trending');
      return response;
    },
    enabled: !!mediaType,
    ...options,
  });
};

/**
 * Hook for fetching person credits (for search by cast/crew)
 */
export const usePersonCredits = (personId, options = {}) => {
  return useQuery({
    queryKey: mediaQueryKeys.personCredits(personId),
    queryFn: async () => {
      const { response, err } = await mediaApi.getPersonCredits(personId);
      if (err) throw new Error(err.message || 'Failed to fetch person credits');
      return response;
    },
    enabled: !!personId,
    ...options,
  });
};

/**
 * Hook for fetching media list by category (popular, top_rated, now_playing, upcoming)
 */
export const useMediaList = (mediaType, mediaCategory, page = 1, options = {}) => {
  return useQuery({
    queryKey: mediaQueryKeys.list(mediaType, mediaCategory, page),
    queryFn: async () => {
      const { response, err } = await mediaApi.getList({ mediaType, mediaCategory, page });
      if (err) throw new Error(err.message || 'Failed to fetch media list');
      return response;
    },
    enabled: !!mediaType && !!mediaCategory,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

/**
 * Hook for fetching all home page data at once with caching
 */
export const useHomePageData = (options = {}) => {
  return useQuery({
    queryKey: mediaQueryKeys.homeData(),
    queryFn: async () => {
      const [
        genresResponse,
        popularMoviesResponse,
        popularTvResponse,
        topRatedMoviesResponse,
        topRatedTvResponse,
        nowPlayingResponse,
        upcomingResponse,
        trendingResponse,
      ] = await Promise.all([
        genreApi.getList({ mediaType: 'movie' }),
        mediaApi.getList({ mediaType: 'movie', mediaCategory: 'popular', page: 1 }),
        mediaApi.getList({ mediaType: 'tv', mediaCategory: 'popular', page: 1 }),
        mediaApi.getList({ mediaType: 'movie', mediaCategory: 'top_rated', page: 1 }),
        mediaApi.getList({ mediaType: 'tv', mediaCategory: 'top_rated', page: 1 }),
        mediaApi.getList({ mediaType: 'movie', mediaCategory: 'now_playing', page: 1 }),
        mediaApi.getList({ mediaType: 'movie', mediaCategory: 'upcoming', page: 1 }),
        mediaApi.getTrending({ mediaType: 'all', timeWindow: 'week' }),
      ]);

      return {
        genres: genresResponse.response?.genres || [],
        popularMovies: popularMoviesResponse.response?.results || [],
        popularTv: popularTvResponse.response?.results || [],
        topRatedMovies: topRatedMoviesResponse.response?.results || [],
        topRatedTv: topRatedTvResponse.response?.results || [],
        nowPlaying: nowPlayingResponse.response?.results || [],
        upcoming: upcomingResponse.response?.results || [],
        trending: trendingResponse.response?.results || [],
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
    ...options,
  });
};

/**
 * Hook for invalidating search cache
 */
export const useInvalidateSearchCache = () => {
  const queryClient = useQueryClient();
  
  return {
    invalidateSearch: () => queryClient.invalidateQueries({ queryKey: ['media', 'search'] }),
    invalidateFilter: () => queryClient.invalidateQueries({ queryKey: ['media', 'filter'] }),
    invalidateHome: () => queryClient.invalidateQueries({ queryKey: ['home'] }),
    invalidateAll: () => queryClient.invalidateQueries({ queryKey: mediaQueryKeys.all }),
  };
};

