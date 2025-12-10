/**
 * Menu Configuration
 * Navigation options for the application
 */

import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import SlideshowOutlinedIcon from "@mui/icons-material/SlideshowOutlined";
import LiveTvOutlinedIcon from "@mui/icons-material/LiveTvOutlined";
import FavoriteBorderOutlinedIcon from "@mui/icons-material/FavoriteBorderOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import RateReviewOutlinedIcon from "@mui/icons-material/RateReviewOutlined";
import LockResetOutlinedIcon from "@mui/icons-material/LockResetOutlined";
import BarChartOutlinedIcon from "@mui/icons-material/BarChartOutlined";
import PlaylistPlayIcon from "@mui/icons-material/PlaylistPlay";

/**
 * Main Menu - Available to all users
 */
const main = [
  {
    display: "Home",
    path: "/",
    icon: <HomeOutlinedIcon />,
    state: "home",
  },
  {
    display: "Movies",
    path: "/movie",
    icon: <SlideshowOutlinedIcon />,
    state: "movie",
  },
  {
    display: "TV Series",
    path: "/tv",
    icon: <LiveTvOutlinedIcon />,
    state: "tv",
  },
  {
    display: "Search",
    path: "/search",
    icon: <SearchOutlinedIcon />,
    state: "search",
  },
  {
    display: "Demand",
    path: "/feedback",
    icon: <BarChartOutlinedIcon />,
    state: "feedback",
  },
];

/**
 * User Menu - Available to authenticated users
 */
const user = [
  {
    display: "Watchlist",
    path: "/watchlist",
    icon: <PlaylistPlayIcon />,
    state: "watchlist",
  },
  {
    display: "Favorites",
    path: "/favorites",
    icon: <FavoriteBorderOutlinedIcon />,
    state: "favorite",
  },
  {
    display: "Reviews",
    path: "/reviews",
    icon: <RateReviewOutlinedIcon />,
    state: "reviews",
  },
  {
    display: "Password Update",
    path: "/password-update",
    icon: <LockResetOutlinedIcon />,
    state: "password.update",
  },
];

const menuConfigs = { main, user };

export default menuConfigs;
