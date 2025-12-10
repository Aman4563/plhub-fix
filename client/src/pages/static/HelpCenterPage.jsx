import { useState } from "react";
import {
  Box,
  Container,
  Typography,
  Paper,
  Stack,
  TextField,
  InputAdornment,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useTheme,
  alpha,
  Chip,
  Button,
} from "@mui/material";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import SearchIcon from "@mui/icons-material/Search";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutline";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import SettingsIcon from "@mui/icons-material/Settings";
import DevicesIcon from "@mui/icons-material/Devices";
import PaymentIcon from "@mui/icons-material/Payment";
import SecurityIcon from "@mui/icons-material/Security";
import EmailIcon from "@mui/icons-material/Email";

const MotionBox = motion(Box);

const HelpCenterPage = () => {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCategory, setExpandedCategory] = useState(null);

  const categories = [
    {
      icon: <PlayCircleOutlineIcon sx={{ fontSize: 40 }} />,
      title: "Getting Started",
      description: "Learn the basics of using PLhub",
      articles: ["How to create an account", "Navigating the homepage", "Finding movies and TV shows", "Using the search feature"],
    },
    {
      icon: <AccountCircleIcon sx={{ fontSize: 40 }} />,
      title: "Account & Profile",
      description: "Manage your account settings",
      articles: ["Updating profile information", "Changing your password", "Managing watchlist", "Viewing your favorites"],
    },
    {
      icon: <DevicesIcon sx={{ fontSize: 40 }} />,
      title: "Devices & Streaming",
      description: "Watch on any device",
      articles: ["Supported devices", "Streaming quality settings", "Download for offline viewing", "Casting to your TV"],
    },
    {
      icon: <SettingsIcon sx={{ fontSize: 40 }} />,
      title: "Settings & Preferences",
      description: "Customize your experience",
      articles: ["Changing language settings", "Dark/Light mode", "Notification preferences", "Parental controls"],
    },
    {
      icon: <PaymentIcon sx={{ fontSize: 40 }} />,
      title: "Billing & Subscription",
      description: "Payment and subscription info",
      articles: ["Free vs Premium features", "Payment methods", "Cancellation policy", "Refund requests"],
    },
    {
      icon: <SecurityIcon sx={{ fontSize: 40 }} />,
      title: "Privacy & Security",
      description: "Keep your account safe",
      articles: ["Two-factor authentication", "Privacy settings", "Data download", "Account security tips"],
    },
  ];

  const popularQuestions = [
    { question: "How do I reset my password?", answer: "Go to Settings > Account > Password Update to change your password. You'll need to enter your current password and then your new password twice to confirm." },
    { question: "Why is a video not playing?", answer: "First, try refreshing the page. If that doesn't work, check your internet connection and try clearing your browser cache. Some content may not be available in certain regions." },
    { question: "How do I add items to my watchlist?", answer: "Click the '+' or 'Add to Watchlist' button on any movie or TV show page. You can access your watchlist from the menu or your profile page." },
    { question: "Can I download content for offline viewing?", answer: "Currently, offline downloading is only available on our mobile apps. Desktop browsers do not support this feature due to content protection requirements." },
    { question: "How do I report a broken link?", answer: "Use the 'Report Issue' link in the footer or contact us directly. Please include the title and URL of the content that's not working." },
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

  const filteredQuestions = popularQuestions.filter(
    (q) =>
      q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box
      sx={{
        minHeight: "100vh",
        pt: { xs: 10, md: 12 },
        pb: 8,
        background: `linear-gradient(180deg, ${alpha(theme.palette.primary.dark, 0.1)} 0%, ${theme.palette.background.default} 100%)`,
      }}
    >
      <Container maxWidth="lg">
        <MotionBox
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Header */}
          <MotionBox variants={itemVariants} sx={{ textAlign: "center", mb: 6 }}>
            <HelpOutlineIcon sx={{ fontSize: 64, color: theme.palette.primary.main, mb: 2 }} />
            <Typography variant="h3" fontWeight={700} gutterBottom>
              Help Center
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              Find answers to common questions and learn how to get the most out of PLhub
            </Typography>

            {/* Search */}
            <TextField
              fullWidth
              placeholder="Search for help articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: theme.palette.text.secondary }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                maxWidth: 600,
                "& .MuiOutlinedInput-root": {
                  backgroundColor: alpha(theme.palette.background.paper, 0.8),
                  "&:hover": {
                    "& fieldset": { borderColor: theme.palette.primary.main },
                  },
                },
              }}
            />
          </MotionBox>

          {/* Categories */}
          <MotionBox variants={itemVariants} sx={{ mb: 6 }}>
            <Typography variant="h5" fontWeight={600} sx={{ mb: 3 }}>
              Browse by Category
            </Typography>
            <Grid container spacing={3}>
              {categories.map((category, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Paper
                    elevation={0}
                    onClick={() => setExpandedCategory(expandedCategory === index ? null : index)}
                    sx={{
                      p: 3,
                      height: "100%",
                      cursor: "pointer",
                      backgroundColor: alpha(theme.palette.background.paper, 0.6),
                      backdropFilter: "blur(10px)",
                      border: `1px solid ${expandedCategory === index ? theme.palette.primary.main : theme.palette.divider}`,
                      borderRadius: 2,
                      transition: "all 0.3s ease",
                      "&:hover": {
                        transform: "translateY(-4px)",
                        borderColor: theme.palette.primary.main,
                        boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.2)}`,
                      },
                    }}
                  >
                    <Box sx={{ color: theme.palette.primary.main, mb: 2 }}>
                      {category.icon}
                    </Box>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      {category.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {category.description}
                    </Typography>
                    <Stack direction="row" flexWrap="wrap" gap={0.5}>
                      <Chip
                        label={`${category.articles.length} articles`}
                        size="small"
                        sx={{
                          backgroundColor: alpha(theme.palette.primary.main, 0.1),
                          color: theme.palette.primary.main,
                        }}
                      />
                    </Stack>
                    {expandedCategory === index && (
                      <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
                        {category.articles.map((article, idx) => (
                          <Typography
                            key={idx}
                            variant="body2"
                            sx={{
                              py: 0.5,
                              color: theme.palette.text.secondary,
                              "&:hover": { color: theme.palette.primary.main },
                            }}
                          >
                            • {article}
                          </Typography>
                        ))}
                      </Box>
                    )}
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </MotionBox>

          {/* Popular Questions */}
          <MotionBox variants={itemVariants}>
            <Typography variant="h5" fontWeight={600} sx={{ mb: 3 }}>
              Frequently Asked Questions
            </Typography>
            <Stack spacing={2}>
              {filteredQuestions.map((item, index) => (
                <Accordion
                  key={index}
                  elevation={0}
                  sx={{
                    backgroundColor: alpha(theme.palette.background.paper, 0.6),
                    backdropFilter: "blur(10px)",
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: "8px !important",
                    "&:before": { display: "none" },
                    "&.Mui-expanded": {
                      margin: 0,
                      borderColor: theme.palette.primary.main,
                    },
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    sx={{
                      "& .MuiAccordionSummary-content": { my: 2 },
                    }}
                  >
                    <Typography fontWeight={500}>{item.question}</Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ pt: 0 }}>
                    <Typography variant="body2" color="text.secondary">
                      {item.answer}
                    </Typography>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Stack>
          </MotionBox>

          {/* Contact Support */}
          <MotionBox variants={itemVariants} sx={{ mt: 6 }}>
            <Paper
              elevation={0}
              sx={{
                p: 4,
                textAlign: "center",
                backgroundColor: alpha(theme.palette.primary.main, 0.05),
                border: `1px solid ${theme.palette.primary.main}`,
                borderRadius: 2,
              }}
            >
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Still need help?
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Our support team is here to assist you with any questions or issues.
              </Typography>
              <Button
                variant="contained"
                startIcon={<EmailIcon />}
                component={Link}
                to="/contact"
                sx={{
                  backgroundColor: theme.palette.primary.main,
                  "&:hover": { backgroundColor: theme.palette.primary.dark },
                }}
              >
                Contact Support
              </Button>
            </Paper>
          </MotionBox>
        </MotionBox>
      </Container>
    </Box>
  );
};

export default HelpCenterPage;

