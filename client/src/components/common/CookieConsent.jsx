import { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Stack,
  Collapse,
  Switch,
  useTheme,
  alpha,
  Slide,
} from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import CookieIcon from "@mui/icons-material/Cookie";
import SettingsIcon from "@mui/icons-material/Settings";

const COOKIE_CONSENT_KEY = "plhub_cookie_consent";
const COOKIE_PREFERENCES_KEY = "plhub_cookie_preferences";

/**
 * CookieConsent Component
 * GDPR-compliant cookie consent banner with preference management
 */
const CookieConsent = () => {
  const theme = useTheme();
  const { t } = useTranslation();
  const [showBanner, setShowBanner] = useState(false);
  
  // Theme-aware colors
  const textSecondary = theme.palette.text.secondary;
  const textMuted = alpha(theme.palette.text.primary, 0.6);
  const borderColor = theme.palette.divider;
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState({
    necessary: true, // Always true, cannot be disabled
    analytics: false,
    marketing: false,
    preferences: false,
  });

  useEffect(() => {
    // Check if user has already consented
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      // Show banner after a short delay for better UX
      const timer = setTimeout(() => setShowBanner(true), 1500);
      return () => clearTimeout(timer);
    } else {
      // Load saved preferences
      const savedPreferences = localStorage.getItem(COOKIE_PREFERENCES_KEY);
      if (savedPreferences) {
        setPreferences(JSON.parse(savedPreferences));
      }
    }
  }, []);

  const handleAcceptAll = () => {
    const allAccepted = {
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true,
    };
    saveConsent(allAccepted);
  };

  const handleAcceptNecessary = () => {
    const necessaryOnly = {
      necessary: true,
      analytics: false,
      marketing: false,
      preferences: false,
    };
    saveConsent(necessaryOnly);
  };

  const handleSavePreferences = () => {
    saveConsent(preferences);
  };

  const saveConsent = (prefs) => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "true");
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(prefs));
    setPreferences(prefs);
    setShowBanner(false);
    setShowSettings(false);

    // Dispatch custom event for other components to react
    window.dispatchEvent(
      new CustomEvent("cookieConsent", { detail: prefs })
    );
  };

  const handlePreferenceChange = (key) => {
    if (key === "necessary") return; // Cannot disable necessary cookies
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const cookieTypes = [
    {
      key: "necessary",
      label: t("cookie.necessary", "Necessary"),
      description: t("cookie.necessaryDesc", "Required for the website to function. Cannot be disabled."),
      disabled: true,
    },
    {
      key: "analytics",
      label: t("cookie.analytics", "Analytics"),
      description: t("cookie.analyticsDesc", "Help us understand how visitors interact with our website."),
      disabled: false,
    },
    {
      key: "marketing",
      label: t("cookie.marketing", "Marketing"),
      description: t("cookie.marketingDesc", "Used for targeted advertising and promotional content."),
      disabled: false,
    },
    {
      key: "preferences",
      label: t("cookie.preferencesLabel", "Preferences"),
      description: t("cookie.preferencesDesc", "Remember your settings and personalization choices."),
      disabled: false,
    },
  ];

  if (!showBanner) return null;

  return (
    <AnimatePresence>
      <Slide direction="up" in={showBanner} mountOnEnter unmountOnExit>
        <Paper
          component={motion.div}
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          elevation={8}
          sx={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 9999,
            backgroundColor: alpha(theme.palette.background.paper, 0.98),
            backdropFilter: "blur(10px)",
            borderTop: `1px solid ${theme.palette.divider}`,
            p: { xs: 2, md: 3 },
          }}
        >
          <Box sx={{ maxWidth: 1200, mx: "auto" }}>
            {/* Main Banner */}
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={3}
              alignItems={{ xs: "stretch", md: "center" }}
              justifyContent="space-between"
            >
              <Stack direction="row" spacing={2} alignItems="flex-start" sx={{ flex: 1 }}>
                <CookieIcon
                  sx={{
                    fontSize: 40,
                    color: theme.palette.primary.main,
                    flexShrink: 0,
                  }}
                />
                <Box>
                  <Typography variant="h6" fontWeight={600} sx={{ mb: 0.5, color: theme.palette.text.primary }}>
                    {t("cookie.title", "We Value Your Privacy")}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: textSecondary, maxWidth: 600 }}
                  >
                    {t("cookie.description", "We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic. By clicking \"Accept All\", you consent to our use of cookies.")}{" "}
                    <Box
                      component="a"
                      href="/cookies"
                      sx={{
                        color: theme.palette.primary.main,
                        textDecoration: "underline",
                        "&:hover": { opacity: 0.8 },
                      }}
                    >
                      {t("cookie.learnMore", "Learn more")}
                    </Box>
                  </Typography>
                </Box>
              </Stack>

              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.5}
                sx={{ flexShrink: 0 }}
              >
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<SettingsIcon />}
                  onClick={() => setShowSettings(!showSettings)}
                  sx={{
                    borderColor: borderColor,
                    color: textSecondary,
                    "&:hover": {
                      borderColor: theme.palette.primary.light,
                      backgroundColor: alpha(theme.palette.primary.main, 0.05),
                    },
                  }}
                >
                  {t("cookie.customize", "Customize")}
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleAcceptNecessary}
                  sx={{
                    borderColor: borderColor,
                    color: textSecondary,
                    "&:hover": {
                      borderColor: theme.palette.primary.light,
                      backgroundColor: alpha(theme.palette.primary.main, 0.05),
                    },
                  }}
                >
                  {t("cookie.necessaryOnly", "Necessary Only")}
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleAcceptAll}
                  sx={{
                    backgroundColor: theme.palette.primary.main,
                    "&:hover": { backgroundColor: theme.palette.primary.dark },
                    px: 3,
                  }}
                >
                  {t("cookie.acceptAll", "Accept All")}
                </Button>
              </Stack>
            </Stack>

            {/* Settings Panel */}
            <Collapse in={showSettings}>
              <Box
                sx={{
                  mt: 3,
                  pt: 3,
                  borderTop: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                }}
              >
                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2, color: theme.palette.text.primary }}>
                  {t("cookie.preferences", "Cookie Preferences")}
                </Typography>
                <Stack spacing={2}>
                  {cookieTypes.map((cookie) => (
                    <Box
                      key={cookie.key}
                      sx={{
                        p: 2,
                        borderRadius: 1,
                        backgroundColor: alpha(theme.palette.background.default, 0.5),
                        border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
                      }}
                    >
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                      >
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" fontWeight={600} sx={{ color: theme.palette.text.primary }}>
                            {cookie.label}
                            {cookie.disabled && (
                              <Typography
                                component="span"
                                variant="caption"
                                sx={{
                                  ml: 1,
                                  px: 1,
                                  py: 0.25,
                                  borderRadius: 1,
                                  backgroundColor: alpha(theme.palette.primary.main, 0.2),
                                  color: theme.palette.primary.main,
                                }}
                              >
                                {t("cookie.required", "Required")}
                              </Typography>
                            )}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ color: textMuted }}
                          >
                            {cookie.description}
                          </Typography>
                        </Box>
                        <Switch
                          checked={preferences[cookie.key]}
                          onChange={() => handlePreferenceChange(cookie.key)}
                          disabled={cookie.disabled}
                          sx={{
                            "& .MuiSwitch-switchBase.Mui-checked": {
                              color: theme.palette.primary.main,
                            },
                            "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                              backgroundColor: theme.palette.primary.main,
                            },
                          }}
                        />
                      </Stack>
                    </Box>
                  ))}
                </Stack>
                <Stack direction="row" justifyContent="flex-end" sx={{ mt: 2 }}>
                  <Button
                    variant="contained"
                    onClick={handleSavePreferences}
                    sx={{
                      backgroundColor: theme.palette.primary.main,
                      "&:hover": { backgroundColor: theme.palette.primary.dark },
                    }}
                  >
                    {t("cookie.savePreferences", "Save Preferences")}
                  </Button>
                </Stack>
              </Box>
            </Collapse>
          </Box>
        </Paper>
      </Slide>
    </AnimatePresence>
  );
};

export default CookieConsent;

