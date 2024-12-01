// Import required modules and dependencies
import responseHandler from "../handlers/response.handler.js";
import favoriteModel from "../models/favorite.model.js";

/**
 * Add a Favorite
 * Adds a media item to the user's list of favorites.
 *
 * @param {Object} req - Express request object containing user and media details.
 * @param {Object} res - Express response object to send the result.
 */
const addFavorite = async (req, res) => {
  try {
    const { mediaId } = req.body;

    // Validate input
    if (!mediaId) {
      return responseHandler.badrequest(res, "Media ID is required.");
    }

    // Check if the item is already marked as favorite
    const existingFavorite = await favoriteModel.findOne({
      user: req.user.id,
      mediaId,
    });

    if (existingFavorite) {
      return responseHandler.ok(res, existingFavorite); // Return existing favorite
    }

    // Create and save the new favorite
    const newFavorite = await favoriteModel.create({
      ...req.body,
      user: req.user.id,
    });

    responseHandler.created(res, newFavorite); // Respond with the created favorite
  } catch (error) {
    console.error("Error adding favorite:", error.message);
    responseHandler.error(res, "Failed to add favorite.");
  }
};

/**
 * Remove a Favorite
 * Removes a media item from the user's list of favorites.
 *
 * @param {Object} req - Express request object containing the favorite ID in the parameters.
 * @param {Object} res - Express response object to send the result.
 */
const removeFavorite = async (req, res) => {
  try {
    const { favoriteId } = req.params;

    // Validate input
    if (!favoriteId) {
      return responseHandler.badrequest(res, "Favorite ID is required.");
    }

    // Find and delete the favorite
    const favorite = await favoriteModel.findOneAndDelete({
      user: req.user.id,
      _id: favoriteId,
    });

    if (!favorite) {
      return responseHandler.notfound(res, "Favorite not found.");
    }

    responseHandler.ok(res, { message: "Favorite removed successfully." });
  } catch (error) {
    console.error("Error removing favorite:", error.message);
    responseHandler.error(res, "Failed to remove favorite.");
  }
};

/**
 * Get User's Favorites
 * Retrieves all favorite items for the authenticated user.
 *
 * @param {Object} req - Express request object containing user details in the context.
 * @param {Object} res - Express response object to send the result.
 */
const getFavoritesOfUser = async (req, res) => {
  try {
    // Fetch user's favorites, sorted by the most recently added
    const favorites = await favoriteModel
      .find({ user: req.user.id })
      .sort({ createdAt: -1 });

    responseHandler.ok(res, favorites);
  } catch (error) {
    console.error("Error fetching favorites:", error.message);
    responseHandler.error(res, "Failed to retrieve favorites.");
  }
};

// Export the controller functions for use in routes
export default { addFavorite, removeFavorite, getFavoritesOfUser };
