 


// import DonationCampaign from '../models/donationCampaign.js';
// import { initializeApp } from 'firebase/app';
// import { getStorage, ref, getDownloadURL, uploadBytesResumable, deleteObject } from 'firebase/storage';
// import config from '../config/firebase.config.js';
// import { v4 as uuidv4 } from 'uuid';
// import request from 'request';

// // Initialize Firebase app
// initializeApp(config.firebaseConfig);

// // Initialize Firebase Cloud Storage
// const storage = getStorage();

// // Helper function to convert base64 image to buffer
// const base64ToBuffer = (base64) => {
//   const matches = base64.match(/^data:(.+);base64,(.+)$/);
//   if (!matches || matches.length !== 3) {
//     throw new Error('Invalid base64 string');
//   }
//   return Buffer.from(matches[2], 'base64');
// };

// // Helper function to upload image to Firebase
// const uploadImageToFirebase = async (buffer, fileName, mimetype) => {
//   try {
//     const storageRef = ref(storage, `campaign_images/${fileName}`);
//     const metadata = {
//       contentType: mimetype,
//     };
//     const snapshot = await uploadBytesResumable(storageRef, buffer, metadata);
//     const downloadURL = await getDownloadURL(snapshot.ref);
//     return downloadURL; // Return the download URL for the uploaded image
//   } catch (err) {
//     console.error('Firebase upload error:', err);
//     throw new Error('Failed to upload image to Firebase');
//   }
// };

// // Helper function to send OTP using TextLocal
// const sendOTP = (phoneNumber, otp) => {
//   const apiKey = process.env.TEXTLOCAL_API_KEY; // Use environment variable for security
//   const sender = 'TXTLCL'; // TextLocal sender ID
//   const message = `Your OTP is ${otp}`;

//   const url = `https://api.textlocal.in/send/?apikey=${apiKey}&numbers=${phoneNumber}&sender=${sender}&message=${encodeURIComponent(message)}`;

//   request(url, function (error, response, body) {
//     if (!error && response.statusCode === 200) {
//       console.log('OTP sent successfully:', body);
//     } else {
//       console.error('Failed to send OTP:', error);
//     }
//   });
// };

// // Create a new donation campaign and send OTP
// export const createDonationCampaign = async (req, res) => {
//   try {
//     const { main_picture, other_pictures, phone_number, ...data } = req.body;

//     // Generate a unique campaign ID upfront
//     const campaignId = uuidv4();

//     let mainPictureUrl = null;
//     const imageUrls = [];

//     // Save main image
//     if (main_picture && typeof main_picture === 'string') {
//       const buffer = base64ToBuffer(main_picture);
//       mainPictureUrl = await uploadImageToFirebase(buffer, `campaign_${campaignId}_main`, 'image/jpeg');
//       data.main_picture = mainPictureUrl;
//     }

//     // Save other images
//     if (other_pictures && Array.isArray(other_pictures)) {
//       for (let i = 0; i < other_pictures.length; i++) {
//         if (typeof other_pictures[i] === 'string') {
//           const buffer = base64ToBuffer(other_pictures[i]);
//           const imageUrl = await uploadImageToFirebase(buffer, `campaign_${campaignId}_other_${i}`, 'image/jpeg');
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

//     const campaign = new DonationCampaign(data);
//     await campaign.save();

//     res.status(200).json({ status: true, message: 'Campaign created successfully and OTP sent to user', data: campaign });
//   } catch (error) {
//     res.status(400).json({ error: error.message });
//   }
// };

// // Get a single donation campaign by ID
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

// // List all donation campaigns with pagination
// export const listDonationCampaigns = async (req, res) => {
//   const page = parseInt(req.query.page) || 1;
//   const perPage = parseInt(req.query.perPage) || 10;

//   try {
//     const count = await DonationCampaign.countDocuments();
//     const campaigns = await DonationCampaign.find()
//       .limit(perPage)
//       .skip((page - 1) * perPage);

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

// // Update a donation campaign by ID
// export const updateDonationCampaign = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { body: data } = req;

//     const campaign = await DonationCampaign.findById(id);

//     if (!campaign) {
//       return res.status(404).json({ error: 'Campaign not found' });
//     }

//     let mainPictureUrl = campaign.main_picture;
//     const updatedImageUrls = [];

//     // Handle the main picture update
//     if (req.body.main_picture) {
//       if (/^data:image\/[a-zA-Z]+;base64,/.test(req.body.main_picture)) {
//         // Delete the old main picture from Firebase
//         if (campaign.main_picture && campaign.main_picture.startsWith('https://')) {
//           const mainPicRef = ref(storage, campaign.main_picture);
//           try {
//             await deleteObject(mainPicRef);
//           } catch (err) {
//             console.error('Failed to delete old main picture from Firebase:', err);
//           }
//         }

//         // Upload the new base64 image
//         const buffer = base64ToBuffer(req.body.main_picture);
//         mainPictureUrl = await uploadImageToFirebase(buffer, `campaign_${id}_main`, 'image/jpeg');
//         data.main_picture = mainPictureUrl; // Store the full Firebase URL
//       } else {
//         // If a URL is provided, ensure that the full URL is stored correctly
//         if (req.body.main_picture.startsWith('https://')) {
//           data.main_picture = req.body.main_picture; // Retain the provided URL if it's a valid one
//         } else {
//           console.error('Invalid main picture URL provided');
//           return res.status(400).json({ error: 'Invalid main picture URL' });
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
//           const uploadedUrl = await uploadImageToFirebase(buffer, `campaign_${id}_other_${i}`, 'image/jpeg');
//           newOtherPictures.push(uploadedUrl);
//         } else {
//           // If it's an existing URL, retain it
//           existingUrls.push(picture);
//         }
//       }

//       // Delete any pictures that are not in the updated URL list
//       const oldPictures = campaign.other_pictures || [];
//       await Promise.all(oldPictures.map(async (oldPic) => {
//         if (!existingUrls.includes(oldPic)) {
//           const picRef = ref(storage, oldPic);
//           try {
//             await deleteObject(picRef);
//           } catch (err) {
//             console.error('Failed to delete old picture from Firebase:', err);
//           }
//         }
//       }));

//       // Combine new uploaded images and existing ones
//       data.other_pictures = [...existingUrls, ...newOtherPictures];
//     } else {
//       // If no other_pictures are sent, delete all existing ones
//       await Promise.all(campaign.other_pictures.map(async (pic) => {
//         const picRef = ref(storage, pic);
//         try {
//           await deleteObject(picRef);
//         } catch (err) {
//           console.error('Failed to delete old picture from Firebase:', err);
//         }
//       }));
//       data.other_pictures = [];
//     }

//     // Apply the updates to the campaign
//     Object.assign(campaign, data);
//     await campaign.save();

//     res.status(200).json({ status: true, message: 'Campaign updated successfully', data: campaign });
//   } catch (error) {
//     res.status(400).json({ error: error.message });
//   }
// };


// // Delete a donation campaign by ID
// export const deleteDonationCampaign = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const campaign = await DonationCampaign.findById(id);

//     if (!campaign) {
//       return res.status(404).json({ error: 'Donation campaign not found' });
//     }

//     // Delete main picture
//     if (campaign.main_picture) {
//       const mainPicRef = ref(storage, campaign.main_picture);
//       try {
//         await deleteObject(mainPicRef);
//       } catch (err) {
//         console.error('Failed to delete main picture from Firebase:', err);
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
//             console.error('Failed to delete picture from Firebase:', err);
//           }
//         })
//       );
//     }

//     await DonationCampaign.findByIdAndDelete(id);

//     res.status(200).json({ status: true, message: 'Donation campaign deleted successfully' });
//   } catch (error) {
//     res.status(400).json({ error: error.message });
//   }
// };

// // Fetch donation campaigns by category with search
// export const getCampaignsByCategoryWithSearch = async (req, res) => {
//   try {
//     const { category } = req.params;
//     const { search } = req.query;
//     const page = parseInt(req.query.page) || 1;
//     const perPage = parseInt(req.query.perPage) || 10;

//     const query = {};

//     if (category && category !== 'All') {
//       query.category = category;
//     }

//     if (search) {
//       query.$or = [
//         { title: { $regex: search, $options: 'i' } },
//         { organization: { $regex: search, $options: 'i' } },
//       ];
//     }

//     const totalCampaigns = await DonationCampaign.countDocuments(query);
//     const campaigns = await DonationCampaign.find(query)
//       .populate('category')
//       .limit(perPage)
//       .skip((page - 1) * perPage)
//       .exec();

//     if (!campaigns.length) {
//       return res.status(404).json({
//         status: false,
//         message: `No campaigns found for the category: ${category || 'All'} with search term: ${search || ''}`,
//         data: null,
//       });
//     }

//     res.status(200).json({
//       status: true,
//       message: 'Campaigns fetched successfully',
//       data: {
//         campaigns,
//         totalCampaigns,
//         currentPage: page,
//         totalPages: Math.ceil(totalCampaigns / perPage),
//         perPage,
//       },
//     });
//   } catch (error) {
//     res.status(400).json({ status: false, message: error.message, data: null });
//   }
// };
import DonationCampaign from '../models/donationCampaign.js';
import { initializeApp } from 'firebase/app';
import { getStorage, ref, getDownloadURL, uploadBytesResumable, deleteObject } from 'firebase/storage';
import config from '../config/firebase.config.js';
import { v4 as uuidv4 } from 'uuid';
import request from 'request';

// Initialize Firebase app
initializeApp(config.firebaseConfig);

// Initialize Firebase Cloud Storage
const storage = getStorage();

// Helper function to convert base64 image to buffer
const base64ToBuffer = (base64) => {
  const matches = base64.match(/^data:(.+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    throw new Error('Invalid base64 string');
  }
  return Buffer.from(matches[2], 'base64');
};

// Helper function to upload image to Firebase
const uploadImageToFirebase = async (buffer, fileName, mimetype) => {
  try {
    const storageRef = ref(storage, `campaign_images/${fileName}`);
    const metadata = {
      contentType: mimetype,
    };
    const snapshot = await uploadBytesResumable(storageRef, buffer, metadata);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL; // Return the download URL for the uploaded image
  } catch (err) {
    console.error('Firebase upload error:', err);
    throw new Error('Failed to upload image to Firebase');
  }
};

// Helper function to send OTP using TextLocal
const sendOTP = (phoneNumber, otp) => {
  const apiKey = process.env.TEXTLOCAL_API_KEY; // Use environment variable for security
  const sender = 'TXTLCL'; // TextLocal sender ID
  const message = `Your OTP is ${otp}`;

  const url = `https://api.textlocal.in/send/?apikey=${apiKey}&numbers=${phoneNumber}&sender=${sender}&message=${encodeURIComponent(message)}`;

  request(url, function (error, response, body) {
    if (!error && response.statusCode === 200) {
      console.log('OTP sent successfully:', body);
    } else {
      console.error('Failed to send OTP:', error);
    }
  });
};

// API to handle image upload from text editor (ReactQuill)
export const uploadTextEditorImage = async (req, res) => {
  try {
    const { image, campaignId } = req.body;

    // Ensure that a campaignId is provided for organizational purposes
    if (!campaignId) {
      return res.status(400).json({ error: 'Campaign ID is required' });
    }

    // Convert the base64 image to buffer
    const buffer = base64ToBuffer(image);
    
    // Generate a unique filename for the image and store it in a dedicated folder for the campaign
    const fileName = `campaign_${campaignId}/text_editor_${uuidv4()}.jpeg`;

    // Upload the image to Firebase
    const imageUrl = await uploadImageToFirebase(buffer, fileName, 'image/jpeg');

    res.status(200).json({
      status: true,
      message: 'Image uploaded successfully',
      imageUrl, // Return the image URL to the client
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// API to remove image from Firebase when deleted from the text editor
export const deleteTextEditorImage = async (req, res) => {
  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: 'Image URL is required' });
    }

    // Extract the file path from the imageUrl
    const filePath = imageUrl.split('/o/')[1].split('?')[0].replace(/%2F/g, '/');
    const imageRef = ref(storage, filePath);

    // Delete the image from Firebase Storage
    await deleteObject(imageRef);

    res.status(200).json({
      status: true,
      message: 'Image deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(400).json({ error: 'Failed to delete image from Firebase' });
  }
};

// Create a new donation campaign and send OTP
export const createDonationCampaign = async (req, res) => {
  try {
    const { main_picture, other_pictures, phone_number, ...data } = req.body;

    // Generate a unique campaign ID upfront
    const campaignId = uuidv4();

    let mainPictureUrl = null;
    const imageUrls = [];

    // Save main image
    if (main_picture && typeof main_picture === 'string') {
      const buffer = base64ToBuffer(main_picture);
      mainPictureUrl = await uploadImageToFirebase(buffer, `campaign_${campaignId}/main_picture.jpeg`, 'image/jpeg');
      data.main_picture = mainPictureUrl;
    }

    // Save other images
    if (other_pictures && Array.isArray(other_pictures)) {
      for (let i = 0; i < other_pictures.length; i++) {
        if (typeof other_pictures[i] === 'string') {
          const buffer = base64ToBuffer(other_pictures[i]);
          const imageUrl = await uploadImageToFirebase(buffer, `campaign_${campaignId}/other_picture_${i}.jpeg`, 'image/jpeg');
          imageUrls.push(imageUrl);
        }
      }
      data.other_pictures = imageUrls;
    }

    // Generate a random OTP
    const otp = Math.floor(100000 + Math.random() * 900000); // Generates a 6-digit OTP

    // Send OTP to user's phone number
    if (phone_number) {
      sendOTP(phone_number, otp); // Call the sendOTP function with the entered phone number
    }

    const campaign = new DonationCampaign(data);
    await campaign.save();

    res.status(200).json({ status: true, message: 'Campaign created successfully and OTP sent to user', data: campaign });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get a single donation campaign by ID
export const getDonationCampaignById = async (req, res) => {
  try {
    const { id } = req.params;
    const campaign = await DonationCampaign.findById(id).populate('category');

    if (!campaign) {
      return res.status(404).json({ status: false, message: 'Donation campaign not found', data: null });
    }

    res.status(200).json({
      status: true,
      message: 'Campaign fetched successfully',
      data: { campaign, category: campaign.category },
    });
  } catch (error) {
    res.status(400).json({ status: false, message: error.message, data: null });
  }
};

// List all donation campaigns with pagination
export const listDonationCampaigns = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const perPage = parseInt(req.query.perPage) || 10;

  try {
    const count = await DonationCampaign.countDocuments();
    const campaigns = await DonationCampaign.find()
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

// Update a donation campaign by ID
export const updateDonationCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const { body: data } = req;

    const campaign = await DonationCampaign.findById(id);

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    let mainPictureUrl = campaign.main_picture;
    const updatedImageUrls = [];

    // Handle the main picture update
    if (req.body.main_picture) {
      if (/^data:image\/[a-zA-Z]+;base64,/.test(req.body.main_picture)) {
        // Delete the old main picture from Firebase
        if (campaign.main_picture && campaign.main_picture.startsWith('https://')) {
          const mainPicRef = ref(storage, campaign.main_picture);
          try {
            await deleteObject(mainPicRef);
          } catch (err) {
            console.error('Failed to delete old main picture from Firebase:', err);
          }
        }

        // Upload the new base64 image
        const buffer = base64ToBuffer(req.body.main_picture);
        mainPictureUrl = await uploadImageToFirebase(buffer, `campaign_${id}_main`, 'image/jpeg');
        data.main_picture = mainPictureUrl; // Store the full Firebase URL
      } else {
        // If a URL is provided, ensure that the full URL is stored correctly
        if (req.body.main_picture.startsWith('https://')) {
          data.main_picture = req.body.main_picture; // Retain the provided URL if it's a valid one
        } else {
          console.error('Invalid main picture URL provided');
          return res.status(400).json({ error: 'Invalid main picture URL' });
        }
      }
    }

    // Handle other pictures
    if (req.body.other_pictures && Array.isArray(req.body.other_pictures)) {
      const newOtherPictures = [];
      const existingUrls = [];

      for (let i = 0; i < req.body.other_pictures.length; i++) {
        const picture = req.body.other_pictures[i];

        // If it's a base64 image, upload it to Firebase
        if (/^data:image\/[a-zA-Z]+;base64,/.test(picture)) {
          const buffer = base64ToBuffer(picture);
          const uploadedUrl = await uploadImageToFirebase(buffer, `campaign_${id}_other_${i}`, 'image/jpeg');
          newOtherPictures.push(uploadedUrl);
        } else {
          // If it's an existing URL, retain it
          existingUrls.push(picture);
        }
      }

      // Delete any pictures that are not in the updated URL list
      const oldPictures = campaign.other_pictures || [];
      await Promise.all(oldPictures.map(async (oldPic) => {
        if (!existingUrls.includes(oldPic)) {
          const picRef = ref(storage, oldPic);
          try {
            await deleteObject(picRef);
          } catch (err) {
            console.error('Failed to delete old picture from Firebase:', err);
          }
        }
      }));

      // Combine new uploaded images and existing ones
      data.other_pictures = [...existingUrls, ...newOtherPictures];
    } else {
      // If no other_pictures are sent, delete all existing ones
      await Promise.all(campaign.other_pictures.map(async (pic) => {
        const picRef = ref(storage, pic);
        try {
          await deleteObject(picRef);
        } catch (err) {
          console.error('Failed to delete old picture from Firebase:', err);
        }
      }));
      data.other_pictures = [];
    }

    // Apply the updates to the campaign
    Object.assign(campaign, data);
    await campaign.save();

    res.status(200).json({ status: true, message: 'Campaign updated successfully', data: campaign });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete a donation campaign by ID
export const deleteDonationCampaign = async (req, res) => {
  try {
    const { id } = req.params;

    const campaign = await DonationCampaign.findById(id);

    if (!campaign) {
      return res.status(404).json({ error: 'Donation campaign not found' });
    }

    // Delete main picture
    if (campaign.main_picture) {
      const mainPicRef = ref(storage, campaign.main_picture);
      try {
        await deleteObject(mainPicRef);
      } catch (err) {
        console.error('Failed to delete main picture from Firebase:', err);
      }
    }

    // Delete other pictures
    if (campaign.other_pictures) {
      await Promise.all(
        campaign.other_pictures.map(async (pic) => {
          const picRef = ref(storage, pic);
          try {
            await deleteObject(picRef);
          } catch (err) {
            console.error('Failed to delete picture from Firebase:', err);
          }
        })
      );
    }

    await DonationCampaign.findByIdAndDelete(id);

    res.status(200).json({ status: true, message: 'Donation campaign deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Fetch donation campaigns by category with search
export const getCampaignsByCategoryWithSearch = async (req, res) => {
  try {
    const { category } = req.params;
    const { search } = req.query;
    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.perPage) || 10;

    const query = {};

    if (category && category !== 'All') {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { organization: { $regex: search, $options: 'i' } },
      ];
    }

    const totalCampaigns = await DonationCampaign.countDocuments(query);
    const campaigns = await DonationCampaign.find(query)
      .populate('category')
      .limit(perPage)
      .skip((page - 1) * perPage)
      .exec();

    if (!campaigns.length) {
      return res.status(404).json({
        status: false,
        message: `No campaigns found for the category: ${category || 'All'} with search term: ${search || ''}`,
        data: null,
      });
    }

    res.status(200).json({
      status: true,
      message: 'Campaigns fetched successfully',
      data: {
        campaigns,
        totalCampaigns,
        currentPage: page,
        totalPages: Math.ceil(totalCampaigns / perPage),
        perPage,
      },
    });
  } catch (error) {
    res.status(400).json({ status: false, message: error.message, data: null });
  }
};
