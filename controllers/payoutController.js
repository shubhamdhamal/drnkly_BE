const Order = require('../models/Order');
const Product = require('../models/product');

exports.getVendorPayouts = async (req, res) => {
  const vendorId = req.vendorId;

  try {
    const allOrders = await Order.find();
    const payouts = [];

    for (const order of allOrders) {
      for (const item of order.items) {
        const product = await Product.findById(item.productId);

        if (!product || product.vendorId.toString() !== vendorId.toString()) continue;

        const commission = Math.round((item.price * item.quantity) * 0.10); // Example: 10%

        payouts.push({
          payoutId: `PAY${Math.floor(1000 + Math.random() * 9000)}`, // Or use fixed mapping
          orderNumber: order.orderNumber,
          productName: item.name,
          customerName: order.deliveryAddress?.fullName || 'Customer',
          date: order.createdAt,
          amount: item.price * item.quantity,
          commission,
          status: item.status === 'accepted' && item.handoverStatus === 'handedOver' ? 'paid' : 'pending',
        });
      }
    }

    res.status(200).json({ payouts });
  } catch (err) {
    console.error('❌ Error generating payouts:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
