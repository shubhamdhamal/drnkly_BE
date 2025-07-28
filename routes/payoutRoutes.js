const express = require('express');
const router = express.Router();
const { getVendorPayouts } = require('../controllers/payoutController');
const { authenticateVendor } = require('../middleware/auth');

router.get('/payouts', authenticateVendor, getVendorPayouts);

module.exports = router;