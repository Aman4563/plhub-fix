/**
 * Default Model Options for Mongoose Schemas
 * Configures the default behavior for schema serialization, versioning, and timestamps.
 */
const modelOptions = {
  /**
   * Configures how documents are serialized to JSON.
   * Includes virtual fields, removes `_id`, and returns a clean object.
   */
  toJSON: {
    virtuals: true,
    transform: (_, ret) => {
      delete ret._id; // Remove the internal `_id` field
      return ret; // Return the transformed object
    },
  },
  /**
   * Configures how documents are serialized to plain JavaScript objects.
   * Includes virtual fields, removes `_id`, and returns a clean object.
   */
  toObject: {
    virtuals: true,
    transform: (_, ret) => {
      delete ret._id; // Remove the internal `_id` field
      return ret; // Return the transformed object
    },
  },
  /**
   * Disables the `__v` version key in documents.
   * Ensures that Mongoose's version control field is excluded by default.
   */
  versionKey: false,
  /**
   * Automatically manages `createdAt` and `updatedAt` timestamps for documents.
   * Adds and updates these fields based on document lifecycle events.
   */
  timestamps: true,
};

export default modelOptions;
