import { useEffect, useCallback } from "react";

/**
 * Custom hook for integrating Google OAuth in a React application.
 * - Dynamically loads the Google OAuth script if not already present.
 * - Initializes and renders the Google Sign-In button with the provided configuration.
 *
 * @param {string} clientId - Google OAuth client ID.
 * @param {string} buttonId - ID of the HTML element where the button will be rendered.
 * @param {Function} callback - Callback function to handle Google sign-in response.
 */
const useGoogleOAuth = (clientId, buttonId, callback) => {
  // Memoize the callback to avoid unnecessary reinitializations on re-renders
  const memoizedCallback = useCallback(callback, [callback]);

  useEffect(() => {
    /**
     * Dynamically loads the Google OAuth script if not already loaded.
     */
    const loadGoogleScript = () => {
      const existingScript = document.getElementById("google-oauth-script");

      if (!existingScript) {
        // Create and append the Google OAuth script to the document
        const script = document.createElement("script");
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        script.id = "google-oauth-script";
        document.body.appendChild(script);

        // Initialize the Google button once the script is loaded
        script.onload = () => initializeGoogleButton();
        script.onerror = () => {
          console.error("Failed to load Google OAuth script.");
        };
      } else {
        // If script is already loaded, initialize the Google button
        initializeGoogleButton();
      }
    };

    /**
     * Initializes and renders the Google Sign-In button.
     */
    const initializeGoogleButton = () => {
      if (window.google && document.getElementById(buttonId)) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: memoizedCallback,
        });
        window.google.accounts.id.renderButton(
          document.getElementById(buttonId),
          { theme: "outline", size: "large", width: "100%" }
        );
      } else {
        console.warn(
          "Google API not ready or element with provided button ID not found."
        );
      }
    };

    // Load the Google OAuth script
    loadGoogleScript();
  }, [clientId, buttonId, memoizedCallback]);
};

export default useGoogleOAuth;
