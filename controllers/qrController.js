const Vendor = require('../models/Vendor');

const uploadQRCode = async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ message: 'No file uploaded' });

    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${file.filename}`;
    const vendorId = req.vendorId;


    await Vendor.findByIdAndUpdate(vendorId, { qrCodeUrl: fileUrl });

    res.status(200).json({ message: 'QR uploaded successfully', url: fileUrl });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'QR upload failed' });
  }
};

module.exports = {
  uploadQRCode
};
