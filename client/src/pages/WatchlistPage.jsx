/**
 * Watchlist Page
 * Netflix-style "My List" with status filtering
 */

import { useEffect, useState, useCallback, memo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Box,
  Typography,
  Stack,
  Tabs,
  Tab,
  Grid,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Tooltip,
} from "@mui/material";
import { toast } from "react-toastify";
import DeleteIcon from "@mui/icons-material/Delete";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import PlaylistPlayIcon from "@mui/icons-material/PlaylistPlay";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import PauseCircleIcon from "@mui/icons-material/PauseCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import MovieIcon from "@mui/icons-material/Movie";
import TvIcon from "@mui/icons-material/Tv";

import Container from "../components/common/Container";
import MediaItem from "../components/common/MediaItem";
import { MediaGridSkeleton } from "../components/common/MediaSkeleton";
import uiConfigs from "../configs/ui.configs";
import watchlistApi from "../api/modules/watchlist.api";
import { setWatchlist, removeFromWatchlist, updateWatchlistItem } from "../redux/features/watchlistSlice";
import { setGlobalLoading } from "../redux/features/globalLoadingSlice";

const STATUS_TABS = [
  { value: "all", label: "All", icon: <PlaylistPlayIcon /> },
  { value: "want_to_watch", label: "Want to Watch", icon: <PlaylistPlayIcon /> },
  { value: "watching", label: "Watching", icon: <VisibilityIcon /> },
  { value: "completed", label: "Completed", icon: <DoneAllIcon /> },
  { value: "on_hold", label: "On Hold", icon: <PauseCircleIcon /> },
  { value: "dropped", label: "Dropped", icon: <CancelIcon /> },
];

/**
 * Memoized Watchlist Card Component
 * Prevents re-render when parent state changes (like menu open/close)
 */
const WatchlistCard = memo(({ item, onMenuOpen }) => {
  return (
    <Box sx={{ position: "relative" }}>
      {/* Media Card */}
      <MediaItem
        media={{
          id: item.mediaId,
          title: item.mediaTitle,
          name: item.mediaTitle,
          poster_path: item.mediaPoster,
          vote_average: item.mediaRate,
          mediaId: item.mediaId,
        }}
        mediaType={item.mediaType}
      />

      {/* Status Badge */}
      <Chip
        label={STATUS_TABS.find(t => t.value === item.status)?.label}
        size="small"
        color={
          item.status === "completed" ? "success" :
          item.status === "watching" ? "info" :
          item.status === "dropped" ? "error" :
          "default"
        }
        sx={{
          position: "absolute",
          top: 8,
          left: 8,
          fontSize: "0.65rem",
          height: 20,
        }}
      />

      {/* Menu Button */}
      <Tooltip title="Options">
        <IconButton
          size="small"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onMenuOpen(e, item);
          }}
          sx={{
            position: "absolute",
            top: 4,
            right: 4,
            backgroundColor: "rgba(0,0,0,0.6)",
            "&:hover": { backgroundColor: "rgba(0,0,0,0.8)" },
          }}
        >
          <MoreVertIcon fontSize="small" sx={{ color: "white" }} />
        </IconButton>
      </Tooltip>
    </Box>
  );
}, (prevProps, nextProps) => {
  // Only re-render if the item's data actually changed
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.item._id === nextProps.item._id &&
    prevProps.item.status === nextProps.item.status &&
    prevProps.item.mediaId === nextProps.item.mediaId &&
    prevProps.item.mediaPoster === nextProps.item.mediaPoster
  );
});

WatchlistCard.displayName = "WatchlistCard";

const WatchlistPage = () => {
  const dispatch = useDispatch();
  const { items } = useSelector((state) => state.watchlist);

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [mediaTypeFilter, setMediaTypeFilter] = useState("all");
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    const fetchWatchlist = async () => {
      dispatch(setGlobalLoading(true));
      setLoading(true);

      const { response, err } = await watchlistApi.getList();

      if (response) {
        dispatch(setWatchlist(response));
      }

      if (err) {
        toast.error(err.message || "Failed to load watchlist");
      }

      setLoading(false);
      dispatch(setGlobalLoading(false));
    };

    fetchWatchlist();
  }, [dispatch]);

  const handleStatusChange = async (newStatus) => {
    if (!selectedItem) return;

    const itemId = selectedItem.id || selectedItem._id;
    
    if (!itemId) {
      toast.error("Cannot update: item ID not found");
      handleMenuClose();
      return;
    }

    const { response, err } = await watchlistApi.update({
      watchlistId: itemId,
      status: newStatus,
    });

    if (response) {
      dispatch(updateWatchlistItem({ id: itemId, status: newStatus }));
      toast.success("Status updated");
    }

    if (err) {
      toast.error(err.message || "Failed to update status");
    }

    handleMenuClose();
  };

  const handleRemove = async () => {
    if (!selectedItem) return;

    const itemId = selectedItem.id || selectedItem._id;
    
    if (!itemId) {
      toast.error("Cannot remove: item ID not found");
      handleMenuClose();
      return;
    }

    const { response, err } = await watchlistApi.remove({
      watchlistId: itemId,
    });

    if (response) {
      dispatch(removeFromWatchlist({ mediaId: selectedItem.mediaId }));
      toast.success("Removed from watchlist");
    }

    if (err) {
      toast.error(err.message || "Failed to remove");
    }

    handleMenuClose();
  };

  // Memoize menu handlers to prevent unnecessary re-renders
  const handleMenuOpen = useCallback((event, item) => {
    setSelectedItem(item);
    setMenuAnchor(event.currentTarget);
  }, []);

  const handleMenuClose = useCallback(() => {
    setMenuAnchor(null);
    setSelectedItem(null);
  }, []);

  // Filter items
  const filteredItems = items.filter((item) => {
    const statusMatch = activeTab === "all" || item.status === activeTab;
    const typeMatch = mediaTypeFilter === "all" || item.mediaType === mediaTypeFilter;
    return statusMatch && typeMatch;
  });

  // Count by status
  const statusCounts = STATUS_TABS.reduce((acc, tab) => {
    acc[tab.value] = tab.value === "all" 
      ? items.length 
      : items.filter((item) => item.status === tab.value).length;
    return acc;
  }, {});

  // Get unique key for item
  const getItemKey = (item) => item.id || item._id || `${item.mediaId}-${item.mediaType}`;

  return (
    <Box sx={{ ...uiConfigs.style.mainContent }}>
      <Container header="My Watchlist">
        {/* Filters */}
        <Stack spacing={3} sx={{ mb: 4 }}>
          {/* Status Tabs */}
          <Tabs
            value={activeTab}
            onChange={(_, value) => setActiveTab(value)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              borderBottom: 1,
              borderColor: "divider",
              "& .MuiTab-root": {
                minHeight: 48,
              },
            }}
          >
            {STATUS_TABS.map((tab) => (
              <Tab
                key={tab.value}
                value={tab.value}
                label={
                  <Stack direction="row" spacing={1} alignItems="center">
                    {tab.icon}
                    <span>{tab.label}</span>
                    <Chip
                      label={statusCounts[tab.value]}
                      size="small"
                      sx={{ height: 20, fontSize: "0.75rem" }}
                    />
                  </Stack>
                }
              />
            ))}
          </Tabs>

          {/* Media Type Filter */}
          <Stack direction="row" spacing={1}>
            <Chip
              label="All"
              onClick={() => setMediaTypeFilter("all")}
              color={mediaTypeFilter === "all" ? "primary" : "default"}
              variant={mediaTypeFilter === "all" ? "filled" : "outlined"}
            />
            <Chip
              icon={<MovieIcon />}
              label="Movies"
              onClick={() => setMediaTypeFilter("movie")}
              color={mediaTypeFilter === "movie" ? "primary" : "default"}
              variant={mediaTypeFilter === "movie" ? "filled" : "outlined"}
            />
            <Chip
              icon={<TvIcon />}
              label="TV Shows"
              onClick={() => setMediaTypeFilter("tv")}
              color={mediaTypeFilter === "tv" ? "primary" : "default"}
              variant={mediaTypeFilter === "tv" ? "filled" : "outlined"}
            />
          </Stack>
        </Stack>

        {/* Content */}
        {loading ? (
          <MediaGridSkeleton count={12} />
        ) : filteredItems.length === 0 ? (
          <Paper
            sx={{
              p: 6,
              textAlign: "center",
              backgroundColor: "background.paper",
            }}
          >
            <PlaylistPlayIcon sx={{ fontSize: 64, color: "text.disabled", mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {activeTab === "all"
                ? "Your watchlist is empty"
                : `No items with status "${STATUS_TABS.find(t => t.value === activeTab)?.label}"`}
            </Typography>
            <Typography variant="body2" color="text.disabled">
              Start adding movies and TV shows to your watchlist!
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={2}>
            {filteredItems.map((item) => (
              <Grid item xs={6} sm={4} md={3} lg={2} key={getItemKey(item)}>
                <WatchlistCard 
                  item={item} 
                  onMenuOpen={handleMenuOpen}
                />
              </Grid>
            ))}
          </Grid>
        )}

        {/* Context Menu - Rendered outside of the grid to prevent re-renders */}
        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={handleMenuClose}
        >
          <Typography variant="caption" sx={{ px: 2, py: 1, color: "text.secondary" }}>
            Change Status
          </Typography>
          {STATUS_TABS.filter(t => t.value !== "all").map((status) => (
            <MenuItem
              key={status.value}
              onClick={() => handleStatusChange(status.value)}
              selected={selectedItem?.status === status.value}
            >
              <ListItemIcon>{status.icon}</ListItemIcon>
              <ListItemText>{status.label}</ListItemText>
            </MenuItem>
          ))}
          <MenuItem onClick={handleRemove} sx={{ color: "error.main" }}>
            <ListItemIcon>
              <DeleteIcon color="error" />
            </ListItemIcon>
            <ListItemText>Remove</ListItemText>
          </MenuItem>
        </Menu>
      </Container>
    </Box>
  );
};

export default WatchlistPage;
