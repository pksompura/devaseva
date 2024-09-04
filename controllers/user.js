// import express from 'express';
// import jwt from 'jsonwebtoken';
// import User from '../models/users.js';
// import { Vonage } from '@vonage/server-sdk';

// const router = express.Router();

// let tokenBlacklist = [];

// // Middleware to check if the token is blacklisted
// const isTokenBlacklisted = (req, res, next) => {
//   const token = req.headers.authorization.split(' ')[1];
//   if (tokenBlacklist.includes(token)) {
//     return res.status(401).json({ error: 'Token is blacklisted' });
//   }
//   next();
// };

// // Function to generate OTP
// function generateOTP() {
//   return Math.floor(100000 + Math.random() * 900000).toString();
// }

// const vonage = new Vonage({
//   apiKey: "32f2a9f4",
//   apiSecret: "aQ0wZEqAB3YVwkAp"
// });

// const from = "Vonage APIs";

// async function sendSMS(to, from, text) {
//   await vonage.sms.send({ to, from, text })
//     .then(resp => { console.log('Message sent successfully'); console.log(resp); })
//     .catch(err => { console.log('There was an error sending the messages.'); console.error(err); });
// }

// // Send OTP
// export const sendOTP = async (req, res) => {
//   const { mobile_number } = req.body;
//   if (!mobile_number) {
//     return res.status(400).json({ error: 'Mobile number is required' });
//   }

//   try {
//     const otp = generateOTP();
//     let user = await User.findOne({ where: { mobile_number } });
//     if (user) {
//       user.otp = otp;
//       await user.save();
//     } else {
//       user = await User.create({ mobile_number, otp });
//     }

//     await sendSMS(`91${mobile_number}`, from, otp);
//     res.status(200).json({ message: 'OTP sent successfully' });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// };

// // Verify OTP
// export const verifyOTP = async (req, res) => {
//   const { mobile_number, otp } = req.body;
//   if (!mobile_number || !otp) {
//     return res.status(400).json({ error: 'Mobile number and OTP are required' });
//   }

//   try {
//     const user = await User.findOne({ where: { mobile_number, otp } });

//     if (!user) {
//       return res.status(400).json({ error: 'Invalid OTP' });
//     }

//     // Clear the OTP after successful verification
//     user.otp = null;
//     await user.save();

//     // Create a JWT token
//     const token = jwt.sign({ id: user._id, mobile_number: user.mobile_number }, "JWT_SECRET", {
//       expiresIn: '1h', // Token expires in 1 hour
//     });

//     res.status(200).json({ message: 'OTP verified successfully', token });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// };

// // List users
// export const listUsers = async (req, res) => {
//   try {
//     const users = await User.findAll(); // Use your ORM method to fetch users
//     res.status(200).json(users);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// };

// // Logout
// export const logout = async (req, res) => {
//   const token = req.headers.authorization.split(' ')[1];
//   tokenBlacklist.push(token);
//   res.status(200).json({ message: 'Logged out successfully' });
// };

// export default router;
import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/users.js';
import { Vonage } from '@vonage/server-sdk';

const router = express.Router();

let tokenBlacklist = [];

// Middleware to check if the token is blacklisted
const isTokenBlacklisted = (req, res, next) => {
  const token = req.headers.authorization.split(' ')[1];
  if (tokenBlacklist.includes(token)) {
    return res.status(401).json({ error: 'Token is blacklisted' });
  }
  next();
};

// Function to generate OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
const vonage = new Vonage({
  apiKey: "32f2a9f4",
  apiSecret: "aQ0wZEqAB3YVwkAp"
});

const from = "Vonage APIs";

async function sendSMS(to, from, text) {
  await vonage.sms.send({ to, from, text })
    .then(resp => { console.log('Message sent successfully'); console.log(resp); })
    .catch(err => { console.log('There was an error sending the messages.'); console.error(err); });
}

// Send OTP
export const sendOTP = async (req, res) => {
  const { mobile_number } = req.body;
  if (!mobile_number) {
    return res.status(400).json({ error: 'Mobile number is required' });
  }

  try {
    const otp = generateOTP();
    let user = await User.findOne({ mobile_number });
    if (user) {
      user.otp = otp;
      await user.save();
    } else {
      user = new User({ mobile_number, otp });
      await user.save();
    }

    await sendSMS(`91${mobile_number}`, from, otp);
    res.status(200).json({ message: 'OTP sent successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Verify OTP
export const verifyOTP = async (req, res) => {
  const { mobile_number, otp } = req.body;
  if (!mobile_number || !otp) {
    return res.status(400).json({ error: 'Mobile number and OTP are required' });
  }

  try {
    const user = await User.findOne({ mobile_number, otp });

    if (!user) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    user.otp = null;
    await user.save();

    const token = jwt.sign({ id: user._id, mobile_number: user.mobile_number }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    res.status(200).json({ message: 'OTP verified successfully', token });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// List users
export const listUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Logout
export const logout = async (req, res) => {
  const token = req.headers.authorization.split(' ')[1];
  tokenBlacklist.push(token);
  res.status(200).json({ message: 'Logged out successfully' });
};

export default router;
