import { useState } from "react";
import {
  Box,
  Container,
  Typography,
  Grid,
  Stack,
  Card,
  CardContent,
  Chip,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useTheme,
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  CircularProgress,
  Alert,
  IconButton,
} from "@mui/material";
import { motion } from "framer-motion";
import { toast } from "react-toastify";

import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import WorkIcon from "@mui/icons-material/Work";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CodeIcon from "@mui/icons-material/Code";
import BrushIcon from "@mui/icons-material/Brush";
import CampaignIcon from "@mui/icons-material/Campaign";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import HealthAndSafetyIcon from "@mui/icons-material/HealthAndSafety";
import BeachAccessIcon from "@mui/icons-material/BeachAccess";
import SchoolIcon from "@mui/icons-material/School";
import HomeIcon from "@mui/icons-material/Home";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

import careersApi from "../../api/modules/careers.api";

const MotionBox = motion(Box);
const MotionCard = motion(Card);

/**
 * Careers Page Component
 * - Displays job openings, benefits, and company culture information.
 */
const CareersPage = () => {
  const theme = useTheme();
  const [expandedJob, setExpandedJob] = useState(null);
  const [applicationDialogOpen, setApplicationDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [applicationId, setApplicationId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    experience: "",
    linkedinUrl: "",
    portfolioUrl: "",
    coverLetter: "",
    referralSource: "Website",
  });
  const [formError, setFormError] = useState(null);
  
  // Theme-aware colors (keeping for future use)
  const textSecondary = theme.palette.text.secondary;
  // eslint-disable-next-line no-unused-vars
  const textMuted = alpha(theme.palette.text.primary, 0.6);
  // eslint-disable-next-line no-unused-vars
  const borderColor = theme.palette.divider;

  const handleOpenApplication = (job = null) => {
    setSelectedJob(job);
    setApplicationDialogOpen(true);
    setSubmitSuccess(false);
    setApplicationId(null);
    setFormError(null);
  };

  const handleCloseApplication = () => {
    setApplicationDialogOpen(false);
    setSelectedJob(null);
    setFormData({
      name: "",
      email: "",
      phone: "",
      experience: "",
      linkedinUrl: "",
      portfolioUrl: "",
      coverLetter: "",
      referralSource: "Website",
    });
    setFormError(null);
    setSubmitSuccess(false);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormError(null);
  };

  const handleSubmitApplication = async () => {
    // Validation
    if (!formData.name || !formData.email) {
      setFormError("Name and email are required");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setFormError("Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    const applicationData = {
      ...formData,
      position: selectedJob?.title || "General Application",
      department: selectedJob?.department || "Other",
    };

    const { response, err } = await careersApi.apply(applicationData);

    setIsSubmitting(false);

    if (response) {
      setSubmitSuccess(true);
      setApplicationId(response.applicationId);
      toast.success("Application submitted successfully!");
    } else if (err) {
      setFormError(err.message || "Failed to submit application. Please try again.");
    }
  };

  const departments = [
    { id: "engineering", icon: <CodeIcon />, label: "Engineering", count: 5 },
    { id: "design", icon: <BrushIcon />, label: "Design", count: 2 },
    { id: "marketing", icon: <CampaignIcon />, label: "Marketing", count: 3 },
    { id: "support", icon: <SupportAgentIcon />, label: "Support", count: 2 },
  ];

  const benefits = [
    { icon: <HealthAndSafetyIcon />, title: "Health Insurance", description: "Comprehensive medical, dental, and vision coverage for you and your family." },
    { icon: <BeachAccessIcon />, title: "Unlimited PTO", description: "Take the time you need. We trust you to manage your schedule." },
    { icon: <SchoolIcon />, title: "Learning Budget", description: "$2,000 annual budget for courses, conferences, and books." },
    { icon: <HomeIcon />, title: "Remote First", description: "Work from anywhere. We're a fully distributed team." },
    { icon: <FitnessCenterIcon />, title: "Wellness Stipend", description: "$100/month for gym, mental health apps, or wellness activities." },
    { icon: <RestaurantIcon />, title: "Team Events", description: "Quarterly team retreats and virtual social events." },
  ];

  const jobs = [
    {
      id: "senior-frontend",
      title: "Senior Frontend Engineer",
      department: "Engineering",
      location: "Remote (Worldwide)",
      type: "Full-time",
      description: "We're looking for a senior frontend engineer to help build the next generation of our streaming platform.",
      requirements: [
        "5+ years of experience with React and modern JavaScript",
        "Experience with state management (Redux, MobX, or similar)",
        "Strong understanding of responsive design and CSS-in-JS",
        "Experience with testing frameworks (Jest, React Testing Library)",
        "Excellent communication skills",
      ],
      salary: "$150,000 - $200,000",
    },
    {
      id: "backend-engineer",
      title: "Backend Engineer",
      department: "Engineering",
      location: "Remote (Worldwide)",
      type: "Full-time",
      description: "Join our backend team to build scalable APIs and services that power our platform.",
      requirements: [
        "3+ years of experience with Node.js or Python",
        "Experience with MongoDB, PostgreSQL, or similar databases",
        "Understanding of RESTful API design principles",
        "Experience with cloud services (AWS, GCP, or Azure)",
        "Familiarity with containerization (Docker, Kubernetes)",
      ],
      salary: "$120,000 - $170,000",
    },
    {
      id: "product-designer",
      title: "Product Designer",
      department: "Design",
      location: "Remote (US/EU)",
      type: "Full-time",
      description: "Help shape the user experience of our platform used by millions of people worldwide.",
      requirements: [
        "4+ years of product design experience",
        "Strong portfolio demonstrating UI/UX projects",
        "Proficiency in Figma and prototyping tools",
        "Experience conducting user research",
        "Understanding of accessibility standards",
      ],
      salary: "$130,000 - $180,000",
    },
    {
      id: "content-marketing",
      title: "Content Marketing Manager",
      department: "Marketing",
      location: "Remote (Worldwide)",
      type: "Full-time",
      description: "Drive our content strategy and help grow our audience through engaging content.",
      requirements: [
        "3+ years of content marketing experience",
        "Excellent writing and editing skills",
        "Experience with SEO and content analytics",
        "Passion for movies and TV shows",
        "Social media management experience",
      ],
      salary: "$80,000 - $120,000",
    },
    {
      id: "customer-support",
      title: "Customer Support Specialist",
      department: "Support",
      location: "Remote (Worldwide)",
      type: "Full-time",
      description: "Be the voice of PLhub and help our users get the most out of our platform.",
      requirements: [
        "2+ years of customer support experience",
        "Excellent written and verbal communication",
        "Problem-solving mindset",
        "Experience with support tools (Zendesk, Intercom)",
        "Fluency in English (additional languages a plus)",
      ],
      salary: "$50,000 - $70,000",
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
            Join Our Team
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
            Help us build the future of entertainment. We're looking for passionate
            people to join our remote-first team.
          </Typography>
        </MotionBox>

        {/* Department Filter */}
        <MotionBox
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          sx={{ mb: 6 }}
        >
          <Stack
            direction="row"
            spacing={2}
            justifyContent="center"
            flexWrap="wrap"
            gap={2}
          >
            {departments.map((dept) => (
              <MotionBox key={dept.id} variants={itemVariants}>
                <Chip
                  icon={dept.icon}
                  label={`${dept.label} (${dept.count})`}
                  clickable
                  sx={{
                    px: 2,
                    py: 2.5,
                    fontSize: "0.9rem",
                    backgroundColor: alpha(theme.palette.background.paper, 0.6),
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                    "&:hover": {
                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                      borderColor: theme.palette.primary.main,
                    },
                  }}
                />
              </MotionBox>
            ))}
          </Stack>
        </MotionBox>

        {/* Job Listings */}
        <MotionBox
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          sx={{ mb: { xs: 8, md: 12 } }}
        >
          <Typography variant="h4" fontWeight={600} sx={{ mb: 4 }}>
            Open Positions
          </Typography>
          {jobs.map((job) => (
            <Accordion
              key={job.id}
              expanded={expandedJob === job.id}
              onChange={() => setExpandedJob(expandedJob === job.id ? null : job.id)}
              sx={{
                mb: 2,
                backgroundColor: alpha(theme.palette.background.paper, 0.6),
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                borderRadius: "8px !important",
                "&:before": { display: "none" },
                "&.Mui-expanded": {
                  margin: "0 0 16px 0",
                },
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{ px: 3, py: 1 }}
              >
                <Box sx={{ width: "100%" }}>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    justifyContent="space-between"
                    alignItems={{ xs: "flex-start", sm: "center" }}
                    spacing={1}
                  >
                    <Box>
                      <Typography variant="h6" fontWeight={600}>
                        {job.title}
                      </Typography>
                      <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <WorkIcon sx={{ fontSize: 16, color: textMuted }} />
                          <Typography variant="body2" sx={{ color: textMuted }}>
                            {job.department}
                          </Typography>
                        </Stack>
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <LocationOnIcon sx={{ fontSize: 16, color: textMuted }} />
                          <Typography variant="body2" sx={{ color: textMuted }}>
                            {job.location}
                          </Typography>
                        </Stack>
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <AccessTimeIcon sx={{ fontSize: 16, color: textMuted }} />
                          <Typography variant="body2" sx={{ color: textMuted }}>
                            {job.type}
                          </Typography>
                        </Stack>
                      </Stack>
                    </Box>
                    <Chip
                      label={job.salary}
                      size="small"
                      sx={{
                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                        color: theme.palette.primary.main,
                        fontWeight: 600,
                      }}
                    />
                  </Stack>
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 3, pb: 3 }}>
                <Typography variant="body1" sx={{ mb: 3, color: textSecondary }}>
                  {job.description}
                </Typography>
                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                  Requirements:
                </Typography>
                <Box component="ul" sx={{ pl: 2, mb: 3 }}>
                  {job.requirements.map((req, idx) => (
                    <Typography
                      component="li"
                      key={`req-${idx}`}
                      variant="body2"
                      sx={{ color: textSecondary, mb: 0.5 }}
                    >
                      {req}
                    </Typography>
                  ))}
                </Box>
                <Button
                  variant="contained"
                  onClick={() => handleOpenApplication(job)}
                  sx={{
                    backgroundColor: theme.palette.primary.main,
                    "&:hover": { backgroundColor: theme.palette.primary.dark },
                  }}
                >
                  Apply Now
                </Button>
              </AccordionDetails>
            </Accordion>
          ))}
        </MotionBox>

        {/* Benefits Section */}
        <MotionBox
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          sx={{ mb: { xs: 8, md: 12 } }}
        >
          <Typography variant="h4" fontWeight={600} sx={{ textAlign: "center", mb: 2 }}>
            Why Join PLhub?
          </Typography>
          <Typography
            variant="body1"
            sx={{ textAlign: "center", color: textMuted, mb: 6, maxWidth: 600, mx: "auto" }}
          >
            We believe in taking care of our team. Here's what you can expect when you join us.
          </Typography>
          <Grid container spacing={3}>
            {benefits.map((benefit, index) => (
              <Grid item xs={12} sm={6} md={4} key={`benefit-${index}`}>
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
                  <CardContent sx={{ p: 3 }}>
                    <Box
                      sx={{
                        color: theme.palette.primary.main,
                        mb: 2,
                        "& svg": { fontSize: 32 },
                      }}
                    >
                      {benefit.icon}
                    </Box>
                    <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
                      {benefit.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: textMuted }}>
                      {benefit.description}
                    </Typography>
                  </CardContent>
                </MotionCard>
              </Grid>
            ))}
          </Grid>
        </MotionBox>

        {/* CTA Section */}
        <Box
          sx={{
            p: { xs: 4, md: 6 },
            borderRadius: 3,
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.2)}, ${alpha(theme.palette.background.paper, 0.9)})`,
            textAlign: "center",
            border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
          }}
        >
          <Typography variant="h5" fontWeight={600} sx={{ mb: 2 }}>
            Don't See a Role That Fits?
          </Typography>
          <Typography
            variant="body1"
            sx={{ color: textSecondary, mb: 3, maxWidth: 500, mx: "auto" }}
          >
            We're always interested in meeting talented people. Send us your resume
            and we'll reach out when a position opens up.
          </Typography>
          <Button
            variant="outlined"
            size="large"
            onClick={() => handleOpenApplication(null)}
            sx={{
              borderColor: theme.palette.primary.main,
              color: theme.palette.primary.main,
              "&:hover": {
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
              },
            }}
          >
            Send Your Resume
          </Button>
        </Box>
      </Container>

      {/* Application Dialog */}
      <Dialog
        open={applicationDialogOpen}
        onClose={handleCloseApplication}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            backgroundColor: theme.palette.background.paper,
          },
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" fontWeight={600}>
              {submitSuccess 
                ? "Application Submitted!" 
                : selectedJob 
                  ? `Apply for ${selectedJob.title}` 
                  : "Send Your Resume"
              }
            </Typography>
            <IconButton onClick={handleCloseApplication} size="small">
              <CloseIcon />
            </IconButton>
          </Stack>
          {selectedJob && !submitSuccess && (
            <Typography variant="body2" color="text.secondary">
              {selectedJob.department} • {selectedJob.location}
            </Typography>
          )}
        </DialogTitle>

        <DialogContent dividers>
          {submitSuccess ? (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <CheckCircleIcon sx={{ fontSize: 64, color: "success.main", mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Thank you for applying!
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                We've received your application and will review it shortly.
                Check your email for a confirmation.
              </Typography>
              {applicationId && (
                <Typography
                  variant="body2"
                  sx={{
                    fontFamily: "monospace",
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    color: theme.palette.primary.main,
                    px: 2,
                    py: 1,
                    borderRadius: 1,
                    display: "inline-block",
                  }}
                >
                  Application ID: {applicationId}
                </Typography>
              )}
            </Box>
          ) : (
            <Stack spacing={2.5} sx={{ mt: 1 }}>
              {formError && (
                <Alert severity="error" onClose={() => setFormError(null)}>
                  {formError}
                </Alert>
              )}

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    required
                    disabled={isSubmitting}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email Address"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleFormChange}
                    required
                    disabled={isSubmitting}
                  />
                </Grid>
              </Grid>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    name="phone"
                    value={formData.phone}
                    onChange={handleFormChange}
                    disabled={isSubmitting}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    select
                    label="Years of Experience"
                    name="experience"
                    value={formData.experience}
                    onChange={handleFormChange}
                    disabled={isSubmitting}
                  >
                    <MenuItem value="">Select...</MenuItem>
                    <MenuItem value="0-1">0-1 years</MenuItem>
                    <MenuItem value="1-3">1-3 years</MenuItem>
                    <MenuItem value="3-5">3-5 years</MenuItem>
                    <MenuItem value="5-10">5-10 years</MenuItem>
                    <MenuItem value="10+">10+ years</MenuItem>
                  </TextField>
                </Grid>
              </Grid>

              <TextField
                fullWidth
                label="LinkedIn Profile URL"
                name="linkedinUrl"
                value={formData.linkedinUrl}
                onChange={handleFormChange}
                placeholder="https://linkedin.com/in/your-profile"
                disabled={isSubmitting}
              />

              <TextField
                fullWidth
                label="Portfolio/GitHub URL"
                name="portfolioUrl"
                value={formData.portfolioUrl}
                onChange={handleFormChange}
                placeholder="https://github.com/your-username"
                disabled={isSubmitting}
              />

              <TextField
                fullWidth
                select
                label="How did you hear about us?"
                name="referralSource"
                value={formData.referralSource}
                onChange={handleFormChange}
                disabled={isSubmitting}
              >
                <MenuItem value="Website">Company Website</MenuItem>
                <MenuItem value="LinkedIn">LinkedIn</MenuItem>
                <MenuItem value="Indeed">Indeed</MenuItem>
                <MenuItem value="Glassdoor">Glassdoor</MenuItem>
                <MenuItem value="Referral">Employee Referral</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </TextField>

              <TextField
                fullWidth
                label="Cover Letter / Message"
                name="coverLetter"
                value={formData.coverLetter}
                onChange={handleFormChange}
                multiline
                rows={4}
                placeholder="Tell us why you'd be a great fit for this role..."
                disabled={isSubmitting}
                helperText={`${formData.coverLetter.length}/5000 characters`}
              />
            </Stack>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          {submitSuccess ? (
            <Button onClick={handleCloseApplication} variant="contained">
              Close
            </Button>
          ) : (
            <>
              <Button onClick={handleCloseApplication} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmitApplication}
                variant="contained"
                disabled={isSubmitting}
                startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
              >
                {isSubmitting ? "Submitting..." : "Submit Application"}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CareersPage;

