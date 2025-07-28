const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
  category: {
    type: String,
    enum: [
      'Order Issues',
      'Payment Issues',
      'Delivery Issues',
      'Product Quality Issues',
      'Technical Issues',
      'Other'
    ],
    required: true
  },
  description: { type: String, required: true },
  file: { type: String },
  orderOrTransactionId: { type: String },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Low'
  },
  contactEmail: { type: String },
  contactPhone: { type: String },
  receiveUpdates: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

// ✅ Add custom validation to require EITHER userId OR vendorId
issueSchema.pre('validate', function (next) {
  if (!this.userId && !this.vendorId) {
    return next(new Error('Either userId or vendorId must be provided.'));
  }
  next();
});

module.exports = mongoose.model('Issue', issueSchema);
