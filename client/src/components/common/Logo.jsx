import { Typography, useTheme } from '@mui/material';

const Logo = () => {
  const theme = useTheme();

  return (
    <div>
      
    <Typography fontWeight="700" fontSize="1.7rem">
      {/* Moon<span style={{ color: theme.palette.primary.main }}>Flix</span> */}
      <a href="/">
      <img src="/logo_v3.svg" alt="Logo" style={{
    background: 'linear-gradient(45deg, #864d25, #ffD700)',
    WebkitBackgroundClip: 'text', // For webkit browsers to apply gradient to text
    WebkitTextFillColor: 'transparent', // For webkit browsers to make text transparent
    width: '7rem',
    height: 'auto'
  }} />
      </a>
    </Typography>
    </div>
  );
};

export default Logo;