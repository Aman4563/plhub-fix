import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";
import { setAppState } from "../../redux/features/appStateSlice";

/**
 * Page transition animation variants
 * Provides smooth fade and slide transitions between pages
 */
const pageVariants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94], // Custom easing for smooth feel
      when: "beforeChildren",
      staggerChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: {
      duration: 0.2,
      ease: "easeIn",
    },
  },
};

/**
 * Child element animation variants
 * For staggered reveal of page content
 */
const childVariants = {
  initial: {
    opacity: 0,
    y: 15,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: "easeOut",
    },
  },
};

/**
 * PageWrapper Component
 * - Wraps a page's content and manages global app state for the page.
 * - Ensures the page scrolls to the top when loaded or when the state changes.
 * - Provides smooth page transition animations using framer-motion.
 *
 * @param {Object} props - Component props.
 * @param {string} props.state - The current app state to be set in the global Redux store.
 * @param {ReactNode} props.children - The child components (page content) to be rendered.
 * @param {boolean} props.disableAnimation - Disable animations if needed.
 */
const PageWrapper = ({ state, children, disableAnimation = false }) => {
  const dispatch = useDispatch();
  const location = useLocation();

  useEffect(() => {
    // Scroll to the top when the component mounts
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    // Scroll to the top and update the app state when `state` changes
    window.scrollTo(0, 0);
    dispatch(setAppState(state));
  }, [state, dispatch]);

  // If animations are disabled, render without motion
  if (disableAnimation) {
    return <>{children}</>;
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={pageVariants}
        style={{ width: "100%" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

/**
 * AnimatedSection Component
 * Use this to wrap sections within a page for staggered reveal animations
 */
export const AnimatedSection = ({ children, delay = 0, className = "" }) => {
  return (
    <motion.div
      variants={childVariants}
      initial="initial"
      whileInView="animate"
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/**
 * FadeIn Component
 * Simple fade-in animation for individual elements
 */
export const FadeIn = ({ children, duration = 0.5, delay = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
};

/**
 * SlideIn Component
 * Slide-in animation from specified direction
 */
export const SlideIn = ({ 
  children, 
  direction = "up", 
  duration = 0.4, 
  delay = 0,
  distance = 30 
}) => {
  const directionMap = {
    up: { y: distance },
    down: { y: -distance },
    left: { x: distance },
    right: { x: -distance },
  };

  return (
    <motion.div
      initial={{ opacity: 0, ...directionMap[direction] }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {children}
    </motion.div>
  );
};

/**
 * ScaleIn Component
 * Scale-in animation for elements that need emphasis
 */
export const ScaleIn = ({ children, duration = 0.4, delay = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
};

/**
 * StaggerContainer Component
 * Container for staggered child animations
 */
export const StaggerContainer = ({ 
  children, 
  staggerDelay = 0.1, 
  className = "" 
}) => {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={{
        animate: {
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/**
 * StaggerItem Component
 * Individual item within a StaggerContainer
 */
export const StaggerItem = ({ children }) => {
  return (
    <motion.div variants={childVariants}>
      {children}
    </motion.div>
  );
};

export default PageWrapper;
