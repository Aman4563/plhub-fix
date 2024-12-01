import { LoadingButton } from "@mui/lab";
import { Box, Button, Divider, Stack, TextField, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import SendOutlinedIcon from "@mui/icons-material/SendOutlined";
import DeleteIcon from "@mui/icons-material/Delete";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import { useSelector } from "react-redux";
import Container from "./Container";
import reviewApi from "../../api/modules/review.api";
import TextAvatar from "./TextAvatar";

/**
 * ReviewItem Component
 * - Displays a single review with the user's name, avatar, content, and timestamp.
 * - Allows the logged-in user to remove their own reviews.
 *
 * @param {Object} props - Component props.
 * @param {Object} props.review - Review object containing review details.
 * @param {Function} props.onRemoved - Callback function to handle review removal.
 */
const ReviewItem = ({ review, onRemoved }) => {
  const { user } = useSelector((state) => state.user);
  const [onRequest, setOnRequest] = useState(false);

  const onRemove = async () => {
    if (onRequest) return;
    setOnRequest(true);

    const { response, err } = await reviewApi.remove({ reviewId: review.id });

    setOnRequest(false);

    if (err) {
      toast.error(err.message);
    } else if (response) {
      onRemoved(review.id);
    }
  };

  return (
    <Box
      sx={{
        padding: 2,
        borderRadius: "5px",
        position: "relative",
        opacity: onRequest ? 0.6 : 1,
        "&:hover": { backgroundColor: "background.paper" },
      }}
    >
      <Stack direction="row" spacing={2}>
        <TextAvatar text={review.user?.displayName} />
        <Stack spacing={2} flexGrow={1}>
          <Stack spacing={1}>
            <Typography variant="h6" fontWeight="700">
              {review.user?.displayName}
            </Typography>
            <Typography variant="caption">
              {dayjs(review.createdAt).format("DD-MM-YYYY HH:mm:ss")}
            </Typography>
          </Stack>
          <Typography variant="body1" textAlign="justify">
            {review.content}
          </Typography>
          {user?.id === review.user.id && (
            <LoadingButton
              variant="contained"
              startIcon={<DeleteIcon />}
              loading={onRequest}
              onClick={onRemove}
              sx={{
                position: { xs: "relative", md: "absolute" },
                right: { xs: 0, md: "10px" },
                marginTop: { xs: 2, md: 0 },
                width: "max-content",
              }}
            >
              Remove
            </LoadingButton>
          )}
        </Stack>
      </Stack>
    </Box>
  );
};

/**
 * MediaReview Component
 * - Manages a list of reviews for a specific media.
 * - Allows authenticated users to post new reviews and remove their own reviews.
 *
 * @param {Object} props - Component props.
 * @param {Array} props.reviews - Initial list of reviews for the media.
 * @param {Object} props.media - Media object containing media details.
 * @param {string} props.mediaType - Type of the media (e.g., "movie" or "tv").
 */
const MediaReview = ({ reviews, media, mediaType }) => {
  const { user } = useSelector((state) => state.user);

  const [listReviews, setListReviews] = useState([]);
  const [filteredReviews, setFilteredReviews] = useState([]);
  const [page, setPage] = useState(1);
  const [onRequest, setOnRequest] = useState(false);
  const [content, setContent] = useState("");
  const [reviewCount, setReviewCount] = useState(0);

  const itemsPerPage = 4;

  useEffect(() => {
    setListReviews([...reviews]);
    setFilteredReviews([...reviews].slice(0, itemsPerPage));
    setReviewCount(reviews.length);
  }, [reviews]);

  const onAddReview = async () => {
    if (onRequest || !content.trim()) return;

    setOnRequest(true);

    const body = {
      content,
      mediaId: media.id,
      mediaType,
      mediaTitle: media.title || media.name,
      mediaPoster: media.poster_path,
    };

    const { response, err } = await reviewApi.add(body);

    setOnRequest(false);

    if (err) {
      toast.error(err.message);
    } else if (response) {
      toast.success("Review posted successfully!");
      setFilteredReviews([response, ...filteredReviews]);
      setReviewCount((prev) => prev + 1);
      setContent("");
    }
  };

  const onLoadMore = () => {
    setFilteredReviews((prev) => [
      ...prev,
      ...listReviews.slice(page * itemsPerPage, (page + 1) * itemsPerPage),
    ]);
    setPage((prev) => prev + 1);
  };

  const onRemoved = (id) => {
    const updatedList = listReviews.filter((review) => review.id !== id);
    setListReviews(updatedList);
    setFilteredReviews(updatedList.slice(0, page * itemsPerPage));
    setReviewCount((prev) => prev - 1);

    toast.success("Review removed successfully!");
  };

  return (
    <Container header={`Reviews (${reviewCount})`}>
      <Stack spacing={4} marginBottom={2}>
        {filteredReviews.map(
          (item) =>
            item.user && (
              <Box key={item.id}>
                <ReviewItem review={item} onRemoved={onRemoved} />
                <Divider sx={{ display: { xs: "block", md: "none" } }} />
              </Box>
            )
        )}
        {filteredReviews.length < listReviews.length && (
          <Button onClick={onLoadMore}>Load More</Button>
        )}
      </Stack>
      {user && (
        <>
          <Divider />
          <Stack direction="row" spacing={2}>
            <TextAvatar text={user.displayName} />
            <Stack spacing={2} flexGrow={1}>
              <Typography variant="h6" fontWeight="700">
                {user.displayName}
              </Typography>
              <TextField
                value={content}
                onChange={(e) => setContent(e.target.value)}
                multiline
                rows={4}
                placeholder="Write your review"
                variant="outlined"
              />
              <LoadingButton
                variant="contained"
                size="large"
                startIcon={<SendOutlinedIcon />}
                loading={onRequest}
                onClick={onAddReview}
              >
                Post
              </LoadingButton>
            </Stack>
          </Stack>
        </>
      )}
    </Container>
  );
};

export default MediaReview;
