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

const actionState = {
  signin: "signin",
  signup: "signup",
  forgotPassword: "forgotPassword",
};

// Movie poster images for the collage
const posterImages = [
  "https://image.tmdb.org/t/p/w342/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg",
  "https://image.tmdb.org/t/p/w342/qjGGOCjvgCb7S3FTvDcfwMuqkKB.jpg",
  "https://image.tmdb.org/t/p/w342/rjkmN1dniUHVYAtwuV3Tji7FsDO.jpg",
  "https://image.tmdb.org/t/p/w342/kPwfYxMvZeJhkfXQBc9cXdqfB2W.jpg",
  "https://image.tmdb.org/t/p/w342/lzWHmYdfeFiMIY4JaMmtR7GEli3.jpg",
  "https://image.tmdb.org/t/p/w342/vZloFAK7NmvMGKE7VkF5UHaz0I.jpg",
  "https://image.tmdb.org/t/p/w342/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg",
  "https://image.tmdb.org/t/p/w342/ngl2FKBlU4fhbdsrtdom9LVLBXw.jpg",
  "https://image.tmdb.org/t/p/w342/d5NXSklXo0qyIYkgV94XAgMIckC.jpg",
];

/**
 * CinematicBackground Component
 * Netflix-inspired background with poster collage - covers entire modal
 */
const CinematicBackground = ({ variant = "full" }) => {
  const theme = useTheme();
  
  // Lighter overlay for the left panel, darker for full background
  const overlayOpacity = variant === "left" ? 0.75 : 0.88;
  
  return (
    <Box sx={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      {/* Poster collage grid */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gridTemplateRows: "repeat(3, 1fr)",
          gap: 0.5,
          position: "absolute",
          top: "-10%",
          left: "-10%",
          right: "-10%",
          bottom: "-10%",
          transform: "rotate(-3deg) scale(1.2)",
          animation: "cinematicDrift 60s ease-in-out infinite",
          "@keyframes cinematicDrift": {
            "0%, 100%": { transform: "rotate(-3deg) scale(1.2) translate(0, 0)" },
            "25%": { transform: "rotate(-3deg) scale(1.2) translate(-0.5%, 0.5%)" },
            "50%": { transform: "rotate(-3deg) scale(1.2) translate(-1%, 1%)" },
            "75%": { transform: "rotate(-3deg) scale(1.2) translate(-0.5%, 0.5%)" },
          },
        }}
      >
        {[...posterImages, ...posterImages.slice(0, 3)].map((src, index) => (
          <Box
            key={index}
            sx={{
              backgroundImage: `url(${src})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              borderRadius: 1,
              opacity: 0.5,
              animation: `posterPulse ${20 + (index % 5) * 3}s ease-in-out infinite`,
              animationDelay: `${index * 0.5}s`,
              "@keyframes posterPulse": {
                "0%, 100%": { opacity: 0.4, transform: "scale(1)" },
                "50%": { opacity: 0.6, transform: "scale(1.02)" },
              },
            }}
          />
        ))}
      </Box>

      {/* Dark gradient overlay - Netflix style */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background: `
            linear-gradient(
              135deg,
              ${alpha("#000", 0.92)} 0%,
              ${alpha("#1a0505", overlayOpacity)} 25%,
              ${alpha("#0a0a0a", overlayOpacity)} 50%,
              ${alpha("#0d0505", overlayOpacity)} 75%,
              ${alpha("#000", 0.94)} 100%
            )
          `,
        }}
      />

      {/* Animated red accent glow */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background: `
            radial-gradient(ellipse at 15% 25%, ${alpha(theme.palette.primary.main, 0.15)} 0%, transparent 45%),
            radial-gradient(ellipse at 85% 75%, ${alpha(theme.palette.primary.dark, 0.1)} 0%, transparent 40%),
            radial-gradient(ellipse at 50% 50%, ${alpha(theme.palette.primary.main, 0.05)} 0%, transparent 60%)
          `,
          animation: "glowPulse 8s ease-in-out infinite",
          "@keyframes glowPulse": {
            "0%, 100%": { opacity: 1 },
            "50%": { opacity: 0.7 },
          },
        }}
      />

      {/* Subtle scanlines effect */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)",
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
 * AuthModal Component - Netflix/IMDb Inspired Design
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

  const handleClose = () => {
    dispatch(setAuthModalOpen(false));
    dispatch(clearAuthError());
    setForgotPasswordEmail("");
    setForgotPasswordMessage(null);
    setForgotPasswordError(null);
  };

  const switchAuthState = useCallback((state) => {
    setAction(state);
    dispatch(clearAuthError());
    setForgotPasswordMessage(null);
    setForgotPasswordError(null);
  }, [dispatch]);

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    setForgotPasswordError(null);
    setForgotPasswordMessage(null);

    if (!forgotPasswordEmail) {
      setForgotPasswordError("Please enter your email address.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(forgotPasswordEmail)) {
      setForgotPasswordError("Please enter a valid email address.");
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

  const renderForgotPasswordForm = () => (
    <Box component="form" onSubmit={handleForgotPasswordSubmit}>
      <TextField
        type="email"
        label="Email Address"
        name="email"
        fullWidth
        size="small"
        value={forgotPasswordEmail}
        onChange={(e) => setForgotPasswordEmail(e.target.value)}
        autoComplete="email"
        sx={{ mb: 2 }}
      />

      {forgotPasswordError && (
        <Alert severity="error" variant="filled" sx={{ mb: 2, py: 0.25, fontSize: "0.8rem" }}>
          {forgotPasswordError}
        </Alert>
      )}

      {forgotPasswordMessage && (
        <Alert severity="success" variant="filled" sx={{ mb: 2, py: 0.25, fontSize: "0.8rem" }}>
          {forgotPasswordMessage}
        </Alert>
      )}

      <LoadingButton
        type="submit"
        fullWidth
        size="medium"
        variant="contained"
        loading={forgotPasswordLoading}
        sx={{
          py: 1.25,
          borderRadius: 1,
          fontWeight: 600,
          textTransform: "none",
        }}
      >
        Send Reset Link
      </LoadingButton>

      <Button 
        fullWidth 
        size="small"
        sx={{ mt: 1.5, color: "text.secondary", "&:hover": { color: "primary.main" } }} 
        onClick={() => switchAuthState(actionState.signin)}
      >
        Back to Sign In
      </Button>
    </Box>
  );

  // Feature highlights
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
          backdropFilter: "blur(4px)",
        },
      }}
    >
      <Fade in={authModalOpen} timeout={250}>
        <Box
          sx={{
            position: "fixed",
            inset: 0,
            display: "flex",
            outline: "none",
            overflow: "hidden",
          }}
        >
          {/* Full-screen Cinematic Background */}
          <CinematicBackground variant="full" />

          {/* Left Visual Panel */}
          {!isMobile && (
            <Box
              sx={{
                width: isTablet ? "45%" : "50%",
                height: "100%",
                position: "relative",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                zIndex: 1,
              }}
            >
              
              {/* Content overlay */}
              <Box 
                sx={{ 
                  position: "relative", 
                  zIndex: 1, 
                  px: { sm: 4, md: 5, lg: 6 },
                  maxWidth: 480,
                }}
              >
                {/* Logo */}
                <Box sx={{ mb: 3 }}>
                  <img 
                    src="/logo_v3.svg" 
                    alt="PLhub Logo" 
                    style={{ 
                      height: 40,
                      filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.5))",
                    }} 
                  />
                </Box>
                
                {/* Headline */}
                <Typography
                  sx={{
                    fontWeight: 700,
                    fontSize: { sm: "1.75rem", md: "2rem", lg: "2.25rem" },
                    lineHeight: 1.15,
                    color: "#fff",
                    mb: 1.5,
                  }}
                >
                  Your Entertainment{" "}
                  <Box
                    component="span"
                    sx={{
                      color: theme.palette.primary.main,
                    }}
                  >
                    Hub
                  </Box>
                </Typography>
                
                <Typography
                  sx={{
                    color: alpha("#fff", 0.6),
                    mb: 4,
                    lineHeight: 1.5,
                    fontSize: "0.9rem",
                  }}
                >
                  Discover, track, and organize your favorite movies and TV shows.
                </Typography>

                {/* Feature cards */}
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
                  {features.map((feature, index) => (
                    <Box
                      key={index}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                        py: 1.25,
                        px: 2,
                        borderRadius: 1.5,
                        background: alpha("#fff", 0.05),
                        border: `1px solid ${alpha("#fff", 0.08)}`,
                        transition: "all 0.2s ease",
                        "&:hover": {
                          background: alpha("#fff", 0.08),
                          borderColor: alpha(theme.palette.primary.main, 0.3),
          },
        }}
      >
        <Box 
          sx={{ 
                          width: 36,
                          height: 36,
                          borderRadius: 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: alpha(theme.palette.primary.main, 0.15),
                          color: theme.palette.primary.main,
                          "& svg": { fontSize: 20 },
                        }}
                      >
                        {feature.icon}
                      </Box>
                      <Box>
                        <Typography sx={{ color: "#fff", fontWeight: 600, fontSize: "0.85rem", lineHeight: 1.2 }}>
                          {feature.title}
                        </Typography>
                        <Typography sx={{ color: alpha("#fff", 0.5), fontSize: "0.7rem" }}>
                          {feature.desc}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>

                {/* Stats row */}
                <Box sx={{ display: "flex", gap: 4, mt: 4, pt: 3, borderTop: `1px solid ${alpha("#fff", 0.1)}` }}>
                  {[
                    { value: "100K+", label: "Users" },
                    { value: "50K+", label: "Titles" },
                    { value: "4.9★", label: "Rating" },
                  ].map((stat, i) => (
                    <Box key={i}>
                      <Typography sx={{ fontWeight: 700, fontSize: "1.1rem", color: "#fff" }}>
                        {stat.value}
                      </Typography>
                      <Typography sx={{ fontSize: "0.65rem", color: alpha("#fff", 0.5), textTransform: "uppercase", letterSpacing: 0.5 }}>
                        {stat.label}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>
          )}

          {/* Right Form Panel */}
          <Box
            sx={{
              width: isMobile ? "100%" : isTablet ? "55%" : "50%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              position: "relative",
              zIndex: 2,
              // Glassmorphism effect - semi-transparent with backdrop blur
              background: alpha(theme.palette.background.default, 0.85),
              backdropFilter: "blur(20px)",
              borderLeft: isMobile ? "none" : `1px solid ${alpha("#fff", 0.08)}`,
            }}
          >
            {/* Close button */}
            <IconButton
              onClick={handleClose}
              sx={{
                position: "absolute",
                top: 16,
                right: 16,
                zIndex: 10,
                color: alpha("#fff", 0.7),
                bgcolor: alpha("#fff", 0.1),
                width: 36,
                height: 36,
                border: `1px solid ${alpha("#fff", 0.1)}`,
                "&:hover": { 
                  color: "#fff", 
                  bgcolor: alpha("#fff", 0.15),
                  borderColor: alpha(theme.palette.primary.main, 0.3),
                },
              }}
            >
              <Close fontSize="small" />
            </IconButton>

            {/* Scrollable form container */}
            <Box
              sx={{
                flex: 1,
                overflowY: "auto",
                overflowX: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                py: { xs: 4, sm: 5 },
                px: { xs: 3, sm: 5, md: 6 },
                "&::-webkit-scrollbar": { width: 4 },
                "&::-webkit-scrollbar-track": { background: "transparent" },
                "&::-webkit-scrollbar-thumb": { background: alpha(theme.palette.divider, 0.5), borderRadius: 2 },
              }}
            >
              <Box sx={{ width: "100%", maxWidth: 420 }}>
                {/* Mobile Logo */}
                {isMobile && (
                  <Box sx={{ textAlign: "center", mb: 3 }}>
                    <img src="/logo_v3.svg" alt="PLhub Logo" style={{ height: 36 }} />
                  </Box>
                )}

                {/* Form Header */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5, fontSize: "1.5rem", color: "#fff" }}>
                    {action === actionState.signin && "Welcome back"}
                    {action === actionState.signup && "Create account"}
                    {action === actionState.forgotPassword && "Reset password"}
                  </Typography>
                  <Typography variant="body2" sx={{ color: alpha("#fff", 0.6), fontSize: "0.9rem" }}>
                    {action === actionState.signin && "Sign in to continue"}
                    {action === actionState.signup && "Join PLhub today"}
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
            <SignupForm 
              switchAuthState={() => switchAuthState(actionState.signin)} 
            />
          )}

          {action === actionState.forgotPassword && renderForgotPasswordForm()}
        </Box>
      </Box>

            {/* Footer */}
            <Box
              sx={{
                py: 2,
                px: { xs: 3, sm: 5 },
                borderTop: `1px solid ${alpha("#fff", 0.08)}`,
                textAlign: "center",
              }}
            >
              <Typography variant="caption" sx={{ color: alpha("#fff", 0.5), fontSize: "0.7rem" }}>
                By continuing, you agree to our{" "}
                <Box component="a" href="/terms" target="_blank" sx={{ color: "primary.main", textDecoration: "none", "&:hover": { textDecoration: "underline" } }}>
                  Terms
                </Box>
                {" "}&{" "}
                <Box component="a" href="/privacy-policy" target="_blank" sx={{ color: "primary.main", textDecoration: "none", "&:hover": { textDecoration: "underline" } }}>
                  Privacy
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
