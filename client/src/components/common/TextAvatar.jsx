import { Avatar } from "@mui/material";

/**
 * TextAvatar Component
 * - Generates an avatar with a background color based on the input text.
 * - Displays the first letter of the provided text in the avatar.
 *
 * @param {Object} props - Component props.
 * @param {string} props.text - Text used to generate the avatar background color and displayed character.
 */
const TextAvatar = ({ text }) => {
  /**
   * Generates a color based on the input string.
   * - Uses a hash function to create a consistent color for the same input.
   *
   * @param {string} str - The input string to generate the color from.
   * @returns {string} A hexadecimal color code.
   */
  const stringToColor = (str) => {
    let hash = 0;

    // Calculate hash from string characters
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }

    // Generate color from hash
    let color = "#";
    for (let i = 0; i < 3; i++) {
      const value = (hash >> (i * 8)) & 0xff;
      color += `00${value.toString(16)}`.slice(-2);
    }

    return color;
  };

  return (
    <Avatar
      sx={{
        backgroundColor: stringToColor(text), // Set background color based on text
        width: 40,
        height: 40,
      }}
    >
      {text?.split(" ")[0][0]} {/* Display the first character of the first word */}
    </Avatar>
  );
};

export default TextAvatar;
