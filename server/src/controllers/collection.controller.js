/**
 * Collection Controller
 * Handles user custom collections
 */

import responseHandler from "../handlers/response.handler.js";
import collectionModel from "../models/collection.model.js";
import logger from "../config/logger.config.js";

/**
 * Create a new collection
 */
const createCollection = async (req, res) => {
  try {
    const { name, description, isPublic, savedFilters } = req.body;
    const userId = req.user.id;

    const existingCollection = await collectionModel.findOne({
      user: userId,
      name: name.trim(),
    });

    if (existingCollection) {
      return responseHandler.badrequest(res, "Collection with this name already exists");
    }

    const collection = new collectionModel({
      user: userId,
      name: name.trim(),
      description,
      isPublic: isPublic || false,
      savedFilters,
      items: [],
    });

    await collection.save();

    return responseHandler.created(res, {
      ...collection.toObject(),
      id: collection._id.toString(),
    });
  } catch (error) {
    logger.error("Error creating collection", { error: error.message });
    return responseHandler.error(res);
  }
};

/**
 * Get all collections for the current user
 */
const getUserCollections = async (req, res) => {
  try {
    const userId = req.user.id;

    const collections = await collectionModel
      .find({ user: userId })
      .sort("-createdAt")
      .lean();

    const transformedCollections = collections.map(c => ({
      ...c,
      id: c._id.toString(),
      itemCount: c.items?.length || 0,
    }));

    return responseHandler.ok(res, transformedCollections);
  } catch (error) {
    logger.error("Error fetching user collections", { error: error.message });
    return responseHandler.error(res);
  }
};

/**
 * Get a specific collection by ID
 */
const getCollection = async (req, res) => {
  try {
    const { collectionId } = req.params;
    const userId = req.user?.id;

    const collection = await collectionModel.findById(collectionId).lean();

    if (!collection) {
      return responseHandler.notfound(res, "Collection not found");
    }

    if (!collection.isPublic && collection.user.toString() !== userId) {
      return responseHandler.unauthorize(res);
    }

    return responseHandler.ok(res, {
      ...collection,
      id: collection._id.toString(),
    });
  } catch (error) {
    logger.error("Error fetching collection", { error: error.message });
    return responseHandler.error(res);
  }
};

/**
 * Update a collection
 */
const updateCollection = async (req, res) => {
  try {
    const { collectionId } = req.params;
    const { name, description, isPublic, coverImage, savedFilters } = req.body;
    const userId = req.user.id;

    const collection = await collectionModel.findOne({
      _id: collectionId,
      user: userId,
    });

    if (!collection) {
      return responseHandler.notfound(res, "Collection not found");
    }

    if (name && name.trim() !== collection.name) {
      const existing = await collectionModel.findOne({
        user: userId,
        name: name.trim(),
        _id: { $ne: collectionId },
      });
      if (existing) {
        return responseHandler.badrequest(res, "Collection with this name already exists");
      }
      collection.name = name.trim();
    }

    if (description !== undefined) collection.description = description;
    if (isPublic !== undefined) collection.isPublic = isPublic;
    if (coverImage !== undefined) collection.coverImage = coverImage;
    if (savedFilters !== undefined) collection.savedFilters = savedFilters;

    await collection.save();

    return responseHandler.ok(res, {
      ...collection.toObject(),
      id: collection._id.toString(),
    });
  } catch (error) {
    logger.error("Error updating collection", { error: error.message });
    return responseHandler.error(res);
  }
};

/**
 * Delete a collection
 */
const deleteCollection = async (req, res) => {
  try {
    const { collectionId } = req.params;
    const userId = req.user.id;

    const collection = await collectionModel.findOneAndDelete({
      _id: collectionId,
      user: userId,
    });

    if (!collection) {
      return responseHandler.notfound(res, "Collection not found");
    }

    return responseHandler.ok(res, { message: "Collection deleted successfully" });
  } catch (error) {
    logger.error("Error deleting collection", { error: error.message });
    return responseHandler.error(res);
  }
};

/**
 * Add an item to a collection
 */
const addItemToCollection = async (req, res) => {
  try {
    const { collectionId } = req.params;
    const { mediaId, mediaType, mediaTitle, mediaPoster, mediaRate } = req.body;
    const userId = req.user.id;

    const collection = await collectionModel.findOne({
      _id: collectionId,
      user: userId,
    });

    if (!collection) {
      return responseHandler.notfound(res, "Collection not found");
    }

    const existingItem = collection.items.find(
      item => item.mediaId === mediaId.toString() && item.mediaType === mediaType
    );

    if (existingItem) {
      return responseHandler.badrequest(res, "Item already in collection");
    }

    collection.items.push({
      mediaId: mediaId.toString(),
      mediaType,
      mediaTitle,
      mediaPoster,
      mediaRate,
    });

    if (!collection.coverImage && mediaPoster) {
      collection.coverImage = mediaPoster;
    }

    await collection.save();

    return responseHandler.ok(res, {
      ...collection.toObject(),
      id: collection._id.toString(),
    });
  } catch (error) {
    logger.error("Error adding item to collection", { error: error.message });
    return responseHandler.error(res);
  }
};

/**
 * Remove an item from a collection
 */
const removeItemFromCollection = async (req, res) => {
  try {
    const { collectionId, mediaId } = req.params;
    const userId = req.user.id;

    const collection = await collectionModel.findOne({
      _id: collectionId,
      user: userId,
    });

    if (!collection) {
      return responseHandler.notfound(res, "Collection not found");
    }

    const itemIndex = collection.items.findIndex(
      item => item.mediaId === mediaId
    );

    if (itemIndex === -1) {
      return responseHandler.notfound(res, "Item not found in collection");
    }

    collection.items.splice(itemIndex, 1);
    await collection.save();

    return responseHandler.ok(res, {
      ...collection.toObject(),
      id: collection._id.toString(),
    });
  } catch (error) {
    logger.error("Error removing item from collection", { error: error.message });
    return responseHandler.error(res);
  }
};

/**
 * Get public collections
 */
const getPublicCollections = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const collections = await collectionModel
      .find({ isPublic: true, "items.0": { $exists: true } })
      .populate("user", "displayName username")
      .sort("-createdAt")
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await collectionModel.countDocuments({
      isPublic: true,
      "items.0": { $exists: true },
    });

    const transformedCollections = collections.map(c => ({
      ...c,
      id: c._id.toString(),
      itemCount: c.items?.length || 0,
    }));

    return responseHandler.ok(res, {
      collections: transformedCollections,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    logger.error("Error fetching public collections", { error: error.message });
    return responseHandler.error(res);
  }
};

export default {
  createCollection,
  getUserCollections,
  getCollection,
  updateCollection,
  deleteCollection,
  addItemToCollection,
  removeItemFromCollection,
  getPublicCollections,
};

