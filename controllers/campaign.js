// import fs from 'fs';
// import path from 'path';
// import DonationCampaign from '../models/donationCampaign.js';

// // Helper function to ensure the directory exists
// const ensureDirectoryExists = (directoryPath) => {
//   if (!fs.existsSync(directoryPath)) {
//     fs.mkdirSync(directoryPath, { recursive: true });
//   }
// };

// // Helper function to save base64 image to a file
// const saveBase64Image = (base64Image, campaignId, imageIndex) => {
//   const matches = base64Image.match(/^data:(.+);base64,(.+)$/);
//   if (!matches || matches.length !== 3) {
//     throw new Error('Invalid base64 string');
//   }

//   const extension = matches[1].split('/')[1];
//   const imageData = matches[2];
//   const imageFileName = `campaign_${campaignId}_${imageIndex}.${extension}`;
//   const imagePath = path.resolve('images', imageFileName);
//   const imageBuffer = Buffer.from(imageData, 'base64');

//   ensureDirectoryExists(path.resolve('images'));
//   fs.writeFileSync(imagePath, imageBuffer);

//   return imageFileName; // Only return the filename, not the full path
// };

// // Get a single donation campaign by ID
// export const getDonationCampaignById = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const campaign = await DonationCampaign.findById(id).populate('category'); // Assuming category is a reference

//     if (!campaign) {
//       return res.status(404).json({ status: false, message: 'Donation campaign not found', data: null });
//     }

//     // Safely handle main_picture and other_pictures
//     campaign.main_picture = campaign.main_picture
//       ? `${req.protocol}://${req.get('host')}/images/${campaign.main_picture}`
//       : null;

//     campaign.other_pictures = campaign.other_pictures?.length
//       ? campaign.other_pictures.map(pic => `${req.protocol}://${req.get('host')}/images/${pic}`)
//       : [];

//     res.status(200).json({
//       status: true,
//       message: 'Campaign fetched successfully',
//       data: { campaign, category: campaign.category }, // Include category details
//     });
//   } catch (error) {
//     res.status(400).json({ status: false, message: error.message, data: null });
//   }
// };


// // Create a new donation campaign
// export const createDonationCampaign = async (req, res) => {
//   try {
//     const { main_picture, other_pictures, ...data } = req.body;
//     console.log(main_picture,other_pictures)
//     // Generate a unique campaign ID upfront
//     const campaignId = Math.random().toString(36).substr(2, 9);

//     // Save main image
//     if (main_picture) {
//       const mainImagePath = saveBase64Image(main_picture, campaignId, 'main');
//       data.main_picture = mainImagePath;
//     }

//     // Save other images
//     if (other_pictures && other_pictures.length) {
//       const imagePaths = other_pictures.map((image, index) =>
//         saveBase64Image(image, campaignId, index)
//       );
//       data.other_pictures = imagePaths;
//     }

//     const campaign = new DonationCampaign(data);
//     await campaign.save();

//     res.status(200).json({ status: true, message: 'Campaign created successfully', data: campaign });
//   } catch (error) {
//     res.status(400).json({ error: error.message });
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

//     const updatedCampaigns = campaigns.map((campaign) => ({
//       ...campaign._doc,
//       main_picture: campaign.main_picture ? `${req.protocol}://${req.get('host')}/images/${campaign.main_picture}` : null,
//       other_pictures: campaign.other_pictures?.length
//         ? campaign.other_pictures.map(pic => `${req.protocol}://${req.get('host')}/images/${pic}`)
//         : [],
//     }));

//     res.status(200).json({
//       campaigns: updatedCampaigns,
//       currentPage: page,
//       totalPages,
//       totalItems: count,
//     });
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

//     // Delete main picture and other pictures if they exist
//     if (campaign.main_picture && fs.existsSync(path.resolve('images', campaign.main_picture))) {
//       fs.unlinkSync(path.resolve('images', campaign.main_picture));
//     }

//     if (campaign.other_pictures) {
//       campaign.other_pictures.forEach((pic) => {
//         const picPath = path.resolve('images', pic);
//         if (fs.existsSync(picPath)) {
//           fs.unlinkSync(picPath);
//         }
//       });
//     }

//     await DonationCampaign.findByIdAndDelete(id);

//     res.status(200).json({ status: true, message: 'Donation campaign deleted successfully' });
//   } catch (error) {
//     res.status(400).json({ error: error.message });
//   }
// };

// // Update a donation campaign by ID
// // export const updateDonationCampaign = async (req, res) => {
// //   try {
// //     const { main_picture, other_pictures, ...data } = req.body;
// //     const { id } = req.params;

// //     const campaign = await DonationCampaign.findById(id);

// //     if (!campaign) {
// //       return res.status(404).json({ error: 'Campaign not found' });
// //     }

// //     Object.assign(campaign, data);

// //     // Update main image
// //     if (main_picture && /^data:image\/[a-zA-Z]+;base64,/.test(main_picture)) {
// //       const oldMainImagePath = campaign.main_picture;

// //       if (oldMainImagePath && fs.existsSync(path.resolve('images', oldMainImagePath))) {
// //         fs.unlinkSync(path.resolve('images', oldMainImagePath));
// //       }

// //       const newMainImagePath = saveBase64Image(main_picture, id, 'main');
// //       campaign.main_picture = newMainImagePath;
// //     }

// //     // Update other images
// //     if (other_pictures && other_pictures.length) {
// //       const oldOtherPictures = campaign.other_pictures;
// //       oldOtherPictures.forEach((pic) => {
// //         const picPath = path.resolve('images', pic);
// //         if (fs.existsSync(picPath)) {
// //           fs.unlinkSync(picPath);
// //         }
// //       });

// //       const newOtherPictures = other_pictures.map((image, index) =>
// //         saveBase64Image(image, id, index)
// //       );
// //       campaign.other_pictures = newOtherPictures;
// //     }

// //     await campaign.save();

// //     res.status(200).json({ status: true, message: 'Campaign updated successfully', data: campaign });
// //   } catch (error) {
// //     res.status(400).json({ error: error.message });
// //   }
// // };


// // export const updateDonationCampaign = async (req, res) => {
// //   try {
// //     const { main_picture, other_pictures, ...data } = req.body;
// //     const { id } = req.params;

// //     const campaign = await DonationCampaign.findById(id);

// //     if (!campaign) {
// //       return res.status(404).json({ error: 'Campaign not found' });
// //     }

// //     Object.assign(campaign, data);

// //     // Update main image
// //     if (main_picture) {
// //       if (/^data:image\/[a-zA-Z]+;base64,/.test(main_picture)) {
// //         const oldMainImagePath = campaign.main_picture;

// //         if (oldMainImagePath && fs.existsSync(path.resolve('images', oldMainImagePath))) {
// //           fs.unlinkSync(path.resolve('images', oldMainImagePath));
// //         }

// //         const newMainImagePath = saveBase64Image(main_picture, id, 'main');
// //         campaign.main_picture = newMainImagePath;
// //       } else {
// //         campaign.main_picture = main_picture; // Keep the URL as it is if it's provided
// //       }
// //     } else if (campaign.main_picture) {
// //       // If no main picture is sent in the body, delete the existing one
// //       const oldMainImagePath = campaign.main_picture;
// //       if (oldMainImagePath && fs.existsSync(path.resolve('images', oldMainImagePath))) {
// //         fs.unlinkSync(path.resolve('images', oldMainImagePath));
// //       }
// //       campaign.main_picture = null;
// //     }

// //     // Update other images
// //     if (other_pictures) {
// //       if (other_pictures.length) {
// //         const oldOtherPictures = campaign.other_pictures;
// //         oldOtherPictures.forEach((pic) => {
// //           const picPath = path.resolve('images', pic);
// //           if (fs.existsSync(picPath)) {
// //             fs.unlinkSync(picPath);
// //           }
// //         });

// //         const newOtherPictures = other_pictures.map((image, index) => {
// //           if (/^data:image\/[a-zA-Z]+;base64,/.test(image)) {
// //             return saveBase64Image(image, id, index);
// //           } else {
// //             return image; // Keep the URL as it is if it's provided
// //           }
// //         });

// //         campaign.other_pictures = newOtherPictures;
// //       } else {
// //         // If no other_pictures are sent in the body, delete the existing ones
// //         campaign.other_pictures.forEach((pic) => {
// //           const picPath = path.resolve('images', pic);
// //           if (fs.existsSync(picPath)) {
// //             fs.unlinkSync(picPath);
// //           }
// //         });
// //         campaign.other_pictures = [];
// //       }
// //     }

// //     await campaign.save();

// //     res.status(200).json({ status: true, message: 'Campaign updated successfully', data: campaign });
// //   } catch (error) {
// //     res.status(400).json({ error: error.message });
// //   }
// // };
// export const updateDonationCampaign = async (req, res) => {
//   try {
//     const { main_picture, other_pictures, ...data } = req.body;
//     const { id } = req.params;
// console.log(main_picture)
//     const campaign = await DonationCampaign.findById(id);

//     if (!campaign) {
//       return res.status(404).json({ error: 'Campaign not found' });
//     }

//     Object.assign(campaign, data);

//     // Update main image
//     if (main_picture) {
//       if (/^data:image\/[a-zA-Z]+;base64,/.test(main_picture)) {
//         // If the main_picture is a base64 string, save the new image
//         const oldMainImagePath = campaign.main_picture;
// console.log("oldMainImagePath")
//         if (oldMainImagePath && fs.existsSync(path.resolve('images', oldMainImagePath))) {
//           fs.unlinkSync(path.resolve('images', oldMainImagePath));
//         }

//         const newMainImagePath = saveBase64Image(main_picture, id, 'main');
//         campaign.main_picture = newMainImagePath;
//       } else {
//         console.log(main_picture)
//         // If the main_picture is a URL, keep it as is (don't modify the path)
//         campaign.main_picture = main_picture;
//       }
//     } 
//     // else if (campaign.main_picture) {
//     //   // If no main_picture is sent in the body, delete the existing one
//     //   const oldMainImagePath = campaign.main_picture;
//     //   if (oldMainImagePath && fs.existsSync(path.resolve('images', oldMainImagePath))) {
//     //     fs.unlinkSync(path.resolve('images', oldMainImagePath));
//     //   }
//     //   campaign.main_picture = null;
//     // }

//     // Update other images
//     if (other_pictures) {
//       // Filter out base64 images from the URLs
//       const newOtherPictures = [];
//       const existingUrls = [];

//       // Separate the URLs and base64 images
//       other_pictures.forEach((image, index) => {
//         if (/^data:image\/[a-zA-Z]+;base64,/.test(image)) {
//           // Save the base64 image
//           const savedImage = saveBase64Image(image, id, index);
//           newOtherPictures.push(savedImage);
//         } else {
//           // This is an existing URL, so we keep it as is
//           existingUrls.push(image);
//         }
//       });

//       // Delete old images that are not in the existingUrls
//       campaign.other_pictures.forEach((pic) => {
//         if (!existingUrls.includes(`${req.protocol}://${req.get('host')}/images/${pic}`)) {
//           const picPath = path.resolve('images', pic);
//           if (fs.existsSync(picPath)) {
//             fs.unlinkSync(picPath);
//           }
//         }
//       });

//       // Combine existing URLs with newly uploaded base64 images
//       campaign.other_pictures = [...existingUrls.map(url => url.replace(`${req.protocol}://${req.get('host')}/images/`, '')), ...newOtherPictures];
//     } else {
//       // If no other_pictures are sent in the body, delete the existing ones
//       campaign.other_pictures.forEach((pic) => {
//         const picPath = path.resolve('images', pic);
//         if (fs.existsSync(picPath)) {
//           fs.unlinkSync(picPath);
//         }
//       });
//       campaign.other_pictures = [];
//     }

//     await campaign.save();

//     res.status(200).json({ status: true, message: 'Campaign updated successfully', data: campaign });
//   } catch (error) {
//     res.status(400).json({ error: error.message });
//   }
// };


// // Fetch donation campaigns by category
// // Fetch donation campaigns by category with search
// export const getCampaignsByCategoryWithSearch = async (req, res) => {
//   try {
//     const { category } = req.params;
//     const { search } = req.query;
//     const page = parseInt(req.query.page) || 1; // Default to page 1
//     const perPage = parseInt(req.query.perPage) || 10; // Default to 10 items per page

//     // Build the query object
//     const query = {};

//     // Only apply category filter if it's not "All"
//     if (category && category !== 'All') {
//       query.category = category;
//     }

//     // Apply search filter if a search term is provided
//     if (search) {
//       query.$or = [
//         { title: { $regex: search, $options: 'i' } }, // Case-insensitive search in title
//         { organization: { $regex: search, $options: 'i' } }, // Case-insensitive search in organization
//       ];
//     }

//     // Find campaigns based on the query object
//     const totalCampaigns = await DonationCampaign.countDocuments(query); // Total campaigns for pagination
//     const campaigns = await DonationCampaign.find(query)
//       .populate('category') // Populate category if it's a reference, remove if unnecessary
//       .limit(perPage)
//       .skip((page - 1) * perPage) // Implement pagination
//       .exec();

//     if (!campaigns.length) {
//       return res.status(404).json({
//         status: false,
//         message: `No campaigns found for the category: ${category || 'All'} with search term: ${search || ''}`,
//         data: null,
//       });
//     }

//     // Format the image URLs
//     const updatedCampaigns = campaigns.map((campaign) => ({
//       ...campaign._doc,
//       main_picture: campaign.main_picture ? `${req.protocol}://${req.get('host')}/images/${campaign.main_picture}` : null,
//       other_pictures: campaign.other_pictures?.length
//         ? campaign.other_pictures.map((pic) => `${req.protocol}://${req.get('host')}/images/${pic}`)
//         : [],
//     }));

//     // Send response with pagination data
//     res.status(200).json({
//       status: true,
//       message: 'Campaigns fetched successfully',
//       data: {
//         campaigns: updatedCampaigns,
//         totalCampaigns, // Total number of matching campaigns for pagination
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

// Create a new donation campaign
export const createDonationCampaign = async (req, res) => {
  try {
    const { body: data } = req;

    // Generate a unique campaign ID
    const campaignId = uuidv4();

    let mainPictureUrl = null;
    const imageUrls = [];

    // Save main image
    if (req.body.main_picture && typeof req.body.main_picture === "string") {
      const buffer = base64ToBuffer(req.body.main_picture);
      mainPictureUrl = await uploadImageToFirebase(buffer, `campaign_${campaignId}_main`, 'image/jpeg');
      data.main_picture = mainPictureUrl;
    }

    // Save other images
    if (req.body.other_pictures && Array.isArray(req.body.other_pictures)) {
      for (let i = 0; i < req.body.other_pictures.length; i++) {
        if (typeof req.body.other_pictures[i] === "string") {
          const buffer = base64ToBuffer(req.body.other_pictures[i]);
          const imageUrl = await uploadImageToFirebase(buffer, `campaign_${campaignId}_other_${i}`, 'image/jpeg');
          imageUrls.push(imageUrl);
        }
      }
      data.other_pictures = imageUrls;
    }

    const campaign = new DonationCampaign(data);
    await campaign.save();

    res.status(200).json({ status: true, message: 'Campaign created successfully', data: campaign });
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

    // Update main image
    if (req.body.main_picture && typeof req.body.main_picture === "string") {
      const buffer = base64ToBuffer(req.body.main_picture);
      mainPictureUrl = await uploadImageToFirebase(buffer, `campaign_${id}_main`, 'image/jpeg');
      data.main_picture = mainPictureUrl;
    }

    // Update other images
    if (req.body.other_pictures && Array.isArray(req.body.other_pictures)) {
      for (let i = 0; i < req.body.other_pictures.length; i++) {
        if (typeof req.body.other_pictures[i] === "string") {
          const buffer = base64ToBuffer(req.body.other_pictures[i]);
          const imageUrl = await uploadImageToFirebase(buffer, `campaign_${id}_other_${i}`, 'image/jpeg');
          updatedImageUrls.push(imageUrl);
        }
      }
      data.other_pictures = [...campaign.other_pictures, ...updatedImageUrls];
    }

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
      await deleteObject(mainPicRef);
    }

    // Delete other pictures
    if (campaign.other_pictures) {
      await Promise.all(
        campaign.other_pictures.map(async (pic) => {
          const picRef = ref(storage, pic);
          await deleteObject(picRef);
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
