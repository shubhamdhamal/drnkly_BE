const express = require('express');
const router = express.Router();
const { getVendorStats } = require('../controllers/vendorStatsController');

// Change from /stats → /vendor-stats
router.get('/', getVendorStats);

module.exports = router;
