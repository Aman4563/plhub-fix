import { useSelector, useDispatch } from "react-redux";
import MenuIcon from "@mui/icons-material/Menu";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import WbSunnyOutlinedIcon from "@mui/icons-material/WbSunnyOutlined";
import { AppBar, Box, Button, IconButton, Stack, Toolbar, useScrollTrigger } from "@mui/material";
import { cloneElement, useState } from "react";
import { Link } from "react-router-dom";
import menuConfigs from "../../configs/menu.configs";
import { themeModes } from "../../configs/theme.configs";
import { setAuthModalOpen } from "../../redux/features/authModalSlice";
import { setThemeMode } from "../../redux/features/themeModeSlice";
import Logo from "./Logo";
import UserMenu from "./UserMenu";
import Sidebar from "./Sidebar";

/**
 * ScrollAppBar Component
 * - Adjusts the appearance of the AppBar based on scroll position.
 *
 * @param {Object} props - Component props.
 * @param {ReactNode} props.children - Child elements (typically AppBar).
 * @param {function} [props.window] - Reference to the window object for scroll calculations.
 */
const ScrollAppBar = ({ children, window }) => {
  const { themeMode } = useSelector((state) => state.themeMode);

  const trigger = useScrollTrigger({
    disableHysteresis: true,
    threshold: 50,
    target: window ? window() : undefined,
  });

  return cloneElement(children, {
    sx: {
      color: trigger ? "text.primary" : themeMode === themeModes.dark ? "primary.contrastText" : "text.primary",
      backgroundColor: trigger
        ? "background.paper"
        : themeMode === themeModes.dark
        ? "transparent"
        : "background.paper",
    },
  });
};

/**
 * Topbar Component
 * - Displays the main navigation bar with a responsive design.
 * - Includes user authentication options, theme toggle, and a sidebar menu.
 */
const Topbar = () => {
  const { user } = useSelector((state) => state.user);
  const { appState } = useSelector((state) => state.appState);
  const { themeMode } = useSelector((state) => state.themeMode);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const dispatch = useDispatch();

  /**
   * Toggles the theme mode between light and dark.
   */
  const onSwitchTheme = () => {
    const theme = themeMode === themeModes.dark ? themeModes.light : themeModes.dark;
    dispatch(setThemeMode(theme));
  };

  /**
   * Toggles the sidebar's open/close state.
   */
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <>
      {/* Sidebar Component */}
      <Sidebar open={sidebarOpen} toggleSidebar={toggleSidebar} />

      {/* Scrollable AppBar */}
      <ScrollAppBar>
        <AppBar elevation={0} sx={{ zIndex: 9999 }}>
          <Toolbar sx={{ alignItems: "center", justifyContent: "space-between" }}>
            {/* Mobile Menu and Logo */}
            <Stack direction="row" spacing={1} alignItems="center">
              <IconButton
                color="inherit"
                sx={{ mr: 2, display: { md: "none" } }}
                onClick={toggleSidebar}
              >
                <MenuIcon />
              </IconButton>
              <Box sx={{ display: { xs: "inline-block", md: "none" } }}>
                <Logo />
              </Box>
            </Stack>

            {/* Main Navigation Menu */}
            <Box
              flexGrow={1}
              alignItems="center"
              display={{ xs: "none", md: "flex" }}
            >
              <Box sx={{ marginRight: "30px" }}>
                <Logo />
              </Box>
              {menuConfigs.main.map((item, index) => (
                <Button
                  key={index}
                  sx={{
                    color: appState.includes(item.state) ? "primary.contrastText" : "inherit",
                    mr: 2,
                  }}
                  component={Link}
                  to={item.path}
                  variant={appState.includes(item.state) ? "contained" : "text"}
                >
                  {item.display}
                </Button>
              ))}
              <IconButton sx={{ color: "inherit" }} onClick={onSwitchTheme}>
                {themeMode === themeModes.dark ? <DarkModeOutlinedIcon /> : <WbSunnyOutlinedIcon />}
              </IconButton>
            </Box>

            {/* User Authentication and Menu */}
            <Stack spacing={3} direction="row" alignItems="center">
              {!user ? (
                <Button
                  variant="contained"
                  onClick={() => dispatch(setAuthModalOpen(true))}
                >
                  Sign In
                </Button>
              ) : (
                <UserMenu />
              )}
            </Stack>
          </Toolbar>
        </AppBar>
      </ScrollAppBar>
    </>
  );
};

export default Topbar;
