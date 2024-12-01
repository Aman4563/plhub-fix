import { createSlice } from "@reduxjs/toolkit";

/**
 * Redux slice for managing theme mode (e.g., dark or light).
 * - Allows setting and tracking the application's current theme mode.
 */
export const themeModeSlice = createSlice({
  name: "ThemeMode", // Name of the slice
  initialState: {
    themeMode: "dark", // Default theme mode
  },
  reducers: {
    /**
     * Updates the theme mode state.
     *
     * @param {Object} state - Current state.
     * @param {Object} action - Redux action containing the new theme mode (e.g., "light" or "dark").
     */
    setThemeMode: (state, action) => {
      state.themeMode = action.payload;
    },
  },
});

// Export actions for dispatching
export const { setThemeMode } = themeModeSlice.actions;

// Export the reducer for integration in the Redux store
export default themeModeSlice.reducer;
