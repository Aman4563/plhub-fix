import { useEffect, useCallback, useRef, useState } from "react";

// Singleton to track global script loading state
let globalScriptLoaded = false;
let globalScriptLoading = false;
const scriptLoadCallbacks = [];

/**
 * Load Google OAuth script once globally
 */
const loadGoogleScript = () => {
  return new Promise((resolve, reject) => {
    if (globalScriptLoaded && window.google) {
      resolve();
      return;
    }

    if (globalScriptLoading) {
      scriptLoadCallbacks.push({ resolve, reject });
      return;
    }

    const existingScript = document.getElementById("google-oauth-script");
    
    if (existingScript && window.google) {
      globalScriptLoaded = true;
      resolve();
      return;
    }

    globalScriptLoading = true;

    const script = existingScript || document.createElement("script");
    
    if (!existingScript) {
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.id = "google-oauth-script";
    }

    script.onload = () => {
      globalScriptLoaded = true;
      globalScriptLoading = false;
      resolve();
      scriptLoadCallbacks.forEach(cb => cb.resolve());
      scriptLoadCallbacks.length = 0;
    };

    script.onerror = () => {
      globalScriptLoading = false;
      const error = new Error("Failed to load Google OAuth script");
      reject(error);
      scriptLoadCallbacks.forEach(cb => cb.reject(error));
      scriptLoadCallbacks.length = 0;
    };

    if (!existingScript) {
      document.body.appendChild(script);
    }
  });
};

/**
 * Custom hook for integrating Google OAuth in a React application.
 * Handles script loading centrally to avoid multiple loads.
 * 
 * @param {Function} callback - Callback function to handle Google OAuth response
 * @param {Object} options - Options for the button
 * @returns {Object} - { isLoaded, triggerPrompt }
 */
const useGoogleOAuth = (callback, options = {}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const initializedRef = useRef(false);
  const callbackRef = useRef(callback);

  // Keep callback ref updated
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const stableCallback = useCallback((response) => {
    callbackRef.current?.(response);
  }, []);

  useEffect(() => {
    let mounted = true;

    const initializeGoogle = async () => {
      try {
        await loadGoogleScript();

        if (!mounted || initializedRef.current) return;

        // Wait a bit for Google to be fully ready
        await new Promise(resolve => setTimeout(resolve, 100));

        if (window.google && !initializedRef.current) {
          window.google.accounts.id.initialize({
            client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
            callback: stableCallback,
            auto_select: false,
          });
          initializedRef.current = true;
          setIsLoaded(true);
        }
      } catch (error) {
        console.error("Google OAuth initialization error:", error);
      }
    };

    initializeGoogle();

    return () => {
      mounted = false;
    };
  }, [stableCallback]);

  // Function to trigger the Google sign-in prompt
  const triggerPrompt = useCallback(() => {
    if (window.google && initializedRef.current) {
      window.google.accounts.id.prompt();
    }
  }, []);

  // Function to render button in a specific container
  const renderButton = useCallback((containerId, buttonOptions = {}) => {
    if (!window.google || !initializedRef.current) return;

    const container = document.getElementById(containerId);
    if (!container) return;

    const defaultOptions = {
      type: "standard",
      theme: "filled_black",
      size: "large",
      text: options.text || "continue_with",
      shape: "rectangular",
      logo_alignment: "left",
      width: 400,
      ...buttonOptions,
    };

    try {
      container.innerHTML = "";
      window.google.accounts.id.renderButton(container, defaultOptions);
    } catch (error) {
      console.error("Error rendering Google button:", error);
    }
  }, [options.text]);

  return { isLoaded, triggerPrompt, renderButton };
};

export default useGoogleOAuth;
