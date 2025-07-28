const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
    default: function () {
      return `ORD${Math.floor(100000 + Math.random() * 900000)}`;
    }
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      name: String,
      image: String,
      price: Number,
      quantity: Number,
      status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending'
      },
      handoverStatus: {
        type: String,
        enum: ['pending', 'handedOver'],
        default: 'pending'
      },
      deliveryStatus: {
        type: String,
        enum: ['pending', 'delivered'],
        default: 'pending'
      }
    }
  ],
  deliveryAddress: {
    fullName: String,
    phone: String,
    street: String,
    city: String,
    state: String,
    pincode: String
  },
  totalAmount: Number,
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid','cash on delivery'],
    default: 'pending'
  },
  paymentProof: {
    type: String // 🔥 Screenshot image URL stored here
  },
    transactionId: {
    type: String, // Store the transaction ID here
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  tracking: [
    {
      status: String,
      color: String, // You can use colors for each status
      description: String,
    },
  ], 
});

module.exports = mongoose.model('Order', orderSchema);
