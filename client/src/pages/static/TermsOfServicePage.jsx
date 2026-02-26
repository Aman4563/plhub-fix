import { Box, Container, Typography, Paper, Stack, Divider, useTheme, alpha } from "@mui/material";
import { motion } from "framer-motion";
import GavelIcon from "@mui/icons-material/Gavel";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import BlockIcon from "@mui/icons-material/Block";
import CopyrightIcon from "@mui/icons-material/Copyright";
import WarningIcon from "@mui/icons-material/Warning";
import UpdateIcon from "@mui/icons-material/Update";
import EmailIcon from "@mui/icons-material/Email";

const MotionBox = motion(Box);

const TermsOfServicePage = () => {
  const theme = useTheme();

  const sections = [
    {
      icon: <AccountCircleIcon />,
      title: "1. Acceptance of Terms",
      content: [
        "By accessing or using PLhub, you agree to be bound by these Terms of Service.",
        "If you do not agree to these terms, you must not use our service.",
        "We reserve the right to modify these terms at any time without prior notice.",
        "Your continued use of the service constitutes acceptance of any changes.",
      ],
    },
    {
      icon: <AccountCircleIcon />,
      title: "2. User Accounts",
      content: [
        "You must be at least 13 years old to create an account.",
        "You are responsible for maintaining the confidentiality of your account credentials.",
        "You agree to provide accurate and complete information during registration.",
        "You are responsible for all activities that occur under your account.",
        "Notify us immediately of any unauthorized use of your account.",
      ],
    },
    {
      icon: <BlockIcon />,
      title: "3. Prohibited Activities",
      content: [
        "Attempting to circumvent any security measures or access controls",
        "Uploading or distributing malware, viruses, or harmful code",
        "Engaging in any activity that disrupts or interferes with our service",
        "Using automated systems to access the service without permission",
        "Impersonating any person or entity or misrepresenting your affiliation",
        "Collecting user information without consent",
        "Using the service for any illegal or unauthorized purpose",
      ],
    },
    {
      icon: <CopyrightIcon />,
      title: "4. Intellectual Property",
      content: [
        "All content on PLhub is protected by copyright and other intellectual property laws.",
        "You may not copy, modify, distribute, or create derivative works without permission.",
        "PLhub does not claim ownership of third-party content linked through our service.",
        "Trademarks, logos, and service marks displayed are property of their respective owners.",
      ],
    },
    {
      icon: <WarningIcon />,
      title: "5. Disclaimers",
      content: [
        "PLhub provides content links for informational purposes only.",
        "We do not host or store any media files on our servers.",
        "We are not responsible for the accuracy, legality, or content of external sites.",
        "The service is provided 'as is' without warranties of any kind.",
        "We do not guarantee uninterrupted or error-free service operation.",
      ],
    },
    {
      icon: <WarningIcon />,
      title: "6. Limitation of Liability",
      content: [
        "PLhub shall not be liable for any indirect, incidental, or consequential damages.",
        "Our total liability shall not exceed the amount you paid for the service.",
        "We are not responsible for any loss of data, profits, or goodwill.",
        "Some jurisdictions do not allow limitation of liability, so these may not apply to you.",
      ],
    },
    {
      icon: <UpdateIcon />,
      title: "7. Termination",
      content: [
        "We may terminate or suspend your account at any time without prior notice.",
        "You may terminate your account at any time by contacting us.",
        "Upon termination, your right to use the service will immediately cease.",
        "Provisions that by nature should survive termination will remain in effect.",
      ],
    },
    {
      icon: <GavelIcon />,
      title: "8. Governing Law",
      content: [
        "These terms shall be governed by and construed in accordance with applicable laws.",
        "Any disputes arising from these terms shall be resolved through binding arbitration.",
        "You agree to submit to the personal jurisdiction of the courts in our jurisdiction.",
      ],
    },
    {
      icon: <EmailIcon />,
      title: "9. Contact Information",
      content: [
        "For questions about these Terms of Service, please contact us at:",
        "Email: legal@plhub.com",
        "We will respond to your inquiry within 30 business days.",
      ],
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
            <GavelIcon sx={{ fontSize: 64, color: theme.palette.primary.main, mb: 2 }} />
            <Typography variant="h3" fontWeight={700} gutterBottom>
              Terms of Service
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Last updated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2, maxWidth: 600, mx: "auto" }}>
              Please read these Terms of Service carefully before using PLhub. By using our service, you agree to be bound by these terms.
            </Typography>
          </MotionBox>

          {/* Content Sections */}
          <Stack spacing={4}>
            {sections.map((section, index) => (
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
                  <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                    <Box
                      sx={{
                        p: 1,
                        borderRadius: 1,
                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                        color: theme.palette.primary.main,
                      }}
                    >
                      {section.icon}
                    </Box>
                    <Typography variant="h6" fontWeight={600}>
                      {section.title}
                    </Typography>
                  </Stack>
                  <Divider sx={{ mb: 2 }} />
                  <Stack spacing={1.5}>
                    {section.content.map((item, idx) => (
                      <Typography key={idx} variant="body2" color="text.secondary" sx={{ pl: 2 }}>
                        • {item}
                      </Typography>
                    ))}
                  </Stack>
                </Paper>
              </MotionBox>
            ))}
          </Stack>
        </MotionBox>
      </Container>
    </Box>
  );
};

export default TermsOfServicePage;

