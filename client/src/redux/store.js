import { configureStore } from "@reduxjs/toolkit";
import appStateSlice from "./features/appStateSlice";
import authModalSlice from "./features/authModalSlice";
import globalLoadingSlice from "./features/globalLoadingSlice";
import themeModeSlice from "./features/themeModeSlice";
import userSlice from "./features/userSlice";

/**
 * Configures the Redux store with all slices of the application state.
 * - Integrates reducers for managing specific features of the app.
 */
const store = configureStore({
  reducer: {
    user: userSlice, // Manages user-related state
    themeMode: themeModeSlice, // Manages theme mode state (e.g., dark or light mode)
    authModal: authModalSlice, // Manages authentication modal visibility and related errors
    globalLoading: globalLoadingSlice, // Tracks global loading state
    appState: appStateSlice, // Manages application state (genres, certifications, etc.)
  },
});

export default store;
