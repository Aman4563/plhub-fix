import { Paper, Stack, Button, Box } from '@mui/material';
import React from 'react';
import Container from './Container';
import Logo from './Logo';
import menuConfigs from "../../configs/menu.configs";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <Container>
      <Paper square={true} sx={{ backgroundImage: "unset", padding: "2rem",
    // background: '#000',
    // margin: 'auto',
    
    }}>
        <Stack
          alignItems="center"
          justifyContent="space-between"
          direction={{ xs: "column", md: "row " }}
          sx={{ height: "max-content" }}
        >
          <Logo />
          <Box style={{paddingLeft: '2rem'}}>
            {menuConfigs.main.map((item, index) => (
              <Button
                key={index}
                sx={{
                  color: '#fff', // White text color
                  textTransform: 'capitalize',
                  '&:hover': {
                    color: '#fca311', // Highlight on hover
                  },
                }}
                component={Link}
                to={item.path}
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