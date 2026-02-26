import {
  Box,
  Container,
  Typography,
  Grid,
  Stack,
  Card,
  CardContent,
  Avatar,
  useTheme,
  alpha,
  Button,
} from "@mui/material";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

import MovieIcon from "@mui/icons-material/Movie";
import TvIcon from "@mui/icons-material/Tv";
import GroupIcon from "@mui/icons-material/Group";
import PublicIcon from "@mui/icons-material/Public";
import SpeedIcon from "@mui/icons-material/Speed";
import SecurityIcon from "@mui/icons-material/Security";
import DevicesIcon from "@mui/icons-material/Devices";
import FavoriteIcon from "@mui/icons-material/Favorite";

const MotionBox = motion(Box);
const MotionCard = motion(Card);

/**
 * About Page Component
 * - Displays company information, mission, values, and team.
 */
const AboutPage = () => {
  const theme = useTheme();
  
  // Theme-aware colors (keeping for future use)
  // eslint-disable-next-line no-unused-vars
  const textPrimary = theme.palette.text.primary;
  const textSecondary = theme.palette.text.secondary;
  // eslint-disable-next-line no-unused-vars
  const textMuted = alpha(theme.palette.text.primary, 0.6);

  const stats = [
    { icon: <MovieIcon />, value: "50,000+", label: "Movies" },
    { icon: <TvIcon />, value: "10,000+", label: "TV Series" },
    { icon: <GroupIcon />, value: "1M+", label: "Users" },
    { icon: <PublicIcon />, value: "190+", label: "Countries" },
  ];

  const values = [
    {
      icon: <SpeedIcon />,
      title: "Performance",
      description: "Lightning-fast streaming with optimized delivery for seamless viewing experience.",
    },
    {
      icon: <SecurityIcon />,
      title: "Security",
      description: "Your privacy matters. We implement industry-leading security measures.",
    },
    {
      icon: <DevicesIcon />,
      title: "Accessibility",
      description: "Watch anywhere, anytime. Available on all devices and platforms.",
    },
    {
      icon: <FavoriteIcon />,
      title: "Community",
      description: "Built by movie lovers, for movie lovers. Your feedback shapes our platform.",
    },
  ];

  const team = [
    { name: "Alex Chen", role: "Founder & CEO", avatar: "A" },
    { name: "Sarah Miller", role: "Chief Technology Officer", avatar: "S" },
    { name: "James Wilson", role: "Head of Content", avatar: "J" },
    { name: "Emily Brown", role: "UX Design Lead", avatar: "E" },
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
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main || "#ff6b6b"})`,
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            About PLhub
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
            Your ultimate destination for movies and TV series. We're on a mission to
            make entertainment accessible to everyone, everywhere.
          </Typography>
        </MotionBox>

        {/* Stats Section */}
        <MotionBox
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          sx={{ mb: { xs: 8, md: 12 } }}
        >
          <Grid container spacing={3}>
            {stats.map((stat, index) => (
              <Grid item xs={6} md={3} key={`stat-${index}`}>
                <MotionBox
                  variants={itemVariants}
                  sx={{
                    textAlign: "center",
                    p: 3,
                    borderRadius: 2,
                    backgroundColor: alpha(theme.palette.background.paper, 0.6),
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                    transition: "transform 0.3s ease, box-shadow 0.3s ease",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.2)}`,
                    },
                  }}
                >
                  <Box
                    sx={{
                      color: theme.palette.primary.main,
                      mb: 1,
                      "& svg": { fontSize: 40 },
                    }}
                  >
                    {stat.icon}
                  </Box>
                  <Typography variant="h4" fontWeight={700} sx={{ mb: 0.5 }}>
                    {stat.value}
                  </Typography>
                  <Typography variant="body2" sx={{ color: textMuted }}>
                    {stat.label}
                  </Typography>
                </MotionBox>
              </Grid>
            ))}
          </Grid>
        </MotionBox>

        {/* Our Story Section */}
        <MotionBox
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          sx={{ mb: { xs: 8, md: 12 } }}
        >
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <MotionBox variants={itemVariants}>
                <Typography
                  variant="overline"
                  sx={{ color: theme.palette.primary.main, mb: 1 }}
                >
                  Our Story
                </Typography>
                <Typography variant="h4" fontWeight={600} sx={{ mb: 3 }}>
                  Built by Movie Lovers, for Movie Lovers
                </Typography>
                <Typography
                  variant="body1"
                  sx={{ color: textSecondary, mb: 2, lineHeight: 1.8 }}
                >
                  PLhub started in 2020 with a simple idea: make it easier for people to
                  discover and enjoy great content. What began as a weekend project has
                  grown into a platform serving millions of users worldwide.
                </Typography>
                <Typography
                  variant="body1"
                  sx={{ color: textSecondary, lineHeight: 1.8 }}
                >
                  We believe everyone deserves access to entertainment. Our platform
                  aggregates links from across the web, making it simple to find where
                  to watch your favorite movies and shows.
                </Typography>
              </MotionBox>
            </Grid>
            <Grid item xs={12} md={6}>
              <MotionBox
                variants={itemVariants}
                sx={{
                  p: 4,
                  borderRadius: 3,
                  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.background.paper, 0.8)})`,
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                }}
              >
                <Typography variant="h6" fontWeight={600} sx={{ mb: 3, textAlign: "center" }}>
                  Our Mission
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    color: textSecondary,
                    textAlign: "center",
                    fontStyle: "italic",
                    fontSize: "1.1rem",
                    lineHeight: 1.8,
                  }}
                >
                  "To democratize entertainment by providing a free, accessible platform
                  where anyone can discover, explore, and enjoy movies and TV shows from
                  around the world."
                </Typography>
              </MotionBox>
            </Grid>
          </Grid>
        </MotionBox>

        {/* Values Section */}
        <MotionBox
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          sx={{ mb: { xs: 8, md: 12 } }}
        >
          <Typography
            variant="h4"
            fontWeight={600}
            sx={{ textAlign: "center", mb: 6 }}
          >
            Our Values
          </Typography>
          <Grid container spacing={3}>
            {values.map((value, index) => (
              <Grid item xs={12} sm={6} md={3} key={`value-${index}`}>
                <MotionCard
                  variants={itemVariants}
                  sx={{
                    height: "100%",
                    backgroundColor: alpha(theme.palette.background.paper, 0.6),
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    transition: "transform 0.3s ease",
                    "&:hover": {
                      transform: "translateY(-8px)",
                    },
                  }}
                >
                  <CardContent sx={{ textAlign: "center", p: 3 }}>
                    <Box
                      sx={{
                        width: 60,
                        height: 60,
                        borderRadius: "50%",
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
                      {value.icon}
                    </Box>
                    <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
                      {value.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: textMuted }}>
                      {value.description}
                    </Typography>
                  </CardContent>
                </MotionCard>
              </Grid>
            ))}
          </Grid>
        </MotionBox>

        {/* Team Section */}
        <MotionBox
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <Typography
            variant="h4"
            fontWeight={600}
            sx={{ textAlign: "center", mb: 2 }}
          >
            Meet Our Team
          </Typography>
          <Typography
            variant="body1"
            sx={{ textAlign: "center", color: textMuted, mb: 6, maxWidth: 600, mx: "auto" }}
          >
            A passionate group of developers, designers, and content enthusiasts dedicated
            to bringing you the best streaming experience.
          </Typography>
          <Grid container spacing={3} justifyContent="center">
            {team.map((member, index) => (
              <Grid item xs={6} sm={3} key={`team-${index}`}>
                <MotionBox
                  variants={itemVariants}
                  sx={{ textAlign: "center" }}
                >
                  <Avatar
                    sx={{
                      width: 100,
                      height: 100,
                      mx: "auto",
                      mb: 2,
                      fontSize: "2rem",
                      fontWeight: 600,
                      backgroundColor: alpha(theme.palette.primary.main, 0.2),
                      color: theme.palette.primary.main,
                      border: `2px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                    }}
                  >
                    {member.avatar}
                  </Avatar>
                  <Typography variant="h6" fontWeight={600}>
                    {member.name}
                  </Typography>
                  <Typography variant="body2" sx={{ color: textMuted }}>
                    {member.role}
                  </Typography>
                </MotionBox>
              </Grid>
            ))}
          </Grid>
        </MotionBox>

        {/* CTA Section */}
        <Box
          sx={{
            mt: { xs: 8, md: 12 },
            p: { xs: 4, md: 6 },
            borderRadius: 3,
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.2)}, ${alpha(theme.palette.background.paper, 0.9)})`,
            textAlign: "center",
            border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
          }}
        >
          <Typography variant="h5" fontWeight={600} sx={{ mb: 2 }}>
            Want to Join Us?
          </Typography>
          <Typography
            variant="body1"
            sx={{ color: textSecondary, mb: 3, maxWidth: 500, mx: "auto" }}
          >
            We're always looking for talented people to join our team. Check out our
            open positions and help us shape the future of entertainment.
          </Typography>
          <Stack direction="row" spacing={2} justifyContent="center">
            <Button
              component={Link}
              to="/careers"
              variant="contained"
              size="large"
              sx={{
                px: 4,
                py: 1.5,
                borderRadius: 2,
                backgroundColor: theme.palette.primary.main,
                fontWeight: 600,
                "&:hover": {
                  backgroundColor: theme.palette.primary.dark,
                },
              }}
            >
              View Careers
            </Button>
            <Button
              component={Link}
              to="/contact"
              variant="outlined"
              size="large"
              sx={{
                px: 4,
                py: 1.5,
                borderRadius: 2,
                borderColor: theme.palette.primary.main,
                color: theme.palette.primary.main,
                fontWeight: 600,
                "&:hover": {
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                },
              }}
            >
              Contact Us
            </Button>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
};

export default AboutPage;

