const Product = require('../models/product');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

// Function to categorize liquor based on alcohol content
const categorizeLiquor = (alcoholContent) => {
  if (alcoholContent >= 36) {
    return 'Hard Liquor';
  } else {
    return 'Mild Liquor';
  }
};

// ✅ Add Product API with full debug logs
exports.addProduct = async (req, res) => {
  try {
    console.log("📩 Incoming Add Product API request...");

    // ✅ Log request headers
    console.log("📑 Headers:", req.headers);

    // ✅ Log body
    console.log("📦 Body:", req.body);

    // ✅ Log file
    console.log("📁 Uploaded File Info:", req.file);

    const {
      name,
      brand,
      category,
      alcoholContent,
      price,
      stock,
      volume,
      description,
    } = req.body;

    // ✅ Validate mandatory fields
    const missingFields = [];
    if (!name) missingFields.push('name');
    if (!brand) missingFields.push('brand');
    if (!category) missingFields.push('category');
    if (!alcoholContent) missingFields.push('alcoholContent');
    if (!price) missingFields.push('price');
    if (!stock) missingFields.push('stock');
    if (!volume) missingFields.push('volume');
    if (!description) missingFields.push('description');

    if (missingFields.length > 0) {
      console.error("⚠️ Missing required fields:", missingFields);
      return res.status(400).json({ error: `Missing required fields: ${missingFields.join(', ')}` });
    }

    // ❌ If no file received
    if (!req.file) {
      console.error("❌ No image file received in request.");
      return res.status(400).json({ error: "Image upload failed or no file provided" });
    }

    // ✅ Compose full image URL
const imageFilename = req.file.filename;
const publicUrl = `https://image.peghouse.in/uploads/${imageFilename}`;
    console.log("📸 Image URL:", publicUrl);



    const liquorType = categorizeLiquor(Number(alcoholContent));

    const newProduct = new Product({
      name,
      brand,
      category,
      alcoholContent,
      price,
      stock,
      volume,
      description,
      image: publicUrl, // ✅ Correct full URL
      liquorType,
      vendorId: req.vendorId,
      inStock: stock > 0,
    });

    const saved = await newProduct.save();

    console.log("✅ Product saved to MongoDB:", saved);

    res.status(201).json({
      message: 'Product added successfully',
      product: saved,
    });

  } catch (error) {
    console.error("🔥 Uncaught Error in addProduct:", error);
    res.status(500).json({ error: 'Failed to add product', details: error.message });
  }
};


exports.updateStockForProducts = async (req, res) => {
  try {
    const { products } = req.body;
    console.log("🛠 Incoming stock update payload:", products);

    if (!Array.isArray(products)) {
      return res.status(400).json({ error: "'products' should be an array" });
    }

    const validUpdates = [];

    for (const product of products) {
      const { productId, inStock } = product;

      if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
        console.warn(`⚠️ Skipping invalid productId: ${productId}`);
        continue;
      }

      const updated = await Product.findByIdAndUpdate(
        productId,
        { inStock },
        { new: true }
      );

      if (updated) {
        validUpdates.push(updated);
      }
    }

    return res.status(200).json({ updatedProducts: validUpdates });
  } catch (error) {
    console.error('🔥 Error updating product stock:', error); // This will print the full error
    return res.status(500).json({ error: 'Error updating product stock', details: error.message });
  }
};

// Fetch products for the logged-in vendor
exports.getProductsByVendor = async (req, res) => {
  try {
    const vendorId = req.vendorId; // Extracted from JWT by middleware
    const products = await Product.find({ vendorId }); // Filter by vendor
    res.status(200).json({ products });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};
  
  
  // productController.js
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params; // Get the product ID from URL params
    const updatedProduct = await Product.findByIdAndUpdate(id, req.body, { new: true });

    if (!updatedProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.status(200).json({ product: updatedProduct });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Error updating product' });
  }
};

  
// productController.js

// Delete product (DELETE)
exports.deleteProduct = async (req, res) => {
    try {
      const { id } = req.params; // Get the product ID from URL params
      console.log('Deleting product with ID:', id); // Debugging log
  
      if (!id) {
        return res.status(400).json({ error: 'Product ID is required' });
      }
  
      const deletedProduct = await Product.findByIdAndDelete(id);
  
      if (!deletedProduct) {
        return res.status(404).json({ error: 'Product not found' });
      }
  
      res.status(200).json({ message: 'Product deleted successfully' });
    } catch (error) {
      console.error('Error deleting product:', error);
      res.status(500).json({ error: 'Error deleting product' });
    }
  };
