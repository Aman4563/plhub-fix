import { ThemeProvider } from "@mui/material/styles";
import { useSelector } from "react-redux";
import { ToastContainer } from "react-toastify";
import CssBaseline from "@mui/material/CssBaseline";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AnimatePresence } from "framer-motion";

import themeConfigs from "./configs/theme.configs";
import MainLayout from "./components/layout/MainLayout";
import routes from "./routes/routes";
import PageWrapper from "./components/common/PageWrapper";

import "react-toastify/dist/ReactToastify.css";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

/**
 * AnimatedRoutes Component
 * Handles route transitions with AnimatePresence
 */
const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<MainLayout />}>
          {routes.map((route, index) => (
            <Route
              key={index}
              path={route.index ? undefined : route.path}
              index={route.index}
              element={
                route.state ? (
                  <PageWrapper state={route.state}>{route.element}</PageWrapper>
                ) : (
                  route.element
                )
              }
            />
          ))}
        </Route>
      </Routes>
    </AnimatePresence>
  );
};

/**
 * App Component
 * - Configures the Material-UI theme based on Redux state.
 * - Integrates `react-toastify` for global notifications.
 * - Sets up the main application routes using React Router with page transitions.
 */
const App = () => {
  const { themeMode } = useSelector((state) => state.themeMode);

  return (
    <HelmetProvider>
      <ThemeProvider theme={themeConfigs.custom({ mode: themeMode })}>
        {/* Toast notifications configuration */}
        <ToastContainer
          position="bottom-left"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          pauseOnFocusLoss
          pauseOnHover
          theme={themeMode}
        />

        {/* Material-UI baseline styles */}
        <CssBaseline />

        {/* Application Routes with Animations */}
        <BrowserRouter>
          <AnimatedRoutes />
        </BrowserRouter>
      </ThemeProvider>
    </HelmetProvider>
  );
};

export default App;
