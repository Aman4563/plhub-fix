import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import mediaApi from "../../api/modules/media.api";

/**
 * Async thunk to fetch genres based on media type.
 * Caches genres in state to avoid redundant API calls.
 */
export const fetchGenres = createAsyncThunk(
  "appState/fetchGenres",
  async (mediaType, { getState }) => {
    const { genres } = getState().appState;

    if (genres[mediaType]) {
      return { mediaType, genres: genres[mediaType] };
    }

    const response = await mediaApi.getGenres({ mediaType });
    return { mediaType, genres: response.response?.genres || [] };
  }
);

/**
 * Async thunk to fetch movie certifications.
 * Caches certifications in state to avoid redundant API calls.
 */
export const fetchCertifications = createAsyncThunk(
  "appState/fetchCertifications",
  async (_, { getState }) => {
    const { certifications } = getState().appState;

    if (certifications?.movie) {
      return { type: "movie", certifications: certifications.movie };
    }

    const response = await mediaApi.getCertifications();
    return { type: "movie", certifications: response.response.certifications?.US || [] };
  }
);

/**
 * Async thunk to fetch TV certifications.
 * Caches certifications in state to avoid redundant API calls.
 */
export const fetchTvCertifications = createAsyncThunk(
  "appState/fetchTvCertifications",
  async (_, { getState }) => {
    const { certifications } = getState().appState;

    if (certifications?.tv) {
      return { type: "tv", certifications: certifications.tv };
    }

    const response = await mediaApi.getTvCertifications();
    return { type: "tv", certifications: response.response.certifications?.US || [] };
  }
);

const appStateSlice = createSlice({
  name: "appState",
  initialState: {
    appState: "",
    genres: {},
    certifications: {
      movie: null,
      tv: null,
    },
    appStateMessage: "",
  },
  reducers: {
    setAppState(state, action) {
      state.appStateMessage = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchGenres.fulfilled, (state, action) => {
        const { mediaType, genres } = action.payload;
        state.genres[mediaType] = genres;
      })
      .addCase(fetchGenres.rejected, (state, action) => {
        console.error("Failed to fetch genres:", action.error.message);
      })
      .addCase(fetchCertifications.fulfilled, (state, action) => {
        const { type, certifications } = action.payload;
        state.certifications[type] = certifications;
      })
      .addCase(fetchCertifications.rejected, (state, action) => {
        console.error("Failed to fetch movie certifications:", action.error.message);
      })
      .addCase(fetchTvCertifications.fulfilled, (state, action) => {
        const { type, certifications } = action.payload;
        state.certifications[type] = certifications;
      })
      .addCase(fetchTvCertifications.rejected, (state, action) => {
        console.error("Failed to fetch TV certifications:", action.error.message);
      });
  },
});

export const { setAppState } = appStateSlice.actions;

export default appStateSlice.reducer;
