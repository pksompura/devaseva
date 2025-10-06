import DonationCampaign from "../models/donationCampaign.js";
import { initializeApp } from "firebase/app";
import {
  getStorage,
  ref,
  getDownloadURL,
  uploadBytesResumable,
  deleteObject,
  listAll,
} from "firebase/storage";
import config from "../config/firebase.config.js";
import { v4 as uuidv4 } from "uuid";
import request from "request";
import Category from "../models/donationCategory.js";
import Donation from "../models/donation.js";
import mongoose from "mongoose";
import fs from "fs/promises";
import fsSync from "fs";
// import fsPromises from "fs/promises"; // if you need async methods like await fsPromises.rm
import path from "path";
import generateReceiptPDF from "../utils/generateReceiptPDF.js"; // Adjust path as needed
import upload from "../utils/multerConfig.js";
import { base64ToBuffer } from "../utils/base64Helper.js";
import User from "../models/users.js";

// Initialize Firebase app
initializeApp(config.firebaseConfig);

// Initialize Firebase Cloud Storage
const storage = getStorage();

// // Helper function to convert base64 image to buffer
// const base64ToBuffer = (base64) => {
//   const matches = base64.match(/^data:(.+);base64,(.+)$/);
//   if (!matches || matches.length !== 3) {
//     throw new Error("Invalid base64 string");
//   }
//   return Buffer.from(matches[2], "base64");
// };

// Helper function to upload image to Firebase

const uploadImageToFirebase = async (buffer, fileName, mimetype) => {
  try {
    const storageRef = ref(storage, `campaign_images/${fileName}`);
    const metadata = {
      contentType: mimetype,
    };
    const snapshot = await uploadBytesResumable(storageRef, buffer, metadata);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (err) {
    console.error("Firebase upload error:", err);
    throw new Error("Failed to upload image to Firebase");
  }
};

const uploadImageLocally = async (base64, folderName, fileNamePrefix) => {
  try {
    const { buffer, extension } = base64ToBuffer(base64);

    // Construct directory
    const uploadDir = path.resolve("images", "campaign_images", folderName);
    await fs.mkdir(uploadDir, { recursive: true });

    const fileName = `${fileNamePrefix}.${extension}`;
    const filePath = path.join(uploadDir, fileName);

    await fs.writeFile(filePath, buffer);

    return `/images/campaign_images/${folderName}/${fileName}`;
  } catch (error) {
    console.error("Local upload error:", error);
    throw new Error("Failed to upload image locally");
  }
};

export const deleteImageLocally = async (relativePath) => {
  try {
    // Convert relative URL path to absolute filesystem path
    // Assuming relativePath starts with '/images/...' as returned from upload
    const filePath = path.resolve(".", "." + relativePath);

    // Check if file exists and delete
    if (
      await fs.promises
        .stat(filePath)
        .then(() => true)
        .catch(() => false)
    ) {
      await fs.promises.unlink(filePath);
    }
  } catch (error) {
    console.error("Error deleting local image:", error.message);
  }
};

const sendOTP = (phoneNumber, otp) => {
  const apiKey = process.env.TEXTLOCAL_API_KEY;
  const sender = "TXTLCL";
  const message = `Your OTP is ${otp}`;

  const url = `https://api.textlocal.in/send/?apikey=${apiKey}&numbers=${phoneNumber}&sender=${sender}&message=${encodeURIComponent(
    message
  )}`;

  request(url, function (error, response, body) {
    if (!error && response.statusCode === 200) {
      console.log("OTP sent successfully:", body);
    } else {
      console.error("Failed to send OTP:", error);
    }
  });
};

// API to handle image upload from text editor (ReactQuill)
// export const uploadTextEditorImage = async (req, res) => {
//   try {
//     const { image, campaignId } = req.body;

//     // Ensure that a campaignId is provided for organizational purposes
//     if (!campaignId) {
//       return res.status(400).json({ error: "Campaign ID is required" });
//     }

//     // Convert the base64 image to buffer
//     const buffer = base64ToBuffer(image);

//     // Generate a unique filename for the image and store it in a dedicated folder for the campaign
//     const fileName = `campaign_${campaignId}/text_editor_${uuidv4()}.jpeg`;

//     // Upload the image to Firebase
//     const imageUrl = await uploadImageToFirebase(fileName, "image/jpeg");

//     res.status(200).json({
//       status: true,
//       message: "Image uploaded successfully",
//       imageUrl,
//     });
//   } catch (error) {
//     res.status(400).json({ error: error.message });
//   }
// };

export const uploadTextEditorImage = async (req, res) => {
  try {
    const { image, campaignId } = req.body;

    // Validate input
    if (!campaignId || !image) {
      return res
        .status(400)
        .json({ error: "Campaign ID and image are required" });
    }

    // Convert base64 string to buffer
    const buffer = base64ToBuffer(image);

    // Define subfolder and filename
    const folderName = `campaign_${campaignId}`;
    const fileName = `text_editor_${uuidv4()}.jpeg`;
    const fullPath = path.join(folderName, fileName); // e.g., campaign_123/text_editor_<uuid>.jpeg

    // Save image locally
    const imageUrl = await uploadImageLocally(buffer, fullPath, "image/jpeg");

    res.status(200).json({
      status: true,
      message: "Image uploaded successfully",
      imageUrl, // e.g., /images/campaign_images/campaign_123/text_editor_<uuid>.jpeg
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(400).json({ error: error.message });
  }
};

// // API to remove image from Firebase when deleted from the text editor
// export const deleteTextEditorImage = async (req, res) => {
//   try {
//     const { imageUrl } = req.body;

//     if (!imageUrl) {
//       return res.status(400).json({ error: "Image URL is required" });
//     }

//     // Extract the file path from the imageUrl
//     const filePath = imageUrl
//       .split("/o/")[1]
//       .split("?")[0]
//       .replace(/%2F/g, "/");
//     const imageRef = ref(storage, filePath);

//     // Delete the image from Firebase Storage
//     await deleteObject(imageRef);

//     res.status(200).json({
//       status: true,
//       message: "Image deleted successfully",
//     });
//   } catch (error) {
//     console.error("Error deleting image:", error);
//     res.status(400).json({ error: "Failed to delete image from Firebase" });
//   }
// };

// API to remove image from local storage when deleted from the text editor
export const deleteTextEditorImage = async (req, res) => {
  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: "Image URL is required" });
    }

    // Convert public URL path to absolute server file path
    // Example: /images/campaign_images/campaign_123/text_editor_abc.jpeg
    const relativePath = imageUrl.replace("/images/", ""); // campaign_images/campaign_123/...
    const absolutePath = path.join(process.cwd(), "images", relativePath);

    // Check if file exists before deleting
    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
      res.status(200).json({
        status: true,
        message: "Image deleted successfully",
      });
    } else {
      res.status(404).json({ error: "Image not found" });
    }
  } catch (error) {
    console.error("Error deleting image:", error);
    res
      .status(400)
      .json({ error: "Failed to delete image from local storage" });
  }
};

// // Create a new donation campaign and send OTP
// export const createDonationCampaign = async (req, res) => {
//   try {
//     // Extract `created_by` from the middleware
//     const createdBy = req.user.id;

//     const {
//       main_picture,
//       other_pictures,
//       phone_number,
//       donation_amounts,
//       ...data
//     } = req.body;

//     // Set `created_by` in the campaign data
//     data.created_by = createdBy;
//     // ✅ Normalize donation_amounts to an array
//     if (Array.isArray(donation_amounts)) {
//       data.donation_amounts = donation_amounts;
//     } else if (donation_amounts) {
//       // If it's a single value, wrap it in an array
//       data.donation_amounts = [donation_amounts];
//     } else {
//       // Default to an empty array if not provided
//       data.donation_amounts = [];
//     }

//     // Generate a unique campaign ID upfront
//     const campaignId = uuidv4();

//     let mainPictureUrl = null;
//     const imageUrls = [];

//     // Save main image
//     if (main_picture && typeof main_picture === "string") {
//       const buffer = base64ToBuffer(main_picture);
//       mainPictureUrl = await uploadImageToFirebase(
//         buffer,
//         `campaign_${campaignId}/main_picture.jpeg`,
//         "image/jpeg"
//       );
//       data.main_picture = mainPictureUrl;
//     }

//     // Save other images
//     if (other_pictures && Array.isArray(other_pictures)) {
//       for (let i = 0; i < other_pictures.length; i++) {
//         if (typeof other_pictures[i] === "string") {
//           const buffer = base64ToBuffer(other_pictures[i]);
//           const imageUrl = await uploadImageToFirebase(
//             buffer,
//             `campaign_${campaignId}/other_picture_${i}.jpeg`,
//             "image/jpeg"
//           );
//           imageUrls.push(imageUrl);
//         }
//       }
//       data.other_pictures = imageUrls;
//     }

//     // Generate a random OTP
//     const otp = Math.floor(100000 + Math.random() * 900000); // Generates a 6-digit OTP

//     // Send OTP to user's phone number
//     if (phone_number) {
//       sendOTP(phone_number, otp); // Call the sendOTP function with the entered phone number
//     }

//     // Create the campaign with the gathered data
//     const campaign = new DonationCampaign(data);
//     await campaign.save();

//     res.status(200).json({
//       status: true,
//       message: "Campaign created successfully and OTP sent to user",
//       data: campaign,
//     });
//   } catch (error) {
//     res.status(400).json({ error: error.message });
//   }
// };

// Create a new donation campaign and send OTP
// export const createDonationCampaign = async (req, res) => {
//   try {
//     const createdBy = req.user.id;

//     const {
//       main_picture,
//       other_pictures,
//       phone_number,
//       donation_amounts,
//       ...data
//     } = req.body;

//     data.created_by = createdBy;

//     // Normalize donation_amounts
//     if (Array.isArray(donation_amounts)) {
//       data.donation_amounts = donation_amounts;
//     } else if (donation_amounts) {
//       data.donation_amounts = [donation_amounts];
//     } else {
//       data.donation_amounts = [];
//     }

//     const campaignId = uuidv4();
//     let mainPictureUrl = null;
//     const imageUrls = [];

//     // Save main picture
//     if (main_picture && typeof main_picture === "string") {
//       mainPictureUrl = await uploadImageLocally(
//         main_picture,
//         `campaign_${campaignId}`,
//         "main_picture"
//       );
//       data.main_picture = mainPictureUrl;
//     }
//     // Save other pictures
//     if (other_pictures && Array.isArray(other_pictures)) {
//       for (let i = 0; i < other_pictures.length; i++) {
//         if (typeof other_pictures[i] === "string") {
//           const imageUrl = await uploadImageLocally(
//             other_pictures[i],
//             `campaign_${campaignId}`,
//             `other_picture_${i}`
//           );
//           imageUrls.push(imageUrl);
//         }
//       }
//       data.other_pictures = imageUrls;
//     }

//     // Generate and send OTP
//     const otp = Math.floor(100000 + Math.random() * 900000);
//     if (phone_number) {
//       sendOTP(phone_number, otp);
//     }

//     const campaign = new DonationCampaign(data);
//     await campaign.save();

//     res.status(200).json({
//       status: true,
//       message: "Campaign created successfully and OTP sent to user",
//       data: campaign,
//     });
//   } catch (error) {
//     console.error("Create campaign error:", error);
//     res.status(400).json({ error: error.message });
//   }
// };

export const createDonationCampaign = async (req, res) => {
  try {
    const createdBy = req.user.id;
    const userRole = req.user.role; // e.g., "admin" or "fundraiser"

    const {
      campaign_title,
      short_description,
      campaign_description,
      story,
      main_picture,
      other_pictures,
      beneficiary_type,
      cause_category,
      phone_number,
      terms_agreed,
      target_amount,
      minimum_amount,
      donation_amounts,
      video_link,
      ngo_name,
      beneficiary,
      state,
      category,
    } = req.body;

    // ✅ Validate minimum required fields
    if (!campaign_title || !main_picture || !campaign_description) {
      return res.status(400).json({
        status: false,
        message:
          "Required fields missing: campaign_title, campaign_description, main_picture",
      });
    }

    const campaignId = uuidv4();

    // ✅ Upload main picture
    let mainPictureUrl = null;
    if (typeof main_picture === "string") {
      mainPictureUrl = await uploadImageLocally(
        main_picture,
        `campaign_${campaignId}`,
        "main_picture"
      );
    }

    // ✅ Upload gallery pictures
    let otherPicturesUrls = [];
    if (Array.isArray(other_pictures)) {
      for (let i = 0; i < other_pictures.length; i++) {
        if (typeof other_pictures[i] === "string") {
          const imageUrl = await uploadImageLocally(
            other_pictures[i],
            `campaign_${campaignId}`,
            `other_picture_${i}`
          );
          otherPicturesUrls.push(imageUrl);
        }
      }
    }

    // ✅ Normalize donation_amounts
    let donationAmounts = [];
    if (Array.isArray(donation_amounts)) {
      donationAmounts = donation_amounts;
    } else if (donation_amounts) {
      donationAmounts = [donation_amounts];
    }

    // ✅ If fundraiser added phone, send OTP
    if (userRole !== "admin" && phone_number) {
      const otp = Math.floor(100000 + Math.random() * 900000);
      sendOTP(phone_number, otp);
    }

    // ✅ Create campaign object
    const campaign = new DonationCampaign({
      campaign_title,
      short_description,
      campaign_description,
      story,
      main_picture: mainPictureUrl,
      other_pictures: otherPicturesUrls,
      beneficiary_type,
      cause_category,
      phone_number,
      terms_agreed,
      target_amount,
      minimum_amount,
      donation_amounts: donationAmounts,
      video_link,
      ngo_name,
      beneficiary,
      state,
      category,
      created_by: createdBy,
      is_approved: userRole === "admin", // auto-approve if admin
    });

    await campaign.save();

    res.status(201).json({
      status: true,
      message:
        userRole === "admin"
          ? "Campaign created successfully"
          : "Campaign submitted successfully. Awaiting admin approval.",
      data: campaign,
    });
  } catch (error) {
    console.error("Create campaign error:", error);
    res.status(500).json({
      status: false,
      message: "Error creating campaign: " + error.message,
    });
  }
};
// Get a single donation campaign by ID
// export const getDonationCampaignById = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const campaign = await DonationCampaign.findById(id).populate('category');

//     if (!campaign) {
//       return res.status(404).json({ status: false, message: 'Donation campaign not found', data: null });
//     }

//     res.status(200).json({
//       status: true,
//       message: 'Campaign fetched successfully',
//       data: { campaign, category: campaign.category },
//     });
//   } catch (error) {
//     res.status(400).json({ status: false, message: error.message, data: null });
//   }
// };

export const getDonationCampaignById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ status: false, message: "Invalid campaign ID", data: null });
    }

    const campaign = await DonationCampaign.findById(id);

    if (!campaign) {
      return res.status(404).json({
        status: false,
        message: "Donation campaign not found",
        data: null,
      });
    }

    // Fetch all donations related to this campaign with donor info
    const donations = await Donation.find({
      donation_campaign_id: id,
      paid: true,
    })
      .populate("user_id", "full_name email") // Select donor fields you want (e.g., name, email)
      .lean();
    res.status(200).json({
      status: true,
      message: "Campaign and donors fetched successfully",
      data: {
        campaign,
        donors: donations.map((donation) => ({
          donor: donation.user_id,
          amount: donation.total_amount.toString(),
          transaction_id: donation.transaction_id,
          donated_date: donation.donated_date,
          payment_method: donation.payment_method,
        })),
      },
    });
  } catch (error) {
    res.status(400).json({ status: false, message: error.message, data: null });
  }
};

// Update donation details with PAN and address
export const updateDonationDetails = async (req, res) => {
  const { donationId } = req.params;
  const { pan_number, full_address } = req.body;

  try {
    // Find the donation by ID
    // const donation = await Donation.findById(donationId);
    const donation = await Donation.findById(donationId)
      .populate("donation_campaign_id")
      .populate("user_id");

    if (!donation) {
      return res
        .status(404)
        .json({ status: false, message: "Donation not found", data: null });
    }

    // Check if PAN and address are provided
    if (pan_number) {
      // Validate the PAN number format
      if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan_number)) {
        return res.status(400).json({
          status: false,
          message: "Invalid PAN number format.",
        });
      }
      donation.pan_number = pan_number;
    }

    if (full_address) {
      donation.full_address = full_address;
    }

    // If PAN and address are both provided, update the issued_80g status
    if (pan_number && full_address) {
      donation.issued_80g = true; // Mark the 80G certificate as issued
    }
    // Save the updated donation record
    await donation.save();

    // ✅ Re-generate receipt PDF with updated info
    const receiptFileName = `receipt_${
      donation.transaction_id || donation._id
    }.pdf`;
    const receiptPath = await generateReceiptPDF(
      donation,
      donation.user_id,
      receiptFileName
    );
    //   // ✅ Optionally update receipt_url
    // donation.receipt_url = `/receipts/${receiptFileName}`;
    // await donation.save();

    res.status(200).json({
      status: true,
      message: "Form 80-G updated successfully",
      data: donation,
    });
  } catch (error) {
    res.status(400).json({ status: false, message: error.message, data: null });
  }
};

// // Helper function to read PDF file buffer by transaction_id
// export async function getReceiptPdfByTransactionId(transaction_id) {
//   const filePath = path.resolve(`./receipts/receipt_${transaction_id}.pdf`);

//   try {
//     const pdfData = await fs.readFile(filePath);
//     return pdfData;
//   } catch (err) {
//     console.error("PDF file not found for transaction:", transaction_id);
//     return null;
//   }
// }

// // Controller handler for route: GET /donations/receipt/:transaction_id
// export async function downloadDonationReceipt(req, res) {
//   const { transaction_id } = req.params;

//   try {
//     const pdfBuffer = await getReceiptPdfByTransactionId(transaction_id);

//     if (!pdfBuffer) {
//       return res.status(404).json({ message: "Receipt not found!" });
//     }

//     res.set({
//       "Content-Type": "application/pdf",
//       "Content-Disposition": `attachment; filename=receipt_${transaction_id}.pdf`,
//       "Content-Length": pdfBuffer.length,
//     });

//     return res.send(pdfBuffer);
//   } catch (error) {
//     console.error("Error fetching receipt PDF:", error);
//     return res.status(500).json({ message: "Failed to fetch receipt." });
//   }
// }

export async function downloadDonationReceipt(req, res) {
  const { transaction_id } = req.params;
  const filePath = path.resolve(`./receipts/receipt_${transaction_id}.pdf`);

  try {
    const pdfBuffer = await fs.readFile(filePath);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=receipt_${transaction_id}.pdf`
    );
    res.setHeader("Content-Length", pdfBuffer.length);

    return res.end(pdfBuffer);
  } catch (error) {
    console.error("Error sending receipt PDF:", error);
    return res.status(404).json({ message: "Receipt not found!" });
  }
}

// List all donation campaigns with pagination
// export const listDonationCampaigns = async (req, res) => {
//   const page = parseInt(req.query.page) || 1;
//   const perPage = parseInt(req.query.perPage) || 10;

//   try {
//     // Fetch only approved campaigns by adding a filter for `is_approved: true`
//     const count = await DonationCampaign.countDocuments();
//     const campaigns = await DonationCampaign.find().sort({ createdAt: -1 })

//     // Filter for approved campaigns
//       // .limit(perPage)
//       // .skip((page - 1) * perPage);

//     const totalPages = Math.ceil(count / perPage);

//     res.status(200).json({
//       campaigns,
//       currentPage: page,
//       totalPages,
//       totalItems: count,
//     });
//   } catch (error) {
//     res.status(400).json({ error: error.message });
//   }
// };
export const listDonationCampaigns = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const perPage = parseInt(req.query.perPage) || 10;

  try {
    // Fetch total count of campaigns
    const count = await DonationCampaign.countDocuments();

    // Get paginated campaigns (if needed, uncomment limit & skip)
    const campaigns = await DonationCampaign.find().sort({ createdAt: -1 });
    // .limit(perPage)
    // .skip((page - 1) * perPage);

    const totalPages = Math.ceil(count / perPage);

    // ✅ Get successful donation count grouped by campaign
    const successfulDonationCounts = await Donation.aggregate([
      {
        $match: {
          payment_status: "successful",
        },
      },
      {
        $group: {
          _id: "$donation_campaign_id",
          successfulDonations: { $sum: 1 },
        },
      },
    ]);

    // Convert aggregation result into a lookup map
    const donationCountMap = {};
    successfulDonationCounts.forEach((item) => {
      donationCountMap[item._id.toString()] = item.successfulDonations;
    });

    // Attach successful donation count to each campaign
    const campaignsWithDonationCounts = campaigns.map((campaign) => {
      const campaignId = campaign._id.toString();
      return {
        ...campaign.toObject(),
        successfulDonations: donationCountMap[campaignId] || 0,
      };
    });

    res.status(200).json({
      campaigns: campaignsWithDonationCounts,
      currentPage: page,
      totalPages,
      totalItems: count,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// ✅ Get only Fundraiser campaigns (created by users, not admins)
export const getFundraiserCampaigns = async (req, res) => {
  try {
    // 1️⃣ Get all campaigns and populate created_by
    const campaigns = await DonationCampaign.find({}).populate(
      "created_by",
      "full_name email mobile_number role"
    );

    // 2️⃣ Filter only user-created campaigns
    const fundraiserCampaigns = campaigns.filter(
      (c) => c.created_by && c.created_by.role === "user"
    );

    res.status(200).json({ campaigns: fundraiserCampaigns });
  } catch (error) {
    console.error("Error fetching fundraiser campaigns:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const listDonationCampaignsFalse = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const perPage = parseInt(req.query.perPage) || 10;

  try {
    // Fetch only approved campaigns by adding a filter for `is_approved: true`
    const count = await DonationCampaign.countDocuments({
      is_approved: false,
    }).populate("User_donation");
    const campaigns = await DonationCampaign.find({ is_approved: false }) // Filter for approved campaigns
      .limit(perPage)
      .skip((page - 1) * perPage);

    const totalPages = Math.ceil(count / perPage);

    res.status(200).json({
      campaigns,
      currentPage: page,
      totalPages,
      totalItems: count,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// // Update a donation campaign by ID
// export const updateDonationCampaign = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { body: data } = req;

//     const campaign = await DonationCampaign.findById(id);

//     if (!campaign) {
//       return res.status(404).json({ error: "Campaign not found" });
//     }

//     let mainPictureUrl = campaign.main_picture;
//     const updatedImageUrls = [];

//     // Handle the main picture update
//     if (req.body.main_picture) {
//       if (/^data:image\/[a-zA-Z]+;base64,/.test(req.body.main_picture)) {
//         // Delete the old main picture from Firebase
//         if (
//           campaign.main_picture &&
//           campaign.main_picture.startsWith("https://")
//         ) {
//           const mainPicRef = ref(storage, campaign.main_picture);
//           try {
//             await deleteObject(mainPicRef);
//           } catch (err) {
//             console.error(
//               "Failed to delete old main picture from Firebase:",
//               err
//             );
//           }
//         }

//         // Upload the new base64 image
//         const buffer = base64ToBuffer(req.body.main_picture);
//         mainPictureUrl = await uploadImageToFirebase(
//           buffer,
//           `campaign_${id}_main`,
//           "image/jpeg"
//         );
//         data.main_picture = mainPictureUrl; // Store the full Firebase URL
//       } else {
//         // If a URL is provided, ensure that the full URL is stored correctly
//         if (req.body.main_picture.startsWith("https://")) {
//           data.main_picture = req.body.main_picture; // Retain the provided URL if it's a valid one
//         } else {
//           console.error("Invalid main picture URL provided");
//           return res.status(400).json({ error: "Invalid main picture URL" });
//         }
//       }
//     }

//     // Handle other pictures
//     if (req.body.other_pictures && Array.isArray(req.body.other_pictures)) {
//       const newOtherPictures = [];
//       const existingUrls = [];

//       for (let i = 0; i < req.body.other_pictures.length; i++) {
//         const picture = req.body.other_pictures[i];

//         // If it's a base64 image, upload it to Firebase
//         if (/^data:image\/[a-zA-Z]+;base64,/.test(picture)) {
//           const buffer = base64ToBuffer(picture);
//           const uploadedUrl = await uploadImageToFirebase(
//             buffer,
//             `campaign_${id}_other_${i}`,
//             "image/jpeg"
//           );
//           newOtherPictures.push(uploadedUrl);
//         } else {
//           // If it's an existing URL, retain it
//           existingUrls.push(picture);
//         }
//       }

//       // Delete any pictures that are not in the updated URL list
//       const oldPictures = campaign.other_pictures || [];
//       await Promise.all(
//         oldPictures.map(async (oldPic) => {
//           if (!existingUrls.includes(oldPic)) {
//             const picRef = ref(storage, oldPic);
//             try {
//               await deleteObject(picRef);
//             } catch (err) {
//               console.error("Failed to delete old picture from Firebase:", err);
//             }
//           }
//         })
//       );

//       // Combine new uploaded images and existing ones
//       data.other_pictures = [...existingUrls, ...newOtherPictures];
//     } else {
//       // If no other_pictures are sent, delete all existing ones
//       await Promise.all(
//         campaign.other_pictures.map(async (pic) => {
//           const picRef = ref(storage, pic);
//           try {
//             await deleteObject(picRef);
//           } catch (err) {
//             console.error("Failed to delete old picture from Firebase:", err);
//           }
//         })
//       );
//       data.other_pictures = [];
//     }

//     // Apply the updates to the campaign
//     Object.assign(campaign, data);
//     await campaign.save();

//     res.status(200).json({
//       status: true,
//       message: "Campaign updated successfully",
//       data: campaign,
//     });
//   } catch (error) {
//     res.status(400).json({ error: error.message });
//   }
// };

// // Update a donation campaign by ID
// export const updateDonationCampaign = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { body: data } = req;

//     const campaign = await DonationCampaign.findById(id);
//     if (!campaign) {
//       return res.status(404).json({ error: "Campaign not found" });
//     }

//     let mainPictureUrl = campaign.main_picture;
//     const updatedImageUrls = [];

//     // Update main picture
//     if (req.body.main_picture) {
//       if (/^data:image\/[a-zA-Z]+;base64,/.test(req.body.main_picture)) {
//         const buffer = base64ToBuffer(req.body.main_picture);
//         mainPictureUrl = await uploadImageLocally(
//           buffer,
//           `campaign_${id}/main_picture.jpeg`,
//           "image/jpeg"
//         );
//         data.main_picture = mainPictureUrl;
//       } else if (req.body.main_picture.startsWith("/images/")) {
//         data.main_picture = req.body.main_picture; // Accept local path if already stored
//       } else {
//         return res.status(400).json({ error: "Invalid main picture format" });
//       }
//     }

//     // Update other pictures
//     if (req.body.other_pictures && Array.isArray(req.body.other_pictures)) {
//       const newOtherPictures = [];
//       const existingUrls = [];

//       for (let i = 0; i < req.body.other_pictures.length; i++) {
//         const picture = req.body.other_pictures[i];

//         if (/^data:image\/[a-zA-Z]+;base64,/.test(picture)) {
//           const buffer = base64ToBuffer(picture);
//           const uploadedUrl = await uploadImageLocally(
//             buffer,
//             `campaign_${id}/other_picture_${i}.jpeg`,
//             "image/jpeg"
//           );
//           newOtherPictures.push(uploadedUrl);
//         } else if (picture.startsWith("/images/")) {
//           existingUrls.push(picture);
//         }
//       }

//       // Merge existing and newly uploaded images
//       data.other_pictures = [...existingUrls, ...newOtherPictures];

//       // Optionally delete unreferenced local images (if needed)
//       const oldPictures = campaign.other_pictures || [];
//       const toDelete = oldPictures.filter(
//         (pic) => !data.other_pictures.includes(pic)
//       );

//       for (const pic of toDelete) {
//         const filePath = path.resolve(`.${pic}`);
//         if (fs.existsSync(filePath)) {
//           fs.unlink(filePath, (err) => {
//             if (err) console.error("Failed to delete old image:", err);
//           });
//         }
//       }
//     } else {
//       // If no other_pictures provided, delete all old images
//       const oldPictures = campaign.other_pictures || [];
//       for (const pic of oldPictures) {
//         const filePath = path.resolve(`.${pic}`);
//         if (fs.existsSync(filePath)) {
//           fs.unlink(filePath, (err) => {
//             if (err) console.error("Failed to delete image:", err);
//           });
//         }
//       }
//       data.other_pictures = [];
//     }

//     // Update the campaign with new data
//     Object.assign(campaign, data);
//     await campaign.save();

//     res.status(200).json({
//       status: true,
//       message: "Campaign updated successfully",
//       data: campaign,
//     });
//   } catch (error) {
//     console.error("Update error:", error);
//     res.status(400).json({ error: error.message });
//   }
// };

export const updateDonationCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const { body: data } = req;

    const campaign = await DonationCampaign.findById(id);
    if (!campaign) {
      return res.status(404).json({ error: "Campaign not found" });
    }

    let mainPictureUrl = campaign.main_picture;

    // Handle main_picture
    if (req.body.main_picture) {
      if (/^data:image\/[a-zA-Z]+;base64,/.test(req.body.main_picture)) {
        // Correctly pass base64 string
        mainPictureUrl = await uploadImageLocally(
          req.body.main_picture,
          `campaign_${id}`,
          "main_picture"
        );
        data.main_picture = mainPictureUrl;
      } else if (req.body.main_picture.startsWith("/images/")) {
        data.main_picture = req.body.main_picture;
      } else {
        return res.status(400).json({ error: "Invalid main picture format" });
      }
    }

    // Handle other_pictures
    if (req.body.other_pictures && Array.isArray(req.body.other_pictures)) {
      const newOtherPictures = [];
      const existingUrls = [];

      for (let i = 0; i < req.body.other_pictures.length; i++) {
        const picture = req.body.other_pictures[i];

        if (/^data:image\/[a-zA-Z]+;base64,/.test(picture)) {
          const uploadedUrl = await uploadImageLocally(
            picture,
            `campaign_${id}`,
            `other_picture_${i}`
          );
          newOtherPictures.push(uploadedUrl);
        } else if (picture.startsWith("/images/")) {
          existingUrls.push(picture);
        }
      }

      data.other_pictures = [...existingUrls, ...newOtherPictures];

      // Remove unused old images
      const oldPictures = campaign.other_pictures || [];
      const toDelete = oldPictures.filter(
        (pic) => !data.other_pictures.includes(pic)
      );

      for (const pic of toDelete) {
        const filePath = path.resolve(`.${pic}`);
        try {
          await fs.promises.unlink(filePath);
        } catch (err) {
          console.error("Failed to delete old image:", err);
        }
      }
    } else {
      // If no new images provided, clear old ones
      const oldPictures = campaign.other_pictures || [];
      for (const pic of oldPictures) {
        const filePath = path.resolve(`.${pic}`);
        try {
          await fs.promises.unlink(filePath);
        } catch (err) {
          console.error("Failed to delete image:", err);
        }
      }
      data.other_pictures = [];
    }

    // Update the document
    Object.assign(campaign, data);
    await campaign.save();

    res.status(200).json({
      status: true,
      message: "Campaign updated successfully",
      data: campaign,
    });
  } catch (error) {
    console.error("Update error:", error);
    res.status(400).json({ error: error.message });
  }
};

// // Delete a donation campaign by ID
// export const deleteDonationCampaign = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const campaign = await DonationCampaign.findById(id);

//     if (!campaign) {
//       return res.status(404).json({ error: "Donation campaign not found" });
//     }

//     // Delete main picture
//     if (campaign.main_picture) {
//       const mainPicRef = ref(storage, campaign.main_picture);
//       try {
//         await deleteObject(mainPicRef);
//       } catch (err) {
//         console.error("Failed to delete main picture from Firebase:", err);
//       }
//     }

//     // Delete other pictures
//     if (campaign.other_pictures) {
//       await Promise.all(
//         campaign.other_pictures.map(async (pic) => {
//           const picRef = ref(storage, pic);
//           try {
//             await deleteObject(picRef);
//           } catch (err) {
//             console.error("Failed to delete picture from Firebase:", err);
//           }
//         })
//       );
//     }

//     await DonationCampaign.findByIdAndDelete(id);

//     res.status(200).json({
//       status: true,
//       message: "Donation campaign deleted successfully",
//     });
//   } catch (error) {
//     res.status(400).json({ error: error.message });
//   }
// };

// Delete a donation campaign by ID
export const deleteDonationCampaign = async (req, res) => {
  try {
    const { id } = req.params;

    const campaign = await DonationCampaign.findById(id);
    if (!campaign) {
      return res.status(404).json({ error: "Donation campaign not found" });
    }

    // Delete main picture if exists
    if (campaign.main_picture && campaign.main_picture.startsWith("/images/")) {
      const mainPicPath = path.resolve(`.${campaign.main_picture}`);
      if (fsSync.existsSync(mainPicPath)) {
        fsSync.unlinkSync(mainPicPath, (err) => {
          if (err) console.error("Failed to delete main picture:", err);
        });
      }
    }

    // Delete other pictures
    if (campaign.other_pictures && Array.isArray(campaign.other_pictures)) {
      for (const pic of campaign.other_pictures) {
        if (pic.startsWith("/images/")) {
          const picPath = path.resolve(`.${pic}`);
          if (fsSync.existsSync(picPath)) {
            fsSync.unlinkSync(picPath, (err) => {
              if (err) console.error("Failed to delete other picture:", err);
            });
          }
        }
      }
    }

    // Optional: delete the entire campaign folder (e.g., `images/campaign_images/campaign_<id>`)
    const campaignFolder = path.resolve(
      "images",
      "campaign_images",
      `campaign_${id}`
    );
    if (fsSync.existsSync(campaignFolder)) {
      fsSync.rmSync(campaignFolder, { recursive: true, force: true });
    }

    // Delete campaign from DB
    await DonationCampaign.findByIdAndDelete(id);

    res.status(200).json({
      status: true,
      message: "Donation campaign deleted successfully",
    });
  } catch (error) {
    console.error("Deletion error:", error);
    res.status(400).json({ error: error.message });
  }
};

export const getCampaignsByCategoryWithSearch = async (req, res) => {
  try {
    const { category } = req.params;
    const { search } = req.query;
    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.perPage) || 10;

    // Initialize the query object
    const query = {};

    // Only apply the category filter if it's not 'All'
    if (category && category !== "All") {
      // Use category as ObjectId directly in the query
      query.category = category;
    }

    // Apply the search filter if a search term is provided
    if (search && search.trim() !== "") {
      query.$or = [
        { campaign_title: { $regex: search, $options: "i" } }, // Case-insensitive search on campaign_title
        { ngo_name: { $regex: search, $options: "i" } }, // Case-insensitive search on ngo_name
        { title: { $regex: search, $options: "i" } }, // Case-insensitive search on title
        { organization: { $regex: search, $options: "i" } }, // Case-insensitive search on organization
      ];
    }

    // Count total campaigns that match the query
    const totalCampaigns = await DonationCampaign.countDocuments(query);
    const successfulDonationCounts = await Donation.aggregate([
      {
        $match: {
          payment_status: "successful",
        },
      },
      {
        $group: {
          _id: "$donation_campaign_id",
          successfulDonations: { $sum: 1 },
        },
      },
    ]);
    // Fetch the campaigns with pagination and optional search & category filter
    const campaigns = await DonationCampaign.find(query)
      .populate("category")
      .skip((page - 1) * perPage)
      .limit(perPage)
      .exec();

    // If no campaigns found, send a 404 response
    if (!campaigns.length) {
      return res.status(404).json({
        status: false,
        message: `No campaigns found for the category: ${
          category || "All"
        } with search term: ${search || ""}`,
        data: null,
      });
    }

    // Return success response with campaigns data
    res.status(200).json({
      status: true,
      message: "Campaigns fetched successfully",
      data: {
        campaigns,
        totalCampaigns,
        donarsCount: successfulDonationCounts,
        currentPage: page,
        totalPages: Math.ceil(totalCampaigns / perPage),
        perPage,
      },
    });
  } catch (error) {
    // Handle errors and send a 400 response with the error message
    res.status(400).json({ status: false, message: error.message, data: null });
  }
};

// export const createCampaignWithLimitedFields = async (req, res) => {
//   try {
//     // Destructure only the required fields from the request body
//     console.log(req.user);
//     const {
//       campaign_title,
//       short_description,
//       main_picture,
//       other_pictures,
//       campaign_description,
//       story,
//     } = req.body;

//     // Validate required fields
//     if (
//       !campaign_title ||
//       !short_description ||
//       !main_picture ||
//       !campaign_description
//     ) {
//       return res.status(400).json({
//         status: false,
//         message:
//           "Please provide all required fields: campaign_title, short_description, main_picture, and campaign_description.",
//       });
//     }

//     // Generate a unique campaign ID
//     const campaignId = uuidv4();

//     // Handle main picture upload
//     let mainPictureUrl = null;
//     if (
//       typeof main_picture === "string" &&
//       /^data:image\/[a-zA-Z]+;base64,/.test(main_picture)
//     ) {
//       const buffer = base64ToBuffer(main_picture); // Convert base64 to buffer
//       mainPictureUrl = await uploadImageToFirebase(
//         buffer,
//         `campaign_${campaignId}/main_picture.jpeg`,
//         "image/jpeg"
//       );
//     }

//     // Handle other pictures upload
//     let otherPicturesUrls = [];
//     if (Array.isArray(other_pictures)) {
//       for (let i = 0; i < other_pictures.length; i++) {
//         const picture = other_pictures[i];
//         if (
//           typeof picture === "string" &&
//           /^data:image\/[a-zA-Z]+;base64,/.test(picture)
//         ) {
//           const buffer = base64ToBuffer(picture);
//           const imageUrl = await uploadImageToFirebase(
//             buffer,
//             `campaign_${campaignId}/other_picture_${i}.jpeg`,
//             "image/jpeg"
//           );
//           otherPicturesUrls.push(imageUrl);
//         }
//       }
//     }

//     // Create the new campaign object
//     const newCampaign = new DonationCampaign({
//       campaign_title,
//       short_description,
//       campaign_description,
//       story,
//       main_picture: mainPictureUrl,
//       other_pictures: otherPicturesUrls,
//       created_by: req.user.id,
//     });

//     // Save the campaign to the database
//     await newCampaign.save();

//     // Return success response
//     res.status(201).json({
//       status: true,
//       message: "Campaign created successfully",
//       data: newCampaign,
//     });
//   } catch (error) {
//     // Handle any errors during the process
//     res.status(500).json({
//       status: false,
//       message: "Error creating campaign: " + error.message,
//     });
//   }
// };

export const createCampaignWithLimitedFields = async (req, res) => {
  try {
    const {
      campaign_title,
      main_picture,
      other_pictures = [],
      story,
      beneficiary_type,
      beneficiary,
      location,
      target_amount,
      terms_agreed,
      category,
      dynamic_fields = {}, // ✅ accept flexible dynamic fields
    } = req.body;

    if (!campaign_title || !main_picture || !story) {
      return res.status(400).json({
        status: false,
        message:
          "Please provide all required fields: campaign_title, main_picture, and story.",
      });
    }

    const campaignId = uuidv4();

    // ✅ Upload main picture
    let mainPictureUrl = null;
    if (typeof main_picture === "string") {
      mainPictureUrl = await uploadImageLocally(
        main_picture,
        `campaign_${campaignId}`,
        "main_picture"
      );
    }

    // ✅ Upload other pictures
    let otherPicturesUrls = [];
    for (let i = 0; i < other_pictures.length; i++) {
      if (typeof other_pictures[i] === "string") {
        const imageUrl = await uploadImageLocally(
          other_pictures[i],
          `campaign_${campaignId}`,
          `other_picture_${i}`
        );
        otherPicturesUrls.push(imageUrl);
      }
    }

    // ✅ Create campaign object
    const newCampaign = new DonationCampaign({
      campaign_title,
      campaign_description: story,
      story,
      main_picture: mainPictureUrl,
      other_pictures: otherPicturesUrls,
      beneficiary_type,
      beneficiary,
      state: location,
      target_amount,
      terms_agreed,
      category,
      dynamic_fields, // ✅ save all extra fields
      created_by: req.user.id,
      hidden: true,
      is_approved: false,
    });

    await newCampaign.save();

    res.status(201).json({
      status: true,
      message: "Fundraiser campaign submitted successfully",
      data: newCampaign,
    });
  } catch (error) {
    console.error("Fundraiser campaign error:", error);
    res.status(500).json({
      status: false,
      message: "Error creating campaign: " + error.message,
    });
  }
};

// export const updateCampaignWithLimitedFields = async (req, res) => {
//   try {
//     const { id } = req.body; // Get campaign ID from request body
//     const {
//       campaign_title,
//       short_description,
//       main_picture,
//       other_pictures,
//       campaign_description,
//       story,
//     } = req.body;

//     // Validate required fields
//     if (
//       !campaign_title ||
//       !short_description ||
//       !main_picture ||
//       !campaign_description
//     ) {
//       return res.status(400).json({
//         status: false,
//         message:
//           "Please provide all required fields: campaign_title, short_description, main_picture, and campaign_description.",
//       });
//     }

//     // Find the campaign by ID
//     const campaign = await DonationCampaign.findById(id);
//     if (!campaign) {
//       return res.status(404).json({
//         status: false,
//         message: "Campaign not found",
//       });
//     }

//     // Update text fields
//     campaign.campaign_title = campaign_title;
//     campaign.short_description = short_description;
//     campaign.campaign_description = campaign_description;
//     campaign.story = story;

//     // Handle main picture update
//     if (main_picture && /^data:image\/[a-zA-Z]+;base64,/.test(main_picture)) {
//       // Delete old main picture from Firebase if it exists
//       if (
//         campaign.main_picture &&
//         campaign.main_picture.startsWith("https://")
//       ) {
//         const mainPicRef = ref(storage, campaign.main_picture);
//         try {
//           await deleteObject(mainPicRef);
//         } catch (err) {
//           console.error(
//             "Failed to delete old main picture from Firebase:",
//             err
//           );
//         }
//       }

//       // Upload the new base64 main picture
//       const buffer = base64ToBuffer(main_picture);
//       const newMainPictureUrl = await uploadImageToFirebase(
//         buffer,
//         `campaign_${id}/main_picture.jpeg`,
//         "image/jpeg"
//       );
//       campaign.main_picture = newMainPictureUrl; // Store the Firebase URL
//     } else if (main_picture.startsWith("https://")) {
//       // Retain existing Firebase URL for main picture
//       campaign.main_picture = main_picture;
//     } else {
//       return res
//         .status(400)
//         .json({ error: "Invalid main picture URL provided" });
//     }

//     // Handle other pictures update
//     const existingUrls = other_pictures.filter((picture) =>
//       picture.startsWith("https://")
//     ); // Retain only URLs
//     const newOtherPictures = [];

//     // Loop through other pictures to handle base64 images
//     for (let i = 0; i < other_pictures.length; i++) {
//       const picture = other_pictures[i];
//       if (/^data:image\/[a-zA-Z]+;base64,/.test(picture)) {
//         // Convert base64 to buffer and upload to Firebase
//         const buffer = base64ToBuffer(picture);
//         const uploadedUrl = await uploadImageToFirebase(
//           buffer,
//           `campaign_${id}/other_picture_${i}.jpeg`,
//           "image/jpeg"
//         );
//         newOtherPictures.push(uploadedUrl); // Store Firebase URL in the new list
//       }
//     }

//     // Delete any old pictures that are not in the updated URL list
//     const oldPictures = campaign.other_pictures || [];
//     await Promise.all(
//       oldPictures.map(async (oldPic) => {
//         if (!existingUrls.includes(oldPic)) {
//           const picRef = ref(storage, oldPic);
//           try {
//             await deleteObject(picRef); // Delete old pictures from Firebase
//           } catch (err) {
//             console.error("Failed to delete old picture from Firebase:", err);
//           }
//         }
//       })
//     );

//     // Combine existing URLs and newly uploaded URLs for other pictures
//     campaign.other_pictures = [...existingUrls, ...newOtherPictures];

//     // Save the updated campaign
//     await campaign.save();

//     // Return success response
//     res.status(200).json({
//       status: true,
//       message: "Campaign updated successfully",
//       data: campaign,
//     });
//   } catch (error) {
//     // Handle errors during the update process
//     res.status(500).json({
//       status: false,
//       message: "Error updating campaign: " + error.message,
//     });
//   }
// };

export const updateCampaignWithLimitedFields = async (req, res) => {
  try {
    const { id } = req.body; // campaign id comes in body (from fundraiser form)
    if (!id) {
      return res
        .status(400)
        .json({ status: false, message: "Missing campaign ID" });
    }

    const campaign = await DonationCampaign.findById(id);
    if (!campaign) {
      return res
        .status(404)
        .json({ status: false, message: "Campaign not found" });
    }

    const data = { ...req.body };
    let mainPictureUrl = campaign.main_picture;

    // ✅ Handle main_picture
    if (data.main_picture) {
      if (/^data:image\/[a-zA-Z]+;base64,/.test(data.main_picture)) {
        mainPictureUrl = await uploadImageLocally(
          data.main_picture,
          `campaign_${id}`,
          "main_picture"
        );
        data.main_picture = mainPictureUrl;
      } else if (data.main_picture.startsWith("/images/")) {
        data.main_picture = data.main_picture; // keep existing
      } else {
        return res
          .status(400)
          .json({ status: false, message: "Invalid main picture format" });
      }
    }

    // ✅ Handle other_pictures
    if (data.other_pictures && Array.isArray(data.other_pictures)) {
      const newOtherPictures = [];
      const existingUrls = [];

      for (let i = 0; i < data.other_pictures.length; i++) {
        const picture = data.other_pictures[i];

        if (/^data:image\/[a-zA-Z]+;base64,/.test(picture)) {
          const uploadedUrl = await uploadImageLocally(
            picture,
            `campaign_${id}`,
            `other_picture_${i}`
          );
          newOtherPictures.push(uploadedUrl);
        } else if (picture.startsWith("/images/")) {
          existingUrls.push(picture);
        }
      }

      data.other_pictures = [...existingUrls, ...newOtherPictures];

      // Remove unused old images
      const oldPictures = campaign.other_pictures || [];
      const toDelete = oldPictures.filter(
        (pic) => !data.other_pictures.includes(pic)
      );

      for (const pic of toDelete) {
        const filePath = path.resolve(`.${pic}`);
        try {
          await fs.promises.unlink(filePath);
        } catch (err) {
          console.error("Failed to delete old image:", err);
        }
      }
    }

    // ✅ Required fields validation (limited fields only)
    if (!data.campaign_title || !data.campaign_description) {
      return res.status(400).json({
        status: false,
        message:
          "Missing required fields: campaign_title or campaign_description",
      });
    }

    // ✅ Assign allowed fields
    Object.assign(campaign, {
      campaign_title: data.campaign_title,
      short_description: data.short_description || campaign.short_description,
      campaign_description: data.campaign_description,
      story: data.story || campaign.story,
      beneficiary_type: data.beneficiary_type || campaign.beneficiary_type,
      beneficiary: data.beneficiary || campaign.beneficiary,
      state: data.location || campaign.state,
      target_amount: data.target_amount || campaign.target_amount,
      category: data.category || campaign.category,
      main_picture: data.main_picture || campaign.main_picture,
      other_pictures: data.other_pictures || campaign.other_pictures,
      dynamic_fields: data.dynamic_fields || campaign.dynamic_fields, // ✅ allow dynamic fields update
    });

    await campaign.save();

    res.status(200).json({
      status: true,
      message: "Campaign updated successfully",
      data: campaign,
    });
  } catch (error) {
    console.error("Update campaign error:", error);
    res.status(500).json({ status: false, message: error.message });
  }
};

// export const updateCampaignWithLimitedFields = async (req, res) => {
//   try {
//     const { id } = req.body; // Get campaign ID from request body
//     const {
//       campaign_title,
//       short_description,
//       main_picture,
//       other_pictures,
//       campaign_description,
//       story,
//     } = req.body;

//     // Validate required fields
//     if (
//       !campaign_title ||
//       !short_description ||
//       !main_picture ||
//       !campaign_description
//     ) {
//       return res.status(400).json({
//         status: false,
//         message:
//           "Please provide all required fields: campaign_title, short_description, main_picture, and campaign_description.",
//       });
//     }

//     // Find the campaign by ID
//     const campaign = await DonationCampaign.findById(id);
//     if (!campaign) {
//       return res.status(404).json({
//         status: false,
//         message: "Campaign not found",
//       });
//     }

//     // Update text fields
//     campaign.campaign_title = campaign_title;
//     campaign.short_description = short_description;
//     campaign.campaign_description = campaign_description;
//     campaign.story = story;

//     // Handle main picture update
//     if (main_picture && /^data:image\/[a-zA-Z]+;base64,/.test(main_picture)) {
//       // Delete old main picture locally if it exists and is a relative path (not URL)
//       if (
//         campaign.main_picture &&
//         !campaign.main_picture.startsWith("http") &&
//         campaign.main_picture.startsWith("/images/")
//       ) {
//         await deleteImageLocally(campaign.main_picture);
//       }

//       // Upload new base64 main picture locally
//       const buffer = base64ToBuffer(main_picture);
//       const fileName = `campaign_${id}_main_picture.jpeg`;
//       const newMainPictureUrl = await uploadImageLocally(buffer, fileName);
//       campaign.main_picture = newMainPictureUrl;
//     } else if (
//       typeof main_picture === "string" &&
//       main_picture.startsWith("/images/")
//     ) {
//       // Retain existing local path for main picture
//       campaign.main_picture = main_picture;
//     } else {
//       return res
//         .status(400)
//         .json({ error: "Invalid main picture URL provided" });
//     }

//     // Handle other pictures update
//     const existingUrls = (other_pictures || []).filter(
//       (pic) => typeof pic === "string" && pic.startsWith("/images/")
//     ); // Retain only local paths
//     const newOtherPictures = [];

//     // Loop through other pictures to handle base64 images
//     for (let i = 0; i < (other_pictures || []).length; i++) {
//       const picture = other_pictures[i];
//       if (
//         typeof picture === "string" &&
//         /^data:image\/[a-zA-Z]+;base64,/.test(picture)
//       ) {
//         // Convert base64 to buffer and upload locally
//         const buffer = base64ToBuffer(picture);
//         const fileName = `campaign_${id}_other_picture_${i}.jpeg`;
//         const uploadedUrl = await uploadImageLocally(buffer, fileName);
//         newOtherPictures.push(uploadedUrl);
//       }
//     }

//     // Delete any old pictures that are not in the updated URL list
//     const oldPictures = campaign.other_pictures || [];
//     await Promise.all(
//       oldPictures.map(async (oldPic) => {
//         if (!existingUrls.includes(oldPic)) {
//           // Only delete local files (skip URLs starting with http)
//           if (oldPic.startsWith("/images/")) {
//             await deleteImageLocally(oldPic);
//           }
//         }
//       })
//     );

//     // Combine existing and newly uploaded pictures URLs
//     campaign.other_pictures = [...existingUrls, ...newOtherPictures];

//     // Save updated campaign
//     await campaign.save();

//     res.status(200).json({
//       status: true,
//       message: "Campaign updated successfully",
//       data: campaign,
//     });
//   } catch (error) {
//     res.status(500).json({
//       status: false,
//       message: "Error updating campaign: " + error.message,
//     });
//   }
// };

export const getCampaignById = async (req, res) => {
  try {
    const { id } = req.params; // Get campaign id from request params

    // Find the campaign by id
    const campaign = await DonationCampaign.findById(id).populate("created_by");
    if (!campaign) {
      return res.status(404).json({
        status: false,
        message: "Campaign not found",
      });
    }

    // Return success response with the campaign data
    res.status(200).json({
      status: true,
      message: "Campaign fetched successfully",
      data: campaign,
    });
  } catch (error) {
    // Handle any errors during the process
    res.status(500).json({
      status: false,
      message: "Error fetching campaign: " + error.message,
    });
  }
};

export const getDonationCampaignsByUser = async (req, res) => {
  try {
    // Extract user ID from the request object (assuming user is authenticated and attached in middleware)
    const userId = req.user.id;
    console.log(userId);
    // Fetch all campaigns created by the user
    const campaigns = await DonationCampaign.find({ created_by: userId });
    // .populate('category'); // You can populate other fields if needed

    // Check if the user has any campaigns
    if (!campaigns.length) {
      return res.status(404).json({
        status: false,
        message: "No donation campaigns found for this user",
        data: null,
      });
    }

    // Return success response with the user's campaigns
    res.status(200).json({
      status: true,
      message: "Campaigns fetched successfully",
      data: campaigns,
    });
  } catch (error) {
    // Handle any errors
    res.status(500).json({
      status: false,
      message: "Error fetching campaigns: " + error.message,
    });
  }
};

// const uploadImageToFirebaseBanners = async (buffer, fileName, contentType) => {
//   try {
//     const storage = getStorage();
//     const storageRef = ref(storage, `banners/${fileName}`); // Store in 'banners/' folder

//     const metadata = {
//       contentType, // Example: 'image/jpeg'
//     };

//     // Upload image to the specified path in Firebase Storage
//     const uploadTask = await uploadBytesResumable(storageRef, buffer, metadata);

//     // Get download URL of the uploaded image
//     const downloadURL = await getDownloadURL(uploadTask.ref);
//     return downloadURL;
//   } catch (error) {
//     throw new Error("Error uploading image to Firebase");
//   }
// };

// const uploadImageLocallyToBanners = async (buffer, fileName, contentType) => {
//   try {
//     // Define the local folder path to save banner images
//     const uploadDir = path.resolve("images", "banners");

//     // Ensure directory exists (create if missing)
//     // fs.mkdir(uploadDir, { recursive: true });
//     await fs.promises.mkdir(uploadDir, { recursive: true });

//     // Full path to save the file
//     const filePath = path.join(uploadDir, fileName);

//     // Write the buffer to the local file system
//     await fs.promises.writeFile(filePath, buffer);

//     // Return a relative URL/path to access the banner image
//     return `/images/banners/${fileName}`;
//   } catch (error) {
//     console.error("Local banner upload error:", error);
//     throw new Error("Failed to upload banner image locally");
//   }
// };

const uploadImageLocallyToBanners = async (buffer, fileName, contentType) => {
  try {
    // Define the local folder path to save banner images
    const uploadDir = path.resolve("images", "banners");

    // Ensure directory exists (create if missing)
    await fs.mkdir(uploadDir, { recursive: true });

    // Full path to save the file
    const filePath = path.join(uploadDir, fileName);

    // Write the buffer to the local file system
    await fs.writeFile(filePath, buffer);

    // Return a relative URL/path to access the banner image
    return `/images/banners/${fileName}`;
  } catch (error) {
    console.error("Local banner upload error:", error);
    throw new Error("Failed to upload banner image locally");
  }
};

// export const uploadBannerImage = async (req, res) => {
//   try {
//     const { image } = req.body;

//     // Ensure image is provided
//     if (!image || typeof image !== "string") {
//       return res.status(400).json({ error: "Banner image is required" });
//     }

//     // Convert base64 to buffer
//     const buffer = base64ToBuffer(image);

//     // Generate a unique filename for the banner
//     const fileName = `banner_${uuidv4()}.jpeg`;

//     // Upload the image to Firebase
//     const imageUrl = await uploadImageToFirebaseBanners(
//       buffer,
//       fileName,
//       "image/jpeg"
//     );

//     res.status(200).json({
//       status: true,
//       message: "Banner image uploaded successfully",
//       imageUrl,
//     });
//   } catch (error) {
//     console.error("Error uploading banner:", error);
//     res.status(500).json({ error: "Failed to upload banner image" });
//   }
// };

// export const uploadBannerImage = async (req, res) => {
//   try {
//     const { image } = req.body;

//     // Ensure image is provided and is a base64 string
//     if (!image || typeof image !== "string") {
//       return res.status(400).json({ error: "Banner image is required" });
//     }

//     // Convert base64 to buffer
//     const buffer = base64ToBuffer(image);

//     // Generate a unique filename for the banner
//     const fileName = `banner_${uuidv4()}.jpeg`;

//     // Upload the image locally to 'images/banners'
//     const imageUrl = await uploadImageLocallyToBanners(
//       buffer,
//       fileName,
//       "image/jpeg"
//     );

//     // Respond with the local URL/path
//     res.status(200).json({
//       status: true,
//       message: "Banner image uploaded successfully",
//       imageUrl, // This will be the relative URL like '/images/banners/banner_xxx.jpeg'
//     });
//   } catch (error) {
//     console.error("Error uploading banner:", error);
//     res.status(500).json({ error: "Failed to upload banner image" });
//   }
// };

// API to update an existing banner image
// export const updateBannerImage = async (req, res) => {
//   try {
//     const { imageUrl, newImage } = req.body;
//     // Ensure both image URL and new image data are provided
//     if (!imageUrl || !newImage) {
//       return res
//         .status(400)
//         .json({ error: "Image URL and new image are required" });
//     }

//     // Extract the file path from the imageUrl
//     const filePath = imageUrl
//       .split("/o/")[1]
//       .split("?")[0]
//       .replace(/%2F/g, "/");
//     const imageRef = ref(storage, filePath);

//     // Delete the old image from Firebase
//     await deleteObject(imageRef);

//     // Convert new base64 image to buffer
//     // console.log(newImage);

//     const buffer = base64ToBuffer(newImage);
//     // Generate a new file name for the updated banner image
//     const fileName = `banner_${uuidv4()}.jpeg`;

//     // Upload the new image to Firebase
//     const newImageUrl = await uploadImageToFirebaseBanners(
//       buffer,
//       fileName,
//       "image/jpeg"
//     );
//     res.status(200).json({
//       status: true,
//       message: "Banner image updated successfully",
//       newImageUrl,
//     });
//   } catch (error) {
//     console.error("Error updating banner:", error);
//     res.status(500).json({ error: "Failed to update banner image" });
//   }
// };

// export const updateBannerImage = async (req, res) => {
//   try {
//     const { imageUrl, newImage } = req.body;

//     if (!imageUrl || !newImage) {
//       return res
//         .status(400)
//         .json({ error: "Image URL and new image are required" });
//     }

//     // Extract relative path from imageUrl (e.g. '/images/banners/banner_xxx.jpeg')
//     const relativePath = imageUrl.replace(/^\/images/, "");
//     const oldFilePath = path.join(process.cwd(), "images", relativePath);

//     // Delete old banner image if exists
//     if (fs.existsSync(oldFilePath)) {
//       await fs.promises.unlink(oldFilePath);
//     } else {
//       console.warn("Old banner image not found:", oldFilePath);
//     }

//     // Convert new base64 image to buffer
//     const buffer = base64ToBuffer(newImage);

//     // Generate new unique filename
//     const newFileName = `banner_${uuidv4()}.jpeg`;

//     // Upload new image locally using your helper
//     const newImageUrl = await uploadImageLocallyToBanners(
//       buffer,
//       newFileName,
//       "image/jpeg"
//     );

//     // Respond with success and new image URL
//     res.status(200).json({
//       status: true,
//       message: "Banner image updated successfully",
//       newImageUrl,
//     });
//   } catch (error) {
//     console.error("Error updating banner:", error);
//     res.status(500).json({ error: "Failed to update banner image" });
//   }
// };

export const updateBannerImage = async (req, res) => {
  try {
    const { imageUrl, newImage } = req.body;

    if (!newImage) {
      return res.status(400).json({ error: "New image is required" });
    }

    // Step 1: Delete old image if valid path is provided
    if (
      imageUrl &&
      typeof imageUrl === "string" &&
      imageUrl.startsWith("/images/")
    ) {
      const oldFilePath = path.join(process.cwd(), imageUrl);
      if (fsSync.existsSync(oldFilePath)) {
        await fs.unlink(oldFilePath);
        console.log("Old banner image deleted:", oldFilePath);
      } else {
        console.warn("Old banner image not found:", oldFilePath);
      }
    }

    // Step 2: Convert base64 to buffer
    const { buffer, mimeType, extension } = base64ToBuffer(newImage);
    const newFileName = `banner_${uuidv4()}.${extension}`;

    // Step 3: Save new image
    const newImageUrl = await uploadImageLocallyToBanners(
      buffer,
      newFileName,
      mimeType
    );

    // Step 4: Return response
    return res.status(200).json({
      status: true,
      message: "Banner image updated successfully",
      newImageUrl, // e.g., /images/banners/banner_xxx.png
    });
  } catch (error) {
    console.error("Error updating banner image:", error.message, error.stack);
    return res.status(500).json({ error: "Failed to update banner image" });
  }
};

export const uploadBannerImage = async (req, res) => {
  try {
    const { image } = req.body;

    // Ensure image is provided and is a base64 string
    if (!image || typeof image !== "string") {
      return res.status(400).json({ error: "Banner image is required" });
    }

    // Convert base64 to buffer
    const buffer = base64ToBuffer(image);

    // Generate a unique filename for the banner
    const fileName = `banner_${uuidv4()}.jpeg`;

    // Upload the image locally to 'images/banners'
    const imageUrl = await uploadImageLocallyToBanners(
      buffer,
      fileName,
      "image/jpeg"
    );

    // Respond with the local URL/path
    res.status(200).json({
      status: true,
      message: "Banner image uploaded successfully",
      imageUrl, // This will be the relative URL like '/images/banners/banner_xxx.jpeg'
    });
  } catch (error) {
    console.error("Error uploading banner:", error);
    res.status(500).json({ error: "Failed to upload banner image" });
  }
};

// // API to delete a banner image
// export const deleteBannerImage = async (req, res) => {
//   try {
//     const { imageUrl } = req.body;

//     // Ensure image URL is provided
//     if (!imageUrl) {
//       return res.status(400).json({ error: "Image URL is required" });
//     }

//     // Extract the file path from the imageUrl
//     const filePath = imageUrl
//       .split("/o/")[1]
//       .split("?")[0]
//       .replace(/%2F/g, "/");
//     const imageRef = ref(storage, filePath);

//     // Delete the image from Firebase
//     await deleteObject(imageRef);

//     res.status(200).json({
//       status: true,
//       message: "Banner image deleted successfully",
//     });
//   } catch (error) {
//     console.error("Error deleting banner:", error);
//     res.status(500).json({ error: "Failed to delete banner image" });
//   }
// };

export const deleteBannerImage = async (req, res) => {
  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: "Image URL is required" });
    }

    // Assuming imageUrl is something like '/images/banners/banner_xxx.jpeg'
    // Extract the relative path after '/images'
    const relativePath = imageUrl.replace(/^\/images/, "");

    // Construct the absolute file path on disk
    const filePath = path.join(process.cwd(), "images", relativePath);

    // Check if the file exists before deleting
    if (fs.existsSync(filePath)) {
      // Delete the file asynchronously
      await fs.promises.unlink(filePath);
      return res.status(200).json({
        status: true,
        message: "Banner image deleted successfully",
      });
    } else {
      return res.status(404).json({
        error: "File not found",
      });
    }
  } catch (error) {
    console.error("Error deleting banner:", error);
    res.status(500).json({ error: "Failed to delete banner image" });
  }
};

// // API to list banner images (limit to 3)
// export const listBannerImages = async (req, res) => {
//   try {
//     // Define a folder path where banner images are stored
//     const bannerRef = ref(storage, "banners/");
//     // Call Firebase API to list all files in the banners folder (up to 3 images)
//     const result = await listAll(bannerRef);

//     // Get download URLs for the listed images
//     const imageUrls = await Promise.all(
//       result.items.slice(0, 3).map(async (itemRef) => {
//         const url = await getDownloadURL(itemRef);
//         return url;
//       })
//     );

//     res.status(200).json({
//       status: true,
//       message: "Banner images fetched successfully",
//       banners: imageUrls,
//     });
//   } catch (error) {
//     console.error("Error listing banners:", error);
//     res.status(500).json({ error: "Failed to list banner images" });
//   }
// };

export const listBannerImages = async (req, res) => {
  try {
    const bannersDir = path.resolve(process.cwd(), "images", "banners");

    // Check if folder exists, create if not
    try {
      await fs.access(bannersDir);
    } catch {
      await fs.mkdir(bannersDir, { recursive: true });
    }

    const files = await fs.readdir(bannersDir);

    const imageFiles = files.filter((file) =>
      /\.(jpe?g|png|gif|webp)$/i.test(file)
    );

    const limitedImages = imageFiles.slice(0, 3);

    const imageUrls = limitedImages.map(
      (fileName) => `/images/banners/${fileName}`
    );

    res.status(200).json({
      status: true,
      message: "Banner images fetched successfully",
      banners: imageUrls,
    });
  } catch (error) {
    console.error("Error listing local banners:", error);
    res.status(500).json({ error: "Failed to list banner images" });
  }
};

// export const listBannerImages = async (req, res) => {
//   try {
//     // Local folder where banner images are stored

//     const bannersDir = path.resolve(process.cwd(), "images", "banners");
//     console.log("📁 Banner Dir Path:", bannersDir);

//     // Read files from the local directory
//     const files = await fs.promises.readdir(bannersDir);

//     // Filter only image files (optional, here filtering by common extensions)
//     const imageFiles = files.filter((file) =>
//       /\.(jpe?g|png|gif|webp)$/i.test(file)
//     );

//     // Limit to max 3 images
//     const limitedImages = imageFiles.slice(0, 3);

//     // Map filenames to URLs relative to your static route
//     const imageUrls = limitedImages.map(
//       (fileName) => `/images/banners/${fileName}`
//     );

//     res.status(200).json({
//       status: true,
//       message: "Banner images fetched successfully",
//       banners: imageUrls,
//     });
//   } catch (error) {
//     console.error("Error listing local banners:", error);
//     res.status(500).json({ error: "Failed to list banner images" });
//   }
// };

export const getAllDonations = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      min_amount,
      max_amount,
      start_date,
      end_date,
      payment_status,
      search,
    } = req.query;

    const query = {};

    // Search (by transaction_id or notes)
    if (search) {
      query.$or = [
        { transaction_id: { $regex: search, $options: "i" } },
        { notes: { $regex: search, $options: "i" } },
      ];
    }

    // Filter by min & max amount
    if (min_amount || max_amount) {
      query.total_amount = {};
      if (min_amount) query.total_amount.$gte = parseFloat(min_amount);
      if (max_amount) query.total_amount.$lte = parseFloat(max_amount);
    }

    // Filter by date range
    if (start_date || end_date) {
      query.donated_date = {};
      if (start_date) query.donated_date.$gte = new Date(start_date);
      if (end_date) query.donated_date.$lte = new Date(end_date);
    }

    // Filter by payment status
    if (payment_status) {
      query.payment_status = payment_status;
    }

    // Pagination logic
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Query with sort by latest first
    const donations = await Donation.find(query)
      .populate("donation_campaign_id", "title") // optional populate example
      .populate("user_id", "full_name email") // optional populate example
      .sort({ donated_date: -1 }) // most recent first
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Donation.countDocuments(query);

    return res.status(200).json({
      data: donations,
      meta: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching donations:", error);
    return res.status(500).json({ message: "Server Error" });
  }
};

// export const getAll80GDonations = async (req, res) => {
//   try {
//     const { page = 1, limit = 10, search, start_date, end_date } = req.query;

//     const matchStage = {
//       payment_status: "successful",
//       issued_80g: true,
//     };

//     // Date range filter
//     if (start_date && end_date) {
//       matchStage.donated_date = {
//         $gte: new Date(start_date),
//         $lte: new Date(end_date),
//       };
//     }

//     // Pagination setup
//     const skip = (parseInt(page) - 1) * parseInt(limit);
//     const lim = parseInt(limit);

//     // Aggregation pipeline
//     const pipeline = [
//       {
//         $lookup: {
//           from: "users", // collection name in MongoDB
//           localField: "user_id",
//           foreignField: "_id",
//           as: "user",
//         },
//       },
//       { $unwind: "$user" },
//       { $match: matchStage },
//     ];

//     // Search logic
//     if (search) {
//       const regex = new RegExp(search, "i");
//       const dateSearch = new Date(search);
//       const isValidDate = !isNaN(dateSearch.getTime());

//       const orConditions = [
//         { pan_number: { $regex: regex } },
//         { name_of_donor: { $regex: regex } },
//         { phone: { $regex: regex } },
//         { email: { $regex: regex } },
//         { transaction_id: { $regex: regex } },
//         { "user.full_name": { $regex: regex } },
//         { "user.email": { $regex: regex } },
//         { "user.mobile_number": { $regex: regex } },
//       ];

//       if (isValidDate) {
//         const startOfDay = new Date(dateSearch.setHours(0, 0, 0, 0));
//         const endOfDay = new Date(dateSearch.setHours(23, 59, 59, 999));
//         orConditions.push({
//           donated_date: {
//             $gte: startOfDay,
//             $lte: endOfDay,
//           },
//         });
//       }

//       pipeline.push({ $match: { $or: orConditions } });
//     }

//     // Count total documents
//     const totalPipeline = [...pipeline, { $count: "total" }];
//     const totalResult = await Donation.aggregate(totalPipeline);
//     const total = totalResult?.[0]?.total || 0;

//     // Add sorting and pagination
//     pipeline.push({ $sort: { donated_date: -1 } });
//     pipeline.push({ $skip: skip });
//     pipeline.push({ $limit: lim });

//     // Execute aggregation
//     const results = await Donation.aggregate(pipeline);

//     // Format response like your existing one
//     return res.status(200).json({
//       data: results,
//       meta: {
//         total,
//         page: parseInt(page),
//         limit: lim,
//         totalPages: Math.ceil(total / lim),
//       },
//     });
//   } catch (error) {
//     console.error("Error in 80G donations search:", error);
//     return res.status(500).json({ message: "Server Error" });
//   }
// };

export const getAll80GDonations = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, start_date, end_date } = req.query;

    // Build base query
    const query = {
      payment_status: "successful",
      issued_80g: true,
    };

    // Handle search filter
    if (search) {
      const dateSearch = new Date(search);
      const isValidDate = !isNaN(dateSearch.getTime());

      query.$or = [
        { pan_number: { $regex: search, $options: "i" } },
        { name_of_donor: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { transaction_id: { $regex: search, $options: "i" } },
        { "user_id.full_name": { $regex: search, $options: "i" } },
        { "user_id.mobile_number": { $regex: search, $options: "i" } },
        { "user_id.email": { $regex: search, $options: "i" } },
      ];

      if (isValidDate) {
        const startOfDay = new Date(dateSearch.setHours(0, 0, 0, 0));
        const endOfDay = new Date(dateSearch.setHours(23, 59, 59, 999));

        query.$or.push({
          donated_date: {
            $gte: startOfDay,
            $lte: endOfDay,
          },
        });
      }
    }

    // Date range filter (from date pickers)
    if (start_date && end_date) {
      query.donated_date = {
        $gte: new Date(start_date),
        $lte: new Date(end_date),
      };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Fetch total count first
    const total = await Donation.countDocuments(query);

    // Step 1: Get all matching donations for accurate total count
    const allDonations = await Donation.find(query)
      .populate("donation_campaign_id", "title") // optional populate example
      .populate("user_id", "full_name email mobile_number")
      .sort({ donated_date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalPages = Math.ceil(total / limit);

    return res.status(200).json({
      data: allDonations,
      meta: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages,
      },
    });
  } catch (error) {
    console.error("Error fetching 80G donations:", error);
    return res.status(500).json({ message: "Server Error" });
  }
};

export const deleteDonation = async (req, res) => {
  const { id } = req.params;

  try {
    const donation = await Donation.findById(id);

    if (!donation) {
      return res.status(404).json({ error: "Donation not found" });
    }

    await Donation.findByIdAndDelete(id);

    return res.status(200).json({ message: "Donation deleted successfully" });
  } catch (err) {
    console.error("Delete donation error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};
