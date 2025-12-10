import { Box, Container, Typography, Paper, Stack, Divider, useTheme, alpha, Button } from "@mui/material";
import { motion } from "framer-motion";
import CopyrightIcon from "@mui/icons-material/Copyright";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import EmailIcon from "@mui/icons-material/Email";
import DescriptionIcon from "@mui/icons-material/Description";

const MotionBox = motion(Box);

const DMCAPage = () => {
  const theme = useTheme();

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
            <CopyrightIcon sx={{ fontSize: 64, color: theme.palette.primary.main, mb: 2 }} />
            <Typography variant="h3" fontWeight={700} gutterBottom>
              DMCA Policy
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Digital Millennium Copyright Act Notice
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2, maxWidth: 600, mx: "auto" }}>
              PLhub respects the intellectual property rights of others and expects users to do the same.
            </Typography>
          </MotionBox>

          {/* Important Notice */}
          <MotionBox variants={itemVariants} sx={{ mb: 4 }}>
            <Paper
              elevation={0}
              sx={{
                p: 4,
                backgroundColor: alpha(theme.palette.warning.main, 0.1),
                border: `1px solid ${theme.palette.warning.main}`,
                borderRadius: 2,
              }}
            >
              <Stack direction="row" spacing={2} alignItems="flex-start">
                <ReportProblemIcon sx={{ color: theme.palette.warning.main, fontSize: 28, mt: 0.5 }} />
                <Box>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Important Notice
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    PLhub does not host any content on our servers. We only provide links to content hosted on third-party services. 
                    If you believe your copyrighted work has been linked without authorization, please contact the hosting provider directly.
                    For links that appear on our platform, you may submit a DMCA takedown notice as outlined below.
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </MotionBox>

          {/* Filing a DMCA Notice */}
          <MotionBox variants={itemVariants} sx={{ mb: 4 }}>
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
              <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
                <Box
                  sx={{
                    p: 1,
                    borderRadius: 1,
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    color: theme.palette.primary.main,
                  }}
                >
                  <DescriptionIcon />
                </Box>
                <Typography variant="h6" fontWeight={600}>
                  Filing a DMCA Takedown Notice
                </Typography>
              </Stack>
              <Divider sx={{ mb: 3 }} />
              
              <Typography variant="body2" color="text.secondary" paragraph>
                To file a valid DMCA takedown notice, please provide the following information:
              </Typography>
              
              <Stack spacing={2}>
                {[
                  "A physical or electronic signature of the copyright owner or authorized representative",
                  "Identification of the copyrighted work claimed to have been infringed",
                  "Identification of the material that is claimed to be infringing, including the URL",
                  "Your contact information (address, telephone number, and email address)",
                  "A statement that you have a good faith belief that the use is not authorized by the copyright owner",
                  "A statement, under penalty of perjury, that the information is accurate and you are authorized to act on behalf of the copyright owner",
                ].map((item, index) => (
                  <Stack key={index} direction="row" spacing={2} alignItems="flex-start">
                    <CheckCircleIcon sx={{ color: theme.palette.success.main, fontSize: 20, mt: 0.3 }} />
                    <Typography variant="body2" color="text.secondary">
                      {item}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Paper>
          </MotionBox>

          {/* Counter Notice */}
          <MotionBox variants={itemVariants} sx={{ mb: 4 }}>
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
              <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
                <Box
                  sx={{
                    p: 1,
                    borderRadius: 1,
                    backgroundColor: alpha(theme.palette.info.main, 0.1),
                    color: theme.palette.info.main,
                  }}
                >
                  <DescriptionIcon />
                </Box>
                <Typography variant="h6" fontWeight={600}>
                  Counter-Notification
                </Typography>
              </Stack>
              <Divider sx={{ mb: 3 }} />
              
              <Typography variant="body2" color="text.secondary" paragraph>
                If you believe your content was wrongly removed, you may file a counter-notification containing:
              </Typography>
              
              <Stack spacing={2}>
                {[
                  "Your physical or electronic signature",
                  "Identification of the material that was removed and its prior location",
                  "A statement under penalty of perjury that you have a good faith belief the material was removed by mistake",
                  "Your name, address, telephone number, and a statement consenting to jurisdiction",
                ].map((item, index) => (
                  <Stack key={index} direction="row" spacing={2} alignItems="flex-start">
                    <CheckCircleIcon sx={{ color: theme.palette.info.main, fontSize: 20, mt: 0.3 }} />
                    <Typography variant="body2" color="text.secondary">
                      {item}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Paper>
          </MotionBox>

          {/* Contact */}
          <MotionBox variants={itemVariants}>
            <Paper
              elevation={0}
              sx={{
                p: 4,
                backgroundColor: alpha(theme.palette.primary.main, 0.05),
                border: `1px solid ${theme.palette.primary.main}`,
                borderRadius: 2,
                textAlign: "center",
              }}
            >
              <EmailIcon sx={{ fontSize: 48, color: theme.palette.primary.main, mb: 2 }} />
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Submit DMCA Notice
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Send your DMCA takedown notices to our designated agent:
              </Typography>
              <Button
                variant="contained"
                startIcon={<EmailIcon />}
                href="mailto:dmca@plhub.com"
                sx={{
                  backgroundColor: theme.palette.primary.main,
                  "&:hover": { backgroundColor: theme.palette.primary.dark },
                }}
              >
                dmca@plhub.com
              </Button>
              <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 2 }}>
                We typically respond to valid DMCA notices within 48-72 hours.
              </Typography>
            </Paper>
          </MotionBox>
        </MotionBox>
      </Container>
    </Box>
  );
};

export default DMCAPage;

