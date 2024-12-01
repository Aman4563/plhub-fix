// Old version

import { Paper, Stack, Button, Box } from "@mui/material";
import React from "react";
import Container from "./Container";
import Logo from "./Logo";
import menuConfigs from "../../configs/menu.configs";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <Container>
      <Paper
        square
        sx={{
          padding: "2rem",
          backgroundImage: "unset", // Removes default MUI Paper background gradient
        }}
      >
        <Stack
          alignItems="center"
          justifyContent="space-between"
          direction={{ xs: "column", md: "row" }}
          sx={{ height: "max-content" }}
        >
          {/* Logo */}
          <Logo />

          {/* Navigation Menu */}
          <Box sx={{ paddingLeft: { xs: "0", md: "2rem" } }}>
            {menuConfigs.main.map((item, index) => (
              <Button
                key={index}
                component={Link}
                to={item.path}
                sx={{
                  textTransform: "capitalize", // Ensures proper capitalization
                  "&:hover": {
                    color: "#fca311", // Highlight color on hover
                  },
                }}
              >
                {item.display}
              </Button>
            ))}
          </Box>
        </Stack>
      </Paper>
    </Container>
  );
};

export default Footer;



// New good version

// import { Paper, Stack, Box, Button, Typography, TextField, Divider, IconButton } from "@mui/material";
// import React from "react";
// import { Link } from "react-router-dom";
// import { Twitter, Facebook, Instagram, YouTube } from "@mui/icons-material";
// import Logo from "./Logo";
// import menuConfigs from "../../configs/menu.configs";

// const Footer = () => {
//   return (
//     <Paper
//       square
//       sx={{
//         backgroundColor: "#1c1c1c",
//         color: "#fff",
//         padding: "2rem",
//         marginTop: "auto",
//       }}
//     >
//       <Stack
//         direction={{ xs: "column", md: "row" }}
//         justifyContent="space-between"
//         alignItems="center"
//         spacing={3}
//         sx={{ textAlign: { xs: "center", md: "left" } }}
//       >
//         {/* Logo and Description */}
//         <Box>
//           <Logo />
//           <Typography variant="body2" sx={{ marginTop: 2 }}>
//             Discover a world of entertainment with our platform. Stream your favorite movies and TV shows seamlessly.
//           </Typography>
//         </Box>

//         {/* Navigation Links */}
//         <Box>
//           <Typography variant="h6" sx={{ marginBottom: 1 }}>
//             Quick Links
//           </Typography>
//           {menuConfigs.main.map((item, index) => (
//             <Button
//               key={index}
//               sx={{
//                 color: "#fff",
//                 textTransform: "capitalize",
//                 "&:hover": { color: "#fca311" },
//               }}
//               component={Link}
//               to={item.path}
//             >
//               {item.display}
//             </Button>
//           ))}
//         </Box>

//         {/* Newsletter Subscription */}
//         <Box>
//           <Typography variant="h6" sx={{ marginBottom: 1 }}>
//             Stay Updated
//           </Typography>
//           <Typography variant="body2" sx={{ marginBottom: 2 }}>
//             Subscribe to our newsletter for the latest updates and exclusive offers.
//           </Typography>
//           <form>
//             <TextField
//               variant="outlined"
//               placeholder="Enter your email"
//               fullWidth
//               sx={{
//                 backgroundColor: "#fff",
//                 borderRadius: 1,
//                 marginBottom: 2,
//                 "& input": { padding: "10px" },
//               }}
//             />
//             <Button variant="contained" sx={{ width: "100%" }}>
//               Subscribe
//             </Button>
//           </form>
//         </Box>
//       </Stack>

//       <Divider sx={{ marginY: 3, borderColor: "rgba(255,255,255,0.2)" }} />

//       {/* Social Media and Legal */}
//       <Stack
//         direction={{ xs: "column", md: "row" }}
//         justifyContent="space-between"
//         alignItems="center"
//         spacing={3}
//         sx={{ textAlign: { xs: "center", md: "left" } }}
//       >
//         {/* Social Media Links */}
//         <Box>
//           <Typography variant="body2" sx={{ marginBottom: 1 }}>
//             Follow Us:
//           </Typography>
//           <Stack direction="row" spacing={2}>
//             <IconButton color="inherit" href="#" aria-label="Twitter">
//               <Twitter />
//             </IconButton>
//             <IconButton color="inherit" href="#" aria-label="Facebook">
//               <Facebook />
//             </IconButton>
//             <IconButton color="inherit" href="#" aria-label="Instagram">
//               <Instagram />
//             </IconButton>
//             <IconButton color="inherit" href="#" aria-label="YouTube">
//               <YouTube />
//             </IconButton>
//           </Stack>
//         </Box>

//         {/* Legal Links */}
//         <Box>
//           <Typography variant="body2">
//             &copy; {new Date().getFullYear()} Your Company Name. All rights reserved.
//           </Typography>
//           <Typography variant="body2">
//             <Link to="/privacy-policy" style={{ color: "#fca311", textDecoration: "none" }}>
//               Privacy Policy
//             </Link>{" "}
//             |{" "}
//             <Link to="/terms" style={{ color: "#fca311", textDecoration: "none" }}>
//               Terms of Use
//             </Link>
//           </Typography>
//         </Box>
//       </Stack>
//     </Paper>
//   );
// };

// export default Footer;






// import { Paper, Stack, Box, Button, Typography, Divider, IconButton } from "@mui/material";
// import { Link, useNavigate } from "react-router-dom";
// import { Twitter, Telegram, Reddit, YouTube } from "@mui/icons-material";
// import Logo from "./Logo";

// const Footer = () => {
//   const navigate = useNavigate();
//   const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

//   const handleAlphabetClick = (letter) => {
//     navigate(`/search?query=${letter}`); // Redirects to the search page with the selected letter
//   };

//   const handleNumericClick = () => {
//     navigate(`/search?query=#`); // Redirects to the search page for numbers
//   };

//   return (
//     <Paper
//       square
//       sx={{
//         backgroundColor: "#1c1c1c",
//         color: "#fff",
//         padding: "2rem",
//         marginTop: "auto",
//       }}
//     >
//       {/* Top Section: Logo and Social Media */}
//       <Stack
//         direction={{ xs: "column", md: "row" }}
//         justifyContent="space-between"
//         alignItems="center"
//         spacing={3}
//         sx={{ textAlign: { xs: "center", md: "left" } }}
//       >
//         {/* Logo */}
//         <Logo />

//         {/* Social Media Links */}
//         <Box>
//           <Stack direction="row" spacing={2}>
//             <IconButton color="inherit" href="#" aria-label="YouTube">
//               <YouTube />
//             </IconButton>
//             <IconButton color="inherit" href="#" aria-label="Telegram">
//               <Telegram />
//             </IconButton>
//             <IconButton color="inherit" href="#" aria-label="Reddit">
//               <Reddit />
//             </IconButton>
//             <IconButton color="inherit" href="#" aria-label="Twitter">
//               <Twitter />
//             </IconButton>
//           </Stack>
//         </Box>
//       </Stack>

//       <Divider sx={{ marginY: 3, borderColor: "rgba(255,255,255,0.2)" }} />

//       {/* A-Z List */}
//       <Box sx={{ textAlign: "center", marginBottom: 3 }}>
//         <Typography variant="h6" sx={{ marginBottom: 1 }}>
//           A-Z LIST
//         </Typography>
//         <Typography variant="body2" sx={{ marginBottom: 2, color: "rgba(255,255,255,0.7)" }}>
//           Searching media by alphabetical order from A to Z.
//         </Typography>
//         <Stack direction="row" justifyContent="center" spacing={1} flexWrap="wrap">
//           <Button
//             variant="contained"
//             sx={{ minWidth: "40px", padding: "0.5rem" }}
//             onClick={() => handleAlphabetClick("")} // Shows all results
//           >
//             All
//           </Button>
//           <Button
//             variant="outlined"
//             sx={{ minWidth: "40px", padding: "0.5rem" }}
//             onClick={handleNumericClick} // Handles numbers
//           >
//             #
//           </Button>
//           {[...Array(10)].map((_, index) => (
//             <Button
//               key={index}
//               variant="outlined"
//               sx={{ minWidth: "40px", padding: "0.5rem" }}
//               onClick={() => handleAlphabetClick(index.toString())}
//             >
//               {index}
//             </Button>
//           ))}
//           {alphabet.map((letter) => (
//             <Button
//               key={letter}
//               variant="outlined"
//               sx={{ minWidth: "40px", padding: "0.5rem" }}
//               onClick={() => handleAlphabetClick(letter)}
//             >
//               {letter}
//             </Button>
//           ))}
//         </Stack>
//       </Box>

//       <Divider sx={{ marginY: 3, borderColor: "rgba(255,255,255,0.2)" }} />

//       {/* Bottom Section: Legal Links and Description */}
//       <Stack
//         direction={{ xs: "column", md: "row" }}
//         justifyContent="space-between"
//         alignItems="center"
//         spacing={3}
//         sx={{ textAlign: { xs: "center", md: "left" } }}
//       >
//         {/* Legal Links */}
//         <Box>
//           <Stack direction="row" spacing={2}>
//             <Link to="/terms" style={{ color: "#fca311", textDecoration: "none" }}>
//               Terms of Service
//             </Link>
//             <Link to="/dmca" style={{ color: "#fca311", textDecoration: "none" }}>
//               DMCA
//             </Link>
//             <Link to="/contact" style={{ color: "#fca311", textDecoration: "none" }}>
//               Contact
//             </Link>
//             <Link to="/app" style={{ color: "#fca311", textDecoration: "none" }}>
//               App
//             </Link>
//           </Stack>
//         </Box>

//         {/* Footer Description */}
//         <Box>
//           <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)" }}>
//             Our platform does not store any files on our server; we only link to the media hosted
//             on third-party services.
//           </Typography>
//           <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)" }}>
//             &copy; {new Date().getFullYear()} YourPlatformName. All rights reserved.
//           </Typography>
//         </Box>
//       </Stack>
//     </Paper>
//   );
// };

// export default Footer;
