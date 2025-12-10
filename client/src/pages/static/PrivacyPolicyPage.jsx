import { Box, Container, Typography, Paper, Stack, Divider, useTheme, alpha } from "@mui/material";
import { motion } from "framer-motion";
import SecurityIcon from "@mui/icons-material/Security";
import VisibilityIcon from "@mui/icons-material/Visibility";
import StorageIcon from "@mui/icons-material/Storage";
import ShareIcon from "@mui/icons-material/Share";
import CookieIcon from "@mui/icons-material/Cookie";
import ChildCareIcon from "@mui/icons-material/ChildCare";
import UpdateIcon from "@mui/icons-material/Update";
import EmailIcon from "@mui/icons-material/Email";

const MotionBox = motion(Box);

const PrivacyPolicyPage = () => {
  const theme = useTheme();

  const sections = [
    {
      icon: <VisibilityIcon />,
      title: "Information We Collect",
      content: [
        "Account Information: When you create an account, we collect your email address, username, and password.",
        "Usage Data: We automatically collect information about how you interact with our service, including pages viewed, search queries, and watch history.",
        "Device Information: We collect device identifiers, browser type, operating system, and IP address.",
        "Cookies and Tracking: We use cookies and similar technologies to enhance your experience and analyze usage patterns.",
      ],
    },
    {
      icon: <StorageIcon />,
      title: "How We Use Your Information",
      content: [
        "To provide and maintain our streaming service",
        "To personalize your experience with recommendations",
        "To communicate with you about updates and new features",
        "To analyze usage patterns and improve our service",
        "To detect and prevent fraud or abuse",
      ],
    },
    {
      icon: <ShareIcon />,
      title: "Information Sharing",
      content: [
        "We do not sell your personal information to third parties.",
        "We may share data with service providers who help operate our platform.",
        "We may disclose information when required by law or to protect our rights.",
        "Aggregated, anonymized data may be shared for analytics purposes.",
      ],
    },
    {
      icon: <SecurityIcon />,
      title: "Data Security",
      content: [
        "We implement industry-standard security measures to protect your data.",
        "All data transmission is encrypted using SSL/TLS protocols.",
        "We regularly review and update our security practices.",
        "Despite our efforts, no method of transmission over the internet is 100% secure.",
      ],
    },
    {
      icon: <CookieIcon />,
      title: "Cookies Policy",
      content: [
        "Essential Cookies: Required for the service to function properly.",
        "Analytics Cookies: Help us understand how visitors interact with our site.",
        "Preference Cookies: Remember your settings and preferences.",
        "You can control cookie settings through your browser preferences.",
      ],
    },
    {
      icon: <ChildCareIcon />,
      title: "Children's Privacy",
      content: [
        "Our service is not intended for children under 13 years of age.",
        "We do not knowingly collect personal information from children.",
        "If you believe we have collected data from a child, please contact us immediately.",
      ],
    },
    {
      icon: <UpdateIcon />,
      title: "Changes to This Policy",
      content: [
        "We may update this privacy policy from time to time.",
        "We will notify you of significant changes via email or through our service.",
        "Your continued use after changes constitutes acceptance of the new policy.",
      ],
    },
    {
      icon: <EmailIcon />,
      title: "Contact Us",
      content: [
        "If you have questions about this Privacy Policy, please contact us at:",
        "Email: privacy@plhub.com",
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
            <SecurityIcon sx={{ fontSize: 64, color: theme.palette.primary.main, mb: 2 }} />
            <Typography variant="h3" fontWeight={700} gutterBottom>
              Privacy Policy
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Last updated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2, maxWidth: 600, mx: "auto" }}>
              Your privacy is important to us. This policy explains how PLhub collects, uses, and protects your personal information.
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

export default PrivacyPolicyPage;

