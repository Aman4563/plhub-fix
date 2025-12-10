/**
 * Watch Provider Controller
 * Handles watch provider listing for filtering
 */

import responseHandler from "../handlers/response.handler.js";
import tmdbApi from "../tmdb/tmdb.api.js";
import logger from "../config/logger.config.js";

/**
 * Get available watch providers for a media type
 * Used for filtering content by streaming service
 */
const getWatchProvidersList = async (req, res) => {
  try {
    const { mediaType } = req.params;
    const { region = "US" } = req.query;

    if (!["movie", "tv"].includes(mediaType)) {
      return responseHandler.badrequest(res, "Invalid media type");
    }

    const response = await tmdbApi.watchProvidersList({ mediaType });

    const providers = response.results
      .filter(provider => provider.display_priorities?.[region] !== undefined)
      .sort((a, b) => {
        const priorityA = a.display_priorities?.[region] ?? 999;
        const priorityB = b.display_priorities?.[region] ?? 999;
        return priorityA - priorityB;
      })
      .slice(0, 50)
      .map(provider => ({
        id: provider.provider_id,
        name: provider.provider_name,
        logo: provider.logo_path,
        priority: provider.display_priorities?.[region],
      }));

    return responseHandler.ok(res, { providers });
  } catch (error) {
    logger.error("Error fetching watch providers list", { error: error.message });
    return responseHandler.error(res);
  }
};

export default {
  getWatchProvidersList,
};

