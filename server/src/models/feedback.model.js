import mongoose from 'mongoose';
import modelOptions from './model.options.js';

const feedbackSchema = new mongoose.Schema(
  {
    user: {
      type: String, // Change type to String to accept username
      required: true,
    },
    feedback: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  modelOptions
);

const Feedback = mongoose.model('Feedback', feedbackSchema);

export default Feedback;
