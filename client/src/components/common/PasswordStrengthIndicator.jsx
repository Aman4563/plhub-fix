import { Box, Typography, LinearProgress, Stack, alpha, useTheme } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import { useMemo } from "react";

/**
 * PasswordStrengthIndicator Component
 * Shows real-time password strength with visual feedback
 */
const PasswordStrengthIndicator = ({ password = "", show = true }) => {
  const theme = useTheme();

  // Password requirements
  const requirements = useMemo(() => [
    { label: "At least 8 characters", test: password.length >= 8 },
    { label: "One lowercase letter", test: /[a-z]/.test(password) },
    { label: "One uppercase letter", test: /[A-Z]/.test(password) },
    { label: "One number", test: /\d/.test(password) },
    { label: "One special character (optional)", test: /[!@#$%^&*(),.?":{}|<>]/.test(password), optional: true },
  ], [password]);

  // Calculate strength score
  const strength = useMemo(() => {
    if (!password) return { score: 0, label: "Enter password", color: theme.palette.grey[500] };
    
    const requiredMet = requirements.filter(r => !r.optional && r.test).length;
    const optionalMet = requirements.filter(r => r.optional && r.test).length;
    const requiredCount = requirements.filter(r => !r.optional).length;
    
    const score = (requiredMet / requiredCount) * 80 + (optionalMet * 20);
    
    if (score < 40) return { score, label: "Weak", color: theme.palette.error.main };
    if (score < 60) return { score, label: "Fair", color: theme.palette.warning.main };
    if (score < 80) return { score, label: "Good", color: theme.palette.info.main };
    return { score, label: "Strong", color: theme.palette.success.main };
  }, [password, requirements, theme]);

  if (!show || !password) return null;

  return (
    <Box sx={{ mt: 1, mb: 1 }}>
      {/* Strength bar */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
        <LinearProgress
          variant="determinate"
          value={strength.score}
          sx={{
            flex: 1,
            height: 6,
            borderRadius: 3,
            backgroundColor: alpha(theme.palette.grey[500], 0.2),
            "& .MuiLinearProgress-bar": {
              backgroundColor: strength.color,
              borderRadius: 3,
              transition: "transform 0.3s ease, background-color 0.3s ease",
            },
          }}
        />
        <Typography
          variant="caption"
          sx={{
            color: strength.color,
            fontWeight: 600,
            minWidth: 50,
            textAlign: "right",
          }}
        >
          {strength.label}
        </Typography>
      </Box>

      {/* Requirements list */}
      <Stack spacing={0.5}>
        {requirements.map((req, index) => (
          <Box
            key={index}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.75,
              opacity: req.optional ? 0.8 : 1,
            }}
          >
            {req.test ? (
              <CheckCircleIcon
                sx={{
                  fontSize: 16,
                  color: theme.palette.success.main,
                  transition: "color 0.2s ease",
                }}
              />
            ) : (
              <RadioButtonUncheckedIcon
                sx={{
                  fontSize: 16,
                  color: theme.palette.grey[500],
                  transition: "color 0.2s ease",
                }}
              />
            )}
            <Typography
              variant="caption"
              sx={{
                color: req.test ? theme.palette.success.main : theme.palette.text.secondary,
                transition: "color 0.2s ease",
                fontStyle: req.optional ? "italic" : "normal",
              }}
            >
              {req.label}
            </Typography>
          </Box>
        ))}
      </Stack>
    </Box>
  );
};

export default PasswordStrengthIndicator;

