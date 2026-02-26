import {
  Box,
  Modal,
  Typography,
  TextField,
  Button,
  Alert,
  useMediaQuery,
  useTheme,
  IconButton,
  Fade,
  alpha,
} from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { Close, PlayArrow, Bookmark, TrendingUp } from "@mui/icons-material";
import { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setAuthModalOpen, clearAuthError } from "../../redux/features/authModalSlice";
import { toast } from "react-toastify";
import SigninForm from "./SigninForm";
import SignupForm from "./SignupForm";
import userApi from "../../api/modules/user.api";
import {
  getInputSx,
  getPrimaryButtonSx,
  getAlertSx,
  validationMessages,
} from "../../utils/formStyles";

const actionState = {
  signin: "signin",
  signup: "signup",
  forgotPassword: "forgotPassword",
};

/**
 * Default movie poster images for the cinematic background animation.
 * These are popular movie posters from TMDB that serve as fallback images.
 * In production, these could be replaced with dynamically fetched trending movie posters.
 * 
 * Note: If any image fails to load, CSS handles the graceful fallback with a gradient background.
 */
const DEFAULT_POSTER_IMAGES = [
  "https://image.tmdb.org/t/p/w342/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg",
  "https://image.tmdb.org/t/p/w342/qjGGOCjvgCb7S3FTvDcfwMuqkKB.jpg",
  "https://image.tmdb.org/t/p/w342/rjkmN1dniUHVYAtwuV3Tji7FsDO.jpg",
  "https://image.tmdb.org/t/p/w342/kPwfYxMvZeJhkfXQBc9cXdqfB2W.jpg",
  "https://image.tmdb.org/t/p/w342/lzWHmYdfeFiMIY4JaMmtR7GEli3.jpg",
  "https://image.tmdb.org/t/p/w342/vZloFAK7NmvMGKE7VkF5UHaz0I.jpg",
  "https://image.tmdb.org/t/p/w342/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg",
  "https://image.tmdb.org/t/p/w342/ngl2FKBlU4fhbdsrtdom9LVLBXw.jpg",
  "https://image.tmdb.org/t/p/w342/d5NXSklXo0qyIYkgV94XAgMIckC.jpg",
  "https://image.tmdb.org/t/p/w342/1E5baAaEse26fej7uHcjOgEE2t2.jpg",
  "https://image.tmdb.org/t/p/w342/qNBAXBIQlnOThrVvA6mA2B5ggV6.jpg",
  "https://image.tmdb.org/t/p/w342/sv1xJUazXeYqALzczSZ3O6nkH75.jpg",
];

// Use default posters (could be enhanced to fetch trending posters dynamically)
const posterImages = DEFAULT_POSTER_IMAGES;

/**
 * Animated Cinematic Background - Full screen with moving posters
 */
const CinematicBackground = () => {
  const theme = useTheme();

  return (
    <Box sx={{ position: "absolute", inset: 0, overflow: "hidden", zIndex: 0 }}>
      {/* Animated Poster Grid */}
      <Box
        sx={{
          position: "absolute",
          inset: "-25%",
          display: "flex",
          flexDirection: "column",
          gap: 1.5,
          transform: "rotate(-12deg)",
        }}
      >
        {[0, 1, 2, 3, 4, 5].map((rowIndex) => (
          <Box
            key={rowIndex}
            sx={{
              display: "flex",
              gap: 1.5,
              animation: `scrollRow${rowIndex % 2 === 0 ? "Left" : "Right"} ${40 + rowIndex * 5}s linear infinite`,
              animationDelay: `${rowIndex * -3}s`,
              "@keyframes scrollRowLeft": {
                "0%": { transform: "translateX(0%)" },
                "100%": { transform: "translateX(-50%)" },
              },
              "@keyframes scrollRowRight": {
                "0%": { transform: "translateX(-50%)" },
                "100%": { transform: "translateX(0%)" },
              },
              "@media (prefers-reduced-motion: reduce)": {
                animation: "none",
              },
            }}
          >
            {[...posterImages, ...posterImages].map((src, index) => (
              <Box
                key={`${rowIndex}-${index}`}
                sx={{
                  flexShrink: 0,
                  width: { xs: 100, sm: 130, md: 160 },
                  height: { xs: 150, sm: 195, md: 240 },
                  backgroundImage: `url(${src}), linear-gradient(135deg, rgba(229,9,20,0.3) 0%, rgba(20,20,20,0.9) 100%)`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  backgroundColor: alpha("#1a0505", 0.8),
                  borderRadius: 2,
                  opacity: 0.7,
                  boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                  transition: "all 0.4s ease",
                  animation: `posterGlow ${12 + (index % 4) * 3}s ease-in-out infinite`,
                  animationDelay: `${(index % 6) * 0.8}s`,
                  "@keyframes posterGlow": {
                    "0%, 100%": { 
                      opacity: 0.6, 
                      transform: "scale(1)",
                      filter: "brightness(0.9)",
                    },
                    "50%": { 
                      opacity: 0.8, 
                      transform: "scale(1.02)",
                      filter: "brightness(1.1)",
                    },
                  },
                  "@media (prefers-reduced-motion: reduce)": {
                    animation: "none",
                    opacity: 0.6,
                  },
                }}
              />
            ))}
          </Box>
        ))}
      </Box>

      {/* Gradient overlays for depth */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background: `
            linear-gradient(135deg, 
              ${alpha("#000", 0.75)} 0%, 
              ${alpha("#1a0505", 0.65)} 30%, 
              ${alpha("#0a0a0a", 0.7)} 50%, 
              ${alpha("#0d0505", 0.65)} 70%, 
              ${alpha("#000", 0.75)} 100%
            )
          `,
        }}
      />

      {/* Animated red accent glows */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background: `
            radial-gradient(ellipse 100% 80% at 10% 20%, ${alpha(theme.palette.primary.main, 0.2)} 0%, transparent 50%),
            radial-gradient(ellipse 80% 100% at 90% 80%, ${alpha(theme.palette.primary.dark, 0.15)} 0%, transparent 45%),
            radial-gradient(ellipse 60% 60% at 50% 50%, ${alpha(theme.palette.primary.main, 0.08)} 0%, transparent 60%)
          `,
          animation: "glowFloat 8s ease-in-out infinite",
          "@keyframes glowFloat": {
            "0%, 100%": { opacity: 1, transform: "scale(1)" },
            "50%": { opacity: 0.7, transform: "scale(1.1)" },
          },
          "@media (prefers-reduced-motion: reduce)": {
            animation: "none",
            opacity: 0.85,
          },
        }}
      />

      {/* Subtle noise texture */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          opacity: 0.03,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          pointerEvents: "none",
        }}
      />

      {/* Vignette */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.5) 100%)",
        }}
      />
    </Box>
  );
};

/**
 * AuthModal Component
 */
const AuthModal = () => {
  const { authModalOpen } = useSelector((state) => state.authModal);
  const dispatch = useDispatch();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.down("md"));

  const [action, setAction] = useState(actionState.signin);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState(null);
  const [forgotPasswordError, setForgotPasswordError] = useState(null);

  useEffect(() => {
    if (authModalOpen) {
      setAction(actionState.signin);
      dispatch(clearAuthError());
      setForgotPasswordEmail("");
      setForgotPasswordMessage(null);
      setForgotPasswordError(null);
    }
  }, [authModalOpen, dispatch]);

  const handleClose = useCallback(() => {
    dispatch(setAuthModalOpen(false));
    dispatch(clearAuthError());
    setForgotPasswordEmail("");
    setForgotPasswordMessage(null);
    setForgotPasswordError(null);
  }, [dispatch]);

  const switchAuthState = useCallback(
    (state) => {
      setAction(state);
      dispatch(clearAuthError());
      setForgotPasswordMessage(null);
      setForgotPasswordError(null);
    },
    [dispatch]
  );

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    setForgotPasswordError(null);
    setForgotPasswordMessage(null);

    if (!forgotPasswordEmail) {
      setForgotPasswordError(validationMessages.email.required);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(forgotPasswordEmail)) {
      setForgotPasswordError(validationMessages.email.invalid);
      return;
    }

    setForgotPasswordLoading(true);

    try {
      const { response, err } = await userApi.forgotPassword({ email: forgotPasswordEmail });
      if (err) {
        setForgotPasswordError(err.message || "Failed to send reset email.");
      } else {
        setForgotPasswordMessage(response?.message || "Password reset link sent to your email.");
        toast.success("Password reset email sent!");
        setForgotPasswordEmail("");
      }
    } catch {
      setForgotPasswordError("An error occurred. Please try again.");
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const inputSx = getInputSx(theme);
  const primaryButtonSx = getPrimaryButtonSx(theme);
  const alertSx = getAlertSx(theme);

  const renderForgotPasswordForm = () => (
    <Box component="form" onSubmit={handleForgotPasswordSubmit} sx={{ width: "100%" }}>
      <TextField
        type="email"
        label="Email Address"
        name="email"
        fullWidth
        value={forgotPasswordEmail}
        onChange={(e) => setForgotPasswordEmail(e.target.value)}
        autoComplete="email"
        autoFocus
        sx={{ ...inputSx, mb: 2.5 }}
      />

      {forgotPasswordError && (
        <Alert severity="error" variant="filled" sx={{ ...alertSx, mb: 2.5 }}>
          {forgotPasswordError}
        </Alert>
      )}

      {forgotPasswordMessage && (
        <Alert
          severity="success"
          variant="filled"
          sx={{ ...alertSx, mb: 2.5, backgroundColor: alpha(theme.palette.success.main, 0.9) }}
        >
          {forgotPasswordMessage}
        </Alert>
      )}

      <LoadingButton
        type="submit"
        fullWidth
        size="large"
        variant="contained"
        loading={forgotPasswordLoading}
        sx={primaryButtonSx}
      >
        Send Reset Link
      </LoadingButton>

      <Button
        fullWidth
        size="medium"
        sx={{
          mt: 2.5,
          color: alpha("#fff", 0.65),
          fontSize: "1rem",
          textTransform: "none",
          "&:hover": { color: theme.palette.primary.main, background: "transparent" },
        }}
        onClick={() => switchAuthState(actionState.signin)}
      >
        Back to Sign In
      </Button>
    </Box>
  );

  const features = [
    { icon: <PlayArrow />, title: "50K+ Titles", desc: "Movies & TV Shows" },
    { icon: <Bookmark />, title: "Watchlists", desc: "Track favorites" },
    { icon: <TrendingUp />, title: "Trending", desc: "Stay updated" },
  ];

  return (
    <Modal
      open={authModalOpen}
      onClose={handleClose}
      closeAfterTransition
      sx={{
        "& .MuiBackdrop-root": {
          backgroundColor: alpha("#000", 0.9),
          backdropFilter: "blur(8px)",
        },
      }}
    >
      <Fade in={authModalOpen} timeout={300}>
        <Box
          sx={{
            position: "fixed",
            inset: 0,
            display: "flex",
            outline: "none",
            overflow: "hidden",
          }}
        >
          {/* Full-screen Animated Background - visible on both sides */}
          <CinematicBackground />

          {/* Left Panel - Info Section */}
          {!isMobile && (
            <Box
              sx={{
                width: isTablet ? "40%" : "45%",
                height: "100%",
                position: "relative",
                display: "flex",
                alignItems: "center",
                zIndex: 1,
              }}
            >
              <Box sx={{ width: "100%", px: { sm: 4, md: 6, lg: 8 }, py: { sm: 4, md: 6 } }}>
                {/* Logo */}
                <Box sx={{ mb: 5 }}>
                  <img
                    src="/logo_v3.svg"
                    alt="PLhub Logo"
                    style={{ height: 52, filter: "drop-shadow(0 4px 16px rgba(0,0,0,0.6))" }}
                  />
                </Box>

                {/* Headline */}
                <Typography
                  sx={{
                    fontWeight: 700,
                    fontSize: { sm: "2.25rem", md: "2.75rem", lg: "3.25rem" },
                    lineHeight: 1.1,
                    color: "#fff",
                    mb: 2.5,
                    textShadow: "0 4px 24px rgba(0,0,0,0.5)",
                  }}
                >
                  Your Entertainment{" "}
                  <Box
                    component="span"
                    sx={{
                      color: theme.palette.primary.main,
                      textShadow: `0 0 40px ${alpha(theme.palette.primary.main, 0.6)}`,
                    }}
                  >
                    Hub
                  </Box>
                </Typography>

                <Typography
                  sx={{
                    color: alpha("#fff", 0.8),
                    mb: 5,
                    lineHeight: 1.7,
                    fontSize: { sm: "1.05rem", md: "1.15rem" },
                    maxWidth: 450,
                    textShadow: "0 2px 8px rgba(0,0,0,0.3)",
                  }}
                >
                  Discover, track, and organize your favorite movies and TV shows all in one place.
                </Typography>

                {/* Feature cards */}
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 5 }}>
                  {features.map((feature, index) => (
                    <Box
                      key={index}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        py: 2,
                        px: 2.5,
                        borderRadius: 2,
                        background: alpha("#000", 0.3),
                        border: `1px solid ${alpha("#fff", 0.1)}`,
                        backdropFilter: "blur(12px)",
                        transition: "all 0.3s ease",
                        "&:hover": {
                          background: alpha("#000", 0.4),
                          borderColor: alpha(theme.palette.primary.main, 0.4),
                          transform: "translateX(8px)",
                        },
                      }}
                    >
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: 1.5,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.3)} 0%, ${alpha(theme.palette.primary.dark, 0.2)} 100%)`,
                          color: theme.palette.primary.main,
                          boxShadow: `0 4px 16px ${alpha(theme.palette.primary.main, 0.3)}`,
                          "& svg": { fontSize: 26 },
                        }}
                      >
                        {feature.icon}
                      </Box>
                      <Box>
                        <Typography sx={{ color: "#fff", fontWeight: 600, fontSize: "1rem" }}>
                          {feature.title}
                        </Typography>
                        <Typography sx={{ color: alpha("#fff", 0.6), fontSize: "0.9rem" }}>
                          {feature.desc}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>

                {/* Stats */}
                <Box
                  sx={{
                    display: "flex",
                    gap: { sm: 4, md: 6 },
                    pt: 4,
                    borderTop: `1px solid ${alpha("#fff", 0.15)}`,
                  }}
                >
                  {[
                    { value: "100K+", label: "Users" },
                    { value: "50K+", label: "Titles" },
                    { value: "4.9★", label: "Rating" },
                  ].map((stat, i) => (
                    <Box key={i}>
                      <Typography
                        sx={{
                          fontWeight: 700,
                          fontSize: { sm: "1.5rem", md: "1.75rem" },
                          color: "#fff",
                          textShadow: "0 2px 8px rgba(0,0,0,0.3)",
                        }}
                      >
                        {stat.value}
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: "0.85rem",
                          color: alpha("#fff", 0.6),
                          textTransform: "uppercase",
                          letterSpacing: 1,
                        }}
                      >
                        {stat.label}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>
          )}

          {/* Right Panel - Form with Glassmorphism (background visible through) */}
          <Box
            sx={{
              width: isMobile ? "100%" : isTablet ? "60%" : "55%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              position: "relative",
              zIndex: 2,
              // Lighter glassmorphism - less blur to show animated background better
              background: alpha(theme.palette.background.default, 0.55),
              backdropFilter: "blur(16px) saturate(140%)",
              borderLeft: isMobile ? "none" : `1px solid ${alpha("#fff", 0.12)}`,
              boxShadow: isMobile ? "none" : `-8px 0 40px ${alpha("#000", 0.4)}`,
              // Inner glow effect
              "&::before": {
                content: '""',
                position: "absolute",
                inset: 0,
                background: `radial-gradient(ellipse at 50% 0%, ${alpha(theme.palette.primary.main, 0.08)} 0%, transparent 50%)`,
                pointerEvents: "none",
              },
            }}
          >
            {/* Close button */}
            <IconButton
              onClick={handleClose}
              sx={{
                position: "absolute",
                top: { xs: 16, sm: 24 },
                right: { xs: 16, sm: 24 },
                zIndex: 10,
                color: alpha("#fff", 0.8),
                bgcolor: alpha("#fff", 0.08),
                width: 44,
                height: 44,
                border: `1px solid ${alpha("#fff", 0.15)}`,
                backdropFilter: "blur(8px)",
                "&:hover": {
                  color: "#fff",
                  bgcolor: alpha("#fff", 0.15),
                  transform: "rotate(90deg)",
                },
                transition: "all 0.3s ease",
              }}
            >
              <Close />
            </IconButton>

            {/* Form Container */}
            <Box
              sx={{
                flex: 1,
                overflowY: "auto",
                overflowX: "hidden",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-start",
                pt: { xs: 10, sm: 12 },
                pb: { xs: 4, sm: 6 },
                px: { xs: 3, sm: 5, md: 6, lg: 8 },
                "&::-webkit-scrollbar": { width: 6 },
                "&::-webkit-scrollbar-track": { background: "transparent" },
                "&::-webkit-scrollbar-thumb": {
                  background: alpha("#fff", 0.2),
                  borderRadius: 3,
                },
              }}
            >
              <Box sx={{ width: "100%", maxWidth: 480 }}>
                {/* Mobile Logo */}
                {isMobile && (
                  <Box sx={{ textAlign: "center", mb: 4 }}>
                    <img src="/logo_v3.svg" alt="PLhub Logo" style={{ height: 44 }} />
                  </Box>
                )}

                {/* Form Header */}
                <Box sx={{ mb: 4 }}>
                  <Typography
                    variant="h4"
                    component="h2"
                    sx={{
                      fontWeight: 700,
                      mb: 1,
                      fontSize: { xs: "1.75rem", sm: "2rem" },
                      color: "#fff",
                    }}
                  >
                    {action === actionState.signin && "Welcome back"}
                    {action === actionState.signup && "Create account"}
                    {action === actionState.forgotPassword && "Reset password"}
                  </Typography>
                  <Typography sx={{ color: alpha("#fff", 0.7), fontSize: "1.05rem" }}>
                    {action === actionState.signin && "Sign in to continue to PLhub"}
                    {action === actionState.signup && "Join PLhub today — it's free"}
                    {action === actionState.forgotPassword && "We'll send you a reset link"}
                  </Typography>
                </Box>

                {/* Forms */}
                {action === actionState.signin && (
                  <SigninForm
                    switchAuthState={() => switchAuthState(actionState.signup)}
                    onForgotPassword={() => switchAuthState(actionState.forgotPassword)}
                  />
                )}

                {action === actionState.signup && (
                  <SignupForm switchAuthState={() => switchAuthState(actionState.signin)} />
                )}

                {action === actionState.forgotPassword && renderForgotPasswordForm()}
              </Box>
            </Box>

            {/* Footer */}
            <Box
              sx={{
                flexShrink: 0,
                py: 2.5,
                px: { xs: 3, sm: 5 },
                borderTop: `1px solid ${alpha("#fff", 0.1)}`,
                textAlign: "center",
                background: alpha("#000", 0.2),
              }}
            >
              <Typography variant="caption" sx={{ color: alpha("#fff", 0.6), fontSize: "0.85rem" }}>
                By continuing, you agree to our{" "}
                <Box
                  component="a"
                  href="/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ color: "primary.main", textDecoration: "none", "&:hover": { textDecoration: "underline" } }}
                >
                  Terms
                </Box>{" "}
                &{" "}
                <Box
                  component="a"
                  href="/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ color: "primary.main", textDecoration: "none", "&:hover": { textDecoration: "underline" } }}
                >
                  Privacy Policy
                </Box>
              </Typography>
            </Box>
          </Box>
        </Box>
      </Fade>
    </Modal>
  );
};

export default AuthModal;
