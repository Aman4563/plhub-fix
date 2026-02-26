import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import { ListItemButton, ListItemIcon, ListItemText, Menu, Typography, Divider, Chip, Stack } from "@mui/material";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import menuConfigs from "../../configs/menu.configs";
import { logoutUser, setListFavorites } from "../../redux/features/userSlice";
import { clearWatchlist } from "../../redux/features/watchlistSlice";
import { routesGen } from "../../routes/routes";
import userApi from "../../api/modules/user.api";

/**
 * UserMenu Component
 * - Provides a dropdown menu for authenticated users.
 * - Allows navigation to user-specific routes and a sign-out option.
 */
const UserMenu = () => {
  const { user } = useSelector((state) => state.user);
  const dispatch = useDispatch();

  // State to manage menu visibility
  const [anchorEl, setAnchorEl] = useState(null);

  /**
   * Toggles the visibility of the user menu.
   * @param {Event} e - The event object triggered by user interaction.
   */
  const toggleMenu = (e) => setAnchorEl(e.currentTarget);

  /**
   * Signs the user out by calling logout API, clearing tokens, and resetting Redux state.
   */
  const handleSignOut = async () => {
    try {
      // Call logout API to clear server-side session and cookies
      await userApi.logout();
      toast.success("Logged out successfully");
    } catch (error) {
      // API call failed but we still want to log out locally
      toast.success("Logged out");
    }
    
    // Clear Redux state and localStorage tokens
    dispatch(logoutUser());
    dispatch(setListFavorites([]));
    dispatch(clearWatchlist());
    
    // Close the menu
    setAnchorEl(null);
  };

  return (
    <>
      {user && (
        <>
          {/* Display user name and toggle menu on click */}
          <Typography
            variant="h6"
            sx={{ cursor: "pointer", userSelect: "none" }}
            onClick={toggleMenu}
          >
            {user.displayName}
          </Typography>

          {/* User Menu Dropdown */}
          <Menu
            open={Boolean(anchorEl)}
            anchorEl={anchorEl}
            onClose={() => setAnchorEl(null)}
            PaperProps={{ sx: { padding: 0 } }}
          >
            {/* Admin/Moderator Panel Link */}
            {(user.role === "admin" || user.role === "moderator") && (
              <>
                <ListItemButton
                  component={Link}
                  to={routesGen.adminPanel}
                  onClick={() => setAnchorEl(null)}
                  sx={{
                    bgcolor: user.role === "admin" ? "error.dark" : "warning.dark",
                    "&:hover": {
                      bgcolor: user.role === "admin" ? "error.main" : "warning.main",
                    },
                    borderRadius: 1,
                    mx: 1,
                    mb: 1,
                  }}
                >
                  <ListItemIcon>
                    <AdminPanelSettingsIcon sx={{ color: "white" }} />
                  </ListItemIcon>
                  <ListItemText
                    disableTypography
                    primary={
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography textTransform="uppercase" sx={{ color: "white" }}>
                          Admin Panel
                        </Typography>
                        <Chip
                          label={user.role}
                          size="small"
                          sx={{
                            height: 18,
                            fontSize: "0.65rem",
                            bgcolor: "rgba(255,255,255,0.2)",
                            color: "white",
                          }}
                        />
                      </Stack>
                    }
                  />
                </ListItemButton>
                <Divider sx={{ my: 1 }} />
              </>
            )}

            {/* Render user-specific menu items */}
            {menuConfigs.user.map((item, index) => (
              <ListItemButton
                component={Link}
                to={item.path}
                key={index}
                onClick={() => setAnchorEl(null)}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText
                  disableTypography
                  primary={<Typography textTransform="uppercase">{item.display}</Typography>}
                />
              </ListItemButton>
            ))}

            {/* Sign-Out Option */}
            <ListItemButton
              sx={{ borderRadius: "10px" }}
              onClick={handleSignOut}
            >
              <ListItemIcon><LogoutOutlinedIcon /></ListItemIcon>
              <ListItemText
                disableTypography
                primary={<Typography textTransform="uppercase">sign out</Typography>}
              />
            </ListItemButton>
          </Menu>
        </>
      )}
    </>
  );
};

export default UserMenu;
