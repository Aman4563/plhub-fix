import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'plhub_search_history';
const MAX_HISTORY_ITEMS = 10;

/**
 * Custom hook for managing search history with localStorage
 */
const useSearchHistory = () => {
  const [searchHistory, setSearchHistory] = useState([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setSearchHistory(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse search history:', e);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  const addToHistory = useCallback((query, mediaType) => {
    if (!query || query.trim().length === 0) return;

    const newItem = {
      query: query.trim(),
      mediaType,
      timestamp: Date.now(),
    };

    setSearchHistory((prev) => {
      const filtered = prev.filter(
        (item) => item.query.toLowerCase() !== newItem.query.toLowerCase()
      );
      const updated = [newItem, ...filtered].slice(0, MAX_HISTORY_ITEMS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const removeFromHistory = useCallback((query) => {
    setSearchHistory((prev) => {
      const updated = prev.filter(
        (item) => item.query.toLowerCase() !== query.toLowerCase()
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setSearchHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    searchHistory,
    addToHistory,
    removeFromHistory,
    clearHistory,
  };
};

export default useSearchHistory;

