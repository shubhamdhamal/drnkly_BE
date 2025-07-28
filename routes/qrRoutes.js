const express = require('express');
const multer = require('multer');
const path = require('path'); // ✅ Add this line
const { uploadQRCode } = require('../controllers/qrController');
const { authenticateVendor } = require('../middleware/auth');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});

const upload = multer({ storage });

router.post(
    '/upload-qr',
    authenticateVendor,               // ✅ Add this line!
    upload.single('qrCode'),
    uploadQRCode
  );

module.exports = router;
