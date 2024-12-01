/**
 * Utility function to load and initialize the Google Sign-In button.
 *
 * @param {Object} buttonRef - A React ref pointing to the DOM element where the button should be rendered.
 * @param {string} clientId - The Google client ID for your application.
 * @param {Function} handleGoogleSignIn - Callback function to handle the Google sign-in response.
 */
export const initializeGoogleButton = (buttonRef, clientId, handleGoogleSignIn) => {
  // Ensure the Google API is available and the buttonRef points to a valid DOM element
  if (window.google && buttonRef.current) {
    // Clear any existing content inside the button container to avoid duplicates
    buttonRef.current.innerHTML = "";

    // Initialize the Google Sign-In button with the provided client ID and callback
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: handleGoogleSignIn,
    });

    // Render the Google Sign-In button with specified options
    window.google.accounts.id.renderButton(buttonRef.current, {
      theme: "outline", // Button theme (e.g., "outline" or "filled_blue")
      size: "large", // Button size (e.g., "small", "medium", "large")
    });
  }
};
