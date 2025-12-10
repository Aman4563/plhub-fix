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
  FormControl,
  InputLabel,
  Select,
  Chip,
} from "@mui/material";
import { motion } from "framer-motion";
import BugReportIcon from "@mui/icons-material/BugReport";
import SendIcon from "@mui/icons-material/Send";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import LinkOffIcon from "@mui/icons-material/LinkOff";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import SubtitlesOffIcon from "@mui/icons-material/SubtitlesOff";
import SpeedIcon from "@mui/icons-material/Speed";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";

const MotionBox = motion(Box);

const ReportIssuePage = () => {
  const theme = useTheme();
  const [formData, setFormData] = useState({
    issueType: "",
    contentTitle: "",
    contentUrl: "",
    browser: "",
    description: "",
    email: "",
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const issueTypes = [
    { value: "broken_link", label: "Broken Link / Video Not Playing", icon: <LinkOffIcon /> },
    { value: "wrong_content", label: "Wrong Content / Mislabeled", icon: <ErrorOutlineIcon /> },
    { value: "subtitle_issue", label: "Subtitle Issues", icon: <SubtitlesOffIcon /> },
    { value: "slow_loading", label: "Slow Loading / Buffering", icon: <SpeedIcon /> },
    { value: "bug", label: "Website Bug", icon: <BugReportIcon /> },
    { value: "other", label: "Other Issue", icon: <HelpOutlineIcon /> },
  ];

  const browsers = [
    "Chrome",
    "Firefox",
    "Safari",
    "Edge",
    "Opera",
    "Brave",
    "Other",
  ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    setShowSuccess(true);
    setFormData({
      issueType: "",
      contentTitle: "",
      contentUrl: "",
      browser: "",
      description: "",
      email: "",
    });
    setIsSubmitting(false);
  };

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
            <BugReportIcon sx={{ fontSize: 64, color: theme.palette.primary.main, mb: 2 }} />
            <Typography variant="h3" fontWeight={700} gutterBottom>
              Report an Issue
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, mx: "auto" }}>
              Found a problem? Let us know and we'll fix it as soon as possible. Your feedback helps us improve PLhub for everyone.
            </Typography>
          </MotionBox>

          {/* Quick Issue Types */}
          <MotionBox variants={itemVariants} sx={{ mb: 4 }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, textAlign: "center" }}>
              Common Issue Types
            </Typography>
            <Stack direction="row" flexWrap="wrap" justifyContent="center" gap={1}>
              {issueTypes.map((type) => (
                <Chip
                  key={type.value}
                  icon={type.icon}
                  label={type.label}
                  onClick={() => setFormData({ ...formData, issueType: type.value })}
                  variant={formData.issueType === type.value ? "filled" : "outlined"}
                  sx={{
                    py: 2.5,
                    px: 1,
                    borderColor: formData.issueType === type.value ? theme.palette.primary.main : theme.palette.divider,
                    backgroundColor: formData.issueType === type.value ? alpha(theme.palette.primary.main, 0.1) : "transparent",
                    color: formData.issueType === type.value ? theme.palette.primary.main : theme.palette.text.secondary,
                    "&:hover": {
                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    },
                  }}
                />
              ))}
            </Stack>
          </MotionBox>

          {/* Report Form */}
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
              <Box component="form" onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <FormControl fullWidth required>
                      <InputLabel>Issue Type</InputLabel>
                      <Select
                        name="issueType"
                        value={formData.issueType}
                        onChange={handleChange}
                        label="Issue Type"
                      >
                        {issueTypes.map((type) => (
                          <MenuItem key={type.value} value={type.value}>
                            <Stack direction="row" spacing={1} alignItems="center">
                              {type.icon}
                              <span>{type.label}</span>
                            </Stack>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Content Title"
                      name="contentTitle"
                      value={formData.contentTitle}
                      onChange={handleChange}
                      required
                      placeholder="e.g., Breaking Bad S01E01"
                      helperText="Movie or TV show title with episode if applicable"
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Content URL"
                      name="contentUrl"
                      value={formData.contentUrl}
                      onChange={handleChange}
                      placeholder="https://plhub.com/..."
                      helperText="Copy the URL from your browser"
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      select
                      label="Browser"
                      name="browser"
                      value={formData.browser}
                      onChange={handleChange}
                      required
                    >
                      {browsers.map((browser) => (
                        <MenuItem key={browser} value={browser}>
                          {browser}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Email (optional)"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      helperText="We'll notify you when the issue is fixed"
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      required
                      multiline
                      rows={4}
                      placeholder="Please describe the issue in detail. Include any error messages you see, what you were trying to do, and what happened instead."
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      fullWidth
                      disabled={isSubmitting}
                      endIcon={<SendIcon />}
                      sx={{
                        py: 1.5,
                        backgroundColor: theme.palette.primary.main,
                        "&:hover": { backgroundColor: theme.palette.primary.dark },
                      }}
                    >
                      {isSubmitting ? "Submitting..." : "Submit Report"}
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </Paper>
          </MotionBox>

          {/* Tips */}
          <MotionBox variants={itemVariants} sx={{ mt: 4 }}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                backgroundColor: alpha(theme.palette.warning.main, 0.1),
                border: `1px solid ${theme.palette.warning.main}`,
                borderRadius: 2,
              }}
            >
              <Stack direction="row" spacing={2} alignItems="flex-start">
                <WarningAmberIcon sx={{ color: theme.palette.warning.main, mt: 0.5 }} />
                <Box>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    Before Reporting
                  </Typography>
                  <Stack spacing={0.5}>
                    {[
                      "Try refreshing the page or clearing your browser cache",
                      "Disable any ad blockers and try again",
                      "Try switching to a different video server/source",
                      "Check if the issue occurs in a different browser",
                    ].map((tip, idx) => (
                      <Typography key={idx} variant="body2" color="text.secondary">
                        • {tip}
                      </Typography>
                    ))}
                  </Stack>
                </Box>
              </Stack>
            </Paper>
          </MotionBox>
        </MotionBox>
      </Container>

      {/* Success Message */}
      <Snackbar
        open={showSuccess}
        autoHideDuration={6000}
        onClose={() => setShowSuccess(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setShowSuccess(false)}
          severity="success"
          sx={{ width: "100%" }}
        >
          Issue reported successfully! Thank you for helping us improve PLhub.
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ReportIssuePage;

