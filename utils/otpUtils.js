const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Store OTPs in memory (in production, use Redis or a database)
const otpStore = {};

// Generate a 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Save OTP with expiry time (5 minutes)
const saveOTP = (email, otp) => {
  otpStore[email] = {
    otp,
    expiry: Date.now() + 5 * 60 * 1000, // 5 minutes from now
  };
};

// Verify OTP
const verifyOTP = (email, otp) => {
  const otpData = otpStore[email];
  
  if (!otpData) {
    return false; // No OTP found for this email
  }
  
  if (Date.now() > otpData.expiry) {
    delete otpStore[email]; // Clean up expired OTP
    return false; // OTP expired
  }
  
  if (otpData.otp !== otp) {
    return false; // OTP doesn't match
  }
  
  // OTP is valid, clean it up
  delete otpStore[email];
  return true;
};

// Create a test account with Ethereal for development
const createTestAccount = async () => {
  try {
    const testAccount = await nodemailer.createTestAccount();
    console.log('Created Ethereal test account:');
    console.log('- Email:', testAccount.user);
    console.log('- Password:', testAccount.pass);
    console.log('- Preview URL: https://ethereal.email');
    
    return {
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    };
  } catch (error) {
    console.error('Failed to create test account:', error);
    throw error;
  }
};

// Send OTP via email
const sendOTPEmail = async (email, otp) => {
  let transportConfig;
  
  // Check if SMTP settings are configured
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transportConfig = {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    };
  } else {
    // Use Ethereal for testing if no SMTP settings
    console.log('No SMTP settings found, using Ethereal test account');
    transportConfig = await createTestAccount();
  }

  const transporter = nodemailer.createTransport(transportConfig);

  const mailOptions = {
    from: process.env.EMAIL_FROM || '"Drnkly Vendor" <vendor@drnkly.com>',
    to: email,
    subject: 'Your Drnkly Vendor Registration OTP',
    text: `Your OTP for Drnkly vendor registration is: ${otp}. This OTP is valid for 5 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h2 style="color: #4a5568;">Drnkly Vendor Registration</h2>
        <p>Hello,</p>
        <p>Thank you for registering as a vendor on Drnkly. To complete your registration, please use the following OTP:</p>
        <div style="background-color: #f7fafc; padding: 15px; border-radius: 5px; text-align: center; font-size: 24px; letter-spacing: 5px; margin: 20px 0;">
          <strong>${otp}</strong>
        </div>
        <p>This OTP is valid for <strong>5 minutes</strong>.</p>
        <p>If you did not request this OTP, please ignore this email.</p>
        <p>Regards,<br>The Drnkly Team</p>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    
    // If using Ethereal, log the preview URL
    if (info.messageId && info.messageId.includes('ethereal')) {
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }
    
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

module.exports = {
  generateOTP,
  saveOTP,
  verifyOTP,
  sendOTPEmail
}; 