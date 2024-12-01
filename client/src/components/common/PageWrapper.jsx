import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { setAppState } from "../../redux/features/appStateSlice";

/**
 * PageWrapper Component
 * - Wraps a page's content and manages global app state for the page.
 * - Ensures the page scrolls to the top when loaded or when the state changes.
 *
 * @param {Object} props - Component props.
 * @param {string} props.state - The current app state to be set in the global Redux store.
 * @param {ReactNode} props.children - The child components (page content) to be rendered.
 */
const PageWrapper = ({ state, children }) => {
  const dispatch = useDispatch();

  useEffect(() => {
    // Scroll to the top when the component mounts
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    // Scroll to the top and update the app state when `state` changes
    window.scrollTo(0, 0);
    dispatch(setAppState(state));
  }, [state, dispatch]);

  return <>{children}</>;
};

export default PageWrapper;
