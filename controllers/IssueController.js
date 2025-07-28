const Issue = require('../models/issue');
const multer = require('multer');
const path = require('path');
const jwt = require('jsonwebtoken');

// Setup Multer for issue file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/issues/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
exports.uploadIssueFile = multer({ storage }).single('file');

// POST /api/issues/report
exports.reportIssue = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const vendorId = decoded.vendorId;

    if (!vendorId) return res.status(400).json({ error: "Vendor ID missing in token" });

    const {
      category,
      description,
      orderOrTransactionId,
      priority,
      contactEmail,
      contactPhone,
      receiveUpdates,
    } = req.body;

    const issue = new Issue({
      vendorId,
      category,
      description,
      file: req.file ? req.file.path : undefined,
      orderOrTransactionId,
      priority,
      contactEmail,
      contactPhone,
      receiveUpdates: receiveUpdates === 'true',
    });

    await issue.save();
    res.status(201).json({ message: "Issue reported successfully", issue });
  } catch (error) {
    console.error('Issue Report Error:', error);
    res.status(500).json({ error: 'Failed to report issue' });
  }
};
