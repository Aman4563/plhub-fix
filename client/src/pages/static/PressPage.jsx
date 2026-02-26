import {
  Box,
  Container,
  Typography,
  Grid,
  Stack,
  Card,
  CardContent,
  Button,
  Chip,
  Divider,
  useTheme,
  alpha,
  Snackbar,
  Alert,
} from "@mui/material";
import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";

import DownloadIcon from "@mui/icons-material/Download";
import ArticleIcon from "@mui/icons-material/Article";
import EmailIcon from "@mui/icons-material/Email";
import ImageIcon from "@mui/icons-material/Image";
import DescriptionIcon from "@mui/icons-material/Description";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

const MotionBox = motion(Box);
const MotionCard = motion(Card);

/**
 * Press Page Component
 * - Displays press releases, media kit, and press contact information.
 */
const PressPage = () => {
  const theme = useTheme();
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  
  // Theme-aware colors
  const textSecondary = theme.palette.text.secondary;
  const textMuted = alpha(theme.palette.text.primary, 0.6);
  const borderColor = theme.palette.divider;

  const handleCopyEmail = () => {
    navigator.clipboard.writeText("press@plhub.com");
    setSnackbarMessage("Email copied to clipboard!");
    setSnackbarOpen(true);
    toast.success("Email copied to clipboard!");
  };

  const handleEmailClick = () => {
    window.location.href = "mailto:press@plhub.com?subject=Press%20Inquiry%20-%20PLhub";
  };

  const handleDownload = (assetTitle) => {
    // In production, this would download actual files
    toast.info(`${assetTitle} download started. In production, actual files would be served.`);
    setSnackbarMessage(`Preparing ${assetTitle} for download...`);
    setSnackbarOpen(true);
  };

  const handleReadMore = (release) => {
    // In production, this would navigate to the full press release
    toast.info(`Opening: ${release.title}`);
  };

  const pressReleases = [
    {
      id: "pr-1",
      date: "November 15, 2024",
      title: "PLhub Reaches 1 Million Active Users Milestone",
      excerpt: "The streaming discovery platform celebrates significant growth milestone with users from over 190 countries.",
      link: "#",
    },
    {
      id: "pr-2",
      date: "October 3, 2024",
      title: "PLhub Launches New Mobile Apps for iOS and Android",
      excerpt: "New native mobile applications bring enhanced streaming experience to smartphones and tablets.",
      link: "#",
    },
    {
      id: "pr-3",
      date: "August 20, 2024",
      title: "PLhub Introduces AI-Powered Content Recommendations",
      excerpt: "Machine learning algorithms now power personalized movie and TV show suggestions for every user.",
      link: "#",
    },
    {
      id: "pr-4",
      date: "June 1, 2024",
      title: "PLhub Partners with Independent Film Distributors",
      excerpt: "New partnerships expand catalog with award-winning independent films and documentaries.",
      link: "#",
    },
  ];

  const mediaAssets = [
    {
      id: "asset-logo",
      title: "Logo Package",
      description: "High-resolution logos in PNG, SVG, and EPS formats.",
      icon: <ImageIcon />,
      fileType: "ZIP",
      fileSize: "2.4 MB",
    },
    {
      id: "asset-brand",
      title: "Brand Guidelines",
      description: "Complete brand style guide with colors, typography, and usage rules.",
      icon: <DescriptionIcon />,
      fileType: "PDF",
      fileSize: "8.1 MB",
    },
    {
      id: "asset-screenshots",
      title: "Product Screenshots",
      description: "High-quality screenshots of the platform across devices.",
      icon: <ImageIcon />,
      fileType: "ZIP",
      fileSize: "15.3 MB",
    },
    {
      id: "asset-fact",
      title: "Company Fact Sheet",
      description: "Key statistics, milestones, and company information.",
      icon: <ArticleIcon />,
      fileType: "PDF",
      fileSize: "1.2 MB",
    },
  ];

  const coverageHighlights = [
    { publication: "TechCrunch", quote: "PLhub is revolutionizing how people discover streaming content.", date: "Nov 2024" },
    { publication: "The Verge", quote: "A must-have tool for any streaming enthusiast.", date: "Oct 2024" },
    { publication: "Wired", quote: "Finally, a platform that aggregates streaming options without the hassle.", date: "Sep 2024" },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <Box sx={{ py: { xs: 6, md: 10 } }}>
      <Container maxWidth="lg">
        {/* Hero Section */}
        <MotionBox
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          sx={{ textAlign: "center", mb: { xs: 6, md: 10 } }}
        >
          <Typography
            variant="h2"
            fontWeight={700}
            sx={{
              mb: 3,
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, #ff6b6b)`,
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Press & Media
          </Typography>
          <Typography
            variant="h5"
            sx={{
              color: textSecondary,
              maxWidth: 700,
              mx: "auto",
              lineHeight: 1.8,
            }}
          >
            Find the latest news, media resources, and press contact information for PLhub.
          </Typography>
        </MotionBox>

        {/* Press Contact Banner */}
        <MotionBox
          variants={itemVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          sx={{
            mb: { xs: 6, md: 10 },
            p: 4,
            borderRadius: 3,
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.15)}, ${alpha(theme.palette.background.paper, 0.9)})`,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
          }}
        >
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={8}>
              <Typography variant="h5" fontWeight={600} sx={{ mb: 1 }}>
                Media Inquiries
              </Typography>
              <Typography variant="body1" sx={{ color: textSecondary }}>
                For press inquiries, interview requests, or additional information, please contact our communications team.
              </Typography>
            </Grid>
            <Grid item xs={12} md={4} sx={{ textAlign: { xs: "left", md: "right" } }}>
              <Stack direction="row" spacing={1} justifyContent={{ xs: "flex-start", md: "flex-end" }}>
                <Button
                  variant="contained"
                  startIcon={<EmailIcon />}
                  size="large"
                  onClick={handleEmailClick}
                  sx={{
                    backgroundColor: theme.palette.primary.main,
                    "&:hover": { backgroundColor: theme.palette.primary.dark },
                  }}
                >
                  press@plhub.com
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={handleCopyEmail}
                  sx={{
                    minWidth: "auto",
                    px: 1.5,
                    borderColor: theme.palette.primary.main,
                    color: theme.palette.primary.main,
                  }}
                >
                  <ContentCopyIcon />
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </MotionBox>

        {/* Coverage Highlights */}
        <MotionBox
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          sx={{ mb: { xs: 8, md: 12 } }}
        >
          <Typography variant="h4" fontWeight={600} sx={{ mb: 4 }}>
            In the News
          </Typography>
          <Grid container spacing={3}>
            {coverageHighlights.map((coverage, index) => (
              <Grid item xs={12} md={4} key={`coverage-${index}`}>
                <MotionCard
                  variants={itemVariants}
                  sx={{
                    height: "100%",
                    backgroundColor: alpha(theme.palette.background.paper, 0.6),
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    p: 3,
                  }}
                >
                  <Typography
                    variant="h6"
                    fontWeight={600}
                    sx={{ color: theme.palette.primary.main, mb: 2 }}
                  >
                    {coverage.publication}
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      color: textSecondary,
                      fontStyle: "italic",
                      mb: 2,
                      lineHeight: 1.6,
                    }}
                  >
                    &quot;{coverage.quote}&quot;
                  </Typography>
                  <Typography variant="caption" sx={{ color: textMuted }}>
                    {coverage.date}
                  </Typography>
                </MotionCard>
              </Grid>
            ))}
          </Grid>
        </MotionBox>

        {/* Press Releases */}
        <MotionBox
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          sx={{ mb: { xs: 8, md: 12 } }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
            <Typography variant="h4" fontWeight={600}>
              Press Releases
            </Typography>
            <Button
              endIcon={<OpenInNewIcon />}
              sx={{ color: theme.palette.primary.main }}
            >
              View All
            </Button>
          </Stack>
          <Stack spacing={3}>
            {pressReleases.map((release) => (
              <MotionCard
                key={release.id}
                variants={itemVariants}
                sx={{
                  backgroundColor: alpha(theme.palette.background.paper, 0.6),
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  transition: "transform 0.3s ease, box-shadow 0.3s ease",
                  "&:hover": {
                    transform: "translateX(8px)",
                    boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.15)}`,
                  },
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    justifyContent="space-between"
                    alignItems={{ xs: "flex-start", sm: "center" }}
                    spacing={2}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                        <CalendarTodayIcon sx={{ fontSize: 14, color: textMuted }} />
                        <Typography variant="caption" sx={{ color: textMuted }}>
                          {release.date}
                        </Typography>
                      </Stack>
                      <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
                        {release.title}
                      </Typography>
                      <Typography variant="body2" sx={{ color: textSecondary }}>
                        {release.excerpt}
                      </Typography>
                    </Box>
                    <Button
                      variant="outlined"
                      size="small"
                      endIcon={<OpenInNewIcon />}
                      onClick={() => handleReadMore(release)}
                      sx={{
                        borderColor: borderColor,
                        color: textSecondary,
                        "&:hover": {
                          borderColor: theme.palette.primary.main,
                          color: theme.palette.primary.main,
                        },
                      }}
                    >
                      Read More
                    </Button>
                  </Stack>
                </CardContent>
              </MotionCard>
            ))}
          </Stack>
        </MotionBox>

        {/* Media Kit */}
        <MotionBox
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          sx={{ mb: { xs: 8, md: 12 } }}
        >
          <Typography variant="h4" fontWeight={600} sx={{ mb: 2 }}>
            Media Kit
          </Typography>
          <Typography
            variant="body1"
            sx={{ color: textMuted, mb: 4, maxWidth: 600 }}
          >
            Download official PLhub assets for your publications. All assets are free to use
            for press and media coverage.
          </Typography>
          <Grid container spacing={3}>
            {mediaAssets.map((asset) => (
              <Grid item xs={12} sm={6} md={3} key={asset.id}>
                <MotionCard
                  variants={itemVariants}
                  sx={{
                    height: "100%",
                    backgroundColor: alpha(theme.palette.background.paper, 0.6),
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    transition: "transform 0.3s ease",
                    "&:hover": {
                      transform: "translateY(-4px)",
                    },
                  }}
                >
                  <CardContent sx={{ p: 3, textAlign: "center" }}>
                    <Box
                      sx={{
                        width: 60,
                        height: 60,
                        borderRadius: 2,
                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        mx: "auto",
                        mb: 2,
                        color: theme.palette.primary.main,
                        "& svg": { fontSize: 28 },
                      }}
                    >
                      {asset.icon}
                    </Box>
                    <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
                      {asset.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: textMuted, mb: 2 }}
                    >
                      {asset.description}
                    </Typography>
                    <Stack direction="row" spacing={1} justifyContent="center" sx={{ mb: 2 }}>
                      <Chip
                        label={asset.fileType}
                        size="small"
                        sx={{
                          backgroundColor: alpha(theme.palette.background.default, 0.5),
                          fontSize: "0.7rem",
                        }}
                      />
                      <Chip
                        label={asset.fileSize}
                        size="small"
                        sx={{
                          backgroundColor: alpha(theme.palette.background.default, 0.5),
                          fontSize: "0.7rem",
                        }}
                      />
                    </Stack>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<DownloadIcon />}
                      size="small"
                      onClick={() => handleDownload(asset.title)}
                      sx={{
                        borderColor: borderColor,
                        color: textSecondary,
                        "&:hover": {
                          borderColor: theme.palette.primary.main,
                          color: theme.palette.primary.main,
                        },
                      }}
                    >
                      Download
                    </Button>
                  </CardContent>
                </MotionCard>
              </Grid>
            ))}
          </Grid>
        </MotionBox>

        {/* Company Facts */}
        <Box
          sx={{
            p: { xs: 4, md: 6 },
            borderRadius: 3,
            backgroundColor: alpha(theme.palette.background.paper, 0.6),
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          }}
        >
          <Typography variant="h5" fontWeight={600} sx={{ mb: 4 }}>
            Quick Facts
          </Typography>
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="subtitle2" sx={{ color: textMuted }}>
                    Founded
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    2020
                  </Typography>
                </Box>
                <Divider sx={{ borderColor: borderColor }} />
                <Box>
                  <Typography variant="subtitle2" sx={{ color: textMuted }}>
                    Headquarters
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    San Francisco, California (Remote-First)
                  </Typography>
                </Box>
                <Divider sx={{ borderColor: borderColor }} />
                <Box>
                  <Typography variant="subtitle2" sx={{ color: textMuted }}>
                    Team Size
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    25+ employees across 12 countries
                  </Typography>
                </Box>
              </Stack>
            </Grid>
            <Grid item xs={12} md={6}>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="subtitle2" sx={{ color: textMuted }}>
                    Active Users
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    1,000,000+ monthly active users
                  </Typography>
                </Box>
                <Divider sx={{ borderColor: borderColor }} />
                <Box>
                  <Typography variant="subtitle2" sx={{ color: textMuted }}>
                    Content Library
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    50,000+ movies and 10,000+ TV series
                  </Typography>
                </Box>
                <Divider sx={{ borderColor: borderColor }} />
                <Box>
                  <Typography variant="subtitle2" sx={{ color: textMuted }}>
                    Global Reach
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    Available in 190+ countries
                  </Typography>
                </Box>
              </Stack>
            </Grid>
          </Grid>
        </Box>
      </Container>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity="success"
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PressPage;

