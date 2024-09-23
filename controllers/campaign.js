import DonationCampaign from '../models/donationCampaign.js';
import { initializeApp } from 'firebase/app';
import { getStorage, ref, getDownloadURL, uploadBytesResumable, deleteObject ,listAll} from 'firebase/storage';
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
    return downloadURL; 
  } catch (err) {
    console.error('Firebase upload error:', err);
    throw new Error('Failed to upload image to Firebase');
  }
};

const sendOTP = (phoneNumber, otp) => {
  const apiKey = process.env.TEXTLOCAL_API_KEY;
  const sender = 'TXTLCL';
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
      imageUrl, 
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
    // Fetch only approved campaigns by adding a filter for `is_approved: true`
    const count = await DonationCampaign.countDocuments({ is_approved: true });
    const campaigns = await DonationCampaign.find({ is_approved: true }) // Filter for approved campaigns
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

export const listDonationCampaignsFalse = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const perPage = parseInt(req.query.perPage) || 10;

  try {
    // Fetch only approved campaigns by adding a filter for `is_approved: true`
    const count = await DonationCampaign.countDocuments({ is_approved: false }).populate('User_donation');
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

export const getCampaignsByCategoryWithSearch = async (req, res) => {
  try {
    const { category } = req.params;
    const { search } = req.query;
    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.perPage) || 10;

    // Initialize the query object
    const query = {};

    // Only apply the category filter if it's not 'All' or undefined
    if (category && category !== 'All') {
      query.category = category;
    }

    // Apply the search filter if a search term is provided
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } }, // Case-insensitive search on title
        { organization: { $regex: search, $options: 'i' } }, // Case-insensitive search on organization
      ];
    }

    // Count total campaigns that match the query
    const totalCampaigns = await DonationCampaign.countDocuments(query);
    
    // Fetch the campaigns with pagination and optional search & category filter
    const campaigns = await DonationCampaign.find(query)
      .populate('category')
      .limit(perPage)
      .skip((page - 1) * perPage)
      .exec();

    // If no campaigns found, send a 404 response
    if (!campaigns.length) {
      return res.status(404).json({
        status: false,
        message: `No campaigns found for the category: ${category || 'All'} with search term: ${search || ''}`,
        data: null,
      });
    }

    // Return success response with campaigns data
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
    // Handle errors and send a 400 response with the error message
    res.status(400).json({ status: false, message: error.message, data: null });
  }
};



export const createCampaignWithLimitedFields = async (req, res) => {
  try {
    // Destructure only the required fields from the request body
    console.log(req.user)
    const { campaign_title, short_description, main_picture, other_pictures, campaign_description } = req.body;

    // Validate required fields
    if (!campaign_title || !short_description || !main_picture || !campaign_description) {
      return res.status(400).json({ 
        status: false, 
        message: 'Please provide all required fields: campaign_title, short_description, main_picture, and campaign_description.' 
      });
    }

    // Generate a unique campaign ID
    const campaignId = uuidv4();

    // Handle main picture upload
    let mainPictureUrl = null;
    if (typeof main_picture === 'string' && /^data:image\/[a-zA-Z]+;base64,/.test(main_picture)) {
      const buffer = base64ToBuffer(main_picture); // Convert base64 to buffer
      mainPictureUrl = await uploadImageToFirebase(buffer, `campaign_${campaignId}/main_picture.jpeg`, 'image/jpeg');
    }

    // Handle other pictures upload
    let otherPicturesUrls = [];
    if (Array.isArray(other_pictures)) {
      for (let i = 0; i < other_pictures.length; i++) {
        const picture = other_pictures[i];
        if (typeof picture === 'string' && /^data:image\/[a-zA-Z]+;base64,/.test(picture)) {
          const buffer = base64ToBuffer(picture);
          const imageUrl = await uploadImageToFirebase(buffer, `campaign_${campaignId}/other_picture_${i}.jpeg`, 'image/jpeg');
          otherPicturesUrls.push(imageUrl);
        }
      }
    }

    // Create the new campaign object
    const newCampaign = new DonationCampaign({
      campaign_title,
      short_description,
      campaign_description,
      main_picture: mainPictureUrl,
      other_pictures: otherPicturesUrls,
      created_by:req.user.id,
    });

    // Save the campaign to the database
    await newCampaign.save();

    // Return success response
    res.status(201).json({
      status: true,
      message: 'Campaign created successfully',
      data: newCampaign,
    });
  } catch (error) {
    // Handle any errors during the process
    res.status(500).json({
      status: false,
      message: 'Error creating campaign: ' + error.message,
    });
  }
};
export const updateCampaignWithLimitedFields = async (req, res) => {
  try {
    const { id } = req.body; // Get campaign ID from request body
    const { campaign_title, short_description, main_picture, other_pictures, campaign_description } = req.body;

    // Validate required fields
    if (!campaign_title || !short_description || !main_picture || !campaign_description) {
      return res.status(400).json({
        status: false,
        message: 'Please provide all required fields: campaign_title, short_description, main_picture, and campaign_description.',
      });
    }

    // Find the campaign by ID
    const campaign = await DonationCampaign.findById(id);
    if (!campaign) {
      return res.status(404).json({
        status: false,
        message: 'Campaign not found',
      });
    }

    // Update text fields
    campaign.campaign_title = campaign_title;
    campaign.short_description = short_description;
    campaign.campaign_description = campaign_description;

    // Handle main picture update
    if (main_picture && /^data:image\/[a-zA-Z]+;base64,/.test(main_picture)) {
      // Delete old main picture from Firebase if it exists
      if (campaign.main_picture && campaign.main_picture.startsWith('https://')) {
        const mainPicRef = ref(storage, campaign.main_picture);
        try {
          await deleteObject(mainPicRef);
        } catch (err) {
          console.error('Failed to delete old main picture from Firebase:', err);
        }
      }

      // Upload the new base64 main picture
      const buffer = base64ToBuffer(main_picture);
      const newMainPictureUrl = await uploadImageToFirebase(buffer, `campaign_${id}/main_picture.jpeg`, 'image/jpeg');
      campaign.main_picture = newMainPictureUrl; // Store the Firebase URL
    } else if (main_picture.startsWith('https://')) {
      // Retain existing Firebase URL for main picture
      campaign.main_picture = main_picture;
    } else {
      return res.status(400).json({ error: 'Invalid main picture URL provided' });
    }

    // Handle other pictures update
    const existingUrls = other_pictures.filter((picture) => picture.startsWith('https://')); // Retain only URLs
    const newOtherPictures = [];

    // Loop through other pictures to handle base64 images
    for (let i = 0; i < other_pictures.length; i++) {
      const picture = other_pictures[i];
      if (/^data:image\/[a-zA-Z]+;base64,/.test(picture)) {
        // Convert base64 to buffer and upload to Firebase
        const buffer = base64ToBuffer(picture);
        const uploadedUrl = await uploadImageToFirebase(buffer, `campaign_${id}/other_picture_${i}.jpeg`, 'image/jpeg');
        newOtherPictures.push(uploadedUrl); // Store Firebase URL in the new list
      }
    }

    // Delete any old pictures that are not in the updated URL list
    const oldPictures = campaign.other_pictures || [];
    await Promise.all(oldPictures.map(async (oldPic) => {
      if (!existingUrls.includes(oldPic)) {
        const picRef = ref(storage, oldPic);
        try {
          await deleteObject(picRef); // Delete old pictures from Firebase
        } catch (err) {
          console.error('Failed to delete old picture from Firebase:', err);
        }
      }
    }));

    // Combine existing URLs and newly uploaded URLs for other pictures
    campaign.other_pictures = [...existingUrls, ...newOtherPictures];

    // Save the updated campaign
    await campaign.save();

    // Return success response
    res.status(200).json({
      status: true,
      message: 'Campaign updated successfully',
      data: campaign,
    });
  } catch (error) {
    // Handle errors during the update process
    res.status(500).json({
      status: false,
      message: 'Error updating campaign: ' + error.message,
    });
  }
};




export const getCampaignById = async (req, res) => {
  try {
    const { id } = req.params; // Get campaign id from request params

    // Find the campaign by id
    const campaign = await DonationCampaign.findById(id).populate('created_by');  
    if (!campaign) {
      return res.status(404).json({
        status: false,
        message: 'Campaign not found',
      });
    }

    // Return success response with the campaign data
    res.status(200).json({
      status: true,
      message: 'Campaign fetched successfully',
      data: campaign,
    });
  } catch (error) {
    // Handle any errors during the process
    res.status(500).json({
      status: false,
      message: 'Error fetching campaign: ' + error.message,
    });
  }
};


export const getDonationCampaignsByUser = async (req, res) => {
  try {
    // Extract user ID from the request object (assuming user is authenticated and attached in middleware)
    const userId = req.user.id;
console.log(userId)
    // Fetch all campaigns created by the user
    const campaigns = await DonationCampaign.find({ created_by: userId })
    // .populate('category'); // You can populate other fields if needed

    // Check if the user has any campaigns
    if (!campaigns.length) {
      return res.status(404).json({
        status: false,
        message: 'No donation campaigns found for this user',
        data: null,
      });
    }

    // Return success response with the user's campaigns
    res.status(200).json({
      status: true,
      message: 'Campaigns fetched successfully',
      data: campaigns,
    });
  } catch (error) {
    // Handle any errors
    res.status(500).json({
      status: false,
      message: 'Error fetching campaigns: ' + error.message,
    });
  }
};


const uploadImageToFirebaseBanners = async (buffer, fileName, contentType) => {
  try {
    const storage = getStorage();
    const storageRef = ref(storage, `banners/${fileName}`); // Store in 'banners/' folder

    const metadata = {
      contentType, // Example: 'image/jpeg'
    };

    // Upload image to the specified path in Firebase Storage
    const uploadTask = await uploadBytesResumable(storageRef, buffer, metadata);

    // Get download URL of the uploaded image
    const downloadURL = await getDownloadURL(uploadTask.ref);
    return downloadURL;
  } catch (error) {
    throw new Error('Error uploading image to Firebase');
  }
};

export const uploadBannerImage = async (req, res) => {
  try {
    const { image } = req.body;

    // Ensure image is provided
    if (!image || typeof image !== 'string') {
      return res.status(400).json({ error: 'Banner image is required' });
    }

    // Convert base64 to buffer
    const buffer = base64ToBuffer(image);
    
    // Generate a unique filename for the banner
    const fileName = `banner_${uuidv4()}.jpeg`;

    // Upload the image to Firebase
    const imageUrl = await uploadImageToFirebaseBanners(buffer, fileName, 'image/jpeg');

    res.status(200).json({
      status: true,
      message: 'Banner image uploaded successfully',
      imageUrl,
    });
  } catch (error) {
    console.error('Error uploading banner:', error);
    res.status(500).json({ error: 'Failed to upload banner image' });
  }
};

// API to update an existing banner image
export const updateBannerImage = async (req, res) => {
  try {
    const { imageUrl, newImage } = req.body;

    // Ensure both image URL and new image data are provided
    if (!imageUrl || !newImage) {
      return res.status(400).json({ error: 'Image URL and new image are required' });
    }

    // Extract the file path from the imageUrl
    const filePath = imageUrl.split('/o/')[1].split('?')[0].replace(/%2F/g, '/');
    const imageRef = ref(storage, filePath);

    // Delete the old image from Firebase
    await deleteObject(imageRef);

    // Convert new base64 image to buffer
    const buffer = base64ToBuffer(newImage);
    
    // Generate a new file name for the updated banner image
    const fileName = `banner_${uuidv4()}.jpeg`;

    // Upload the new image to Firebase
    const newImageUrl = await uploadImageToFirebaseBanners(buffer, fileName, 'image/jpeg');

    res.status(200).json({
      status: true,
      message: 'Banner image updated successfully',
      newImageUrl,
    });
  } catch (error) {
    console.error('Error updating banner:', error);
    res.status(500).json({ error: 'Failed to update banner image' });
  }
};

// API to delete a banner image
export const deleteBannerImage = async (req, res) => {
  try {
    const { imageUrl } = req.body;

    // Ensure image URL is provided
    if (!imageUrl) {
      return res.status(400).json({ error: 'Image URL is required' });
    }

    // Extract the file path from the imageUrl
    const filePath = imageUrl.split('/o/')[1].split('?')[0].replace(/%2F/g, '/');
    const imageRef = ref(storage, filePath);

    // Delete the image from Firebase
    await deleteObject(imageRef);

    res.status(200).json({
      status: true,
      message: 'Banner image deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting banner:', error);
    res.status(500).json({ error: 'Failed to delete banner image' });
  }
};

// API to list banner images (limit to 3)
export const listBannerImages = async (req, res) => {
  try {
    // Define a folder path where banner images are stored
    const bannerRef = ref(storage, 'banners/');
    console.log(bannerRef)
    // Call Firebase API to list all files in the banners folder (up to 3 images)
    const result = await listAll(bannerRef);

    // Get download URLs for the listed images
    const imageUrls = await Promise.all(
      result.items.slice(0, 3).map(async (itemRef) => {
        const url = await getDownloadURL(itemRef);
        return url;
      })
    );

    res.status(200).json({
      status: true,
      message: 'Banner images fetched successfully',
      banners: imageUrls,
    });
  } catch (error) {
    console.error('Error listing banners:', error);
    res.status(500).json({ error: 'Failed to list banner images' });
  }
};