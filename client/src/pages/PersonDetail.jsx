import { Box, Toolbar, Typography, Stack } from "@mui/material";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import PersonMediaGrid from "../components/common/PersonMediaGrid";
import tmdbConfigs from "../api/configs/tmdb.configs";
import uiConfigs from "../configs/ui.configs";
import Container from "../components/common/Container";
import personApi from "../api/modules/person.api";
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";
import { setGlobalLoading } from "../redux/features/globalLoadingSlice";

/**
 * PersonDetail Component
 * - Displays detailed information about a specific person (actor, director, etc.).
 * - Shows biography and media appearances associated with the person.
 */
const PersonDetail = () => {
  const { personId } = useParams(); // Extract person ID from route parameters
  const [person, setPerson] = useState(null); // State to store person details
  const dispatch = useDispatch();

  useEffect(() => {
    /**
     * Fetches details of the person using the TMDB API.
     */
    const getPerson = async () => {
      dispatch(setGlobalLoading(true));

      const { response, err } = await personApi.detail({ personId });
      dispatch(setGlobalLoading(false));

      if (err) {
        toast.error(err.message);
      } else if (response) {
        setPerson(response);
      }
    };

    getPerson();
  }, [personId, dispatch]);

  return (
    <>
      {/* Add space at the top for consistent UI layout */}
      <Toolbar />

      {person && (
        <>
          <Box sx={{ ...uiConfigs.style.mainContent }}>
            {/* Person Information Section */}
            <Box
              sx={{
                position: "relative",
                display: "flex",
                flexDirection: { xs: "column", md: "row" },
              }}
            >
              {/* Person's Profile Image */}
              <Box sx={{ width: { xs: "50%", md: "20%" } }}>
                <Box
                  sx={{
                    paddingTop: "160%",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundColor: "darkgrey",
                    backgroundImage: `url(${tmdbConfigs.posterPath(person.profile_path)})`,
                  }}
                />
              </Box>

              {/* Person's Details */}
              <Box
                sx={{
                  width: { xs: "100%", md: "80%" },
                  padding: { xs: "1rem 0", md: "1rem 2rem" },
                }}
              >
                <Stack spacing={2}>
                  {/* Name and Lifespan */}
                  <Typography variant="h5" fontWeight="700">
                    {`${person.name} (${person.birthday?.split("-")[0] || "N/A"}`}
                    {person.deathday && ` - ${person.deathday?.split("-")[0]}`}
                    {")"}
                  </Typography>

                  {/* Biography */}
                  <Typography sx={{ ...uiConfigs.style.typoLines(10) }}>
                    {person.biography || "Biography not available."}
                  </Typography>
                </Stack>
              </Box>
            </Box>

            {/* Media Appearances Section */}
            <Container header="Medias">
              <PersonMediaGrid personId={personId} />
            </Container>
          </Box>
        </>
      )}
    </>
  );
};

export default PersonDetail;
