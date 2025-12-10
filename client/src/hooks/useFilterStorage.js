import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'plhub_filter_settings';

const DEFAULT_FILTERS = {
  genre: [],
  language: '',
  year: '',
  minScore: 0,
  maxScore: 10,
  sortBy: 'popularity.desc',
  certification: '',
  minRuntime: 0,
  maxRuntime: 400,
  watchProviders: [],
  keywords: '',
};

/**
 * Custom hook for persisting filter settings in localStorage
 */
const useFilterStorage = () => {
  const [savedFilters, setSavedFilters] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setSavedFilters(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse saved filters:', e);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  const saveFilters = useCallback((filters, mediaType) => {
    const data = { filters, mediaType, timestamp: Date.now() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setSavedFilters(data);
  }, []);

  const loadFilters = useCallback(() => {
    return savedFilters;
  }, [savedFilters]);

  const clearSavedFilters = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setSavedFilters(null);
  }, []);

  const hasStoredFilters = Boolean(savedFilters);

  return {
    savedFilters,
    saveFilters,
    loadFilters,
    clearSavedFilters,
    hasStoredFilters,
    DEFAULT_FILTERS,
  };
};

export default useFilterStorage;

