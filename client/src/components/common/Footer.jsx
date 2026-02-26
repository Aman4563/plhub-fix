import { useState } from "react";
import {
  Box,
  Stack,
  Typography,
  IconButton,
  TextField,
  Button,
  Divider,
  Grid,
  useTheme,
  alpha,
  Tooltip,
  Collapse,
  useMediaQuery,
  Select,
  MenuItem,
  FormControl,
  CircularProgress,
} from "@mui/material";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import TwitterIcon from "@mui/icons-material/Twitter";
import YouTubeIcon from "@mui/icons-material/YouTube";
import TelegramIcon from "@mui/icons-material/Telegram";
import RedditIcon from "@mui/icons-material/Reddit";
import InstagramIcon from "@mui/icons-material/Instagram";
import DiscordIcon from "@mui/icons-material/Forum";
import EmailIcon from "@mui/icons-material/Email";
import SendIcon from "@mui/icons-material/Send";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import AndroidIcon from "@mui/icons-material/Android";
import AppleIcon from "@mui/icons-material/Apple";
import LanguageIcon from "@mui/icons-material/Language";
import PublicIcon from "@mui/icons-material/Public";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

import Logo from "./Logo";
import newsletterApi from "../../api/modules/newsletter.api";

const MotionBox = motion(Box);
const MotionIconButton = motion(IconButton);

/**
 * Footer Component
 * - Modern, comprehensive footer inspired by Netflix/IMDb.
 * - Features: Social links, A-Z browsing, navigation, newsletter, legal links, language selector.
 * - Full i18n support with real newsletter API integration.
 */
const Footer = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  
  const [email, setEmail] = useState("");
  const [showAZIndex, setShowAZIndex] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [subscribeSuccess, setSubscribeSuccess] = useState(false);
  const [language, setLanguage] = useState(i18n.language || "en");
  const [region, setRegion] = useState(localStorage.getItem("plhub_region") || "US");

  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  const handleAlphabetClick = (letter) => {
    navigate(`/search?query=${letter}`);
  };

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsSubscribing(true);
    
    const { response, err } = await newsletterApi.subscribe({
      email,
      source: "footer",
    });

    setIsSubscribing(false);

    if (response) {
      setSubscribeSuccess(true);
      setEmail("");
      toast.success(response.message || "Successfully subscribed!");
      setTimeout(() => setSubscribeSuccess(false), 5000);
    } else if (err) {
      toast.error(err.message || "Failed to subscribe. Please try again.");
    }
  };

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    i18n.changeLanguage(newLang);
    localStorage.setItem("plhub_language", newLang);
  };

  const handleRegionChange = (e) => {
    const newRegion = e.target.value;
    setRegion(newRegion);
    localStorage.setItem("plhub_region", newRegion);
  };

  // Real social media links - update these with actual URLs
  const socialLinks = [
    { id: "youtube", icon: <YouTubeIcon />, label: "YouTube", href: "https://youtube.com/@plhub", color: "#FF0000" },
    { id: "twitter", icon: <TwitterIcon />, label: "Twitter", href: "https://twitter.com/plhub", color: "#1DA1F2" },
    { id: "instagram", icon: <InstagramIcon />, label: "Instagram", href: "https://instagram.com/plhub", color: "#E4405F" },
    { id: "telegram", icon: <TelegramIcon />, label: "Telegram", href: "https://t.me/plhub", color: "#0088cc" },
    { id: "reddit", icon: <RedditIcon />, label: "Reddit", href: "https://reddit.com/r/plhub", color: "#FF4500" },
    { id: "discord", icon: <DiscordIcon />, label: "Discord", href: "https://discord.gg/plhub", color: "#5865F2" },
  ];

  const navigationLinks = [
    { id: "nav-home", label: t("footer.home"), path: "/" },
    { id: "nav-movies", label: t("footer.movies"), path: "/movie" },
    { id: "nav-tv", label: t("footer.tvSeries"), path: "/tv" },
    { id: "nav-search", label: t("footer.search"), path: "/search" },
    { id: "nav-demand", label: t("footer.demand"), path: "/feedback" },
  ];

  const legalLinks = [
    { id: "legal-privacy", label: t("footer.privacyPolicy"), path: "/privacy-policy" },
    { id: "legal-terms", label: t("footer.termsOfService"), path: "/terms" },
    { id: "legal-dmca", label: t("footer.dmca"), path: "/dmca" },
    { id: "legal-cookies", label: t("footer.cookiePolicy"), path: "/cookies" },
  ];

  const supportLinks = [
    { id: "support-help", label: t("footer.helpCenter"), path: "/help" },
    { id: "support-contact", label: t("footer.contactUs"), path: "/contact" },
    { id: "support-faq", label: t("footer.faq"), path: "/faq" },
    { id: "support-report", label: t("footer.reportIssue"), path: "/report" },
  ];

  const corporateLinks = [
    { id: "corp-about", label: t("footer.aboutUs"), path: "/about" },
    { id: "corp-careers", label: t("footer.careers"), path: "/careers" },
    { id: "corp-press", label: t("footer.press"), path: "/press" },
  ];

  const languages = [
    { code: "en", label: "English" },
    { code: "es", label: "Español" },
    { code: "fr", label: "Français" },
    { code: "de", label: "Deutsch" },
    { code: "pt", label: "Português" },
    { code: "ja", label: "日本語" },
    { code: "ko", label: "한국어" },
    { code: "zh", label: "中文" },
    { code: "hi", label: "हिन्दी" },
    { code: "ar", label: "العربية" },
  ];

  const regions = [
    { code: "US", label: "United States" },
    { code: "UK", label: "United Kingdom" },
    { code: "CA", label: "Canada" },
    { code: "AU", label: "Australia" },
    { code: "IN", label: "India" },
    { code: "DE", label: "Germany" },
    { code: "FR", label: "France" },
    { code: "JP", label: "Japan" },
    { code: "BR", label: "Brazil" },
    { code: "MX", label: "Mexico" },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  // Theme-aware text colors
  const textPrimary = theme.palette.text.primary;
  const textSecondary = theme.palette.text.secondary;
  const textMuted = alpha(theme.palette.text.primary, 0.6);
  const borderColor = theme.palette.divider;

  const FooterLink = ({ to, children, isActive }) => (
    <Box
      component={Link}
      to={to}
      sx={{
        color: isActive ? theme.palette.primary.main : textSecondary,
        textDecoration: "none",
        fontSize: "0.875rem",
        py: 0.5,
        display: "block",
        position: "relative",
        transition: "color 0.2s ease, transform 0.2s ease",
        "&:hover": {
          color: theme.palette.primary.main,
          transform: "translateX(4px)",
        },
        "&::before": isActive
          ? {
              content: '""',
              position: "absolute",
              left: -12,
              top: "50%",
              transform: "translateY(-50%)",
              width: 4,
              height: 4,
              borderRadius: "50%",
              backgroundColor: theme.palette.primary.main,
            }
          : {},
      }}
    >
      {children}
    </Box>
  );

  const SectionTitle = ({ children }) => (
    <Typography
      variant="subtitle1"
      fontWeight={600}
      sx={{
        color: textPrimary,
        mb: 2,
        textTransform: "uppercase",
        fontSize: "0.75rem",
        letterSpacing: "0.1em",
      }}
    >
      {children}
    </Typography>
  );

  return (
    <Box
      component="footer"
      role="contentinfo"
      dir={language === "ar" ? "rtl" : "ltr"}
      sx={{
        backgroundColor: alpha(theme.palette.background.paper, 0.95),
        borderTop: `1px solid ${theme.palette.divider}`,
        mt: "auto",
        position: "relative",
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "1px",
          background: `linear-gradient(90deg, transparent, ${theme.palette.primary.main}, transparent)`,
        },
      }}
    >
      {/* Social Media Bar */}
      <Box
        sx={{
          backgroundColor: alpha(theme.palette.background.default, 0.5),
          py: 2,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Stack
          direction="row"
          justifyContent="center"
          alignItems="center"
          spacing={1}
          flexWrap="wrap"
        >
          <Typography
            variant="body2"
            sx={{ color: textSecondary, mr: 2 }}
          >
            {t("footer.followUs")}:
          </Typography>
          {socialLinks.map((social) => (
            <Tooltip key={social.id} title={social.label} arrow>
              <MotionIconButton
                component="a"
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Follow us on ${social.label}`}
                whileHover={{ scale: 1.2, y: -2 }}
                whileTap={{ scale: 0.95 }}
                sx={{
                  color: textSecondary,
                  transition: "color 0.2s ease",
                  "&:hover": {
                    color: social.color,
                    backgroundColor: alpha(social.color, 0.1),
                  },
                }}
              >
                {social.icon}
              </MotionIconButton>
            </Tooltip>
          ))}
        </Stack>
      </Box>

      {/* Main Footer Content */}
      <MotionBox
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        sx={{
          maxWidth: "1600px",
          mx: "auto",
          px: { xs: 2, sm: 4, md: 6 },
          py: { xs: 4, md: 6 },
        }}
      >
        <Grid container spacing={4}>
          {/* Logo & Description */}
          <Grid item xs={12} md={3}>
            <MotionBox variants={itemVariants}>
              <Logo variant="default" />
              <Typography
                variant="body2"
                sx={{
                  color: textSecondary,
                  mt: 2,
                  maxWidth: 280,
                  lineHeight: 1.7,
                }}
              >
                {t("footer.tagline")}
              </Typography>

              {/* App Download Buttons - Real App Store Links */}
              <Stack direction="row" spacing={1} sx={{ mt: 3 }}>
                <Button
                  component="a"
                  href="https://apps.apple.com/app/plhub"
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="outlined"
                  size="small"
                  startIcon={<AppleIcon />}
                  sx={{
                    borderColor: borderColor,
                    color: textSecondary,
                    fontSize: "0.7rem",
                    "&:hover": {
                      borderColor: theme.palette.primary.main,
                      color: theme.palette.primary.main,
                    },
                  }}
                >
                  {t("footer.ios")}
                </Button>
                <Button
                  component="a"
                  href="https://play.google.com/store/apps/details?id=com.plhub"
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="outlined"
                  size="small"
                  startIcon={<AndroidIcon />}
                  sx={{
                    borderColor: borderColor,
                    color: textSecondary,
                    fontSize: "0.7rem",
                    "&:hover": {
                      borderColor: theme.palette.primary.main,
                      color: theme.palette.primary.main,
                    },
                  }}
                >
                  {t("footer.android")}
                </Button>
              </Stack>
            </MotionBox>
          </Grid>

          {/* Navigation Links */}
          <Grid item xs={6} sm={4} md={1.5}>
            <MotionBox variants={itemVariants}>
              <SectionTitle>{t("footer.browse")}</SectionTitle>
              <Stack spacing={0.5}>
                {navigationLinks.map((link) => (
                  <FooterLink
                    key={link.id}
                    to={link.path}
                    isActive={location.pathname === link.path}
                  >
                    {link.label}
                  </FooterLink>
                ))}
              </Stack>
            </MotionBox>
          </Grid>

          {/* Support Links */}
          <Grid item xs={6} sm={4} md={1.5}>
            <MotionBox variants={itemVariants}>
              <SectionTitle>{t("footer.support")}</SectionTitle>
              <Stack spacing={0.5}>
                {supportLinks.map((link) => (
                  <FooterLink key={link.id} to={link.path}>
                    {link.label}
                  </FooterLink>
                ))}
              </Stack>
            </MotionBox>
          </Grid>

          {/* Legal Links */}
          <Grid item xs={6} sm={4} md={1.5}>
            <MotionBox variants={itemVariants}>
              <SectionTitle>{t("footer.legal")}</SectionTitle>
              <Stack spacing={0.5}>
                {legalLinks.map((link) => (
                  <FooterLink key={link.id} to={link.path}>
                    {link.label}
                  </FooterLink>
                ))}
              </Stack>
            </MotionBox>
          </Grid>

          {/* Corporate Links */}
          <Grid item xs={6} sm={4} md={1.5}>
            <MotionBox variants={itemVariants}>
              <SectionTitle>{t("footer.company")}</SectionTitle>
              <Stack spacing={0.5}>
                {corporateLinks.map((link) => (
                  <FooterLink key={link.id} to={link.path}>
                    {link.label}
                  </FooterLink>
                ))}
              </Stack>
            </MotionBox>
          </Grid>

          {/* Newsletter */}
          <Grid item xs={12} sm={8} md={3}>
            <MotionBox variants={itemVariants}>
              <SectionTitle>{t("footer.stayUpdated")}</SectionTitle>
              <Typography
                variant="body2"
                sx={{ color: textSecondary, mb: 2 }}
              >
                {t("footer.newsletterDesc")}
              </Typography>
              <Box component="form" onSubmit={handleNewsletterSubmit}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder={t("footer.enterEmail")}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubscribing || subscribeSuccess}
                  InputProps={{
                    startAdornment: subscribeSuccess ? (
                      <CheckCircleIcon
                        sx={{
                          color: theme.palette.success.main,
                          mr: 1,
                          fontSize: "1.2rem",
                        }}
                      />
                    ) : (
                      <EmailIcon
                        sx={{
                          color: textMuted,
                          mr: 1,
                          fontSize: "1.2rem",
                        }}
                      />
                    ),
                    sx: {
                      backgroundColor: alpha(theme.palette.background.default, 0.5),
                      color: textPrimary,
                      "& fieldset": { borderColor: subscribeSuccess ? theme.palette.success.main : borderColor },
                      "&:hover fieldset": {
                        borderColor: subscribeSuccess ? theme.palette.success.main : theme.palette.primary.light,
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: theme.palette.primary.main,
                      },
                      "& input::placeholder": {
                        color: textMuted,
                        opacity: 1,
                      },
                    },
                  }}
                  sx={{ mb: 1 }}
                />
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="small"
                  disabled={isSubscribing || subscribeSuccess || !email}
                  endIcon={
                    isSubscribing ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : subscribeSuccess ? (
                      <CheckCircleIcon />
                    ) : (
                      <SendIcon />
                    )
                  }
                  sx={{
                    backgroundColor: subscribeSuccess 
                      ? theme.palette.success.main 
                      : theme.palette.primary.main,
                    "&:hover": {
                      backgroundColor: subscribeSuccess 
                        ? theme.palette.success.dark 
                        : theme.palette.primary.dark,
                    },
                  }}
                >
                  {subscribeSuccess ? t("footer.subscribed") : t("footer.subscribe")}
                </Button>
              </Box>

              {/* Language & Region Selector */}
              <Stack direction="row" spacing={1} sx={{ mt: 3 }}>
                <FormControl size="small" sx={{ minWidth: 100 }}>
                  <Select
                    value={language}
                    onChange={handleLanguageChange}
                    startAdornment={<LanguageIcon sx={{ mr: 0.5, fontSize: "1rem", color: textSecondary }} />}
                    sx={{
                      color: textSecondary,
                      fontSize: "0.75rem",
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: borderColor,
                      },
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: theme.palette.primary.light,
                      },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: theme.palette.primary.main,
                      },
                      "& .MuiSvgIcon-root": {
                        color: textSecondary,
                      },
                    }}
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          backgroundColor: theme.palette.background.paper,
                          maxHeight: 200,
                        },
                      },
                    }}
                  >
                    {languages.map((lang) => (
                      <MenuItem key={lang.code} value={lang.code} sx={{ fontSize: "0.8rem" }}>
                        {lang.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 90 }}>
                  <Select
                    value={region}
                    onChange={handleRegionChange}
                    startAdornment={<PublicIcon sx={{ mr: 0.5, fontSize: "1rem", color: textSecondary }} />}
                    sx={{
                      color: textSecondary,
                      fontSize: "0.75rem",
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: borderColor,
                      },
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: theme.palette.primary.light,
                      },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: theme.palette.primary.main,
                      },
                      "& .MuiSvgIcon-root": {
                        color: textSecondary,
                      },
                    }}
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          backgroundColor: theme.palette.background.paper,
                          maxHeight: 200,
                        },
                      },
                    }}
                  >
                    {regions.map((reg) => (
                      <MenuItem key={reg.code} value={reg.code} sx={{ fontSize: "0.8rem" }}>
                        {reg.code}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>
            </MotionBox>
          </Grid>
        </Grid>

        {/* A-Z Index Section */}
        <Divider sx={{ my: 4, borderColor: borderColor }} />

        <Box sx={{ textAlign: "center" }}>
          <Button
            onClick={() => setShowAZIndex(!showAZIndex)}
            endIcon={showAZIndex ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            sx={{
              color: textSecondary,
              textTransform: "none",
              "&:hover": {
                color: theme.palette.primary.main,
                backgroundColor: "transparent",
              },
            }}
          >
            {t("footer.browseAZ")}
          </Button>

          <Collapse in={showAZIndex}>
            <Box sx={{ mt: 3 }}>
              <Typography
                variant="body2"
                sx={{ color: textMuted, mb: 2 }}
              >
                {t("footer.azDesc")}
              </Typography>
              <Stack
                direction="row"
                justifyContent="center"
                flexWrap="wrap"
                gap={0.5}
              >
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => handleAlphabetClick("")}
                  sx={{
                    minWidth: isMobile ? 32 : 36,
                    height: isMobile ? 32 : 36,
                    fontSize: isMobile ? "0.65rem" : "0.75rem",
                    backgroundColor: theme.palette.primary.main,
                    "&:hover": { backgroundColor: theme.palette.primary.dark },
                  }}
                >
                  {t("common.all")}
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => handleAlphabetClick("#")}
                  sx={{
                    minWidth: isMobile ? 32 : 36,
                    height: isMobile ? 32 : 36,
                    fontSize: isMobile ? "0.65rem" : "0.75rem",
                    borderColor: borderColor,
                    color: textSecondary,
                    "&:hover": {
                      borderColor: theme.palette.primary.main,
                      color: theme.palette.primary.main,
                    },
                  }}
                >
                  #
                </Button>
                {[...Array(10)].map((_, idx) => (
                  <Button
                    key={`number-${idx}`}
                    variant="outlined"
                    size="small"
                    onClick={() => handleAlphabetClick(idx.toString())}
                    sx={{
                      minWidth: isMobile ? 32 : 36,
                      height: isMobile ? 32 : 36,
                      fontSize: isMobile ? "0.65rem" : "0.75rem",
                      borderColor: borderColor,
                      color: textSecondary,
                      "&:hover": {
                        borderColor: theme.palette.primary.main,
                        color: theme.palette.primary.main,
                      },
                    }}
                  >
                    {idx}
                  </Button>
                ))}
                {alphabet.map((letter) => (
                  <Button
                    key={`letter-${letter}`}
                    variant="outlined"
                    size="small"
                    onClick={() => handleAlphabetClick(letter)}
                    sx={{
                      minWidth: isMobile ? 32 : 36,
                      height: isMobile ? 32 : 36,
                      fontSize: isMobile ? "0.65rem" : "0.75rem",
                      borderColor: borderColor,
                      color: textSecondary,
                      "&:hover": {
                        borderColor: theme.palette.primary.main,
                        color: theme.palette.primary.main,
                      },
                    }}
                  >
                    {letter}
                  </Button>
                ))}
              </Stack>
            </Box>
          </Collapse>
        </Box>
      </MotionBox>

      {/* Bottom Bar - Copyright & Legal */}
      <Box
        sx={{
          backgroundColor: alpha(theme.palette.background.default, 0.8),
          borderTop: `1px solid ${borderColor}`,
          py: 2,
          px: { xs: 2, md: 6 },
        }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          alignItems="center"
          spacing={2}
          sx={{ maxWidth: "1600px", mx: "auto" }}
        >
          <Typography
            variant="body2"
            sx={{ color: textMuted, textAlign: "center" }}
          >
            {t("footer.copyright", { year: new Date().getFullYear() })}
          </Typography>

          <Typography
            variant="caption"
            sx={{
              color: textMuted,
              textAlign: "center",
              maxWidth: { xs: "100%", md: "50%" },
            }}
          >
            {t("footer.disclaimer")}
          </Typography>

          <Stack direction="row" spacing={2} flexWrap="wrap" justifyContent="center">
            {legalLinks.slice(0, 3).map((link) => (
              <Box
                key={`bottom-${link.id}`}
                component={Link}
                to={link.path}
                sx={{
                  color: textMuted,
                  textDecoration: "none",
                  fontSize: "0.75rem",
                  "&:hover": {
                    color: theme.palette.primary.main,
                    textDecoration: "underline",
                  },
                }}
              >
                {link.label}
              </Box>
            ))}
          </Stack>
        </Stack>
      </Box>
    </Box>
  );
};

export default Footer;
