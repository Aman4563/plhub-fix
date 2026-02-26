import { useState } from "react";
import {
  Box,
  Container,
  Typography,
  Paper,
  Stack,
  TextField,
  Button,
  Grid,
  useTheme,
  alpha,
  MenuItem,
  Snackbar,
  Alert,
  CircularProgress,
} from "@mui/material";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import ContactMailIcon from "@mui/icons-material/ContactMail";
import EmailIcon from "@mui/icons-material/Email";
import SendIcon from "@mui/icons-material/Send";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import TwitterIcon from "@mui/icons-material/Twitter";
import TelegramIcon from "@mui/icons-material/Telegram";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

import contactApi from "../../api/modules/contact.api";

const MotionBox = motion(Box);

const ContactPage = () => {
  const theme = useTheme();
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    category: "",
    message: "",
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ticketNumber, setTicketNumber] = useState(null);
  const [error, setError] = useState(null);

  const categories = [
    "General Inquiry",
    "Technical Support",
    "Account Issues",
    "Content Request",
    "Bug Report",
    "Partnership",
    "DMCA",
    "Other",
  ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name || !formData.email || !formData.subject || !formData.category || !formData.message) {
      setError("Please fill in all required fields");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    
    const { response, err } = await contactApi.submit(formData);
    
    setIsSubmitting(false);

    if (response) {
      setShowSuccess(true);
      setTicketNumber(response.ticketNumber);
      setFormData({ name: "", email: "", subject: "", category: "", message: "" });
    } else if (err) {
      setError(err.message || "Failed to send message. Please try again.");
    }
  };

  const contactInfo = [
    {
      icon: <EmailIcon />,
      title: "Email",
      content: "support@plhub.com",
      subtext: "We typically respond within 24 hours",
    },
    {
      icon: <LocationOnIcon />,
      title: "Location",
      content: "Global Service",
      subtext: "Available worldwide",
    },
    {
      icon: <AccessTimeIcon />,
      title: "Support Hours",
      content: "24/7 Support",
      subtext: "We're always here to help",
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
      <Container maxWidth="lg">
        <MotionBox
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Header */}
          <MotionBox variants={itemVariants} sx={{ textAlign: "center", mb: 6 }}>
            <ContactMailIcon sx={{ fontSize: 64, color: theme.palette.primary.main, mb: 2 }} />
            <Typography variant="h3" fontWeight={700} gutterBottom>
              {t("contact.title", "Contact Us")}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, mx: "auto" }}>
              {t("contact.subtitle", "Have a question or need assistance? We'd love to hear from you. Send us a message and we'll respond as soon as possible.")}
            </Typography>
          </MotionBox>

          <Grid container spacing={4}>
            {/* Contact Form */}
            <Grid item xs={12} md={7}>
              <MotionBox variants={itemVariants}>
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
                  <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
                    {t("contact.sendMessage", "Send us a Message")}
                  </Typography>
                  
                  {error && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                      {error}
                    </Alert>
                  )}

                  <Box component="form" onSubmit={handleSubmit}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label={t("contact.name", "Your Name")}
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          required
                          variant="outlined"
                          disabled={isSubmitting}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label={t("contact.email", "Email Address")}
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          variant="outlined"
                          disabled={isSubmitting}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          select
                          label={t("contact.category", "Category")}
                          name="category"
                          value={formData.category}
                          onChange={handleChange}
                          required
                          variant="outlined"
                          disabled={isSubmitting}
                        >
                          {categories.map((option) => (
                            <MenuItem key={option} value={option}>
                              {option}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label={t("contact.subject", "Subject")}
                          name="subject"
                          value={formData.subject}
                          onChange={handleChange}
                          required
                          variant="outlined"
                          disabled={isSubmitting}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label={t("contact.message", "Message")}
                          name="message"
                          value={formData.message}
                          onChange={handleChange}
                          required
                          multiline
                          rows={5}
                          variant="outlined"
                          disabled={isSubmitting}
                          helperText={`${formData.message.length}/5000 characters`}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Button
                          type="submit"
                          variant="contained"
                          size="large"
                          fullWidth
                          disabled={isSubmitting}
                          endIcon={
                            isSubmitting ? (
                              <CircularProgress size={20} color="inherit" />
                            ) : (
                              <SendIcon />
                            )
                          }
                          sx={{
                            py: 1.5,
                            backgroundColor: theme.palette.primary.main,
                            "&:hover": { backgroundColor: theme.palette.primary.dark },
                          }}
                        >
                          {isSubmitting ? t("contact.sending", "Sending...") : t("contact.send", "Send Message")}
                        </Button>
                      </Grid>
                    </Grid>
                  </Box>
                </Paper>
              </MotionBox>
            </Grid>

            {/* Contact Info */}
            <Grid item xs={12} md={5}>
              <Stack spacing={3}>
                {contactInfo.map((info, index) => (
                  <MotionBox key={`contact-info-${index}`} variants={itemVariants}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 3,
                        backgroundColor: alpha(theme.palette.background.paper, 0.6),
                        backdropFilter: "blur(10px)",
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 2,
                      }}
                    >
                      <Stack direction="row" spacing={2} alignItems="flex-start">
                        <Box
                          sx={{
                            p: 1.5,
                            borderRadius: 1,
                            backgroundColor: alpha(theme.palette.primary.main, 0.1),
                            color: theme.palette.primary.main,
                          }}
                        >
                          {info.icon}
                        </Box>
                        <Box>
                          <Typography variant="subtitle2" color="text.secondary">
                            {info.title}
                          </Typography>
                          <Typography variant="body1" fontWeight={600}>
                            {info.content}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {info.subtext}
                          </Typography>
                        </Box>
                      </Stack>
                    </Paper>
                  </MotionBox>
                ))}

                {/* Social Links */}
                <MotionBox variants={itemVariants}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
                      backgroundColor: alpha(theme.palette.primary.main, 0.05),
                      border: `1px solid ${theme.palette.primary.main}`,
                      borderRadius: 2,
                    }}
                  >
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                      Connect with us on social media
                    </Typography>
                    <Stack direction="row" spacing={2}>
                      <Button
                        variant="outlined"
                        startIcon={<TwitterIcon />}
                        href="https://twitter.com/plhub"
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                          borderColor: "#1DA1F2",
                          color: "#1DA1F2",
                          "&:hover": {
                            backgroundColor: alpha("#1DA1F2", 0.1),
                            borderColor: "#1DA1F2",
                          },
                        }}
                      >
                        Twitter
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<TelegramIcon />}
                        href="https://t.me/plhub"
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                          borderColor: "#0088cc",
                          color: "#0088cc",
                          "&:hover": {
                            backgroundColor: alpha("#0088cc", 0.1),
                            borderColor: "#0088cc",
                          },
                        }}
                      >
                        Telegram
                      </Button>
                    </Stack>
                  </Paper>
                </MotionBox>
              </Stack>
            </Grid>
          </Grid>
        </MotionBox>
      </Container>

      {/* Success Message */}
      <Snackbar
        open={showSuccess}
        autoHideDuration={10000}
        onClose={() => setShowSuccess(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setShowSuccess(false)}
          severity="success"
          icon={<CheckCircleIcon />}
          sx={{ width: "100%" }}
        >
          <Box>
            <Typography variant="body2" fontWeight={600}>
              {t("contact.success", "Message sent successfully! We'll get back to you soon.")}
            </Typography>
            {ticketNumber && (
              <Typography variant="caption" sx={{ display: "block", mt: 0.5 }}>
                Your ticket number: <strong>{ticketNumber}</strong>
              </Typography>
            )}
          </Box>
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ContactPage;
