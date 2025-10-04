import jwt from "jsonwebtoken";
import axios from "axios";
import Fundraiser from "../models/Fundraiser.js";
import LoginLog from "../models/userLoginLogs.js";
import DeviceDetector from "device-detector-js";
// import Campaign from "../models/Campaign.js"; // your campaign model
// import Transaction from "../models/Transaction.js"; // your transaction model

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/* ----- OTP SEND ----- */
// Helper to send SMS via SMSIndiaHub
async function sendSMS(to, otp) {
  const message = `Your One Time Password is ${otp}. Thanks, SMSINDIAHUB`;
  const apiUrl = `http://cloud.smsindiahub.in/vendorsms/pushsms.aspx?APIKey=dfpVksGa6Em6a6UIefUbZQ&msisdn=${to}&sid=AREPLY&msg=${encodeURIComponent(
    message
  )}&fl=0&gwid=2&DCS=0&DLTTemplateId=1007248488345555325`;

  try {
    const response = await axios.get(apiUrl);
    console.log("SMS sent:", response.data);
  } catch (error) {
    console.error("Error sending SMS:", error.response?.data || error.message);
    throw new Error("Failed to send SMS");
  }
}

/* ----- OTP SEND ----- */
export const sendFundraiserOTP = async (req, res) => {
  const { mobile_number, purpose, name, email, ngoName } = req.body;
  if (!mobile_number)
    return res.status(400).json({ error: "Mobile number required" });

  const typeMap = {
    "Medical Treatment": "INDIVIDUAL",
    "NGO / Charity": "NGO",
    Mediation: "MEDIATION",
    "Other Cause": "OTHER",
  };

  try {
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    let fundraiser = await Fundraiser.findOne({ mobile_number });

    if (fundraiser) {
      fundraiser.otp = otp;
      fundraiser.otp_expiry = otpExpiry;

      await fundraiser.save();
    } else {
      const fundraiser_type = typeMap[purpose] || "INDIVIDUAL";

      const newFundraiser = {
        mobile_number,
        otp,
        otp_expiry: otpExpiry,
        fundraiser_type,
      };

      if (fundraiser_type === "INDIVIDUAL") {
        newFundraiser.full_name = name || "Anonymous";
        newFundraiser.email = email || "";
      } else if (fundraiser_type === "NGO") {
        newFundraiser.ngo_name = ngoName || "Unknown NGO";
        newFundraiser.email = email || "";
      }

      fundraiser = new Fundraiser(newFundraiser);
      await fundraiser.save();
    }

    // Send OTP SMS
    await sendSMS(`91${mobile_number}`, otp);

    res.status(200).json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/* ----- OTP VERIFY / LOGIN ----- */
export const verifyFundraiserOTP = async (req, res) => {
  const { mobile_number, otp } = req.body;
  if (!mobile_number || !otp)
    return res.status(400).json({ error: "Mobile number and OTP required" });

  try {
    // Find fundraiser by mobile number and OTP
    let fundraiser = await Fundraiser.findOne({ mobile_number, otp });
    if (!fundraiser || fundraiser.otp !== otp)
      return res.status(400).json({ error: "Invalid OTP" });

    if (fundraiser.otp_expiry && new Date() > fundraiser.otp_expiry)
      return res.status(400).json({ error: "OTP expired, please resend" });

    if (fundraiser.isBlocked)
      return res.status(403).json({ error: "Account blocked" });

    // Clear OTP after verification
    fundraiser.otp = null;
    await fundraiser.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: fundraiser._id, role: fundraiser.role },
      process.env.JWT_SECRET || "praveen1",
      { expiresIn: "1h" }
    );

    // Parse device info
    const deviceDetector = new DeviceDetector();
    const device = deviceDetector.parse(req.headers["user-agent"] || "");

    // Convert deviceInfo to string to match Mongoose schema
    const deviceInfo = {
      os: device.os
        ? `${device.os.name || ""} ${device.os.version || ""}`.trim()
        : "Unknown",
      client: device.client
        ? `${device.client.name || ""} ${device.client.version || ""}`.trim()
        : "Unknown",
      device: device.device
        ? `${device.device.type || ""} ${device.device.brand || ""}`.trim()
        : "Unknown",
    };

    // Create login log
    await LoginLog.create({
      userId: fundraiser._id,
      ipAddress: req.headers["x-forwarded-for"] || req.connection.remoteAddress,
      deviceInfo,
    });

    // Prepare response fundraiser info
    const responseFundraiser = {
      _id: fundraiser._id,
      mobile_number: fundraiser.mobile_number,
      name: fundraiser.full_name || fundraiser.ngo_name || "Anonymous",
      fundraiser_type: fundraiser.fundraiser_type,
      email: fundraiser.email || "",
    };

    res.status(200).json({
      message: "OTP verified",
      token,
      fundraiser: responseFundraiser,
    });
  } catch (error) {
    console.error("OTP verification error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
/* ----- LOGOUT ----- */
export const logoutFundraiser = async (req, res) => {
  try {
    await LoginLog.findOneAndUpdate(
      { userId: req.user.id, logoutAt: null },
      { logoutAt: new Date() },
      { sort: { loginAt: -1 } }
    );
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/* ----- FUNDRAISER PROFILE ----- */
export const updateFundraiser = async (req, res) => {
  try {
    const updated = await Fundraiser.findByIdAndUpdate(req.user.id, req.body, {
      new: true,
    });
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ error: "Failed to update profile" });
  }
};

export const getFundraiser = async (req, res) => {
  try {
    const fundraiser = await Fundraiser.findById(req.user.id);
    res.status(200).json(fundraiser);
  } catch (error) {
    res.status(500).json({ error: "Failed to get profile" });
  }
};

export const listFundraisers = async (req, res) => {
  try {
    const fundraisers = await Fundraiser.find();
    res.status(200).json(fundraisers);
  } catch (error) {
    res.status(500).json({ error: "Failed to list fundraisers" });
  }
};

/* ----- KYC ----- */
export const upsertKYC = async (req, res) => {
  try {
    const fundraiser = await Fundraiser.findByIdAndUpdate(
      req.user.id,
      { kyc: req.body },
      { new: true, upsert: true }
    );
    res.status(200).json(fundraiser.kyc);
  } catch (error) {
    res.status(500).json({ error: "Failed to update KYC" });
  }
};

export const listKYC = async (req, res) => {
  try {
    const fundraisers = await Fundraiser.find({}, { kyc: 1, name: 1 });
    res.status(200).json(fundraisers);
  } catch (error) {
    res.status(500).json({ error: "Failed to list KYC" });
  }
};

/* ----- CAMPAIGNS ----- */
export const createCampaign = async (req, res) => {
  try {
    const campaign = new Campaign({ ...req.body, fundraiser: req.user.id });
    await campaign.save();
    res.status(201).json(campaign);
  } catch (error) {
    res.status(500).json({ error: "Failed to create campaign" });
  }
};

export const updateCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findOneAndUpdate(
      { _id: req.params.id, fundraiser: req.user.id },
      req.body,
      { new: true }
    );
    res.status(200).json(campaign);
  } catch (error) {
    res.status(500).json({ error: "Failed to update campaign" });
  }
};

export const deleteCampaign = async (req, res) => {
  try {
    await Campaign.findOneAndDelete({
      _id: req.params.id,
      fundraiser: req.user.id,
    });
    res.status(200).json({ message: "Campaign deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete campaign" });
  }
};

export const getCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    res.status(200).json(campaign);
  } catch (error) {
    res.status(500).json({ error: "Failed to get campaign" });
  }
};

export const listCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.find();
    res.status(200).json(campaigns);
  } catch (error) {
    res.status(500).json({ error: "Failed to list campaigns" });
  }
};

/* ----- TRANSACTIONS ----- */
export const createTransaction = async (req, res) => {
  try {
    const transaction = new Transaction({
      ...req.body,
      fundraiser: req.user.id,
    });
    await transaction.save();
    res.status(201).json(transaction);
  } catch (error) {
    res.status(500).json({ error: "Failed to create transaction" });
  }
};

export const getTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    res.status(200).json(transaction);
  } catch (error) {
    res.status(500).json({ error: "Failed to get transaction" });
  }
};

export const listTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find();
    res.status(200).json(transactions);
  } catch (error) {
    res.status(500).json({ error: "Failed to list transactions" });
  }
};

/* ----- 80G REFERENCE ----- */
export const get80GReference = async (req, res) => {
  try {
    // Example: fetch from Ketto, Millap, or IMPACC API
    const { data } = await axios.get("https://api.example.com/80g-reference");
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch 80G reference" });
  }
};
