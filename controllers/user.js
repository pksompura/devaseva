
import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/users.js';
import axios from 'axios';

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
// Update user information
export const updateUserInfo = async (req, res) => {
  const { first_name, last_name, email, mobile_number, address, profile_pic, pan_number } = req.body;
  const userId = req.user.id; // Get user ID from the verified JWT token

  try {
    // Find the user by ID
    let user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update user information
    user.first_name = first_name || user.first_name;
    user.last_name = last_name || user.last_name;
    user.email = email || user.email;
    user.mobile_number = mobile_number || user.mobile_number;
    user.address = address || user.address;
    user.profile_pic = profile_pic || user.profile_pic;
    user.pan_number = pan_number || user.pan_number; // Update the new field

    // Save the updated user
    await user.save();

    res.status(200).json({ message: 'User information updated successfully', user });
  } catch (error) {
    console.error('Error updating user information:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Send OTP using SMSINDIAHUB API
async function sendSMS(to, message) {
 
  // const apiUrl = `http://cloud.smsindiahub.in/api/mt/SendSMS?APIKey=dfpVksGa6Em6a6UIefUbZQ&senderid=AREPLY&channel=Trans&DCS=0&flashsms=0&number=${to}&text=${message}&route=Transactional&PEId=1701158019630577568`; 
 const apiUrl =`http://cloud.smsindiahub.in/vendorsms/pushsms.aspx?APIKey=dfpVksGa6Em6a6UIefUbZQ&msisdn=${to}&sid=AREPLY&msg=Your One Time Password is ${message}. Thanks SMSINDIAHUB&fl=0&gwid=2&DCS=0`
  //  const params = {
  //   user: 'pksompura',           // Replace with your SMSINDIAHUB username
  //   password: 'Pksompura1#',       // Replace with your SMSINDIAHUB password
  //   senderid: 'AREPLY',             // Replace with your approved SenderID
  //   channel: 'Transactional',               // Use 'Trans' for transactional SMS
  //   DCS: 0,
  //   flashsms: 0,
  //   number: to,                     // Mobile number of the user
  //   text: message, // This should match the template text
  //   DLTTemplateId: '1007248488345555325',  // Replace with the approved DLT Template ID
  //   route: 'AREPLY',
  //   PEId: '1701158019630577568'              // Replace with your Principal Entity ID
  // };
  try {
    const response = await axios.post(apiUrl);
    console.log('SMS sent:', response.data);
  } catch (error) {
    console.error('Error sending SMS:', error);
    throw new Error('Failed to send SMS');
  }
}

export const sendOTP = async (req, res) => {
  const { mobile_number } = req.body;
  if (!mobile_number) {
    return res.status(400).json({ error: 'Mobile number is required' });
  }

  try {
    const otp = generateOTP();
    let user = await User.findOne({ mobile_number });

    if (user) {
      // If the user exists, update the OTP
      user.otp = otp;
      await user.save();
    } else {
      // If the user doesn't exist, create a new user with mobile_number and otp
      user = new User({ mobile_number, otp });
      
      try {
        // Try saving the new user to the database
        const result = await user.save();
        console.log('User created:', result);
      } catch (saveError) {
        // Catch specific errors related to saving the new user
        console.error('Error saving user:', saveError.message);
        return res.status(500).json({ error: 'Failed to create user. Please try again later.' });
      }
    }

    // Send OTP via SMS
    await sendSMS(`91${mobile_number}`, otp);
    return res.status(200).json({ message: 'OTP sent successfully' });
  } catch (error) {
    // Log the full error to understand the cause
    console.error('Internal server error:', error.message);
    return res.status(500).json({ error: 'Internal server error' });
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

    user.otp = null; // Clear the OTP after successful verification
    await user.save();

    const token = jwt.sign({ id: user._id, mobile_number: user.mobile_number }, "praveen1", {
      expiresIn: '1h',
    });

    res.status(200).json({ message: 'OTP verified successfully', token ,user:user});
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Register or Login User at the time of Donation
export const registerOrLoginUser = async (req, res) => {
  const { name, email, mobile_number } = req.body;

  if (!name || !email || !mobile_number) {``
    return res.status(400).json({ error: 'Name, email, and mobile number are required' });
  }

  try {
    let user = await User.findOne({ mobile_number });
    const otp = generateOTP();

    if (user) {
      user.otp = otp;
      await user.save();

      await sendSMS(`91${mobile_number}`, `Your OTP is: ${otp}`);
      return res.status(200).json({
        message: 'OTP sent successfully. Please verify to proceed.',
        user: { name: user.name, email: user.email, mobile_number: user.mobile_number },
      });
    } else {
      const newUser = new User({ name, email, mobile_number, otp });
      await newUser.save();

      await sendSMS(`91${mobile_number}`, `Your OTP is: ${otp}`);
      return res.status(201).json({
        message: 'Registration successful. OTP sent successfully.',
        user: { name: newUser.name, email: newUser.email, mobile_number: newUser.mobile_number },
      });
    }
  } catch (error) {
    console.error('Error during registration or OTP sending:', error);
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


// Get user profile controller
export const getUserProfile = async (req, res) => {
  const userId = req.user.id; // The user ID from the JWT token

  try {
    // Find the user by ID
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
console.log(user)
    // Return user profile data (you can choose which fields to return)
    res.status(200).json({status:true,message:"user Fetched successfully",data:user});
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export default router;
  

// 70222 80760