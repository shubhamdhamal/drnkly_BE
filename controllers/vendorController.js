const Vendor = require('../models/Vendor');
const multer = require('multer');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs'); // Make sure bcryptjs is imported at the top
const { generateOTP, saveOTP, verifyOTP, sendOTPEmail } = require('../utils/otpUtils');


// Configure Multer for file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Destination folder
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Create a unique filename
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB file size limit
}).single('image'); // Make sure the field name matches the name attribute in your form


exports.registerVendor = async (req, res) => {
  try {
    const { businessName, businessEmail, businessPhone, password, location, productCategories, verificationMethod } = req.body;

    // Check if the vendor already exists by email or phone
    const vendorExists = await Vendor.findOne({
      $or: [{ businessEmail }, { businessPhone }]
    });
    if (vendorExists) {
      return res.status(400).json({ error: 'Vendor already exists' });
    }

    // Create a new vendor
    const newVendor = new Vendor({
      businessName,
      businessEmail,
      businessPhone,
      password, // Password will be hashed in the Vendor model before saving
      location,
      productCategories,
      verificationStatus: verificationMethod === 'otp' ? 'verified' : 'pending' // If OTP verified, set to verified directly
    });

    // Save the vendor to the database
    await newVendor.save();
    
    // Send response with the vendor's data and vendorId
    
    res.status(201).json({
      message: verificationMethod === 'otp' ? 'Registration completed successfully' : 'Registration submitted for admin approval',
      vendorId: newVendor._id,
      verificationStatus: newVendor.verificationStatus
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// Handle file uploads
exports.uploadFiles = (req, res) => {
  const vendorId = req.params.vendorId;
  const vendorFiles = req.files; // Multer adds files to req.files

  if (!vendorFiles || vendorFiles.length === 0) {
    return res.status(400).json({ error: 'No files uploaded' });
  }

  // Check for specific file fields (license and id)
  const licenseFile = vendorFiles.find(file => file.fieldname === 'license');
  const idProofFile = vendorFiles.find(file => file.fieldname === 'id');

  if (!licenseFile || !idProofFile) {
    return res.status(400).json({ error: 'Both license and ID files are required' });
  }

  Vendor.findById(vendorId)
    .then(vendor => {
      if (!vendor) {
        return res.status(404).json({ error: 'Vendor not found' });
      }

      vendor.license = licenseFile.path;
      vendor.idProof = idProofFile.path;

      return vendor.save();
    })
    .then(updatedVendor => {
      res.status(200).json({
        message: 'Files uploaded successfully',
        vendor: updatedVendor,
      });
    })
    .catch(err => res.status(500).json({ error: err.message }));
};

// Update verification status
exports.updateVerificationStatus = async (req, res) => {
  const { vendorId, status } = req.body;

  try {
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    vendor.verificationStatus = status;
    await vendor.save();

    res.status(200).json({
      message: 'Verification status updated',
      vendor: vendor,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Vendor login

// Vendor login
exports.loginVendor = async (req, res) => {
  try {
    const { emailOrPhone, password } = req.body;

    // 🔍 Check for input
    if (!emailOrPhone || !password) {
      return res.status(400).json({ error: 'Email/Phone and password are required' });
    }

    // 🔍 Find vendor by email or phone
    const vendor = await Vendor.findOne({
      $or: [{ businessEmail: emailOrPhone }, { businessPhone: emailOrPhone }],
    });

    if (!vendor) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // 🔐 Check password
    const isMatch = await bcrypt.compare(password, vendor.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // 🚫 Check verification status
    if (vendor.verificationStatus === 'pending') {
      return res.status(403).json({ error: 'Your account is under review by the admin.' });
    }

    if (vendor.verificationStatus === 'rejected') {
      return res.status(403).json({ error: 'Your account has been rejected by the admin.' });
    }

    // ✅ Generate token if verified
    const token = jwt.sign({ vendorId: vendor._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({
      message: 'Login successful',
      token,
      vendor: {
        id: vendor._id,
        businessName: vendor.businessName,
        businessEmail: vendor.businessEmail,
        verificationStatus: vendor.verificationStatus
      }
    });

  } catch (error) {
    console.error('Error logging in vendor:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


exports.getVendorProfile = async (req, res) => {
  const vendorId = req.vendorId; // From the JWT token

  try {
    const vendor = await Vendor.findById(vendorId); // Find vendor by ID
    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    const { password, ...vendorData } = vendor.toObject(); // Exclude password
    res.status(200).json(vendorData); // Send profile data
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch vendor profile', details: err.message });
  }
};
exports.updateVendorProfile = async (req, res) => {
  const vendorId = req.vendorId; // Getting the vendorId from the JWT token
  const { businessName, businessEmail, businessPhone } = req.body;

  console.log('Updating profile for vendorId:', vendorId);

  try {
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    console.log('Vendor found:', vendor);

    // Update vendor fields
    if (businessName) vendor.businessName = businessName;
    if (businessEmail) vendor.businessEmail = businessEmail;
    if (businessPhone) vendor.businessPhone = businessPhone;

    // Save and log the updated vendor
    await vendor.save();
    console.log('Vendor updated:', vendor);

    res.status(200).json(vendor);
  } catch (err) {
    console.error('Error updating vendor profile:', err);
    res.status(500).json({ error: 'Failed to update vendor profile', details: err.message });
  }
};

// Fetch the product count for the logged-in vendor
exports.getProductCount = async (req, res) => {
  try {
    const vendorId = req.vendorId; // Get the vendorId from the JWT token
    // Fetch the count of products where vendorId matches the logged-in vendor
    const productCount = await Product.countDocuments({ vendorId });

    res.status(200).json({ productCount });
  } catch (error) {
    console.error("Error fetching product count:", error);
    res.status(500).json({ error: 'Failed to fetch product count' });
  }
};


// GET vendor verification status by ID
exports.getVendorStatus = async (req, res) => {
  const { vendorId } = req.params;

  try {
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    res.status(200).json({ verificationStatus: vendor.verificationStatus });
  } catch (error) {
    console.error('Error fetching vendor status:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Send OTP for email verification
exports.sendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Generate a new OTP
    const otp = generateOTP();
    
    // Save the OTP
    saveOTP(email, otp);
    
    // Send the OTP via email
    await sendOTPEmail(email, otp);
    
    res.status(200).json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ error: 'Failed to send OTP', details: error.message });
  }
};

// Verify OTP
exports.verifyOtp = (req, res) => {
  try {
    const { email, otp } = req.body;
    
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }
    
    // Verify the OTP
    const isValid = verifyOTP(email, otp);
    
    if (isValid) {
      res.status(200).json({ message: 'OTP verified successfully' });
    } else {
      res.status(400).json({ error: 'Invalid or expired OTP' });
    }
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ error: 'Failed to verify OTP', details: error.message });
  }
};
