import HomePage from "../pages/HomePage";
import PersonDetail from "../pages/PersonDetail";
import FavoriteList from "../pages/FavoriteList";
import MediaDetail from "../pages/MediaDetail";
import MediaList from "../pages/MediaList";
import MediaSearch from "../pages/MediaSearch";
import PasswordUpdate from "../pages/PasswordUpdate";
import ReviewList from "../pages/ReviewList";
import ProtectedPage from "../components/common/ProtectedPage";
import FeedbackSpreadsheet from "../pages/FeedbackSpreadsheet";

/**
 * Route generator functions for constructing dynamic paths.
 */
export const routesGen = {
  home: "/", // Home page route
  mediaList: (type) => `/${type}`, // Route for media list (e.g., "movie" or "tv")
  mediaDetail: (type, id) => `/${type}/${id}`, // Route for specific media details
  mediaSearch: "/search", // Route for search page
  person: (id) => `/person/${id}`, // Route for person detail page
  favoriteList: "/favorites", // Route for favorite list page
  reviewList: "/reviews", // Route for review list page
  feedback: "/feedback", // Route for feedback spreadsheet page
  passwordUpdate: "/password-update", // Route for password update page
};

/**
 * Static route configuration for the application.
 * - Defines path-to-component mapping for all routes.
 * - Includes protected routes wrapped with <ProtectedPage>.
 */
const routes = [
  {
    index: true, // Default route
    element: <HomePage />, // Component to render
    state: "home", // State identifier
  },
  {
    path: "/person/:personId", // Dynamic route for person details
    element: <PersonDetail />,
    state: "person.detail",
  },
  {
    path: "/search", // Search page route
    element: <MediaSearch />,
    state: "search",
  },
  {
    path: "/password-update", // Password update page (protected)
    element: (
      <ProtectedPage>
        <PasswordUpdate />
      </ProtectedPage>
    ),
    state: "password.update",
  },
  {
    path: "/favorites", // Favorite list page (protected)
    element: (
      <ProtectedPage>
        <FavoriteList />
      </ProtectedPage>
    ),
    state: "favorites",
  },
  {
    path: "/reviews", // Review list page (protected)
    element: (
      <ProtectedPage>
        <ReviewList />
      </ProtectedPage>
    ),
    state: "reviews",
  },
  {
    path: "/:mediaType", // Dynamic route for media list
    element: <MediaList />,
  },
  {
    path: "/:mediaType/:mediaId", // Dynamic route for media details
    element: <MediaDetail />,
  },
  {
    path: "/feedback", // Feedback spreadsheet page
    element: <FeedbackSpreadsheet />,
  },
];

export default routes;
