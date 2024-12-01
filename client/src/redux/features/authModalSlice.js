import { createSlice } from "@reduxjs/toolkit";

/**
 * Redux slice for managing the authentication modal state and related errors.
 */
export const authModalSlice = createSlice({
  name: "AuthModal", // Name of the slice
  initialState: {
    authModalOpen: false, // Tracks whether the authentication modal is open
    authError: null, // Stores authentication-related errors
  },
  reducers: {
    /**
     * Sets the state of the authentication modal (open/close).
     *
     * @param {Object} state - Current state.
     * @param {Object} action - Redux action with a boolean payload to open or close the modal.
     */
    setAuthModalOpen: (state, action) => {
      state.authModalOpen = action.payload;
    },

    /**
     * Sets an authentication-related error in the state.
     *
     * @param {Object} state - Current state.
     * @param {Object} action - Redux action containing the error message or object.
     */
    setAuthError: (state, action) => {
      state.authError = action.payload;
    },

    /**
     * Clears any existing authentication error from the state.
     *
     * @param {Object} state - Current state.
     */
    clearAuthError: (state) => {
      state.authError = null;
    },
  },
});

// Export actions for dispatching
export const { setAuthModalOpen, setAuthError, clearAuthError } = authModalSlice.actions;

// Export the reducer for integration in the Redux store
export default authModalSlice.reducer;
