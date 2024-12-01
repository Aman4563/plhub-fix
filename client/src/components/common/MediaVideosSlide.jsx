import { Box } from "@mui/material";
import { useEffect, useRef } from "react";
import { SwiperSlide } from "swiper/react";
import tmdbConfigs from "../../api/configs/tmdb.configs";
import NavigationSwiper from "./NavigationSwiper";

/**
 * MediaVideo Component
 * - Renders an iframe for a YouTube video with responsive sizing.
 *
 * @param {Object} props - Component props.
 * @param {Object} props.video - Video object containing video details.
 */
const MediaVideo = ({ video }) => {
  const iframeRef = useRef();

  useEffect(() => {
    // Calculate and set the iframe height based on a 16:9 aspect ratio
    const height = `${iframeRef.current.offsetWidth * 9 / 16}px`;
    iframeRef.current.setAttribute("height", height);
  }, [video]);

  return (
    <Box sx={{ height: "max-content" }}>
      <iframe
        key={video.key}
        src={tmdbConfigs.youtubePath(video.key)} // Construct YouTube embed URL
        ref={iframeRef}
        width="100%"
        title={video.name}
        style={{ border: 0 }}
      />
    </Box>
  );
};

/**
 * MediaVideosSlide Component
 * - Displays a swiper carousel of media videos.
 *
 * @param {Object} props - Component props.
 * @param {Array} props.videos - Array of video objects to display in the slider.
 */
const MediaVideosSlide = ({ videos }) => {
  return (
    <NavigationSwiper>
      {videos.map((video, index) => (
        <SwiperSlide key={index}>
          <MediaVideo video={video} />
        </SwiperSlide>
      ))}
    </NavigationSwiper>
  );
};

export default MediaVideosSlide;
