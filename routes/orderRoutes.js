const express = require('express');
const router = express.Router();

const Order = require('../models/Order');
const Product = require('../models/product');
const { authenticateVendor } = require('../middleware/auth'); // ✅ Import middleware

// ✔ Internal helper function: Filter orders by vendor
const getOrdersForVendor = async (vendorId) => {
  try {
    const allOrders = await Order.find();
    const filteredOrders = [];

    for (const order of allOrders) {
      const vendorItems = [];

      for (const item of order.items) {
        const product = await Product.findById(item.productId);

        if (!product || !product.vendorId) continue;

        if (product.vendorId.toString() === vendorId.toString()) {
          vendorItems.push({
            productId: item.productId,
            orderNumber: order.orderNumber,
            name: item.name,
            image: item.image,
            price: item.price,
            quantity: item.quantity,
            status: item.status || 'pending',
            productName: product.name,
            productImage: product.image,
            orderId: order._id,
            orderDate: order.createdAt,
            paymentStatus: order.paymentStatus || '',
            transactionId: order.transactionId || '',
            customerPhone: order.deliveryAddress?.phone || '',
            customerAddress: `${order.deliveryAddress?.street || ''}, ${order.deliveryAddress?.city || ''}, ${order.deliveryAddress?.state || ''} - ${order.deliveryAddress?.pincode || ''}`,
          });
        }
      }

      if (vendorItems.length > 0) {
        filteredOrders.push({
          orderId: order._id,
          customerId: order.userId,
          customerName: order.deliveryAddress?.fullName || 'Customer',
          customerPhone: order.deliveryAddress?.phone || '',
          customerAddress: `${order.deliveryAddress?.street || ''}, ${order.deliveryAddress?.city || ''}, ${order.deliveryAddress?.state || ''} - ${order.deliveryAddress?.pincode || ''}`,
          deliveryAddress: order.deliveryAddress,
          createdAt: order.createdAt,
          paymentStatus: order.paymentStatus || '',
          transactionId: order.transactionId || '',
          paymentProof: order.paymentProof || '',
          totalAmount: order.totalAmount || 0,
          orderNumber: order.orderNumber,
          items: vendorItems,
        });
      }
    }

    return filteredOrders;
  } catch (err) {
    console.error("❌ Error fetching vendor orders:", err);
    throw new Error('Unable to fetch vendor orders');
  }
};

// 🔥 GET all orders for vendor
router.get('/orders', authenticateVendor, async (req, res) => {
  const vendorId = req.vendorId;

  try {
    const orders = await getOrdersForVendor(vendorId);
    res.status(200).json({ orders });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ✅ PUT: Accept or Reject order item
router.put('/orders/:orderId/status', authenticateVendor, async (req, res) => {
  console.log('🔥 PUT /orders/:orderId/status HIT');
  const { orderId } = req.params;
  const { productId, status } = req.body;
  const vendorId = req.vendorId;

  if (!['accepted', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status value' });
  }

  try {
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    let updated = false;

    for (let item of order.items) {
      if (
        item.productId.toString() === productId &&
        (await Product.findOne({ _id: productId, vendorId }))
      ) {
        item.status = status;
        updated = true;
        break;
      }
    }

    if (!updated) {
      return res.status(403).json({ message: 'Not authorized to update this item' });
    }

    await order.save();
    return res.status(200).json({ message: 'Order item status updated' });
  } catch (err) {
    console.error('❌ Error updating order status:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// 🔥 GET ready-for-pickup orders
router.get('/ready-for-pickup', authenticateVendor, async (req, res) => {
  const vendorId = req.vendorId;

  try {
    const allOrders = await Order.find();
    const readyOrders = [];

    for (const order of allOrders) {
      const vendorItems = [];

      for (const item of order.items) {
        const product = await Product.findById(item.productId);
        if (!product || !product.vendorId) continue;

        if (product.vendorId.toString() === vendorId.toString() && item.status === 'accepted') {
          vendorItems.push({
            productId: item.productId,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            orderNumber: order.orderNumber,
            customerName: order.deliveryAddress?.fullName || 'Customer',
            customerAddress: `${order.deliveryAddress?.street}, ${order.deliveryAddress?.city}`,
            orderId: order._id,
            totalAmount: item.price * item.quantity,
            readyTime: order.createdAt,
          });
        }
      }

      if (vendorItems.length > 0) {
        readyOrders.push(...vendorItems);
      }
    }

    res.status(200).json({ orders: readyOrders });
  } catch (err) {
    console.error('Error fetching ready-for-pickup orders:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ PUT: Update handover status
router.put('/orders/handover', authenticateVendor, async (req, res) => {
  const { productId, orderNumber } = req.body;
  const vendorId = req.vendorId;

  try {
    const order = await Order.findOne({ orderNumber });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    let updated = false;

    for (let item of order.items) {
      if (
        item.productId.toString() === productId &&
        (await Product.findOne({ _id: productId, vendorId }))
      ) {
        item.handoverStatus = 'handedOver';
        updated = true;
        break;
      }
    }

    if (!updated) {
      return res.status(403).json({ message: 'Not authorized to update this item' });
    }

    await order.save();
    res.status(200).json({ message: 'Handover marked successfully' });
  } catch (error) {
    console.error('❌ Error handing over:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = router;
