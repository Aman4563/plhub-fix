import { Box } from "@mui/material";
import { Outlet } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import { toast } from "react-toastify";

import Footer from "../common/Footer";
import GlobalLoading from "../common/GlobalLoading";
import Topbar from "../common/Topbar";
import AuthModal from "../common/AuthModal";
import CustomScrollbar from "../CustomScrollbar";

import userApi from "../../api/modules/user.api";
import favoriteApi from "../../api/modules/favorite.api";
import { setListFavorites, setUser } from "../../redux/features/userSlice";

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
   * Fetches authenticated user information on mount.
   */
  useEffect(() => {
    const authUser = async () => {
      const { response, err } = await userApi.getInfo();

      if (response) {
        dispatch(setUser(response));
      } else if (err) {
        dispatch(setUser(null));
      }
    };

    authUser();
  }, [dispatch]);

  /**
   * Fetches the user's favorite list when user state changes.
   */
  useEffect(() => {
    const getFavorites = async () => {
      const { response, err } = await favoriteApi.getList();

      if (response) {
        dispatch(setListFavorites(response));
      } else if (err) {
        toast.error(err.message);
      }
    };

    if (user) {
      getFavorites();
    } else {
      dispatch(setListFavorites([]));
    }
  }, [user, dispatch]);

  return (
    <>
      {/* Global loading indicator */}
      <GlobalLoading />

      {/* Authentication modal */}
      <AuthModal />

      <Box display="flex" minHeight="100vh">
        {/* Top navigation bar */}
        <Topbar />

        {/* Main content area */}
        <Box
          component="main"
          flexGrow={1}
          overflow="hidden"
          minHeight="100vh"
        >
          <CustomScrollbar>
            <Outlet />
          </CustomScrollbar>
        </Box>
      </Box>

      {/* Footer section */}
      <Footer />
    </>
  );
};

export default MainLayout;
