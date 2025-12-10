import { Box } from "@mui/material";
import { Outlet } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";

import Footer from "../common/Footer";
import GlobalLoading from "../common/GlobalLoading";
import Topbar from "../common/Topbar";
import AuthModal from "../common/AuthModal";
import BackToTop from "../common/BackToTop";
import SkipLink from "../common/SkipLink";
import CookieConsent from "../common/CookieConsent";
import CustomScrollbar from "../CustomScrollbar";

import userApi from "../../api/modules/user.api";
import favoriteApi from "../../api/modules/favorite.api";
import { setListFavorites, setUser } from "../../redux/features/userSlice";
import { clearWatchlist } from "../../redux/features/watchlistSlice";

/**
 * MainLayout Component
 * - Serves as the primary layout for the application.
 * - Handles global user authentication and favorite data fetching.
 * - Wraps the main content with common components like `Topbar`, `Footer`, and modals.
 */
const MainLayout = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.user);

  /**
   * Listen for auth:logout event from private client interceptor
   */
  useEffect(() => {
    const handleLogout = () => {
      dispatch(setUser(null));
      dispatch(setListFavorites([]));
      dispatch(clearWatchlist());
    };

    window.addEventListener("auth:logout", handleLogout);
    return () => window.removeEventListener("auth:logout", handleLogout);
  }, [dispatch]);

  /**
   * Fetches authenticated user information on mount.
   * Only attempts if there's a token in localStorage (indicates previous login).
   */
  useEffect(() => {
    const authUser = async () => {
      // Check if there's a token - if not, user is logged out
      const token = localStorage.getItem("actkn");
      if (!token) {
        dispatch(setUser(null));
        dispatch(clearWatchlist());
        return;
      }

      const { response, err } = await userApi.getInfo();

      if (response) {
        dispatch(setUser(response));
      } else if (err) {
        dispatch(setUser(null));
        dispatch(clearWatchlist());
      }
    };

    authUser();
  }, [dispatch]);

  /**
   * Fetches the user's favorite list when user state changes.
   * Uses getAll() which returns all favorites for the Redux store.
   */
  useEffect(() => {
    const getFavorites = async () => {
      const { response, err } = await favoriteApi.getAll();

      if (response) {
        dispatch(setListFavorites(response));
      } else if (err) {
        console.error("Failed to fetch favorites:", err.message);
      }
    };

    if (user) {
      getFavorites();
    } else {
      dispatch(setListFavorites([]));
      dispatch(clearWatchlist());
    }
  }, [user, dispatch]);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        overflowX: "hidden",
      }}
    >
      {/* Skip to main content link for accessibility */}
      <SkipLink />

      {/* Global loading indicator */}
      <GlobalLoading />

      {/* Authentication modal */}
      <AuthModal />

      {/* Back to top button */}
      <BackToTop threshold={400} />

      {/* Cookie consent banner */}
      <CookieConsent />

      {/* Top navigation bar */}
      <Topbar />

      {/* Main content area */}
      <Box
        id="main-content"
        component="main"
        tabIndex={-1}
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          "&:focus": {
            outline: "none",
          },
        }}
      >
        <CustomScrollbar>
          <Outlet />
          {/* Footer inside scrollable area for proper layout */}
          <Footer />
        </CustomScrollbar>
      </Box>
    </Box>
  );
};

export default MainLayout;
