const mongoose = require('mongoose');

// Check if model already exists
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  brand: { type: String, required: true },
  category: { type: String, required: true },
  alcoholContent: { type: Number, required: true },
  price: { type: Number, required: true },
  stock: { type: Number, required: true },
  volume: { type: Number, required: true },
  description: { type: String, required: true },
  image: { type: String, required: false },  // Make this field optional
  liquorType: { type: String, enum: ['Hard Liquor', 'Mild Liquor'], required: true }, // Added liquorType
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  inStock: { type: Boolean, default: true },  // This field tracks the product's stock status for the vendor
}, { timestamps: true });

// Check if model is already compiled to avoid OverwriteModelError
module.exports = mongoose.models.Product || mongoose.model('Product', productSchema);
