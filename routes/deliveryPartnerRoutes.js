const express = require('express');
const router = express.Router();
const DeliveryPartner = require('../models/deliveryPartner');
const { authenticateVendor } = require('../middleware/auth');

// Add a new delivery partner
router.post('/add', authenticateVendor, async (req, res) => {
  const { name, email, phone, password } = req.body;
  const vendorId = req.vendorId; // Get the vendorId from the JWT token

  try {
    const newDeliveryPartner = new DeliveryPartner({
      name,
      email,
      phone,
      password, // You should hash the password before saving it in a real application
      vendorId,
    });

    await newDeliveryPartner.save();
    res.status(201).json({ message: 'Delivery partner added successfully', deliveryPartner: newDeliveryPartner });
  } catch (error) {
    console.error('Error adding delivery partner:', error);
    res.status(500).json({ error: 'Failed to add delivery partner' });
  }
});

// Get all delivery partners for the logged-in vendor
router.get('/', authenticateVendor, async (req, res) => {
  try {
    const deliveryPartners = await DeliveryPartner.find({ vendorId: req.vendorId });
    res.status(200).json({ deliveryPartners });
  } catch (error) {
    console.error('Error fetching delivery partners:', error);
    res.status(500).json({ error: 'Failed to fetch delivery partners' });
  }
});

module.exports = router;
