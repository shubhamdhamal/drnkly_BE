const express = require('express');
const router = express.Router();
const issueController = require('../controllers/IssueController');
const { authenticateVendor } = require('../middleware/auth');

// Vendor reporting an issue
router.post(
  '/report',
  authenticateVendor,
  issueController.uploadIssueFile,
  issueController.reportIssue
);

module.exports = router;
