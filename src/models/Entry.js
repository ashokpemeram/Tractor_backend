const mongoose = require('mongoose');

const entrySchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: [true, 'User ID is required'],
      index: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: [true, 'Customer ID is required'],
    },
    workType: {
      type: String,
      required: [true, 'Work type is required'],
      trim: true,
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0, 'Quantity cannot be negative'],
    },
    rate: {
      type: Number,
      required: [true, 'Rate is required'],
      min: [0, 'Rate cannot be negative'],
    },
    totalAmount: {
      type: Number,
      default: 0,
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      default: Date.now,
    },
    paymentStatus: {
      type: String,
      enum: ['paid', 'pending'],
      default: 'pending',
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
  },
  {
    timestamps: true,
  }
);

// Auto-calculate totalAmount before saving
entrySchema.pre('save', function (next) {
  this.totalAmount = this.quantity * this.rate;
  next();
});

entrySchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate();
  if (update.quantity !== undefined && update.rate !== undefined) {
    update.totalAmount = update.quantity * update.rate;
  }
  next();
});

entrySchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Entry', entrySchema);
