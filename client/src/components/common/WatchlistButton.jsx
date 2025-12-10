/**
 * Watchlist Button Component
 * Add/remove media from watchlist with status options
 */

import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Button,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CheckIcon from "@mui/icons-material/Check";
import PlaylistAddIcon from "@mui/icons-material/PlaylistAdd";
import PlaylistAddCheckIcon from "@mui/icons-material/PlaylistAddCheck";
import VisibilityIcon from "@mui/icons-material/Visibility";
import PauseCircleIcon from "@mui/icons-material/PauseCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import { toast } from "react-toastify";

import watchlistApi from "../../api/modules/watchlist.api";
import { addToWatchlist, removeFromWatchlist, updateWatchlistItem } from "../../redux/features/watchlistSlice";
import { setAuthModalOpen } from "../../redux/features/authModalSlice";

const STATUS_OPTIONS = [
  { value: "want_to_watch", label: "Want to Watch", icon: <AddIcon /> },
  { value: "watching", label: "Currently Watching", icon: <VisibilityIcon /> },
  { value: "completed", label: "Completed", icon: <DoneAllIcon /> },
  { value: "on_hold", label: "On Hold", icon: <PauseCircleIcon /> },
  { value: "dropped", label: "Dropped", icon: <CancelIcon /> },
];

/**
 * Helper to get media ID as string
 */
const getMediaIdString = (media) => {
  const id = media?.id ?? media?.mediaId;
  return id != null ? String(id) : null;
};

const WatchlistButton = ({
  media,
  mediaType,
  inWatchlist = false,
  watchlistStatus = null,
  watchlistId = null,
  variant = "button", // "button" | "icon"
  size = "medium",
  onUpdate,
}) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.user);
  
  const [loading, setLoading] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [isInList, setIsInList] = useState(inWatchlist);
  const [currentStatus, setCurrentStatus] = useState(watchlistStatus);
  const [currentWatchlistId, setCurrentWatchlistId] = useState(watchlistId);

  // Sync local state with props when they change
  useEffect(() => {
    setIsInList(inWatchlist);
    setCurrentStatus(watchlistStatus);
    setCurrentWatchlistId(watchlistId);
  }, [inWatchlist, watchlistStatus, watchlistId]);

  const handleClick = (event) => {
    if (!user) {
      dispatch(setAuthModalOpen(true));
      return;
    }

    if (isInList) {
      // Show menu to change status or remove
      setAnchorEl(event.currentTarget);
    } else {
      // Add to watchlist
      handleAdd();
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleAdd = async () => {
    const mediaIdStr = getMediaIdString(media);
    
    if (!mediaIdStr) {
      toast.error("Cannot add: media ID not found");
      return;
    }

    setLoading(true);
    
    const { response, err } = await watchlistApi.add({
      mediaId: mediaIdStr,
      mediaType,
      mediaTitle: media.title || media.name || "Unknown",
      mediaPoster: media.poster_path || "",
      mediaBackdrop: media.backdrop_path || "",
      mediaRate: media.vote_average || 0,
    });

    setLoading(false);

    if (response) {
      // Handle both _id and id from response
      const responseId = response.id || response._id;
      setIsInList(true);
      setCurrentStatus(response.status || "want_to_watch");
      setCurrentWatchlistId(responseId);
      dispatch(addToWatchlist({ ...response, id: responseId }));
      toast.success("Added to watchlist");
      if (onUpdate) onUpdate({ inWatchlist: true, status: response.status, watchlistId: responseId });
    }

    if (err) {
      toast.error(err.message || "Failed to add to watchlist");
    }
  };

  const handleStatusChange = async (newStatus) => {
    handleClose();
    
    if (!currentWatchlistId) {
      toast.error("Cannot update: watchlist ID not found");
      return;
    }
    
    setLoading(true);

    const { response, err } = await watchlistApi.update({
      watchlistId: currentWatchlistId,
      status: newStatus,
    });

    setLoading(false);

    if (response) {
      setCurrentStatus(newStatus);
      dispatch(updateWatchlistItem({ id: currentWatchlistId, status: newStatus }));
      toast.success(`Status updated to "${STATUS_OPTIONS.find(s => s.value === newStatus)?.label}"`);
      if (onUpdate) onUpdate({ inWatchlist: true, status: newStatus, watchlistId: currentWatchlistId });
    }

    if (err) {
      toast.error(err.message || "Failed to update status");
    }
  };

  const handleRemove = async () => {
    handleClose();
    
    if (!currentWatchlistId) {
      toast.error("Cannot remove: watchlist ID not found");
      return;
    }
    
    setLoading(true);

    const { response, err } = await watchlistApi.remove({
      watchlistId: currentWatchlistId,
    });

    setLoading(false);

    if (response) {
      const mediaIdStr = getMediaIdString(media);
      setIsInList(false);
      setCurrentStatus(null);
      setCurrentWatchlistId(null);
      dispatch(removeFromWatchlist({ mediaId: mediaIdStr }));
      toast.success("Removed from watchlist");
      if (onUpdate) onUpdate({ inWatchlist: false, status: null, watchlistId: null });
    }

    if (err) {
      toast.error(err.message || "Failed to remove from watchlist");
    }
  };

  const currentStatusOption = STATUS_OPTIONS.find(s => s.value === currentStatus);

  if (variant === "icon") {
    return (
      <>
        <Tooltip title={isInList ? `In Watchlist: ${currentStatusOption?.label}` : "Add to Watchlist"}>
          <IconButton
            onClick={handleClick}
            disabled={loading}
            color={isInList ? "primary" : "default"}
            size={size}
          >
            {loading ? (
              <CircularProgress size={24} />
            ) : isInList ? (
              <PlaylistAddCheckIcon />
            ) : (
              <PlaylistAddIcon />
            )}
          </IconButton>
        </Tooltip>

        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
          {STATUS_OPTIONS.map((option) => (
            <MenuItem
              key={option.value}
              onClick={() => handleStatusChange(option.value)}
              selected={currentStatus === option.value}
            >
              <ListItemIcon>{option.icon}</ListItemIcon>
              <ListItemText>{option.label}</ListItemText>
              {currentStatus === option.value && <CheckIcon fontSize="small" />}
            </MenuItem>
          ))}
          <MenuItem onClick={handleRemove} sx={{ color: "error.main" }}>
            <ListItemIcon>
              <CancelIcon color="error" />
            </ListItemIcon>
            <ListItemText>Remove from Watchlist</ListItemText>
          </MenuItem>
        </Menu>
      </>
    );
  }

  return (
    <>
      <Button
        variant={isInList ? "contained" : "outlined"}
        startIcon={
          loading ? (
            <CircularProgress size={20} color="inherit" />
          ) : isInList ? (
            <PlaylistAddCheckIcon />
          ) : (
            <PlaylistAddIcon />
          )
        }
        onClick={handleClick}
        disabled={loading}
        size={size}
        sx={{ minWidth: 140 }}
      >
        {isInList ? currentStatusOption?.label || "In Watchlist" : "Add to Watchlist"}
      </Button>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
        {STATUS_OPTIONS.map((option) => (
          <MenuItem
            key={option.value}
            onClick={() => handleStatusChange(option.value)}
            selected={currentStatus === option.value}
          >
            <ListItemIcon>{option.icon}</ListItemIcon>
            <ListItemText>{option.label}</ListItemText>
            {currentStatus === option.value && <CheckIcon fontSize="small" />}
          </MenuItem>
        ))}
        <MenuItem onClick={handleRemove} sx={{ color: "error.main" }}>
          <ListItemIcon>
            <CancelIcon color="error" />
          </ListItemIcon>
          <ListItemText>Remove from Watchlist</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
};

export default WatchlistButton;
