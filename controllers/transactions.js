import Razorpay from "razorpay";
import crypto from "crypto";
import axios from "axios";
import cron from "node-cron";
// import DonationCampaign from '../models/DonationCampaign.js';
import dotenv from "dotenv";
dotenv.config(); // Ensure this is at the top of the file

import Donation from "../models/donation.js";
import DonationCampaign from "../models/donationCampaign.js";
import nodemailer from "nodemailer";
import path, { dirname } from "path";
import { createObjectCsvStringifier, createObjectCsvWriter } from "csv-writer";
import User from "../models/users.js";
import os from "os";
import html_to_pdf from "html-pdf-node";
import fs from "fs";
import { fileURLToPath } from "url";
// import puppeteer from "puppeteer";
// import pdf from "html-pdf"; // or use puppeteer if you're using that
import ExcelJS from "exceljs";
import Decimal128 from "mongodb";
import generateReceiptPDF from "../utils/generateReceiptPDF.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Initialize Razorpay instance
const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
});

// const sendDonationReceipt = async (
//   email,
//   donorName,
//   donationDate,
//   amount,
//   transactionId,
//   notes
// ) => {
//   const transporter = nodemailer.createTransport({
//     host: "smtp.hostinger.com",
//     port: 465,
//     secure: true,
//     auth: {
//       user: "aschandan88@algotradingelite.com",
//       pass: "Chandu@8861151876", // Your Hostinger email password
//     },
//     tls: {
//       rejectUnauthorized: false, // Adjust based on your SSL certificate
//       minVersion: "TLSv1.2", // Force TLS version
//     },
//   });

//   const mailOptions = {
//     // from: `"Giveaze Foundation" <${process.env.EMAIL_USER}>`,
//     to: email,
//     subject: "Giveaze Foundation - Donation Receipt",
//     subject: "Giveaze Foundation - Donation Receipt",
//     html: `<!DOCTYPE html>
//     <html>
//     <head>
//       <meta charset="UTF-8" />
//       <title>Giveaze Foundation Donation Receipt</title>
//     </head>
//     <body style="font-family: Arial, sans-serif; background-color: #f6f9fc; padding: 20px; margin: 0;">
//       <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
//         <tr>
//           <td align="center" style="padding-bottom: 20px;">
//             <img src="https://giveaze.com/NAME.png" alt="Giveaze Foundation" style="width: 100px; display: block; margin: 0 auto;" />
//             <h1 style="color: #1e3a8a; font-size: 24px; margin: 10px 0;">Thank you for your donation!</h1>
//           </td>
//         </tr>
//         <tr>
//           <td style="font-size: 16px; color: #333;">
//             <p>Dear <strong>${donorName}</strong>,</p>
//             <p>We are deeply grateful for your generous donation to <strong>Giveaze Foundation</strong>.</p>
//             <p>Your donation receipt is detailed below:</p>
//             <p><strong>Donation Date:</strong> ${donationDate}</p>
//             <p><strong>Amount:</strong> <span style="font-size: 20px; color: #1e3a8a; font-weight: bold;">$${amount}</span></p>
//             <p><strong>Transaction ID:</strong> ${transactionId}</p>

//             <p>Please retain this email as your official donation receipt for your records.</p>
//           </td>
//         </tr>
//       </table>
//     </body>
//     </html>`,
//   };
//   await transporter.sendMail(mailOptions);
// };
const sendDonationReceipt = async (
  email,
  donorName,
  donationDate,
  amount,
  transactionId,
  notes,
  receiptPath // Absolute path to PDF
) => {
  // console.log("SMTP Configuration:", {
  //   host: process.env.SMTP_HOST,
  //   port: process.env.SMTP_PORT,
  //   user: process.env.SMTP_USER,
  // });

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false,
      minVersion: "TLSv1.2",
    },
  });
  // transporter.verify(function (error, success) {
  //   if (error) {
  //     console.log("Connection error:", error);
  //   } else {
  //     console.log("Server is ready to take our messages");
  //   }
  // });

  const mailOptions = {
    from: `"Giveaze Foundation" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "Giveaze Foundation - Donation Receipt",
    html: `<!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8" />
      <title>Giveaze Foundation Donation Receipt</title>
    </head>
    <body style="font-family: Arial, sans-serif; background-color: #f6f9fc; padding: 20px; margin: 0;">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
        <tr>
          <td align="center" style="padding-bottom: 20px;">
            <img src="https://giveaze.com/NAME.png" alt="Giveaze Foundation" style="width: 100px; display: block; margin: 0 auto;" />
            <h1 style="color: #1e3a8a; font-size: 24px; margin: 10px 0;">Thank you for your donation!</h1>
          </td>
        </tr>
        <tr>
          <td style="font-size: 16px; color: #333;">
            <p>Dear <strong>${donorName}</strong>,</p>
            <p>We are deeply grateful for your generous donation to <strong>Giveaze Foundation</strong>.</p>
            <p>Your donation receipt is attached to this email:</p>
            <p><strong>Donation Date:</strong> ${donationDate}</p>
            <p><strong>Amount:</strong> <span style="font-size: 20px; color: #1e3a8a; font-weight: bold;">₹${amount}</span></p>
            <p><strong>Transaction ID:</strong> ${transactionId}</p>
            <p><strong>Notes:</strong> ${notes}</p>
            <p>Please retain the attached PDF as your official donation receipt.</p>
          </td>
        </tr>
      </table>
    </body>
    </html>`,
    attachments: [
      {
        filename: path.basename(receiptPath), // only the file name
        path: receiptPath, // full file system path
        contentType: "application/pdf",
      },
    ],
  };

  await transporter.sendMail(mailOptions);
};

// export const createOrder = async (req, res) => {
//   const {
//     clientIp,
//     deviceInfo,
//     browserType,
//     amount,
//     user_id,
//     donation_campaign_id,
//     payment_method,
//     notes,
//     is_anonymous,
//   } = req.body;

//   if (!amount || !user_id || !donation_campaign_id) {
//     return res
//       .status(400)
//       .json({ message: "All required fields must be provided!" });
//   }
//   try {
//     // 🔹 Create order in Razorpay
//     const options = {
//       amount: Number(amount * 100), // Convert to paise
//       currency: "INR",
//       receipt: crypto.randomBytes(10).toString("hex"),
//     };

//     const order = await razorpayInstance.orders.create(options);

//     // 🔹 Save donation record in DB
//     const donation = new Donation({
//       total_amount: amount,
//       donation_campaign_id,
//       transaction_id: order.id, // Razorpay Order ID
//       user_id,
//       // payment_method,
//       payment_status: "pending", // Initially pending
//       currency: "INR",
//       ip_address: clientIp,
//       device_info: deviceInfo,
//       browser_type: browserType,
//       // notes,
//       is_anonymous: is_anonymous || false,
//     });
//     await donation.save();
//     res
//       .status(200)
//       .json({ success: true, data: order, donation_id: donation._id });
//   } catch (error) {
//     console.error("Error creating order:", error);
//     res.status(500).json({ message: "Internal Server Error!" });
//   }
// };

export const createOrder = async (req, res) => {
  const {
    clientIp,
    deviceInfo,
    browserType,
    amount,
    user_id,
    donation_campaign_id,
    payment_method,
    notes,
    is_anonymous,
    pan_number,
    full_address,
  } = req.body;

  if (!amount || !user_id || !donation_campaign_id) {
    return res
      .status(400)
      .json({ message: "All required fields must be provided!" });
  }

  try {
    const options = {
      amount: Number(amount * 100), // amount in paise
      currency: "INR",
      receipt: crypto.randomBytes(10).toString("hex"),
    };

    const order = await razorpayInstance.orders.create(options);

    const donation = new Donation({
      total_amount: amount,
      donation_campaign_id,
      transaction_id: order.id, // Razorpay ORDER ID (stored safely)
      user_id,
      payment_status: "pending",
      currency: "INR",
      ip_address: clientIp,
      device_info: deviceInfo,
      browser_type: browserType,
      notes: notes || "",
      is_anonymous: is_anonymous || false,
      pan_number: pan_number || undefined,
      full_address: full_address || undefined,
      paid: false, // Set to false, will update after verification
    });

    await donation.save();

    res.status(200).json({
      success: true,
      data: order,
      donation_id: donation._id,
    });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ message: "Internal Server Error!" });
  }
};

// export const verifyPayment = async (req, res) => {
//   const { razorpay_payment_id, transaction_id, email, donorName } = req.body;

//   try {
//     // ✅ Get payment status from Razorpay
//     const razorpayResponse = await axios.get(
//       `https://api.razorpay.com/v1/payments/${razorpay_payment_id}`,
//       {
//         auth: {
//           username: process.env.RAZORPAY_KEY_ID,
//           password: process.env.RAZORPAY_SECRET,
//         },
//       }
//     );

//     const paymentDetails = razorpayResponse.data;

//     if (paymentDetails.status !== "captured") {
//       return res
//         .status(400)
//         .json({ status: false, message: "Payment not successful!" });
//     }

//     // ✅ Find existing donation using transaction_id (Razorpay Order ID)
//     const donation = await Donation.findOne({ transaction_id });
//     if (!donation) {
//       return res
//         .status(404)
//         .json({ status: false, message: "Donation not found!" });
//     }

//     // ✅ Update the existing donation
//     donation.payment_status = "successful";
//     donation.paid = true;
//     donation.transaction_id = razorpay_payment_id; // optional: replace order ID with payment ID
//     await donation.save();

//     // ✅ Update campaign raised amount
//     const campaign = await DonationCampaign.findById(
//       donation.donation_campaign_id
//     );
//     if (!campaign) {
//       return res.status(404).json({ message: "Donation campaign not found!" });
//     }

//     const currentRaised = campaign.raised_amount
//       ? parseFloat(campaign.raised_amount.toString())
//       : 0;
//     const updatedRaised = currentRaised + parseFloat(donation.total_amount);
//     campaign.raised_amount = updatedRaised;
//     await campaign.save();

//     // ✅ Send Receipt
//     await sendDonationReceipt(
//       email,
//       donorName,
//       new Date().toISOString(),
//       donation.total_amount,
//       paymentDetails.order_id
//     );

//     return res.status(200).json({
//       status: true,
//       message: "Payment Verified and Donation Updated Successfully",
//       donation,
//     });
//   } catch (error) {
//     console.error("Payment Verification Error:", error);
//     return res
//       .status(500)
//       .json({ status: false, message: "Internal Server Error!" });
//   }
// };

export const verifyPayment = async (req, res) => {
  const { razorpay_payment_id, donation_id } = req.body;

  console.log("RAZORPAY_KEY_ID:", process.env.RAZORPAY_KEY_ID);
  console.log("RAZORPAY_SECRET:", process.env.RAZORPAY_SECRET);

  try {
    // 1. Verify with Razorpay
    const razorpayResponse = await axios.get(
      `https://api.razorpay.com/v1/payments/${razorpay_payment_id}`,
      {
        auth: {
          username: process.env.RAZORPAY_KEY_ID,
          password: process.env.RAZORPAY_SECRET,
        },
      }
    );

    const paymentDetails = razorpayResponse.data;

    if (paymentDetails.status !== "captured") {
      return res.status(400).json({
        status: false,
        message: "Payment not successful!",
      });
    }

    // 2. Find Donation (Fix: use donation_id instead of transaction_id)
    const donation = await Donation.findById(donation_id)
      .populate("donation_campaign_id")
      .populate("user_id");
    if (!donation) {
      return res.status(404).json({
        status: false,
        message: "Donation not found!",
      });
    }

    // 3. Update Donation
    donation.payment_status = "successful";
    donation.paid = true;
    donation.transaction_id = razorpay_payment_id;
    await donation.save();

    // 4. Update Campaign Raised Amount
    const campaign = donation.donation_campaign_id;
    if (!campaign) {
      return res.status(404).json({
        status: false,
        message: "Donation campaign not found!",
      });
    }

    const currentRaised = campaign.raised_amount
      ? parseFloat(campaign.raised_amount.toString())
      : 0;
    const updatedRaised =
      currentRaised + parseFloat(donation.total_amount.toString());
    campaign.raised_amount = updatedRaised;
    await campaign.save();

    // 5. Generate Receipt PDF
    const receiptFileName = `receipt_${donation.transaction_id}.pdf`;
    const receiptPath = await generateReceiptPDF(
      donation,
      donation.user_id,
      receiptFileName
    );

    // 6. Save receipt path
    donation.receipt_url = `/receipts/${receiptFileName}`;
    await donation.save();

    // 7. Send Email with receipt
    await sendDonationReceipt(
      donation.user_id.email,
      donation.user_id.name || donation.user_id.full_name,
      new Date().toLocaleString(),
      donation.total_amount,
      razorpay_payment_id,
      donation.notes || "",
      receiptPath
    );

    // 8. Response
    return res.status(200).json({
      status: true,
      message: "Payment Verified and Donation Updated Successfully",
      donation,
      receipt_url: donation.receipt_url,
    });
  } catch (error) {
    console.error("Payment Verification Error:", error);
    return res.status(500).json({
      status: false,
      message: "Internal Server Error!",
    });
  }
};

// export const verifyPayment = async (req, res) => {
//   const {
//     razorpay_payment_id,
//     razorpay_order_id,
//     razorpay_signature,
//     donation_id,
//   } = req.body;

//   try {
//     // Step 1: Validate Razorpay Signature
//     const generatedSignature = crypto
//       .createHmac("sha256", process.env.RAZORPAY_SECRET)
//       .update(`${razorpay_order_id}|${razorpay_payment_id}`)
//       .digest("hex");

//     if (generatedSignature !== razorpay_signature) {
//       return res.status(400).json({
//         status: false,
//         message: "Invalid Razorpay signature!",
//       });
//     }

//     // Step 2: Fetch Razorpay Payment Details
//     const razorpayResponse = await axios.get(
//       `https://api.razorpay.com/v1/payments/${razorpay_payment_id}`,
//       {
//         auth: {
//           username: process.env.RAZORPAY_KEY_ID,
//           password: process.env.RAZORPAY_SECRET,
//         },
//       }
//     );

//     const paymentDetails = razorpayResponse.data;

//     if (paymentDetails.status !== "captured") {
//       return res.status(400).json({
//         status: false,
//         message: "Payment not captured!",
//       });
//     }

//     // Step 3: Fetch Donation Record
//     const donation = await Donation.findById(donation_id)
//       .populate("donation_campaign_id")
//       .populate("user_id");

//     if (!donation) {
//       return res.status(404).json({
//         status: false,
//         message: "Donation not found!",
//       });
//     }

//     // Step 4: Update Donation Details
//     donation.payment_status = "successful";
//     donation.paid = true;
//     donation.razorpay_payment_id = razorpay_payment_id;

//     // Set transaction_id only if not already set (avoid overwriting)
//     if (!donation.transaction_id) {
//       donation.transaction_id = razorpay_order_id;
//     }

//     await donation.save();

//     // Step 5: Update Campaign Raised Amount
//     const campaign = donation.donation_campaign_id;
//     if (campaign) {
//       const current = parseFloat(campaign.raised_amount || 0);
//       const donated = parseFloat(donation.total_amount || 0);
//       campaign.raised_amount = (current + donated).toFixed(2);
//       await campaign.save();
//     }

//     // Step 6: Generate Receipt PDF
//     const receiptFileName = `receipt_${donation._id}.pdf`;
//     const receiptPath = await generateReceiptPDF(
//       donation,
//       donation.user_id,
//       receiptFileName
//     );

//     donation.receipt_url = `/receipts/${receiptFileName}`;
//     await donation.save();

//     // Step 7: Send Receipt Email
//     await sendDonationReceipt(
//       donation.user_id.email,
//       donation.user_id.name || donation.user_id.full_name,
//       new Date().toLocaleString(),
//       donation.total_amount,
//       razorpay_payment_id,
//       donation.notes || "",
//       receiptPath
//     );

//     // Step 8: Return Success Response
//     return res.status(200).json({
//       status: true,
//       message: "Payment Verified and Donation Updated Successfully",
//       donation,
//       receipt_url: donation.receipt_url,
//     });
//   } catch (error) {
//     console.error(
//       "Payment Verification Error:",
//       error?.response?.data || error.message || error
//     );
//     return res.status(500).json({
//       status: false,
//       message: "Internal Server Error",
//     });
//   }
// };

export const getDonationsByUser = async (req, res) => {
  const { userId } = req.params;

  try {
    const donations = await Donation.find({ user_id: userId }).populate(
      "donation_campaign_id"
    );
    if (!donations) {
      return res
        .status(404)
        .json({ message: "No donations found for this user." });
    }
    res.status(200).json(donations);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error!" });
  }
};

// Controller to fetch all donations by campaign
export const getDonationsByCampaign = async (req, res) => {
  const { campaignId } = req.params;

  try {
    const donations = await Donation.find({
      donation_campaign_id: campaignId,
    }).populate("user_id");
    if (!donations) {
      return res
        .status(404)
        .json({ message: "No donations found for this campaign." });
    }
    res.status(200).json(donations);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error!" });
  }
};

// Controller to fetch donations by transaction/payment ID
export const getDonationsByTransactionId = async (req, res) => {
  const { paymentId } = req.params;

  try {
    const payment = await Donation.findOne({
      razorpay_payment_id: paymentId,
    }).populate("donation_campaign_id");
    if (!payment) {
      return res
        .status(404)
        .json({ message: "No donations found for this transaction." });
    }
    res.status(200).json(payment);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error!" });
  }
};

export const getAllTransactions = async (req, res) => {
  try {
    const { search } = req.query;

    let matchStage = {};

    if (search) {
      matchStage = {
        $or: [
          { transaction_id: { $regex: search, $options: "i" } }, // Search by transaction ID
          { "user_data.full_name": { $regex: search, $options: "i" } }, // Search by user full name
          { "user_data.mobile_number": { $regex: search, $options: "i" } }, // Search by user mobile
          { "campaign_data.campaign_title": { $regex: search, $options: "i" } }, // Search by campaign title
        ],
      };
    }

    const transactions = await Donation.aggregate([
      {
        $lookup: {
          from: "user_donations", // Collection name in MongoDB
          localField: "user_id",
          foreignField: "_id",
          as: "user_data",
        },
      },
      { $unwind: { path: "$user_data", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "donationcampaigns", // Collection name in MongoDB
          localField: "donation_campaign_id",
          foreignField: "_id",
          as: "campaign_data",
        },
      },
      { $unwind: { path: "$campaign_data", preserveNullAndEmptyArrays: true } },
      { $match: matchStage }, // Apply search filter
      { $sort: { donated_date: -1 } }, // Sort by latest donations
      {
        $project: {
          transaction_id: 1,
          donated_date: 1,
          total_amount: 1,
          payment_method: 1,
          payment_status: 1,
          currency: 1,
          receipt_url: 1,
          notes: 1,
          "user_data.full_name": 1,
          "user_data.mobile_number": 1,
          "user_data.email": 1,
          "campaign_data.campaign_title": 1,
        },
      },
    ]);

    res.status(200).json({ success: true, data: transactions });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getTransactionsByDate = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    // Validate dates
    if (!start_date || !end_date) {
      return res
        .status(400)
        .json({ message: "Start date and end date are required" });
    }

    const transactions = await Donation.find({
      donated_date: { $gte: new Date(start_date), $lte: new Date(end_date) },
    })
      .populate("user_id")
      .populate("donation_campaign_id");

    if (!transactions.length) {
      return res.status(404).json({ message: "No transactions found" });
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Transactions");

    // Add headers
    worksheet.columns = [
      { header: "Sl. No.", key: "sl_no", width: 10 },
      { header: "Transaction ID", key: "transaction_id", width: 25 },
      { header: "Donor Name", key: "donor_name", width: 25 },
      { header: "Email", key: "email", width: 25 },
      { header: "Phone", key: "phone", width: 15 },
      { header: "Amount", key: "amount", width: 15 },
      { header: "Date", key: "donation_date", width: 20 },
      { header: "Time", key: "donation_time", width: 15 },
      { header: "Campaign", key: "campaign_name", width: 25 },
      { header: "Device Info", key: "device_info", width: 25 },
      { header: "IP Address", key: "ip_address", width: 20 },
    ];

    // Add rows
    transactions.forEach((tx, index) => {
      worksheet.addRow({
        sl_no: index + 1,
        transaction_id: tx.transaction_id || "N/A",
        donor_name: tx.user_id?.full_name || "N/A",
        email: tx.user_id?.email || "N/A",
        phone: tx.user_id?.mobile_number || "N/A",
        amount: tx.total_amount ? tx.total_amount.toString() : "0",
        donation_date: tx.donated_date
          ? tx.donated_date.toISOString().split("T")[0]
          : "N/A",
        donation_time: tx.donated_date
          ? tx.donated_date.toISOString().split("T")[1].split(".")[0]
          : "N/A",
        campaign_name: tx.donation_campaign_id?.campaign_title || "N/A",
        device_info: tx.device_info || "N/A",
        ip_address: tx.ip_address || "N/A",
      });
    });

    // Set response headers
    const fileName = `transactions_${start_date}_to_${end_date}.xlsx`;
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);

    // Write workbook to response stream
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Excel Export Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
cron.schedule("*/5 * * * *", async () => {
  console.log("[CRON] Checking for pending donations...");

  const pendingDonations = await Donation.find({
    payment_status: "pending",
    retry_count: { $lt: 5 },
  });

  for (const donation of pendingDonations) {
    try {
      const razorpayResponse = await axios.get(
        `https://api.razorpay.com/v1/orders/${donation.transaction_id}/payments`,
        {
          auth: {
            username: process.env.RAZORPAY_KEY_ID,
            password: process.env.RAZORPAY_SECRET,
          },
        }
      );
      const payments = razorpayResponse.data.items;
      const capturedPayment = payments.find((p) => p.status === "captured");

      if (capturedPayment) {
        donation.payment_status = "successful";
        donation.paid = true;
        donation.transaction_id = capturedPayment.id;
        await donation.save();

        const campaign = await DonationCampaign.findById(
          donation.donation_campaign_id
        );
        if (campaign) {
          const currentRaised = parseFloat(campaign.raised_amount || 0);
          campaign.raised_amount =
            currentRaised + parseFloat(donation.total_amount);
          await campaign.save();
        }

        const user = await User.findById(donation.user_id);
        const donorName = user?.name || "Donor";
        const email = user?.email;
        const donationDate = new Date().toISOString();

        if (email) {
          await sendDonationReceipt(
            email,
            donorName,
            donationDate,
            donation.total_amount,
            capturedPayment.order_id,
            donation.notes
          );
        }

        console.log(
          `✅ Donation ${donation._id} verified & marked as successful`
        );
      } else {
        donation.retry_count += 1;
        donation.last_checked_at = new Date();
        await donation.save();

        if (donation.retry_count >= 5) {
          // You can delete it or mark as expired instead:
          // await Donation.deleteOne({ _id: donation._id });
          donation.payment_status = "expired";
          await donation.save();
          console.log(`❌ Donation ${donation._id} expired after max retries`);
        } else {
          console.log(
            `🔁 Donation ${donation._id} retry count: ${donation.retry_count}`
          );
        }
      }
    } catch (error) {
      console.error(
        `🚨 Error verifying donation ${donation._id}:`,
        error.message
      );
    }
  }
});

// export const getTransactionsByDate = async (req, res) => {
//   try {
//     const { start_date, end_date } = req.query;
//     // Fetch transactions from DB based on date range
//     const transactions = await Donation.find({
//       donated_date: { $gte: new Date(start_date), $lte: new Date(end_date) },
//     })
//       .populate("user_id")
//       .populate("donation_campaign_id");

//     if (!transactions.length) {
//       return res.status(404).json({ message: "No transactions found" });
//     }
//     // Ensure the 'exports' folder exists
//     const exportFolder = path.join(__dirname, "../exports");
//     if (!fs.existsSync(exportFolder)) {
//       fs.mkdirSync(exportFolder, { recursive: true });
//     }

//     // Define CSV file path
//     const fileName = `transactions_${start_date}_to_${end_date}.csv`;
//     const filePath = path.join(exportFolder, fileName);

//     // Define CSV Writer
//     const csvWriter = createObjectCsvWriter({
//       path: filePath,
//       header: [
//         { id: "sl_no", title: "Sl. No." },
//         { id: "pre_ack_no", title: "Pre Acknowledgement Number" },
//         { id: "id_code", title: "ID Code" },
//         { id: "unique_id", title: "Unique Identification Number" },
//         { id: "section_code", title: "Section Code" },
//         { id: "urn", title: "Unique Registration Number (URN)" },
//         {
//           id: "date_issued",
//           title: "Date of Issuance of Unique Registration Number",
//         },
//         { id: "donor_name", title: "Name of donor" },
//         { id: "donor_address", title: "Address of donor" },
//         { id: "donation_type", title: "Donation Type" },
//         { id: "mode_of_receipt", title: "Mode of receipt" },
//         { id: "amount", title: "Amount of donation (Indian rupees)" },
//         { id: "receipt_no", title: "Receipt No." },
//         { id: "donation_date", title: "Date of donation" },
//         { id: "donation_time", title: "Time of donation" },
//         { id: "phone", title: "Phone" },
//         { id: "email", title: "Email" },
//         { id: "campaign_id", title: "Campaign ID" },
//         { id: "campaign_name", title: "Campaign Name" },
//         { id: "transaction_id", title: "Transaction ID" },
//         { id: "browser_type", title: "Browser Type" },
//         { id: "device_info", title: "Device Information" },
//         { id: "ip_address", title: "IP Address" },
//       ],
//     });

//     // Format data
//     const csvData = transactions.map((tx, index) => ({
//       sl_no: index + 1,
//       pre_ack_no: "",
//       id_code: tx.user_id?.pan_number,
//       unique_id: tx.unique_id || "N/A",
//       section_code: "Section 80G",
//       urn: "AAETG8493KF20241",
//       date_issued: "12-09-2024",
//       donor_name: tx.user_id?.full_name || "N/A",
//       donor_address: tx.user_id?.address || "N/A",
//       donation_type: "Others",
//       mode_of_receipt: "Electronic modes including account payee cheque/draft",
//       amount: tx.total_amount?.$numberDecimal || "0",
//       receipt_no: tx.receipt_no || "N/A",
//       donation_date: tx.donated_date
//         ? tx.donated_date.toISOString().split("T")[0]
//         : "N/A",
//       donation_time: tx.donated_date
//         ? tx.donated_date.toISOString().split("T")[1]
//         : "N/A",
//       phone: tx.user_id?.mobile_number || "N/A",
//       email: tx.user_id?.email || "N/A",
//       campaign_id: tx.donation_campaign_id._id || "N/A",
//       campaign_name: tx.donation_campaign_id.campaign_title || "N/A",
//       transaction_id: tx.transaction_id || "N/A",
//       browser_type: tx.browser_type || "N/A",
//       device_info: tx.device_info || "N/A",
//       ip_address: tx.ip_address || "N/A",
//     }));

//     // Write data to CSV file
//     await csvWriter.writeRecords(csvData);

//     // Ensure file exists before sending
//     if (!fs.existsSync(filePath)) {
//       return res.status(500).json({ message: "Error generating CSV file" });
//     }

//     // Send the file for download
//     res.download(filePath, fileName, (err) => {
//       if (err) {
//         console.error("Error sending file:", err);
//         res.status(500).json({ message: "Error downloading file" });
//       } else {
//         // Delete file after download
//         fs.unlink(filePath, (unlinkErr) => {
//           if (unlinkErr) console.error("Error deleting file:", unlinkErr);
//         });
//       }
//     });
//   } catch (error) {
//     console.error("Error exporting transactions:", error);
//     res.status(500).json({ message: "Internal Server Error" });
//   }
// };
// cron.schedule("*/5 * * * *", async () => {
//   console.log("[CRON] Checking for pending donations...");

//   const pendingDonations = await Donation.find({
//     payment_status: "pending",
//     retry_count: { $lt: 5 },
//   });

//   for (const donation of pendingDonations) {
//     try {
//       const razorpayResponse = await axios.get(
//         `https://api.razorpay.com/v1/orders/${donation.transaction_id}/payments`,
//         {
//           auth: {
//             username: process.env.RAZORPAY_KEY_ID,
//             password: process.env.RAZORPAY_SECRET,
//           },
//         }
//       );
//       const payments = razorpayResponse.data.items;
//       const capturedPayment = payments.find((p) => p.status === "captured");

//       if (capturedPayment) {
//         donation.payment_status = "successful";
//         donation.paid = true;
//         donation.transaction_id = capturedPayment.id;
//         await donation.save();

//         const campaign = await DonationCampaign.findById(
//           donation.donation_campaign_id
//         );
//         if (campaign) {
//           const currentRaised = parseFloat(campaign.raised_amount || 0);
//           campaign.raised_amount =
//             currentRaised + parseFloat(donation.total_amount);
//           await campaign.save();
//         }

//         const user = await User.findById(donation.user_id);
//         const donorName = user?.name || "Donor";
//         const email = user?.email;
//         const donationDate = new Date().toISOString();

//         if (email) {
//           await sendDonationReceipt(
//             email,
//             donorName,
//             donationDate,
//             donation.total_amount,
//             capturedPayment.order_id,
//             donation.notes
//           );
//         }

//         console.log(
//           `✅ Donation ${donation._id} verified & marked as successful`
//         );
//       } else {
//         donation.retry_count += 1;
//         donation.last_checked_at = new Date();
//         await donation.save();

//         if (donation.retry_count >= 5) {
//           // You can delete it or mark as expired instead:
//           // await Donation.deleteOne({ _id: donation._id });
//           donation.payment_status = "expired";
//           await donation.save();
//           console.log(`❌ Donation ${donation._id} expired after max retries`);
//         } else {
//           console.log(
//             `🔁 Donation ${donation._id} retry count: ${donation.retry_count}`
//           );
//         }
//       }
//     } catch (error) {
//       console.error(
//         `🚨 Error verifying donation ${donation._id}:`,
//         error.message
//       );
//     }
//   }
// });

// export const downloadDonationReceipt = async (req, res) => {
//   const { donation_id } = req.query;

//   if (!donation_id) {
//     return res.status(400).json({ message: "Donation ID is required" });
//   }

//   try {
//     const donation = await Donation.findById(donation_id);
//     if (!donation)
//       return res.status(404).json({ message: "Donation not found" });

//     const user = await User.findById(donation.user_id);
//     const campaign = await DonationCampaign.findById(
//       donation.donation_campaign_id
//     );

//     const donorName = user?.name || "Donor";
//     const donationDate = new Date(donation.createdAt).toLocaleDateString(
//       "en-IN"
//     );
//     const transactionId = donation.transaction_id;
//     const amount = parseFloat(donation.total_amount.toString()).toFixed(2);
//     const notes = donation.notes || "";
//     const campaignName = campaign?.title || "Donation Campaign";

//     // 📄 HTML content for the receipt
//     const html = `
//       <!DOCTYPE html>
//       <html lang="en">
//       <head>
//         <meta charset="UTF-8" />
//         <title>Donation Receipt</title>
//         <style>
//           body { font-family: Arial, sans-serif; padding: 30px; background-color: #f9fafb; }
//           .container { max-width: 600px; margin: auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
//           h1 { color: #1e3a8a; margin-bottom: 20px; }
//           p { font-size: 16px; margin: 5px 0; }
//           .footer { margin-top: 30px; font-size: 12px; color: #555; }
//         </style>
//       </head>
//       <body>
//         <div class="container">
//           <h1>Giveaze Foundation - Donation Receipt</h1>
//           <p><strong>Donor Name:</strong> ${donorName}</p>
//           <p><strong>Campaign:</strong> ${campaignName}</p>
//           <p><strong>Transaction ID:</strong> ${transactionId}</p>
//           <p><strong>Donation Date:</strong> ${donationDate}</p>
//           <p><strong>Amount:</strong> ₹${amount}</p>
//           ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ""}
//           <div class="footer">
//             <p>Thank you for your generous contribution!</p>
//           </div>
//         </div>
//       </body>
//       </html>
//     `;

//     // 📦 Generate PDF using Puppeteer
//     const browser = await puppeteer.launch();
//     const page = await browser.newPage();
//     await page.setContent(html, { waitUntil: "networkidle0" });

//     const pdfBuffer = await page.pdf({
//       format: "A4",
//       printBackground: true,
//     });

//     await browser.close();

//     // 🧾 Save PDF to local file
//     const fileName = `receipt-${transactionId}.pdf`;
//     const receiptPath = path.resolve("uploads", "receipts");
//     const filePath = path.join(receiptPath, fileName);

//     // Ensure the directory exists
//     if (!fs.existsSync(receiptPath)) {
//       fs.mkdirSync(receiptPath, { recursive: true });
//     }

//     fs.writeFileSync(filePath, pdfBuffer);

//     // 📤 Send PDF in response
//     res.setHeader("Content-Type", "application/pdf");
//     res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
//     res.send(pdfBuffer);
//   } catch (err) {
//     console.error("PDF Generation Error:", err);
//     res
//       .status(500)
//       .json({ message: "Something went wrong while generating the PDF" });
//   }
// // };

// export const downloadDonationReceipt = async (req, res) => {
//   const { donation_id } = req.query;

//   if (!donation_id) {
//     return res.status(400).json({ message: "Donation ID is required" });
//   }

//   try {
//     const donation = await Donation.findById(donation_id);
//     if (!donation) return res.status(404).json({ message: "Donation not found" });

//     const user = await User.findById(donation.user_id);
//     const campaign = await DonationCampaign.findById(donation.donation_campaign_id);

//     const donorName = user?.name || "Donor";
//     const donationDate = new Date(donation.createdAt).toLocaleDateString("en-IN");
//     const transactionId = donation.transaction_id;
//     const amount = parseFloat(donation.total_amount.toString()).toFixed(2);
//     const notes = donation.notes || "";
//     const campaignName = campaign?.title || "Donation Campaign";

//     const html = `
//           <!DOCTYPE html>
//           <html lang="en">
//           <head>
//             <meta charset="UTF-8" />
//             <title>Donation Receipt</title>
//             <style>
//               body { font-family: Arial, sans-serif; padding: 30px; background-color: #f9fafb; }
//               .container { max-width: 600px; margin: auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
//               h1 { color: #1e3a8a; margin-bottom: 20px; }
//               p { font-size: 16px; margin: 5px 0; }
//               .footer { margin-top: 30px; font-size: 12px; color: #555; }
//             </style>
//           </head>
//           <body>
//             <div class="container">
//               <h1>Giveaze Foundation - Donation Receipt</h1>
//               <p><strong>Donor Name:</strong> ${donorName}</p>
//               <p><strong>Campaign:</strong> ${campaignName}</p>
//               <p><strong>Transaction ID:</strong> ${transactionId}</p>
//               <p><strong>Donation Date:</strong> ${donationDate}</p>
//               <p><strong>Amount:</strong> ₹${amount}</p>
//               ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ""}
//               <div class="footer">
//                 <p>Thank you for your generous contribution!</p>
//               </div>
//             </div>
//           </body>
//           </html>
//         `;

//     const receiptFileName = `donation_receipt_${donation_id}.pdf`;
//     const receiptPath = path.join("receipts", receiptFileName); // Make sure the receipts folder exists

//     pdf.create(html).toFile(receiptPath, (err, result) => {
//       if (err) {
//         console.error("PDF generation error:", err);
//         return res.status(500).json({ message: "Failed to generate receipt" });
//       }

//       res.setHeader("Content-Type", "application/pdf");
//       res.setHeader("Content-Disposition", `attachment; filename="${receiptFileName}"`);

//       // Pipe the file stream directly to response
//       const fileStream = fs.createReadStream(result.filename);
//       fileStream.pipe(res);
//     });
//   } catch (error) {
//     console.error("Error generating receipt:", error);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// export const downloadDonationReceipt = async (req, res) => {
//   const { donation_id } = req.query;

//   if (!donation_id) {
//     return res.status(400).json({ message: "Donation ID is required" });
//   }

//   try {
//     const donation = await Donation.findById(donation_id);
//     if (!donation)
//       return res.status(404).json({ message: "Donation not found" });

//     const user = await User.findById(donation.user_id);
//     const campaign = await DonationCampaign.findById(
//       donation.donation_campaign_id
//     );

//     const donorName = user?.name || "Donor";
//     const donationDate = new Date(donation.createdAt).toLocaleDateString(
//       "en-IN"
//     );
//     const transactionId = donation.transaction_id;
//     const amount = parseFloat(donation.total_amount.toString()).toFixed(2);
//     const notes = donation.notes || "";
//     const campaignName = campaign?.title || "Donation Campaign";

//     const html = `
//       <!DOCTYPE html>
//       <html>
//         <head>
//           <meta charset="utf-8">
//           <title>Donation Receipt</title>
//           <style>
//             body { font-family: Arial; padding: 20px; background: #f9f9f9; }
//             .container { background: #fff; padding: 20px; border-radius: 10px; max-width: 600px; margin: auto; }
//             h1 { color: #333; }
//           </style>
//         </head>
//         <body>
//           <div class="container">
//             <h1>Donation Receipt</h1>
//             <p><strong>Donor Name:</strong> ${donorName}</p>
//             <p><strong>Date:</strong> ${donationDate}</p>
//             <p><strong>Transaction ID:</strong> ${transactionId}</p>
//             <p><strong>Amount:</strong> ₹${amount}</p>
//             <p><strong>Campaign:</strong> ${campaignName}</p>
//             <p><strong>Notes:</strong> ${notes}</p>
//           </div>
//         </body>
//       </html>
//     `;

//     // Generate PDF using Puppeteer
//     // const browser = await puppeteer.launch({ headless: "new" });
//     // const browser = await puppeteer.launch({
//     //   headless: "new", // or true
//     //   // args: [
//     //   //   "--no-sandbox",
//     //   //   "--disable-setuid-sandbox",
//     //   //   "--disable-dev-shm-usage",
//     //   //   "--disable-accelerated-2d-canvas",
//     //   //   "--no-first-run",
//     //   //   "--no-zygote",
//     //   //   "--single-process", // optional for some hosts
//     //   //   "--disable-gpu",
//     //   // ],
//     //   args: ["--no-sandbox", "--disable-setuid-sandbox"],
//     // });
//     const browser = await puppeteer.launch({
//       args: ["--no-sandbox", "--disable-setuid-sandbox"],
//     });

//     const page = await browser.newPage();
//     await page.setContent(html);
//     const pdfBuffer = await page.pdf({ format: "A4" });
//     await browser.close();

//     // Send the buffer in base64 so frontend can convert to Blob
//     res.json({ pdf: pdfBuffer.toString("base64") });
//   } catch (error) {
//     console.error("Error generating receipt PDF:", error);
//     res.status(500).json({ message: "Error generating PDF" });
//   }
// };
// export const downloadDonationReceipt = async (req, res) => {
//   const { donation_id } = req.query;

//   if (!donation_id) {
//     return res.status(400).json({ message: "Donation ID is required" });
//   }

//   try {
//     const donation = await Donation.findById(donation_id);
//     if (!donation)
//       return res.status(404).json({ message: "Donation not found" });

//     const user = await User.findById(donation.user_id);
//     const campaign = await DonationCampaign.findById(
//       donation.donation_campaign_id
//     );

//     const donorName = user?.name || "Donor";
//     const donationDate = new Date(donation.createdAt).toLocaleDateString(
//       "en-IN"
//     );
//     const transactionId = donation.transaction_id;
//     const amount = parseFloat(donation.total_amount.toString()).toFixed(2);
//     const notes = donation.notes || "";
//     const campaignName = campaign?.title || "Donation Campaign";

//     const html = `
//       <!DOCTYPE html>
//       <html>
//         <head>
//           <meta charset="utf-8" />
//           <title>Donation Receipt</title>
//           <style>
//             body { font-family: Arial; padding: 20px; background: #f9f9f9; }
//             .container { background: #fff; padding: 20px; border-radius: 10px; max-width: 600px; margin: auto; }
//             h1 { color: #333; }
//           </style>
//         </head>
//         <body>
//           <div class="container">
//             <h1>Donation Receipt</h1>
//             <p><strong>Donor Name:</strong> ${donorName}</p>
//             <p><strong>Date:</strong> ${donationDate}</p>
//             <p><strong>Transaction ID:</strong> ${transactionId}</p>
//             <p><strong>Amount:</strong> ₹${amount}</p>
//             <p><strong>Campaign:</strong> ${campaignName}</p>
//             <p><strong>Notes:</strong> ${notes}</p>
//           </div>
//         </body>
//       </html>
//     `;
//     const browser = await puppeteer.launch({
//       executablePath: "/usr/bin/chromium-browser", // <- system path
//       headless: true,
//       args: [
//         "--no-sandbox",
//         "--disable-setuid-sandbox",
//         "--disable-dev-shm-usage",
//       ],
//     });
//     const page = await browser.newPage();
//     await page.setContent(html);
//     const pdfBuffer = await page.pdf({ format: "A4" });
//     await browser.close();

//     res.set({
//       "Content-Type": "application/pdf",
//       "Content-Disposition": `attachment; filename="donation-receipt-${transactionId}.pdf"`,
//     });

//     res.send(pdfBuffer);
//   } catch (error) {
//     console.error("Error generating receipt PDF:", error);
//     res.status(500).json({ message: "Error generating PDF" });
//   }
// };
// export const downloadDonationReceipt = async (req, res) => {
//   const { donation_id } = req.query;

//   if (!donation_id) {
//     return res.status(400).json({ message: "Donation ID is required" });
//   }

//   try {
//     const donation = await Donation.findById(donation_id);
//     if (!donation)
//       return res.status(404).json({ message: "Donation not found" });

//     const user = await User.findById(donation.user_id);
//     const campaign = await DonationCampaign.findById(
//       donation.donation_campaign_id
//     );

//     const donorName = user?.name || "Donor";
//     const donationDate = new Date(donation.createdAt).toLocaleDateString(
//       "en-IN"
//     );
//     const transactionId = donation.transaction_id;
//     const amount = parseFloat(donation.total_amount.toString()).toFixed(2);
//     const notes = donation.notes || "";
//     const campaignName = campaign?.title || "Donation Campaign";

//     const html = `
//       <!DOCTYPE html>
//       <html>
//         <head>
//           <meta charset="utf-8" />
//           <title>Donation Receipt</title>
//           <style>
//             body { font-family: Arial; padding: 20px; background: #f9f9f9; }
//             .container { background: #fff; padding: 20px; border-radius: 10px; max-width: 600px; margin: auto; }
//             h1 { color: #333; }
//           </style>
//         </head>
//         <body>
//           <div class="container">
//             <h1>Donation Receipt</h1>
//             <p><strong>Donor Name:</strong> ${donorName}</p>
//             <p><strong>Date:</strong> ${donationDate}</p>
//             <p><strong>Transaction ID:</strong> ${transactionId}</p>
//             <p><strong>Amount:</strong> ₹${amount}</p>
//             <p><strong>Campaign:</strong> ${campagitignName}</p>
//             <p><strong>Notes:</strong> ${notes}</p>
//           </div>
//         </body>
//       </html>
//     `;

//     // Puppeteer launch configuration for root access with --no-sandbox
//     const browser = await puppeteer.launch({
//       executablePath: "/usr/bin/chromium-browser", // Ensure this path is correct for your VPS
//       headless: true,
//       args: [
//         "--no-sandbox",
//         "--disable-setuid-sandbox",
//         "--disable-dev-shm-usage",
//         "--disable-gpu",
//       ],
//     });

//     const page = await browser.newPage();
//     await page.setContent(html, { waitUntil: "networkidle0" }); // Ensure full content is loaded
//     const pdfBuffer = await page.pdf({
//       format: "A4",
//       printBackground: true, // Print CSS backgrounds
//     });

//     await browser.close();

//     res.set({
//       "Content-Type": "application/pdf",
//       "Content-Disposition": `attachment; filename="donation-receipt-${transactionId}.pdf"`,
//     });

//     res.send(pdfBuffer);
//   } catch (error) {
//     console.error("Error generating receipt PDF:", error);
//     res.status(500).json({ message: "Error generating PDF" });
//   }
// };

export const downloadDonationReceipt = async (req, res) => {
  const { donation_id } = req.query;

  if (!donation_id) {
    return res.status(400).json({ message: "Donation ID is required" });
  }

  try {
    const donation = await Donation.findById(donation_id);
    if (!donation)
      return res.status(404).json({ message: "Donation not found" });

    const user = await User.findById(donation.user_id);
    const campaign = await DonationCampaign.findById(
      donation.donation_campaign_id
    );

    const donorName = user?.name || "Donor";
    const donationDate = new Date(donation.createdAt).toLocaleDateString(
      "en-IN"
    );
    const transactionId = donation.transaction_id;
    const amount = parseFloat(donation.total_amount.toString()).toFixed(2);
    const notes = donation.notes || "";
    const campaignName = campaign?.title || "Donation Campaign";

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Donation Receipt</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; background: #f9f9f9; }
            .container { background: #fff; padding: 20px; border-radius: 10px; max-width: 600px; margin: auto; }
            h1 { color: #333; }
            p { font-size: 14px; color: #555; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Donation Receipt</h1>
            <p><strong>Donor Name:</strong> ${donorName}</p>
            <p><strong>Date:</strong> ${donationDate}</p>
            <p><strong>Transaction ID:</strong> ${transactionId}</p>
            <p><strong>Amount:</strong> ₹${amount}</p>
            <p><strong>Campaign:</strong> ${campaignName}</p>
            <p><strong>Notes:</strong> ${notes}</p>
          </div>
        </body>
      </html>
    `;

    let file = { content: html };
    let options = { format: "A4" };

    const pdfBuffer = await html_to_pdf.generatePdf(file, options);

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="donation-receipt-${transactionId}.pdf"`,
    });

    res.send(pdfBuffer);
  } catch (error) {
    console.error("Error generating receipt PDF:", error);
    res.status(500).json({ message: "Error generating PDF" });
  }
};
