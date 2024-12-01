import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import { ListItemButton, ListItemIcon, ListItemText, Menu, Typography } from "@mui/material";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import menuConfigs from "../../configs/menu.configs";
import { setUser } from "../../redux/features/userSlice";

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
   * Signs the user out by clearing user data from Redux.
   */
  const handleSignOut = () => {
    dispatch(setUser(null)); // Clear user data
    setAnchorEl(null); // Close the menu
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
