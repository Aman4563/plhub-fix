import { Box, Container, Typography, Paper, Stack, Divider, useTheme, alpha, Switch, FormControlLabel } from "@mui/material";
import { useState } from "react";
import { motion } from "framer-motion";
import CookieIcon from "@mui/icons-material/Cookie";
import SettingsIcon from "@mui/icons-material/Settings";
import AnalyticsIcon from "@mui/icons-material/Analytics";
import PersonIcon from "@mui/icons-material/Person";
import CampaignIcon from "@mui/icons-material/Campaign";

const MotionBox = motion(Box);

const CookiePolicyPage = () => {
  const theme = useTheme();
  const [cookiePreferences, setCookiePreferences] = useState({
    essential: true,
    analytics: true,
    preferences: true,
    marketing: false,
  });

  const handleCookieChange = (type) => {
    if (type === "essential") return;
    setCookiePreferences((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

  const cookieTypes = [
    {
      icon: <SettingsIcon />,
      title: "Essential Cookies",
      type: "essential",
      description: "These cookies are necessary for the website to function and cannot be switched off. They are usually only set in response to actions made by you such as setting your privacy preferences, logging in, or filling in forms.",
      examples: ["Session management", "Authentication", "Security features", "Load balancing"],
      required: true,
    },
    {
      icon: <AnalyticsIcon />,
      title: "Analytics Cookies",
      type: "analytics",
      description: "These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously. This helps us improve our service.",
      examples: ["Page views", "Time on site", "Navigation patterns", "Error tracking"],
      required: false,
    },
    {
      icon: <PersonIcon />,
      title: "Preference Cookies",
      type: "preferences",
      description: "These cookies enable the website to remember choices you make (such as your preferred language or theme) and provide enhanced, personalized features.",
      examples: ["Language settings", "Theme preferences", "Region selection", "Playback settings"],
      required: false,
    },
    {
      icon: <CampaignIcon />,
      title: "Marketing Cookies",
      type: "marketing",
      description: "These cookies may be set through our site by our advertising partners. They may be used to build a profile of your interests and show you relevant adverts on other sites.",
      examples: ["Ad targeting", "Social media tracking", "Remarketing", "Conversion tracking"],
      required: false,
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        pt: { xs: 10, md: 12 },
        pb: 8,
        background: `linear-gradient(180deg, ${alpha(theme.palette.primary.dark, 0.1)} 0%, ${theme.palette.background.default} 100%)`,
      }}
    >
      <Container maxWidth="md">
        <MotionBox
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Header */}
          <MotionBox variants={itemVariants} sx={{ textAlign: "center", mb: 6 }}>
            <CookieIcon sx={{ fontSize: 64, color: theme.palette.primary.main, mb: 2 }} />
            <Typography variant="h3" fontWeight={700} gutterBottom>
              Cookie Policy
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Last updated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2, maxWidth: 600, mx: "auto" }}>
              This policy explains how PLhub uses cookies and similar technologies to recognize you when you visit our website.
            </Typography>
          </MotionBox>

          {/* What are Cookies */}
          <MotionBox variants={itemVariants} sx={{ mb: 4 }}>
            <Paper
              elevation={0}
              sx={{
                p: 4,
                backgroundColor: alpha(theme.palette.background.paper, 0.6),
                backdropFilter: "blur(10px)",
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 2,
              }}
            >
              <Typography variant="h6" fontWeight={600} gutterBottom>
                What are Cookies?
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Cookies are small text files that are placed on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently and provide information to website owners.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Cookies can be "persistent" or "session" cookies. Persistent cookies remain on your device for a set period, while session cookies are deleted when you close your browser.
              </Typography>
            </Paper>
          </MotionBox>

          {/* Cookie Types */}
          <Stack spacing={3}>
            {cookieTypes.map((cookie, index) => (
              <MotionBox key={index} variants={itemVariants}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 4,
                    backgroundColor: alpha(theme.palette.background.paper, 0.6),
                    backdropFilter: "blur(10px)",
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 2,
                  }}
                >
                  <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} sx={{ mb: 2 }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Box
                        sx={{
                          p: 1,
                          borderRadius: 1,
                          backgroundColor: alpha(theme.palette.primary.main, 0.1),
                          color: theme.palette.primary.main,
                        }}
                      >
                        {cookie.icon}
                      </Box>
                      <Typography variant="h6" fontWeight={600}>
                        {cookie.title}
                      </Typography>
                    </Stack>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={cookiePreferences[cookie.type]}
                          onChange={() => handleCookieChange(cookie.type)}
                          disabled={cookie.required}
                          color="primary"
                        />
                      }
                      label={cookie.required ? "Always Active" : cookiePreferences[cookie.type] ? "Enabled" : "Disabled"}
                      sx={{ ml: { xs: 0, sm: 2 }, mt: { xs: 1, sm: 0 } }}
                    />
                  </Stack>
                  <Divider sx={{ mb: 2 }} />
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {cookie.description}
                  </Typography>
                  <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                    Examples:
                  </Typography>
                  <Stack direction="row" flexWrap="wrap" gap={1}>
                    {cookie.examples.map((example, idx) => (
                      <Box
                        key={idx}
                        sx={{
                          px: 1.5,
                          py: 0.5,
                          borderRadius: 1,
                          backgroundColor: alpha(theme.palette.text.secondary, 0.1),
                        }}
                      >
                        <Typography variant="caption" color="text.secondary">
                          {example}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </Paper>
              </MotionBox>
            ))}
          </Stack>

          {/* How to Control Cookies */}
          <MotionBox variants={itemVariants} sx={{ mt: 4 }}>
            <Paper
              elevation={0}
              sx={{
                p: 4,
                backgroundColor: alpha(theme.palette.info.main, 0.05),
                border: `1px solid ${theme.palette.info.main}`,
                borderRadius: 2,
              }}
            >
              <Typography variant="h6" fontWeight={600} gutterBottom>
                How to Control Cookies
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                You can control and manage cookies in various ways. Most browsers allow you to:
              </Typography>
              <Stack spacing={1}>
                {[
                  "View what cookies are stored and delete them individually",
                  "Block third-party cookies",
                  "Block cookies from particular sites",
                  "Block all cookies from being set",
                  "Delete all cookies when you close your browser",
                ].map((item, idx) => (
                  <Typography key={idx} variant="body2" color="text.secondary" sx={{ pl: 2 }}>
                    • {item}
                  </Typography>
                ))}
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Please note that blocking some types of cookies may impact your experience on our website.
              </Typography>
            </Paper>
          </MotionBox>
        </MotionBox>
      </Container>
    </Box>
  );
};

export default CookiePolicyPage;

