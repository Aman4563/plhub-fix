import { useState } from "react";
import {
  Box,
  Container,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useTheme,
  alpha,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
  Stack,
  Chip,
} from "@mui/material";
import { motion } from "framer-motion";
import QuestionAnswerIcon from "@mui/icons-material/QuestionAnswer";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SearchIcon from "@mui/icons-material/Search";

const MotionBox = motion(Box);

const FAQPage = () => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [expanded, setExpanded] = useState(false);

  const faqCategories = [
    {
      label: "General",
      faqs: [
        {
          question: "What is PLhub?",
          answer: "PLhub is a streaming platform that provides links to movies and TV series from various sources. We aggregate content from third-party providers to give you a seamless viewing experience.",
        },
        {
          question: "Is PLhub free to use?",
          answer: "Yes, PLhub is completely free to use. We provide access to a vast library of movies and TV shows without any subscription fees.",
        },
        {
          question: "Do I need to create an account?",
          answer: "While you can browse content without an account, creating one allows you to save favorites, create watchlists, write reviews, and get personalized recommendations.",
        },
        {
          question: "What devices can I use PLhub on?",
          answer: "PLhub works on any device with a modern web browser, including computers, tablets, and smartphones. We're optimized for Chrome, Firefox, Safari, and Edge.",
        },
      ],
    },
    {
      label: "Account",
      faqs: [
        {
          question: "How do I create an account?",
          answer: "Click the 'Sign In' button in the top right corner, then select 'Sign Up'. Enter your email address, create a username, and set a secure password.",
        },
        {
          question: "I forgot my password. What should I do?",
          answer: "Go to the sign-in page and click 'Forgot Password'. Enter your email address, and we'll send you a link to reset your password.",
        },
        {
          question: "How do I change my username or email?",
          answer: "Go to your profile settings by clicking your avatar, then select 'Settings'. From there, you can update your username, email, and other account details.",
        },
        {
          question: "Can I delete my account?",
          answer: "Yes, you can delete your account from the settings page. Please note that this action is irreversible and will delete all your data including watchlists and favorites.",
        },
      ],
    },
    {
      label: "Streaming",
      faqs: [
        {
          question: "Why isn't a video playing?",
          answer: "First, try refreshing the page or switching to a different server/source. Clear your browser cache, disable ad blockers, or try a different browser. Some content may also be region-restricted.",
        },
        {
          question: "Can I change the video quality?",
          answer: "Video quality depends on the source server. Most players have a quality selector (gear icon) where you can choose from available resolutions.",
        },
        {
          question: "Why do I see ads?",
          answer: "Ads help us keep the service free. We try to minimize intrusive ads, but some may come from third-party video sources that we don't control.",
        },
        {
          question: "Can I download videos for offline viewing?",
          answer: "No, PLhub doesn't support downloading as we only provide links to content hosted on other platforms. You can only stream content while online.",
        },
      ],
    },
    {
      label: "Content",
      faqs: [
        {
          question: "How often is new content added?",
          answer: "We continuously update our library with new movies and TV series. New releases are typically added within days of their availability on streaming platforms.",
        },
        {
          question: "Can I request specific content?",
          answer: "Yes! Use the 'Demand' feature in the main menu to request movies or TV shows you'd like to see added to our platform.",
        },
        {
          question: "Why is some content not available in my region?",
          answer: "Some content providers implement regional restrictions. We display content from various sources, and availability may vary based on your location.",
        },
        {
          question: "How do I report broken links or missing content?",
          answer: "Use the 'Report Issue' page accessible from the footer. Provide the content title and describe the problem, and our team will look into it.",
        },
      ],
    },
    {
      label: "Features",
      faqs: [
        {
          question: "What is the Watchlist?",
          answer: "The Watchlist is your personal queue of movies and shows you want to watch. Add items by clicking the '+' button, and access your list from the menu.",
        },
        {
          question: "How do Favorites work?",
          answer: "Favorites are for content you love and want to easily find again. Click the heart icon on any title to add it to your favorites.",
        },
        {
          question: "Can I write reviews?",
          answer: "Yes! After watching something, you can leave a review and rating to help other users discover great content. Reviews require a registered account.",
        },
        {
          question: "What is the A-Z Index in the footer?",
          answer: "The A-Z Index lets you browse content alphabetically. Click any letter to see all movies and TV shows starting with that letter.",
        },
      ],
    },
  ];

  const handleAccordionChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  const filteredFAQs = faqCategories[activeTab].faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            <QuestionAnswerIcon sx={{ fontSize: 64, color: theme.palette.primary.main, mb: 2 }} />
            <Typography variant="h3" fontWeight={700} gutterBottom>
              Frequently Asked Questions
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              Find quick answers to common questions about PLhub
            </Typography>

            {/* Search */}
            <TextField
              fullWidth
              placeholder="Search FAQs..."
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
                maxWidth: 500,
                "& .MuiOutlinedInput-root": {
                  backgroundColor: alpha(theme.palette.background.paper, 0.8),
                },
              }}
            />
          </MotionBox>

          {/* Category Tabs */}
          <MotionBox variants={itemVariants} sx={{ mb: 4 }}>
            <Tabs
              value={activeTab}
              onChange={(e, val) => setActiveTab(val)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                "& .MuiTab-root": {
                  minWidth: "auto",
                  px: 2,
                  py: 1,
                  mr: 1,
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 500,
                  color: theme.palette.text.secondary,
                  "&.Mui-selected": {
                    color: theme.palette.primary.main,
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  },
                },
                "& .MuiTabs-indicator": {
                  display: "none",
                },
              }}
            >
              {faqCategories.map((cat, idx) => (
                <Tab key={idx} label={cat.label} />
              ))}
            </Tabs>
          </MotionBox>

          {/* FAQ List */}
          <Stack spacing={2}>
            {filteredFAQs.length > 0 ? (
              filteredFAQs.map((faq, index) => (
                <MotionBox key={index} variants={itemVariants}>
                  <Accordion
                    expanded={expanded === `panel${index}`}
                    onChange={handleAccordionChange(`panel${index}`)}
                    elevation={0}
                    sx={{
                      backgroundColor: alpha(theme.palette.background.paper, 0.6),
                      backdropFilter: "blur(10px)",
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: "12px !important",
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
                      <Typography fontWeight={500}>{faq.question}</Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ pt: 0, pb: 3 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                        {faq.answer}
                      </Typography>
                    </AccordionDetails>
                  </Accordion>
                </MotionBox>
              ))
            ) : (
              <MotionBox variants={itemVariants} sx={{ textAlign: "center", py: 6 }}>
                <Typography color="text.secondary">
                  No FAQs found matching "{searchQuery}"
                </Typography>
                <Chip
                  label="Clear search"
                  onClick={() => setSearchQuery("")}
                  sx={{ mt: 2 }}
                />
              </MotionBox>
            )}
          </Stack>

          {/* Stats */}
          <MotionBox variants={itemVariants} sx={{ mt: 6, textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">
              Showing {filteredFAQs.length} of {faqCategories[activeTab].faqs.length} questions in {faqCategories[activeTab].label}
            </Typography>
          </MotionBox>
        </MotionBox>
      </Container>
    </Box>
  );
};

export default FAQPage;

