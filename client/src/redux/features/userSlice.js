import { createSlice } from "@reduxjs/toolkit";

/**
 * Redux slice for managing user-related state.
 * - Includes user information and a list of favorite items.
 * - Provides actions to update the user state and manage favorites.
 */
export const userSlice = createSlice({
  name: "User", // Name of the slice
  initialState: {
    user: null, // Holds the currently logged-in user details
    listFavorites: [], // Stores the list of user's favorite items
  },
  reducers: {
    /**
     * Sets the user data in the state.
     * - If payload is null, clears user-related tokens from localStorage.
     * - Otherwise, stores provided tokens in localStorage (if available).
     * 
     * @param {Object} state - Current state.
     * @param {Object} action - Redux action containing user data.
     */
    setUser: (state, action) => {
      const userData = action.payload;

      if (userData === null) {
        // Clear user-related tokens when logging out
        localStorage.removeItem("actkn");
        localStorage.removeItem("captchaToken");
        localStorage.removeItem("googleToken");
      } else {
        // Store tokens if available in the user payload
        if (userData.token) localStorage.setItem("actkn", userData.token);
        if (userData.captchaToken) localStorage.setItem("captchaToken", userData.captchaToken);
        if (userData.googleToken) localStorage.setItem("googleToken", userData.googleToken);
      }

      // Update state with the new user data
      state.user = userData;
    },

    /**
     * Updates the list of favorite items in the state.
     * 
     * @param {Object} state - Current state.
     * @param {Object} action - Redux action containing the updated list of favorites.
     */
    setListFavorites: (state, action) => {
      state.listFavorites = action.payload;
    },

    /**
     * Removes a specific favorite item from the list based on its mediaId.
     * 
     * @param {Object} state - Current state.
     * @param {Object} action - Redux action containing the mediaId to be removed.
     */
    removeFavorite: (state, action) => {
      const { mediaId } = action.payload;

      // Filter out the favorite item matching the provided mediaId
      state.listFavorites = state.listFavorites.filter(
        favorite => favorite.mediaId.toString() !== mediaId.toString()
      );
    },

    /**
     * Adds a new favorite item to the beginning of the list.
     * 
     * @param {Object} state - Current state.
     * @param {Object} action - Redux action containing the new favorite item.
     */
    addFavorite: (state, action) => {
      // Add the new favorite item at the beginning of the list
      state.listFavorites = [action.payload, ...state.listFavorites];
    },
  },
});

// Export actions for dispatching
export const { setUser, setListFavorites, addFavorite, removeFavorite } = userSlice.actions;

// Export the reducer for use in the store
export default userSlice.reducer;
