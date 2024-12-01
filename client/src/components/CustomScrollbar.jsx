import React, { useEffect, useState } from "react";

/**
 * CustomScrollbar Component
 * - Adds a custom scrollbar to the content.
 * - Applies a shadow effect when the user scrolls.
 *
 * @param {Object} props - React props.
 * @param {React.ReactNode} props.children - Child components to wrap with the custom scrollbar.
 */
const CustomScrollbar = ({ children }) => {
  const [isScrolled, setIsScrolled] = useState(false);

  /**
   * Adds an event listener to track scrolling and update the `isScrolled` state.
   */
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <div
      style={{
        overflowY: "auto",
        height: "100%",
      }}
      className={isScrolled ? "scrolling" : ""}
    >
      {children}
      <style>
        {`
          /* Custom scrollbar styles */
          ::-webkit-scrollbar {
            width: 6px; /* Slimmer scrollbar */
          }

          ::-webkit-scrollbar-track {
            background: transparent; /* Transparent track */
          }

          ::-webkit-scrollbar-thumb {
            background: #555; /* Darker thumb */
          }

          ::-webkit-scrollbar-thumb:hover {
            background: #333; /* Darker hover effect */
          }

          /* Custom class for scrolling state */
          .scrolling {
            box-shadow: 0 0 8px rgba(0, 0, 0, 0.3); /* Shadow effect while scrolling */
          }
        `}
      </style>
    </div>
  );
};

export default CustomScrollbar;
