/**
 * Watchlist Redux Slice
 * Manages user's watchlist state
 */

import { createSlice } from "@reduxjs/toolkit";

export const watchlistSlice = createSlice({
  name: "watchlist",
  initialState: {
    items: [],
    stats: null,
    loading: false,
    error: null,
  },
  reducers: {
    setWatchlist: (state, action) => {
      state.items = action.payload;
      state.loading = false;
      state.error = null;
    },
    setWatchlistStats: (state, action) => {
      state.stats = action.payload;
    },
    addToWatchlist: (state, action) => {
      state.items = [action.payload, ...state.items];
    },
    removeFromWatchlist: (state, action) => {
      const { mediaId } = action.payload;
      state.items = state.items.filter(
        (item) => {
          const itemMediaId = item.mediaId?.toString();
          const targetMediaId = mediaId?.toString();
          return itemMediaId !== targetMediaId;
        }
      );
    },
    updateWatchlistItem: (state, action) => {
      const { id, ...updates } = action.payload;
      // Find by id or _id
      const index = state.items.findIndex((item) => {
        const itemId = item.id || item._id;
        return itemId?.toString() === id?.toString();
      });
      if (index !== -1) {
        state.items[index] = { ...state.items[index], ...updates };
      }
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    clearWatchlist: (state) => {
      state.items = [];
      state.stats = null;
      state.loading = false;
      state.error = null;
    },
  },
});

export const {
  setWatchlist,
  setWatchlistStats,
  addToWatchlist,
  removeFromWatchlist,
  updateWatchlistItem,
  setLoading,
  setError,
  clearWatchlist,
} = watchlistSlice.actions;

export default watchlistSlice.reducer;
