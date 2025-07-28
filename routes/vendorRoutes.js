const express = require('express');
const router = express.Router();
const vendorController = require('../controllers/vendorController');
const productController = require('../controllers/productController');
const multer = require('multer');
const { authenticateVendor } = require('../middleware/auth'); // Middleware to check authentication


// Protected route to fetch vendor profile based on JWT token
router.get('/profile', authenticateVendor, vendorController.getVendorProfile);
// Update profile route
router.put('/profile', authenticateVendor, vendorController.updateVendorProfile);


// Add the route to get product count
router.get('/product-count', authenticateVendor, vendorController.getProductCount);
// Add the route to get products by vendor
router.get('/products', authenticateVendor, productController.getProductsByVendor);


// Middleware for file upload handling
const upload = multer({ dest: 'uploads/' }).array('files', 2);

// Routes
router.post('/register', vendorController.registerVendor); // Register vendor
router.post('/upload/:vendorId', upload, vendorController.uploadFiles); // Upload documents
router.post('/update-status', vendorController.updateVerificationStatus); // Update verification status
router.post('/login', vendorController.loginVendor); // Vendor login
router.get('/status/:vendorId', vendorController.getVendorStatus);

// OTP routes
router.post('/send-otp', vendorController.sendOtp); // Send OTP
router.post('/verify-otp', vendorController.verifyOtp); // Verify OTP

module.exports = router;