// src/features/appStateSlice.js

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import mediaApi from "../../api/modules/media.api";

/**
 * Async thunk to fetch genres based on media type.
 * - Caches genres in state to avoid redundant API calls.
 *
 * @param {string} mediaType - The type of media (e.g., "movie", "tv").
 * @returns {Object} - Contains the mediaType and the fetched genres.
 */
export const fetchGenres = createAsyncThunk(
  "appState/fetchGenres",
  async (mediaType, { getState }) => {
    const { genres } = getState().appState;

    // Return cached genres if available for the given mediaType
    if (genres[mediaType]) return genres[mediaType];

    // Fetch genres from the API
    const response = await mediaApi.getGenres(mediaType);
    return { mediaType, genres: response.response.genres };
  }
);

/**
 * Async thunk to fetch certifications.
 * - Caches certifications in state to avoid redundant API calls.
 *
 * @returns {Array} - List of certifications (defaulting to US certifications if available).
 */
export const fetchCertifications = createAsyncThunk(
  "appState/fetchCertifications",
  async (_, { getState }) => {
    const { certifications } = getState().appState;

    // Return cached certifications if already fetched
    if (certifications) return certifications;

    // Fetch certifications from the API
    const response = await mediaApi.getCertifications();
    return response.response.certifications.US || [];
  }
);

/**
 * Redux slice for managing application state.
 * - Handles genres, certifications, and general app state messages.
 */
const appStateSlice = createSlice({
  name: "appState",
  initialState: {
    appState: "", // Current application state (e.g., loading, success, error)
    genres: {}, // Stores genres by media type (e.g., { movie: [], tv: [] })
    certifications: null, // Cached certifications
    appStateMessage: "", // Message describing the current state
  },
  reducers: {
    /**
     * Sets a custom application state message.
     *
     * @param {Object} state - Current state.
     * @param {Object} action - Redux action containing the new message.
     */
    setAppState(state, action) {
      state.appStateMessage = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      /**
       * Handles successful genre fetching.
       * - Updates the genres for the specified media type.
       */
      .addCase(fetchGenres.fulfilled, (state, action) => {
        const { mediaType, genres } = action.payload;
        state.genres[mediaType] = genres;
      })
      /**
       * Handles successful certification fetching.
       * - Updates the certifications in the state.
       */
      .addCase(fetchCertifications.fulfilled, (state, action) => {
        state.certifications = action.payload;
      });
  },
});

// Export actions for dispatching
export const { setAppState } = appStateSlice.actions;

// Export the reducer for integration in the store
export default appStateSlice.reducer;
