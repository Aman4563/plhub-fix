/**
 * EmojiPicker Component
 * A popover-based emoji picker using emoji-mart
 */

import { useState, useRef } from "react";
import { 
  Box, 
  IconButton, 
  Popover, 
  useTheme,
  Tooltip,
  alpha,
} from "@mui/material";
import EmojiEmotionsOutlinedIcon from "@mui/icons-material/EmojiEmotionsOutlined";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";

const EmojiPicker = ({ onEmojiSelect, disabled = false }) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState(null);
  const buttonRef = useRef(null);

  const handleOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleEmojiSelect = (emoji) => {
    if (onEmojiSelect) {
      onEmojiSelect(emoji.native);
    }
    handleClose();
  };

  const open = Boolean(anchorEl);

  return (
    <>
      <Tooltip title="Add emoji">
        <span>
          <IconButton
            ref={buttonRef}
            onClick={handleOpen}
            disabled={disabled}
            size="small"
            sx={{
              color: open ? theme.palette.primary.main : theme.palette.text.secondary,
              "&:hover": {
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.primary.main,
              },
            }}
          >
            <EmojiEmotionsOutlinedIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        slotProps={{
          paper: {
            sx: {
              backgroundColor: "transparent",
              boxShadow: "none",
              overflow: "visible",
            },
          },
        }}
      >
        <Box
          sx={{
            "& em-emoji-picker": {
              "--em-rgb-background": theme.palette.mode === "dark" ? "26, 26, 46" : "255, 255, 255",
              "--em-rgb-input": theme.palette.mode === "dark" ? "45, 45, 68" : "240, 240, 240",
              "--em-rgb-color": theme.palette.mode === "dark" ? "255, 255, 255" : "0, 0, 0",
              "--border-radius": "12px",
              border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
              boxShadow: theme.shadows[8],
            },
          }}
        >
          <Picker
            data={data}
            onEmojiSelect={handleEmojiSelect}
            theme={theme.palette.mode}
            previewPosition="none"
            skinTonePosition="search"
            maxFrequentRows={2}
            perLine={8}
            emojiSize={24}
            emojiButtonSize={32}
            categories={[
              "frequent",
              "people",
              "nature",
              "foods",
              "activity",
              "places",
              "objects",
              "symbols",
              "flags",
            ]}
            set="native"
          />
        </Box>
      </Popover>
    </>
  );
};

export default EmojiPicker;

