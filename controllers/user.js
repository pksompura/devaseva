import express from "express";
import jwt from "jsonwebtoken";
import User, { Settings } from "../models/users.js";
import axios from "axios";
import Donation from "../models/donation.js";
import LoginLog from "../models/userLoginLogs.js";
import DeviceDetector from "device-detector-js";

const router = express.Router();

let tokenBlacklist = [];

// Middleware to check if the token is blacklisted
const isTokenBlacklisted = (req, res, next) => {
  const token = req.headers.authorization.split(" ")[1];
  if (tokenBlacklist.includes(token)) {
    return res.status(401).json({ error: "Token is blacklisted" });
  }
  next();
};

// Function to generate OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
// Update user information
export const updateUserInfo = async (req, res) => {
  const {
    full_name,
    email,
    mobile_number,
    address = "",
    profile_pic = "",
    pan_number = "",
  } = req.body;
  try {
    // Find the user by ID provided in the body
    let user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if the mobile number belongs to the current user
    if (mobile_number && mobile_number !== user.mobile_number) {
      const existingUser = await User.findOne({ mobile_number });
      if (existingUser && existingUser._id.toString() !== id) {
        return res
          .status(400)
          .json({ error: "Mobile number already in use by another user" });
      }
    }

    // Update user information
    user.full_name = full_name || user.full_name;
    user.email = email || user.email;
    user.mobile_number = mobile_number || user.mobile_number;
    user.address = address || user.address;
    user.profile_pic = profile_pic || user.profile_pic;
    user.pan_number = pan_number || user.pan_number;

    // Save the updated user
    await user.save();

    res.status(200).json({
      status: true,
      message: "User information updated successfully",
      user,
    });
  } catch (error) {
    console.error("Error updating user information:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Send OTP using SMSINDIAHUB API
async function sendSMS(to, message) {
  // const apiUrl = `http://cloud.smsindiahub.in/api/mt/SendSMS?APIKey=dfpVksGa6Em6a6UIefUbZQ&senderid=AREPLY&channel=Trans&DCS=0&flashsms=0&number=${to}&text=${message}&route=Transactional&PEId=1701158019630577568`;
  const apiUrl = `http://cloud.smsindiahub.in/vendorsms/pushsms.aspx?APIKey=dfpVksGa6Em6a6UIefUbZQ&msisdn=${to}&sid=AREPLY&msg=Your One Time Password is ${message}. Thanks SMSINDIAHUB&fl=0&gwid=2&DCS=0`;
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
    console.log("SMS sent:", response.data);
  } catch (error) {
    console.error("Error sending SMS:", error);
    throw new Error("Failed to send SMS");
  }
}

export const sendOTP = async (req, res) => {
  const { mobile_number } = req.body;
  if (!mobile_number) {
    return res.status(400).json({ error: "Mobile number is required" });
  }

  try {
    const otp = generateOTP();
    let user = await User.findOne({ mobile_number });
    if (user) {
      // If the user exists, update the OTP
      user.otp = otp;
      await user.save();
    } else {
      const newUser = new User({ mobile_number, otp });
      await newUser.save();
    }

    // Send OTP via SMS
    await sendSMS(`91${mobile_number}`, otp);
    return res.status(200).json({ message: "OTP sent successfully" });
  } catch (error) {
    // Log the full error to understand the cause
    console.error("Internal server error:", error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Verify OTP
// export const verifyOTP = async (req, res) => {
//   const { mobile_number, otp } = req.body;
//   if (!mobile_number || !otp) {
//     return res
//       .status(400)
//       .json({ error: "Mobile number and OTP are required" });
//   }

//   try {
//     const user = await User.findOne({ mobile_number, otp });
//     if (!user) {
//       return res.status(400).json({ error: "Invalid OTP" });
//     }

//     user.otp = null; // Clear the OTP after successful verification
//     await user.save();

//     const token = jwt.sign(
//       { id: user._id, mobile_number: user.mobile_number, role: user.role },
//       "praveen1",
//       {
//         expiresIn: "1h",
//       }
//     );

//     res
//       .status(200)
//       .json({ message: "OTP verified successfully", token, user: user });
//   } catch (error) {
//     res.status(500).json({ error: "Internal server error" });
//   }
// };
export const verifyOTP = async (req, res) => {
  const { mobile_number, otp } = req.body;

  if (!mobile_number || !otp) {
    return res
      .status(400)
      .json({ error: "Mobile number and OTP are required" });
  }

  try {
    const user = await User.findOne({ mobile_number, otp });
    if (!user) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    if (user.isBlocked) {
      return res
        .status(403)
        .json({ error: "Your account is blocked. Contact support." });
    }

    user.otp = null; // Clear OTP on success
    await user.save();
    const token = jwt.sign(
      { id: user._id, mobile_number: user.mobile_number, role: user.role },
      process.env.JWT_SECRET || "praveen1", // move to .env if not already
      { expiresIn: "1h" }
    );

    // Device info using device-detector-js
    const deviceDetector = new DeviceDetector();
    const userAgent = req.headers["user-agent"] || "";
    const device = deviceDetector.parse(userAgent);
    const deviceInfo = {
      browser: device.client?.name || "Unknown",
      os: device.os?.name || "Unknown",
      deviceType: device.device?.type || "Unknown",
      model: device.device?.model || "Unknown",
      vendor: device.device?.brand || "Unknown",
    };

    // // IP address & location (via ipwho.is, no API key)
    // const ipAddress =
    //   req.headers["x-forwarded-for"]?.split(",")[0] ||
    //   req.connection?.remoteAddress ||
    //   req.socket?.remoteAddress ||
    //   "Unknown";
    // let location = "Unknown";

    // try {
    //   const geoResponse = await axios.get(`https://ipwho.is/${ipAddress}`);
    //   if (geoResponse.data && geoResponse.data.success) {
    //     location = `${geoResponse.data.city}, ${geoResponse.data.region}, ${geoResponse.data.country}`;
    //   }
    // } catch (geoErr) {
    //   console.warn("Geolocation error:", geoErr.message);
    // }

    // Extract IP address
    const forwarded = req.headers["x-forwarded-for"];
    let ipAddress = forwarded
      ? forwarded.split(",")[0].trim()
      : req.connection?.remoteAddress || req.socket?.remoteAddress || "Unknown";

    // Clean IPv6 prefix if present
    ipAddress = ipAddress.replace(/^::ffff:/, "");

    // Fetch geolocation
    let location = "Unknown";
    try {
      const geoResponse = await axios.get(`https://ipwho.is/${ipAddress}`);
      if (geoResponse.data && geoResponse.data.success) {
        location = `${geoResponse.data.city}, ${geoResponse.data.region}, ${geoResponse.data.country}`;
      }
    } catch (geoErr) {
      console.warn("Geolocation error:", geoErr.message);
    }

    // Log the login activity
    const loginLog = new LoginLog({
      userId: user._id,
      ipAddress,
      location,
      deviceInfo,
    });
    await loginLog.save();
    return res.status(200).json({
      message: "OTP verified successfully",
      token,
      user: {
        _id: user._id,
        full_name: user.full_name,
        email: user.email,
        mobile_number: user.mobile_number,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("OTP verification error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Register or Login User at the time of Donation
// export const registerOrLoginUser = async (req, res) => {
//   const { name, email, mobile_number } = req.body;

//   if (!mobile_number) {
//     return res
//       .status(400)
//       .json({ error: "Name, email, and mobile number are required" });
//   }

//   try {
//     let user = await User.findOne({ mobile_number });
//     const otp = generateOTP();

//     if (user) {
//       user.otp = otp;
//       await user.save();

//       await sendSMS(`91${mobile_number}`, `Your OTP is: ${otp}`);
//       return res.status(200).json({
//         message: "OTP sent successfully. Please verify to proceed.",
//         user: {
//           name: user.name || "guest",
//           email: user.email || "",
//           mobile_number: user.mobile_number,
//         },
//       });
//     } else {
//       const newUser = new User({ name, email, mobile_number, otp });
//       await newUser.save();

//       await sendSMS(`91${mobile_number}`, `Your OTP is: ${otp}`);
//       return res.status(201).json({
//         message: "Registration successful. OTP sent successfully.",
//         user: {
//           name: newUser.name,
//           email: newUser.email,
//           mobile_number: newUser.mobile_number,
//         },
//       });
//     }
//   } catch (error) {
//     console.error("Error during registration or OTP sending:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// };
export const registerOrLoginUser = async (req, res) => {
  const name = req.body.name?.trim();
  const email = req.body.email?.trim();
  const mobile_number = req.body.mobile_number?.trim();
  if (!mobile_number) {
    return res.status(400).json({ error: "Mobile number is required" });
  }

  const otp = generateOTP();
  if (!otp) {
    return res.status(500).json({ error: "Failed to generate OTP" });
  }

  try {
    let user = await User.findOne({ mobile_number });

    if (user) {
      if (user.isBlocked) {
        return res
          .status(403)
          .json({ error: "Your account is blocked. Contact support." });
      }

      user.otp = otp;
      await user.save();
    } else {
      user = new User({
        name: name || "guest",
        email: email || "",
        mobile_number,
        otp,
        role: "admin", // optional default role
        isBlocked: false, // optional default status
      });
      await user.save();
    }

    try {
      await sendSMS(`91${mobile_number}`, `Your OTP is: ${otp}`);
    } catch (smsError) {
      console.error("SMS sending failed:", smsError);
      return res.status(500).json({ error: "Failed to send OTP. Try again." });
    }

    res.status(user.wasNew ? 201 : 200).json({
      message: "OTP sent successfully. Please verify to proceed.",
      user: {
        name: user.name,
        email: user.email,
        mobile_number: user.mobile_number,
      },
    });
  } catch (error) {
    console.error("Error during registration or OTP sending:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get single user's login history for the last 30 days
export const getUserWithLoginHistory = async (req, res) => {
  try {
    const { id } = req.params;

    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const logs = await LoginLog.find({
      userId: id,
      loginAt: { $gte: oneMonthAgo },
    }).sort({ loginAt: -1 });

    const formattedLogs = logs.map((log) => ({
      loginAt: log.loginAt,
      logoutAt: log.logoutAt || "Not logged out yet", // Default if logoutAt is null
      ipAddress: log.ipAddress || "IP not available",
      location: log.location || "Location not available",
      deviceInfo: log.deviceInfo
        ? `${log.deviceInfo.browser || "Unknown Browser"} on ${
            log.deviceInfo.os || "Unknown OS"
          }`
        : "Device info not available",
    }));

    res.status(200).json(formattedLogs);
  } catch (error) {
    console.error("Error getting login history:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// List users
// export const listUsers = async (req, res) => {
//   try {
//     const users = await User.find();
//     res.status(200).json(users);
//   } catch (error) {
//     res.status(500).json({ error: "Internal server error" });
//   }
// };

// List users with pagination and search functionality
export const listUsers = async (req, res) => {
  try {
    const { page = 1, search = "" } = req.query;
    const limit = 10;
    const skip = (page - 1) * limit;

    const searchFilter = search
      ? {
          $or: [
            { full_name: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
            { mobile_number: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    const users = await User.find(searchFilter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }); // Optional: latest first

    const count = await User.countDocuments(searchFilter);

    res.status(200).json({ results: users, count });
  } catch (error) {
    console.error("Error listing users:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
//block users
export const blockUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.isBlocked = !user.isBlocked;
    await user.save();

    res.status(200).json({
      status: true,
      message: `User has been ${user.isBlocked ? "blocked" : "unblocked"}`,
      isBlocked: user.isBlocked,
    });
  } catch (error) {
    console.error("Error blocking user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Logout
// export const logout = async (req, res) => {
//   const token = req.headers.authorization.split(" ")[1];
//   tokenBlacklist.push(token);
//   res.status(200).json({ message: "Logged out successfully" });
// };

// export const logout = async (req, res) => {
//   try {
//     const authHeader = req.headers.authorization;
//     if (!authHeader)
//       return res.status(401).json({ error: "No token provided" });

//     const token = authHeader.split(" ")[1];
//     const decoded = jwt.verify(token, process.env.JWT_SECRET || "praveen1");

//     tokenBlacklist.push(token); // If you're using blacklist

//     // Update logout time in latest login record
//     const latestLogin = await LoginLog.findOne({ userId: decoded.id }).sort({
//       loginAt: -1,
//     });
//     if (latestLogin && !latestLogin.logoutAt) {
//       latestLogin.logoutAt = new Date();
//       await latestLogin.save();
//     }

//     res.status(200).json({ message: "Logged out successfully" });
//   } catch (error) {
//     console.error("Logout error:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// };

export const logout = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || "praveen1");
    } catch (verifyError) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    // Add token to blacklist if implemented
    tokenBlacklist.push(token);

    // Find the latest login record and update logout time
    const latestLogin = await LoginLog.findOne({
      userId: decoded.id,
      logoutAt: null, // Only open sessions
    }).sort({ loginAt: -1 });

    if (latestLogin) {
      latestLogin.logoutAt = new Date();
      await latestLogin.save();
    }

    return res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Get user profile controller
export const getUserProfile = async (req, res) => {
  const userId = req.user.id; // The user ID from the JWT token

  try {
    // Find the user by ID
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    // Return user profile data (you can choose which fields to return)
    const userDonations = await Donation.find({ user_id: user._id })
      .populate("donation_campaign_id", "campaign_title")
      .sort({ donated_date: -1 });
    res.status(200).json({
      status: true,
      message: "User information updated successfully",
      data: user,
      donations: userDonations,
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export default router;

// Delete user controller
export const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    // Find the user by ID and delete
    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res
      .status(200)
      .json({ status: true, message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateSettings = async (req, res) => {
  try {
    const {
      privacypolicy,
      terms,
      about_us,
      banner_title,
      banner_description,
      banner_link,
    } = req.body;

    const user = await User.findById(req.user.id);
    if (!user || user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Access denied. Only admins can update settings." });
    }

    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
    }

    settings.privacypolicy = privacypolicy || settings.privacypolicy;
    settings.terms = terms || settings.terms;
    settings.about_us = about_us || settings.about_us;
    settings.banner_title = banner_title || settings.banner_title;
    settings.banner_description =
      banner_description || settings.banner_description;
    settings.banner_link = banner_link || settings.banner_link;
    console.log(settings.banner_link);
    await settings.save();
    res
      .status(200)
      .json({ message: "Settings updated successfully", settings });
  } catch (error) {
    res
      .status(500)
      .json({ message: "An error occurred while updating settings", error });
  }
};

export const getSettings = async (req, res) => {
  try {
    // const user = await User.findById(req.user.id);

    // if (!user || user.role !== 'admin') {
    //   return res.status(403).json({ message: 'Access denied. Only admins can update settings.' });
    // }

    let settings = await Settings.findOne();

    res.status(200).json({
      status: true,
      message: "Settings updated successfully",
      data: settings,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "An error occurred while updating settings", error });
  }
};
