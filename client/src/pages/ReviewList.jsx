import { LoadingButton } from "@mui/lab";
import { Box, Button, Divider, Stack, Typography } from "@mui/material";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";
import tmdbConfigs from "../api/configs/tmdb.configs";
import reviewApi from "../api/modules/review.api";
import Container from "../components/common/Container";
import uiConfigs from "../configs/ui.configs";
import { setGlobalLoading } from "../redux/features/globalLoadingSlice";
import DeleteIcon from "@mui/icons-material/Delete";
import { routesGen } from "../routes/routes";

/**
 * ReviewItem Component
 * - Displays an individual review.
 * - Allows the user to delete a review.
 *
 * @param {Object} props - Component props.
 * @param {Object} props.review - Review data.
 * @param {Function} props.onRemoved - Callback function to handle review removal.
 */
const ReviewItem = ({ review, onRemoved }) => {
  const [onRequest, setOnRequest] = useState(false);

  /**
   * Handles the removal of a review.
   */
  const onRemove = async () => {
    if (onRequest) return;
    setOnRequest(true);

    const { response, err } = await reviewApi.remove({ reviewId: review.id });
    setOnRequest(false);

    if (err) {
      toast.error(err.message);
      return;
    }

    if (response) {
      toast.success("Review removed successfully");
      onRemoved(review.id);
    }
  };

  return (
    <Box
      sx={{
        position: "relative",
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        padding: 1,
        opacity: onRequest ? 0.6 : 1,
        "&:hover": { backgroundColor: "background.paper" },
      }}
    >
      {/* Media Poster */}
      <Box sx={{ width: { xs: 0, md: "10%" } }}>
        <Link
          to={routesGen.mediaDetail(review.mediaType, review.mediaid)}
          style={{ color: "unset", textDecoration: "none" }}
        >
          <Box
            sx={{
              paddingTop: "160%",
              ...uiConfigs.style.backgroundImage(
                tmdbConfigs.posterPath(review.mediaPoster)
              ),
            }}
          />
        </Link>
      </Box>

      {/* Review Content */}
      <Box
        sx={{
          width: { xs: "100%", md: "80%" },
          padding: { xs: 0, md: "0 2rem" },
        }}
      >
        <Stack spacing={1}>
          {/* Media Title */}
          <Link
            to={routesGen.mediaDetail(review.mediaType, review.mediaid)}
            style={{ color: "unset", textDecoration: "none" }}
          >
            <Typography
              variant="h6"
              sx={{ ...uiConfigs.style.typoLines(1, "left") }}
            >
              {review.mediaTitle}
            </Typography>
          </Link>

          {/* Review Timestamp */}
          <Typography variant="caption">
            {dayjs(review.createdAt).format("DD-MM-YYYY HH:mm:ss")}
          </Typography>

          {/* Review Content */}
          <Typography>{review.content}</Typography>
        </Stack>
      </Box>

      {/* Remove Button */}
      <LoadingButton
        variant="contained"
        sx={{
          position: { xs: "relative", md: "absolute" },
          right: { xs: 0, md: "10px" },
          marginTop: { xs: 2, md: 0 },
          width: "max-content",
        }}
        startIcon={<DeleteIcon />}
        loadingPosition="start"
        loading={onRequest}
        onClick={onRemove}
      >
        Remove
      </LoadingButton>
    </Box>
  );
};

/**
 * ReviewList Component
 * - Displays a list of user reviews.
 * - Supports pagination to load more reviews.
 */
const ReviewList = () => {
  const [reviews, setReviews] = useState([]);
  const [filteredReviews, setFilteredReviews] = useState([]);
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);
  const dispatch = useDispatch();
  const itemsPerPage = 2;

  useEffect(() => {
    /**
     * Fetches the list of reviews.
     */
    const getReviews = async () => {
      dispatch(setGlobalLoading(true));

      const { response, err } = await reviewApi.getList();
      dispatch(setGlobalLoading(false));

      if (err) {
        toast.error(err.message);
        return;
      }

      if (response) {
        setCount(response.length);
        setReviews(response);
        setFilteredReviews(response.slice(0, itemsPerPage));
      }
    };

    getReviews();
  }, [dispatch, itemsPerPage]);

  /**
   * Handles loading more reviews.
   */
  const onLoadMore = () => {
    setFilteredReviews((prev) => [
      ...prev,
      ...reviews.slice(page * itemsPerPage, (page + 1) * itemsPerPage),
    ]);
    setPage((prev) => prev + 1);
  };

  /**
   * Handles the removal of a review.
   *
   * @param {string} id - ID of the review to remove.
   */
  const onRemoved = (id) => {
    const updatedReviews = reviews.filter((review) => review.id !== id);
    setReviews(updatedReviews);
    setFilteredReviews(updatedReviews.slice(0, page * itemsPerPage));
    setCount((prev) => prev - 1);
  };

  return (
    <Box sx={{ ...uiConfigs.style.mainContent }}>
      <Container header={`Your Reviews (${count})`}>
        <Stack spacing={2}>
          {/* Render Each Review */}
          {filteredReviews.map((review) => (
            <Box key={review.id}>
              <ReviewItem review={review} onRemoved={onRemoved} />
              <Divider
                sx={{
                  display: { xs: "block", md: "none" },
                }}
              />
            </Box>
          ))}

          {/* Load More Button */}
          {filteredReviews.length < reviews.length && (
            <Button onClick={onLoadMore}>Load More</Button>
          )}
        </Stack>
      </Container>
    </Box>
  );
};

export default ReviewList;
