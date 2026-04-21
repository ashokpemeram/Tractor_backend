const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema(
  {
    userId: {
      type: String, // Using String to allow simple device IDs from frontend
      required: [true, 'User ID is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    profilePhoto: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

customerSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Customer', customerSchema);
