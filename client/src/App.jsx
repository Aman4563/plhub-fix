import { ThemeProvider } from "@mui/material/styles";
import { useSelector } from "react-redux";
import { ToastContainer } from "react-toastify";
import CssBaseline from "@mui/material/CssBaseline";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import themeConfigs from "./configs/theme.configs";
import MainLayout from "./components/layout/MainLayout";
import routes from "./routes/routes";
import PageWrapper from "./components/common/PageWrapper";

import "react-toastify/dist/ReactToastify.css";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

/**
 * App Component
 * - Configures the Material-UI theme based on Redux state.
 * - Integrates `react-toastify` for global notifications.
 * - Sets up the main application routes using React Router.
 */
const App = () => {
  const { themeMode } = useSelector((state) => state.themeMode); // Retrieve theme mode from Redux state

  return (
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

      {/* Application Routes */}
      <BrowserRouter>
        <Routes>
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
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;
