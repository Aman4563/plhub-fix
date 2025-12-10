/**
 * MediaReview Component
 * Displays and manages reviews for media items
 * Includes rating distribution, spoiler warnings, edit functionality, helpful votes, report feature, and sorting
 */

import { LoadingButton } from "@mui/lab";
import {
  Box,
  Button,
  Divider,
  Stack,
  TextField,
  Typography,
  Rating,
  IconButton,
  Chip,
  FormControlLabel,
  Checkbox,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Alert,
  Tooltip,
  alpha,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  RadioGroup,
  Radio,
  LinearProgress,
  Paper,
} from "@mui/material";
import { useEffect, useState, useCallback, useMemo } from "react";
import SendOutlinedIcon from "@mui/icons-material/SendOutlined";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import StarIcon from "@mui/icons-material/Star";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import VisibilityIcon from "@mui/icons-material/Visibility";
import SortIcon from "@mui/icons-material/Sort";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import ThumbUpOutlinedIcon from "@mui/icons-material/ThumbUpOutlined";
import FlagIcon from "@mui/icons-material/Flag";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useSelector } from "react-redux";

import Container from "./Container";
import reviewApi from "../../api/modules/review.api";
import reportApi, { REPORT_REASONS } from "../../api/modules/report.api";
import TextAvatar from "./TextAvatar";
import { DisplayStarRating } from "./StarRating";
import EmojiPicker from "./EmojiPicker";

dayjs.extend(relativeTime);

// Sort options
const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "highest", label: "Highest Rated" },
  { value: "lowest", label: "Lowest Rated" },
  { value: "helpful", label: "Most Helpful" },
];

/**
 * RatingDistribution Component
 * Displays a visual bar chart of rating distribution (like IMDb)
 */
const RatingDistribution = ({ reviews, averageRating, totalRatings }) => {
  const theme = useTheme();

  // Calculate rating distribution from reviews
  const distribution = useMemo(() => {
    const counts = Array(10).fill(0);
    reviews.forEach((review) => {
      if (review.rating && review.rating >= 1 && review.rating <= 10) {
        counts[review.rating - 1]++;
      }
    });
    return counts;
  }, [reviews]);

  const maxCount = Math.max(...distribution, 1);

  if (totalRatings === 0) return null;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        mb: 3,
        bgcolor: alpha(theme.palette.background.paper, 0.6),
        backdropFilter: "blur(8px)",
        borderRadius: 2,
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
      }}
    >
      <Stack direction={{ xs: "column", md: "row" }} spacing={3} alignItems="flex-start">
        {/* Average Rating Display */}
        <Box
          sx={{
            textAlign: "center",
            minWidth: 120,
            p: 2,
            borderRadius: 2,
            bgcolor: alpha(theme.palette.primary.main, 0.08),
          }}
        >
          <Stack direction="row" alignItems="baseline" justifyContent="center" spacing={0.5}>
            <Typography
              variant="h3"
              fontWeight="700"
              sx={{ color: "#f5c518", lineHeight: 1 }}
            >
              {averageRating?.toFixed(1) || "—"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              /10
            </Typography>
          </Stack>
          <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.5} sx={{ mt: 1 }}>
            <StarIcon sx={{ fontSize: 18, color: "#f5c518" }} />
            <Typography variant="body2" color="text.secondary">
              {totalRatings} {totalRatings === 1 ? "rating" : "ratings"}
            </Typography>
          </Stack>
        </Box>

        {/* Rating Bars */}
        <Box sx={{ flex: 1, width: "100%" }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
            Rating Distribution
          </Typography>
          <Stack spacing={0.75}>
            {distribution.map((count, index) => {
              const rating = index + 1;
              const percentage = (count / maxCount) * 100;

              return (
                <Stack
                  key={rating}
                  direction="row"
                  alignItems="center"
                  spacing={1.5}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      minWidth: 20,
                      textAlign: "right",
                      fontWeight: 600,
                      color: count > 0 ? "text.primary" : "text.disabled",
                    }}
                  >
                    {rating}
                  </Typography>
                  <StarBorderIcon
                    sx={{
                      fontSize: 14,
                      color: count > 0 ? "#f5c518" : "text.disabled",
                    }}
                  />
                  <Box sx={{ flex: 1, position: "relative" }}>
                    <LinearProgress
                      variant="determinate"
                      value={percentage}
                      sx={{
                        height: 10,
                        borderRadius: 1,
                        bgcolor: alpha(theme.palette.divider, 0.2),
                        "& .MuiLinearProgress-bar": {
                          borderRadius: 1,
                          bgcolor: count > 0 ? "#f5c518" : "transparent",
                        },
                      }}
                    />
                  </Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ minWidth: 24 }}
                  >
                    {count}
                  </Typography>
                </Stack>
              );
            })}
          </Stack>
        </Box>
      </Stack>
    </Paper>
  );
};

/**
 * ReportDialog Component
 * Modal for reporting inappropriate reviews
 */
const ReportDialog = ({ open, onClose, reviewId, onReportSubmitted }) => {
  const theme = useTheme();
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!reason) {
      toast.warning("Please select a reason for your report");
      return;
    }

    setLoading(true);
    const { response, err } = await reportApi.create({
      reviewId,
      reason,
      description: description.trim() || undefined,
    });
    setLoading(false);

    if (err) {
      toast.error(err.message || "Failed to submit report");
    } else if (response) {
      toast.success(response.message || "Report submitted successfully");
      onReportSubmitted(reviewId);
      handleClose();
    }
  };

  const handleClose = () => {
    if (!loading) {
      setReason("");
      setDescription("");
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          bgcolor: theme.palette.background.paper,
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <FlagIcon color="warning" />
          <span>Report Review</span>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Help us understand the issue. Select the reason that best describes why you're reporting this review.
        </Typography>

        <FormControl component="fieldset" sx={{ width: "100%" }}>
          <RadioGroup
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          >
            {REPORT_REASONS.map((option) => (
              <FormControlLabel
                key={option.value}
                value={option.value}
                control={<Radio size="small" />}
                label={
                  <Typography variant="body2">{option.label}</Typography>
                }
                sx={{
                  mx: 0,
                  py: 0.5,
                  borderRadius: 1,
                  "&:hover": {
                    bgcolor: alpha(theme.palette.action.hover, 0.5),
                  },
                }}
              />
            ))}
          </RadioGroup>
        </FormControl>

        <TextField
          fullWidth
          multiline
          rows={3}
          label="Additional details (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Provide any additional context that might help us understand the issue..."
          inputProps={{ maxLength: 500 }}
          helperText={`${description.length}/500 characters`}
          sx={{ mt: 2 }}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <LoadingButton
          onClick={handleSubmit}
          loading={loading}
          variant="contained"
          color="warning"
          disabled={!reason}
          startIcon={<FlagIcon />}
        >
          Submit Report
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
};

/**
 * ReviewItem Component
 * Displays a single review with options for edit, delete, spoiler toggle, helpful vote, and report
 */
const ReviewItem = ({ review, onRemoved, onUpdated, onVoteUpdated, currentUserId, onReportClick }) => {
  const theme = useTheme();
  const [onRequest, setOnRequest] = useState(false);
  const [voteLoading, setVoteLoading] = useState(false);
  const [showSpoiler, setShowSpoiler] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(review.content);
  const [editRating, setEditRating] = useState(review.rating ? review.rating / 2 : 0);
  const [editContainsSpoilers, setEditContainsSpoilers] = useState(review.containsSpoilers || false);

  const reviewUserId = review.user?.id || review.user?._id;
  const isOwner = currentUserId && reviewUserId && currentUserId.toString() === reviewUserId.toString();
  const hasSpoiler = review.containsSpoilers;
  const reviewId = review.id || review._id;

  // Check if current user has voted on this review
  const hasUserVoted = review.helpfulVoters?.some(
    (voterId) => currentUserId && voterId?.toString() === currentUserId.toString()
  ) || false;

  // Check if user has reported this review
  const hasReported = review.hasReported || false;

  const handleRemove = async () => {
    if (onRequest) return;
    setOnRequest(true);
    setAnchorEl(null);

    const { response, err } = await reviewApi.remove({ reviewId });

    setOnRequest(false);

    if (err) {
      toast.error(err.message);
    } else if (response) {
      onRemoved(reviewId);
    }
  };

  const handleEdit = async () => {
    if (onRequest || !editContent.trim()) return;
    setOnRequest(true);

    const { response, err } = await reviewApi.update({
      reviewId,
      content: editContent.trim(),
      rating: editRating > 0 ? Math.round(editRating * 2) : null,
      containsSpoilers: editContainsSpoilers,
    });

    setOnRequest(false);

    if (err) {
      toast.error(err.message);
    } else if (response) {
      toast.success("Review updated successfully!");
      setIsEditing(false);
      onUpdated(reviewId, {
        ...review,
        content: editContent.trim(),
        rating: editRating > 0 ? Math.round(editRating * 2) : null,
        containsSpoilers: editContainsSpoilers,
      });
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent(review.content);
    setEditRating(review.rating ? review.rating / 2 : 0);
    setEditContainsSpoilers(review.containsSpoilers || false);
  };

  const handleVoteHelpful = async () => {
    if (!currentUserId) {
      toast.info("Please sign in to vote on reviews");
      return;
    }
    if (isOwner) {
      toast.info("You can't vote on your own review");
      return;
    }
    if (voteLoading) return;

    setVoteLoading(true);

    const { response, err } = await reviewApi.voteHelpful({ reviewId });

    setVoteLoading(false);

    if (err) {
      toast.error(err.message || "Failed to update vote");
    } else if (response) {
      onVoteUpdated(reviewId, {
        helpfulVotes: response.helpfulVotes,
        hasVoted: response.hasVoted,
      });
    }
  };

  const handleReportClick = () => {
    setAnchorEl(null);
    if (!currentUserId) {
      toast.info("Please sign in to report reviews");
      return;
    }
    if (isOwner) {
      toast.info("You can't report your own review");
      return;
    }
    if (hasReported) {
      toast.info("You have already reported this review");
      return;
    }
    onReportClick(review);
  };

  return (
    <Box
      sx={{
        padding: 2,
        borderRadius: 2,
        position: "relative",
        opacity: onRequest ? 0.6 : 1,
        backgroundColor: alpha(theme.palette.background.paper, 0.6),
        backdropFilter: "blur(8px)",
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        transition: "background-color 0.2s, box-shadow 0.2s",
        "&:hover": {
          backgroundColor: alpha(theme.palette.background.paper, 0.8),
          boxShadow: `0 4px 12px ${alpha(theme.palette.common.black, 0.1)}`,
        },
      }}
    >
      <Stack direction="row" spacing={2}>
        <TextAvatar text={review.user?.displayName} />

        <Stack spacing={1.5} flexGrow={1} sx={{ minWidth: 0 }}>
          {/* Header */}
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            flexWrap="wrap"
            gap={1}
          >
            <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap">
              <Typography variant="subtitle1" fontWeight="600">
                {review.user?.displayName}
              </Typography>

              {review.rating && (
                <DisplayStarRating value={review.rating} size="small" />
              )}

              {hasSpoiler && (
                <Chip
                  icon={<WarningAmberIcon sx={{ fontSize: 14 }} />}
                  label="Spoiler"
                  size="small"
                  color="warning"
                  variant="outlined"
                  sx={{ height: 22 }}
                />
              )}
            </Stack>

            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="caption" color="text.secondary">
                {dayjs(review.createdAt).fromNow()}
              </Typography>

              {/* Menu for owner or for report */}
              {(isOwner || currentUserId) && (
                <>
                  <IconButton
                    size="small"
                    onClick={(e) => setAnchorEl(e.currentTarget)}
                    disabled={onRequest}
                  >
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                  <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={() => setAnchorEl(null)}
                  >
                    {isOwner ? (
                      [
                        <MenuItem key="edit" onClick={() => { setIsEditing(true); setAnchorEl(null); }}>
                          <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
                          <ListItemText>Edit</ListItemText>
                        </MenuItem>,
                        <MenuItem key="delete" onClick={handleRemove} sx={{ color: "error.main" }}>
                          <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
                          <ListItemText>Delete</ListItemText>
                        </MenuItem>
                      ]
                    ) : (
                      <MenuItem
                        onClick={handleReportClick}
                        disabled={hasReported}
                        sx={{ color: hasReported ? "text.disabled" : "warning.main" }}
                      >
                        <ListItemIcon>
                          {hasReported ? (
                            <FlagIcon fontSize="small" color="disabled" />
                          ) : (
                            <FlagOutlinedIcon fontSize="small" color="warning" />
                          )}
                        </ListItemIcon>
                        <ListItemText>{hasReported ? "Reported" : "Report"}</ListItemText>
                      </MenuItem>
                    )}
                  </Menu>
                </>
              )}
            </Stack>
          </Stack>

          {/* Content - Edit Mode */}
          {isEditing ? (
            <Box sx={{ mt: 1 }}>
              <TextField
                fullWidth
                multiline
                rows={3}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="Edit your review..."
                variant="outlined"
                size="small"
              />

              <Stack direction="row" alignItems="center" spacing={2} sx={{ mt: 2 }} flexWrap="wrap" gap={1}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Typography variant="body2">Rating:</Typography>
                  <Rating
                    value={editRating}
                    onChange={(_, value) => setEditRating(value || 0)}
                    precision={0.5}
                    size="small"
                  />
                </Stack>

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={editContainsSpoilers}
                      onChange={(e) => setEditContainsSpoilers(e.target.checked)}
                      size="small"
                    />
                  }
                  label={<Typography variant="body2">Contains spoilers</Typography>}
                />
              </Stack>

              <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleEdit}
                  disabled={onRequest || !editContent.trim()}
                >
                  Save
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleCancelEdit}
                  disabled={onRequest}
                >
                  Cancel
                </Button>
              </Stack>
            </Box>
          ) : (
            <>
              {/* Content - View Mode */}
              {hasSpoiler && !showSpoiler ? (
                <Box
                  sx={{
                    py: 2,
                    px: 3,
                    backgroundColor: alpha(theme.palette.warning.main, 0.1),
                    borderRadius: 1,
                    textAlign: "center",
                    cursor: "pointer",
                    border: `1px dashed ${alpha(theme.palette.warning.main, 0.3)}`,
                    transition: "all 0.2s",
                    "&:hover": {
                      backgroundColor: alpha(theme.palette.warning.main, 0.15),
                    },
                  }}
                  onClick={() => setShowSpoiler(true)}
                >
                  <VisibilityOffIcon sx={{ fontSize: 24, color: "warning.main", mb: 0.5 }} />
                  <Typography variant="body2" color="text.secondary">
                    This review contains spoilers. Click to reveal.
                  </Typography>
                </Box>
              ) : (
                <Box>
                  {hasSpoiler && showSpoiler && (
                    <Button
                      size="small"
                      startIcon={<VisibilityIcon />}
                      onClick={() => setShowSpoiler(false)}
                      sx={{ mb: 1 }}
                    >
                      Hide Spoiler
                    </Button>
                  )}
                  <Typography
                    variant="body2"
                    sx={{
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      lineHeight: 1.7,
                    }}
                  >
                    {review.content}
                  </Typography>
                </Box>
              )}

              {/* Actions: Helpful Vote */}
              <Stack direction="row" alignItems="center" spacing={2} sx={{ mt: 2 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Tooltip
                    title={
                      !currentUserId
                        ? "Sign in to vote"
                        : isOwner
                        ? "You can't vote on your own review"
                        : hasUserVoted
                        ? "Remove vote"
                        : "Mark as helpful"
                    }
                    arrow
                  >
                    <span>
                      <IconButton
                        size="small"
                        onClick={handleVoteHelpful}
                        disabled={voteLoading || isOwner || !currentUserId}
                        sx={{
                          color: hasUserVoted ? "primary.main" : "text.secondary",
                          "&:hover": {
                            backgroundColor: alpha(theme.palette.primary.main, 0.1),
                          },
                        }}
                      >
                        {hasUserVoted ? (
                          <ThumbUpIcon fontSize="small" />
                        ) : (
                          <ThumbUpOutlinedIcon fontSize="small" />
                        )}
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Typography variant="caption" color="text.secondary">
                    {review.helpfulVotes || 0} found this helpful
                  </Typography>
                </Stack>
              </Stack>
            </>
          )}
        </Stack>
      </Stack>
    </Box>
  );
};

/**
 * MediaReview Component
 * Manages reviews list and review form
 */
const MediaReview = ({ reviews, media, mediaType, userRating, ratingStats }) => {
  const theme = useTheme();
  const { user } = useSelector((state) => state.user);

  const [listReviews, setListReviews] = useState([]);
  const [filteredReviews, setFilteredReviews] = useState([]);
  const [page, setPage] = useState(1);
  const [onRequest, setOnRequest] = useState(false);
  const [content, setContent] = useState("");
  const [rating, setRating] = useState(0);
  const [containsSpoilers, setContainsSpoilers] = useState(false);
  const [reviewCount, setReviewCount] = useState(0);
  const [sortBy, setSortBy] = useState("newest");
  const [sortAnchorEl, setSortAnchorEl] = useState(null);

  // Report dialog state
  const [reportDialog, setReportDialog] = useState({ open: false, review: null });

  const itemsPerPage = 5;
  const currentUserId = user?.id || user?._id;

  // Calculate rating stats from reviews if not provided
  const computedRatingStats = useMemo(() => {
    if (ratingStats?.averageRating) return ratingStats;

    const ratingsWithValue = reviews.filter((r) => r.rating);
    const avgRating = ratingsWithValue.length > 0
      ? ratingsWithValue.reduce((sum, r) => sum + r.rating, 0) / ratingsWithValue.length
      : null;

    return {
      averageRating: avgRating,
      totalRatings: ratingsWithValue.length,
    };
  }, [reviews, ratingStats]);

  // Check if user already has a review
  const userHasReview = listReviews.some((r) => {
    const reviewUserId = r.user?.id || r.user?._id;
    return currentUserId && reviewUserId && currentUserId.toString() === reviewUserId.toString();
  });

  // Sort reviews helper
  const sortReviews = useCallback((reviewList, sortType) => {
    const sorted = [...reviewList];
    switch (sortType) {
      case "oldest":
        return sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      case "highest":
        return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      case "lowest":
        return sorted.sort((a, b) => (a.rating || 0) - (b.rating || 0));
      case "helpful":
        return sorted.sort((a, b) => (b.helpfulVotes || 0) - (a.helpfulVotes || 0));
      case "newest":
      default:
        return sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
  }, []);

  // Initialize and sort reviews
  useEffect(() => {
    const sorted = sortReviews([...reviews], sortBy);
    setListReviews(sorted);
    setFilteredReviews(sorted.slice(0, itemsPerPage));
    setReviewCount(reviews.length);
  }, [reviews, sortBy, sortReviews]);

  // Set user rating from props
  useEffect(() => {
    if (userRating) {
      setRating(userRating / 2);
    }
  }, [userRating]);

  // Handle sort change
  const handleSortChange = (newSort) => {
    setSortBy(newSort);
    setSortAnchorEl(null);
    setPage(1);
    const sorted = sortReviews([...listReviews], newSort);
    setListReviews(sorted);
    setFilteredReviews(sorted.slice(0, itemsPerPage));
  };

  // Add new review
  const onAddReview = async () => {
    if (onRequest || !content.trim()) {
      toast.warning("Please write a review before posting");
      return;
    }

    setOnRequest(true);

    const body = {
      content: content.trim(),
      rating: rating > 0 ? Math.round(rating * 2) : null,
      mediaId: media.id,
      mediaType,
      mediaTitle: media.title || media.name,
      mediaPoster: media.poster_path,
      containsSpoilers,
    };

    const { response, err } = await reviewApi.add(body);

    setOnRequest(false);

    if (err) {
      toast.error(err.message);
    } else if (response) {
      toast.success("Review posted successfully!");
      const newReview = {
        ...response,
        id: response.id || response._id,
        user: { ...user, id: currentUserId },
        helpfulVotes: 0,
        helpfulVoters: [],
      };

      const newList = [newReview, ...listReviews];
      setListReviews(newList);
      setFilteredReviews(newList.slice(0, page * itemsPerPage));
      setReviewCount((prev) => prev + 1);
      setContent("");
      setRating(0);
      setContainsSpoilers(false);
    }
  };

  // Load more reviews
  const onLoadMore = () => {
    const newPage = page + 1;
    setFilteredReviews(listReviews.slice(0, newPage * itemsPerPage));
    setPage(newPage);
  };

  // Handle review removal
  const onRemoved = (id) => {
    const updatedList = listReviews.filter((review) => {
      const reviewId = review.id || review._id;
      return reviewId?.toString() !== id?.toString();
    });
    setListReviews(updatedList);
    setFilteredReviews(updatedList.slice(0, page * itemsPerPage));
    setReviewCount((prev) => prev - 1);
    toast.success("Review removed successfully!");
  };

  // Handle review update
  const onUpdated = (id, updatedReview) => {
    const updatedList = listReviews.map((review) => {
      const reviewId = review.id || review._id;
      if (reviewId?.toString() === id?.toString()) {
        return { ...review, ...updatedReview };
      }
      return review;
    });
    setListReviews(updatedList);
    setFilteredReviews(updatedList.slice(0, page * itemsPerPage));
  };

  // Handle vote update
  const onVoteUpdated = (id, voteData) => {
    const updatedList = listReviews.map((review) => {
      const reviewId = review.id || review._id;
      if (reviewId?.toString() === id?.toString()) {
        // Update helpfulVoters array
        let updatedVoters = [...(review.helpfulVoters || [])];
        if (voteData.hasVoted) {
          // Add current user to voters
          if (!updatedVoters.includes(currentUserId)) {
            updatedVoters.push(currentUserId);
          }
        } else {
          // Remove current user from voters
          updatedVoters = updatedVoters.filter(
            (voterId) => voterId?.toString() !== currentUserId?.toString()
          );
        }
        return {
          ...review,
          helpfulVotes: voteData.helpfulVotes,
          helpfulVoters: updatedVoters,
        };
      }
      return review;
    });
    setListReviews(updatedList);
    setFilteredReviews(updatedList.slice(0, page * itemsPerPage));
  };

  // Handle report click
  const handleReportClick = (review) => {
    setReportDialog({ open: true, review });
  };

  // Handle report submitted
  const handleReportSubmitted = (reviewId) => {
    // Mark review as reported locally
    const updatedList = listReviews.map((review) => {
      const id = review.id || review._id;
      if (id?.toString() === reviewId?.toString()) {
        return { ...review, hasReported: true };
      }
      return review;
    });
    setListReviews(updatedList);
    setFilteredReviews(updatedList.slice(0, page * itemsPerPage));
  };

  // Get unique key for review
  const getReviewKey = (item) =>
    item.id || item._id || `review-${item.mediaId}-${item.createdAt}`;

  return (
    <Container
      header={
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h5" fontWeight="700">
            Reviews ({reviewCount})
          </Typography>

          {reviewCount > 1 && (
            <>
              <Button
                size="small"
                startIcon={<SortIcon />}
                onClick={(e) => setSortAnchorEl(e.currentTarget)}
                sx={{
                  textTransform: "none",
                  color: "text.secondary",
                }}
              >
                {SORT_OPTIONS.find((o) => o.value === sortBy)?.label}
              </Button>
              <Menu
                anchorEl={sortAnchorEl}
                open={Boolean(sortAnchorEl)}
                onClose={() => setSortAnchorEl(null)}
              >
                {SORT_OPTIONS.map((option) => (
                  <MenuItem
                    key={option.value}
                    selected={sortBy === option.value}
                    onClick={() => handleSortChange(option.value)}
                  >
                    {option.label}
                  </MenuItem>
                ))}
              </Menu>
            </>
          )}
        </Stack>
      }
    >
      {/* Rating Distribution Chart */}
      {computedRatingStats.totalRatings > 0 && (
        <RatingDistribution
          reviews={listReviews}
          averageRating={computedRatingStats.averageRating}
          totalRatings={computedRatingStats.totalRatings}
        />
      )}

      <Stack spacing={2} marginBottom={3}>
        {filteredReviews.length > 0 ? (
          filteredReviews.map((item) =>
            item.user ? (
              <ReviewItem
                key={getReviewKey(item)}
                review={item}
                onRemoved={onRemoved}
                onUpdated={onUpdated}
                onVoteUpdated={onVoteUpdated}
                currentUserId={currentUserId}
                onReportClick={handleReportClick}
              />
            ) : null
          )
        ) : (
          <Box
            sx={{
              textAlign: "center",
              py: 4,
              px: 3,
              backgroundColor: alpha(theme.palette.background.paper, 0.6),
              borderRadius: 2,
            }}
          >
            <Typography color="text.secondary">
              No reviews yet. Be the first to share your thoughts!
            </Typography>
          </Box>
        )}

        {filteredReviews.length < listReviews.length && (
          <Button
            onClick={onLoadMore}
            variant="outlined"
            sx={{ mt: 2, alignSelf: "center" }}
          >
            Load More Reviews ({listReviews.length - filteredReviews.length} remaining)
          </Button>
        )}
      </Stack>

      {/* Review Form */}
      {user && !userHasReview && (
        <>
          <Divider sx={{ my: 3 }} />
          <Box
            sx={{
              backgroundColor: alpha(theme.palette.background.paper, 0.6),
              backdropFilter: "blur(8px)",
              p: 3,
              borderRadius: 2,
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            }}
          >
            <Stack direction="row" spacing={2}>
              <TextAvatar text={user.displayName} />
              <Stack spacing={2} flexGrow={1}>
                <Typography variant="subtitle1" fontWeight="600">
                  {user.displayName}
                </Typography>

                {/* Rating Input */}
                <Stack direction="row" alignItems="center" spacing={2} flexWrap="wrap" gap={1}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography variant="body2" color="text.secondary">
                      Your Rating:
                    </Typography>
                    <Rating
                      name="user-rating"
                      value={rating}
                      onChange={(_, newValue) => setRating(newValue || 0)}
                      precision={0.5}
                      size="large"
                      emptyIcon={<StarIcon style={{ opacity: 0.4 }} fontSize="inherit" />}
                      sx={{
                        "& .MuiRating-iconFilled": { color: "#f5c518" },
                        "& .MuiRating-iconHover": { color: "#f5c518" },
                      }}
                    />
                    {rating > 0 && (
                      <Chip
                        label={`${Math.round(rating * 2)}/10`}
                        size="small"
                        color="primary"
                      />
                    )}
                  </Stack>

                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={containsSpoilers}
                        onChange={(e) => setContainsSpoilers(e.target.checked)}
                        size="small"
                      />
                    }
                    label={
                      <Stack direction="row" alignItems="center" spacing={0.5}>
                        <WarningAmberIcon sx={{ fontSize: 16, color: "warning.main" }} />
                        <Typography variant="body2">Contains spoilers</Typography>
                      </Stack>
                    }
                  />
                </Stack>

                {/* Review Content */}
                <Box sx={{ position: "relative" }}>
                <TextField
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  multiline
                  rows={4}
                  placeholder="Share your thoughts about this title..."
                  variant="outlined"
                  fullWidth
                  inputProps={{ maxLength: 2000 }}
                  helperText={`${content.length}/2000 characters`}
                />
                  <Box
                    sx={{
                      position: "absolute",
                      right: 8,
                      bottom: 28,
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <EmojiPicker 
                      onEmojiSelect={(emoji) => setContent((prev) => prev + emoji)}
                      disabled={content.length >= 1990}
                    />
                  </Box>
                </Box>

                <LoadingButton
                  variant="contained"
                  size="large"
                  startIcon={<SendOutlinedIcon />}
                  loading={onRequest}
                  onClick={onAddReview}
                  disabled={!content.trim()}
                  sx={{ alignSelf: "flex-start" }}
                >
                  Post Review
                </LoadingButton>
              </Stack>
            </Stack>
          </Box>
        </>
      )}

      {user && userHasReview && (
        <Alert severity="info" sx={{ mt: 2 }}>
          You've already reviewed this title. You can edit or delete your review above.
        </Alert>
      )}

      {!user && (
        <Alert severity="info" sx={{ mt: 2 }}>
          Please sign in to write a review.
        </Alert>
      )}

      {/* Report Dialog */}
      <ReportDialog
        open={reportDialog.open}
        onClose={() => setReportDialog({ open: false, review: null })}
        reviewId={reportDialog.review?.id || reportDialog.review?._id}
        onReportSubmitted={handleReportSubmitted}
      />
    </Container>
  );
};

export default MediaReview;
