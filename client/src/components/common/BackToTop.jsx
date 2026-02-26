import { useState, useEffect } from "react";
import { Fab, Zoom, useTheme } from "@mui/material";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";

/**
 * BackToTop Component
 * - Floating action button that scrolls to top when clicked.
 * - Appears after scrolling down past threshold.
 */
const BackToTop = ({ threshold = 400 }) => {
  const [visible, setVisible] = useState(false);
  const theme = useTheme();

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > threshold);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [threshold]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <Zoom in={visible}>
      <Fab
        onClick={scrollToTop}
        size="medium"
        aria-label="Scroll to top"
        sx={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 1000,
          backgroundColor: theme.palette.primary.main,
          color: "#fff",
          "&:hover": {
            backgroundColor: theme.palette.primary.dark,
            transform: "scale(1.1)",
          },
          transition: "transform 0.2s ease",
        }}
      >
        <KeyboardArrowUpIcon />
      </Fab>
    </Zoom>
  );
};

export default BackToTop;

