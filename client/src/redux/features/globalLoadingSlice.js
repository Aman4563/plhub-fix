import { createSlice } from "@reduxjs/toolkit";

/**
 * Redux slice for managing the global loading state.
 * - Tracks whether a global loading indicator should be displayed.
 */
export const globalLoadingSlice = createSlice({
  name: "GlobalLoading", // Name of the slice
  initialState: {
    globalLoading: false, // Indicates whether global loading is active
  },
  reducers: {
    /**
     * Updates the global loading state.
     * 
     * @param {Object} state - Current state.
     * @param {Object} action - Redux action containing a boolean payload to set the loading state.
     */
    setGlobalLoading: (state, action) => {
      state.globalLoading = action.payload;
    },
  },
});

// Export actions for dispatching
export const { setGlobalLoading } = globalLoadingSlice.actions;

// Export the reducer for integration in the Redux store
export default globalLoadingSlice.reducer;
