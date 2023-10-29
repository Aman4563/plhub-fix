import React, { useEffect, useState } from 'react';

const CustomScrollbar = ({ children }) => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 0) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div
      style={{
        overflowY: 'auto',
      }}
      className={isScrolled ? 'scrolling' : ''}
    >
      {children}
      <style>
        {`
          /* Custom scrollbar styles */
          ::-webkit-scrollbar {
            width: 6px; // Slimmer scrollbar
          }

          ::-webkit-scrollbar-track {
            background: transparent; // Transparent track
          }

          ::-webkit-scrollbar-thumb {
            background: #555; // Darker thumb
          }

          ::-webkit-scrollbar-thumb:hover {
            background: #333; // Darker hover effect
          }

          /* Custom class for scrolling state */
          .scrolling {
            
            box-shadow: 0 0 8px rgba(0, 0, 0, 0.3); // Change box shadow when scrolling
          }
        `}
      </style>
    </div>
  );
};

export default CustomScrollbar;
