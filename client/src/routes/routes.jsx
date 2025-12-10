/**
 * Application Routes Configuration
 * Includes all pages with proper protection
 */

import HomePage from "../pages/HomePage";
import PersonDetail from "../pages/PersonDetail";
import FavoriteList from "../pages/FavoriteList";
import MediaDetail from "../pages/MediaDetail";
import MediaList from "../pages/MediaList";
import MediaSearch from "../pages/MediaSearch";
import PasswordUpdate from "../pages/PasswordUpdate";
import ReviewList from "../pages/ReviewList";
import WatchlistPage from "../pages/WatchlistPage";
import ProtectedPage from "../components/common/ProtectedPage";
import AdminProtectedPage from "../components/common/AdminProtectedPage";
import FeedbackSpreadsheet from "../pages/FeedbackSpreadsheet";
import AdminPanel from "../pages/admin/AdminPanel";
import VerifyEmail from "../pages/VerifyEmail";

import {
  PrivacyPolicyPage,
  TermsOfServicePage,
  DMCAPage,
  CookiePolicyPage,
  HelpCenterPage,
  ContactPage,
  FAQPage,
  ReportIssuePage,
  AboutPage,
  CareersPage,
  PressPage,
} from "../pages/static";

/**
 * Route generator functions for constructing dynamic paths
 */
export const routesGen = {
  home: "/",
  mediaList: (type) => `/${type}`,
  mediaDetail: (type, id) => `/${type}/${id}`,
  mediaSearch: "/search",
  person: (id) => `/person/${id}`,
  favoriteList: "/favorites",
  reviewList: "/reviews",
  watchlist: "/watchlist",
  feedback: "/feedback",
  passwordUpdate: "/password-update",
  adminPanel: "/admin",
};

/**
 * Static route configuration
 * Note: Static pages must be defined BEFORE dynamic routes like /:mediaType
 */
const routes = [
  {
    index: true,
    element: <HomePage />,
    state: "home",
  },
  {
    path: "/person/:personId",
    element: <PersonDetail />,
    state: "person.detail",
  },
  {
    path: "/search",
    element: <MediaSearch />,
    state: "search",
  },
  {
    path: "/password-update",
    element: (
      <ProtectedPage>
        <PasswordUpdate />
      </ProtectedPage>
    ),
    state: "password.update",
  },
  {
    path: "/favorites",
    element: (
      <ProtectedPage>
        <FavoriteList />
      </ProtectedPage>
    ),
    state: "favorites",
  },
  {
    path: "/watchlist",
    element: (
      <ProtectedPage>
        <WatchlistPage />
      </ProtectedPage>
    ),
    state: "watchlist",
  },
  {
    path: "/reviews",
    element: (
      <ProtectedPage>
        <ReviewList />
      </ProtectedPage>
    ),
    state: "reviews",
  },
  {
    path: "/feedback",
    element: <FeedbackSpreadsheet />,
    state: "feedback",
  },
  // Email Verification
  {
    path: "/verify-email/:token",
    element: <VerifyEmail />,
    state: "verify-email",
  },
  // Admin Panel (Protected - Moderator+ only)
  {
    path: "/admin",
    element: (
      <AdminProtectedPage requiredRole="moderator">
        <AdminPanel />
      </AdminProtectedPage>
    ),
    state: "admin",
  },
  // Static Pages - Legal
  {
    path: "/privacy-policy",
    element: <PrivacyPolicyPage />,
    state: "privacy-policy",
  },
  {
    path: "/terms",
    element: <TermsOfServicePage />,
    state: "terms",
  },
  {
    path: "/dmca",
    element: <DMCAPage />,
    state: "dmca",
  },
  {
    path: "/cookies",
    element: <CookiePolicyPage />,
    state: "cookies",
  },
  // Static Pages - Support
  {
    path: "/help",
    element: <HelpCenterPage />,
    state: "help",
  },
  {
    path: "/contact",
    element: <ContactPage />,
    state: "contact",
  },
  {
    path: "/faq",
    element: <FAQPage />,
    state: "faq",
  },
  {
    path: "/report",
    element: <ReportIssuePage />,
    state: "report",
  },
  // Static Pages - Corporate
  {
    path: "/about",
    element: <AboutPage />,
    state: "about",
  },
  {
    path: "/careers",
    element: <CareersPage />,
    state: "careers",
  },
  {
    path: "/press",
    element: <PressPage />,
    state: "press",
  },
  // Dynamic Routes - These MUST be last
  {
    path: "/:mediaType",
    element: <MediaList />,
  },
  {
    path: "/:mediaType/:mediaId",
    element: <MediaDetail />,
  },
];

export default routes;
