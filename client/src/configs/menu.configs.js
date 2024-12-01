import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import SlideshowOutlinedIcon from "@mui/icons-material/SlideshowOutlined";
import LiveTvOutlinedIcon from "@mui/icons-material/LiveTvOutlined";
import FavoriteBorderOutlinedIcon from "@mui/icons-material/FavoriteBorderOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import RateReviewOutlinedIcon from "@mui/icons-material/RateReviewOutlined";
import LockResetOutlinedIcon from "@mui/icons-material/LockResetOutlined";
import BarChartOutlinedIcon from "@mui/icons-material/BarChartOutlined";

/**
 * Main Menu Configuration
 * - Represents primary navigation options available to all users.
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
 * User Menu Configuration
 * - Represents additional navigation options available to authenticated users.
 */
const user = [
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

/**
 * Consolidated Menu Configurations
 */
const menuConfigs = { main, user };

export default menuConfigs;
