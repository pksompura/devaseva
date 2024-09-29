import mongoose from 'mongoose';

const donationCampaignSchema = new mongoose.Schema({
  campaign_title: {
    type: String,
    required: true, // Required during creation
  },
  
  

  // Campaign Description
  campaign_description: {
    type: String,
    required: true, // Required during creation
  },
  
  // Campaign Main Picture (Single Image URL/Path)
  main_picture: {
    type: String,
    required: true, // Required during creation
  },
  
  // Campaign Other Pictures (Array of Image URLs/Paths)
  other_pictures: [{
    type: String,
  }],
  
  // Target Amount (Optional during creation, can be added later)
  target_amount: {
    type: mongoose.Types.Decimal128,
    required: false,
  },
  
  // Minimum Donation Amount (Optional during creation, can be added later)
  minimum_amount: {
    type: mongoose.Types.Decimal128,
    required: false,
  },
  
  

  video_link: {
    type: String,
    required: false,
  },
  
  ngo_name: {
    type: String,
    required: false,
  },
  
  
  
  state: {
    type: String,
    required: false,
  },
  
  video: {
    type: String,
    required: false,
  },
  
  // Approval Status
  is_approved: {
    type: Boolean,
    default: false,
  },
  is_tax: {
    type: Boolean,
    default: false,
  },
  
  // Expiration Status
  is_expired: {
    type: Boolean,
    default: false,
  },
  
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: false,
  },

  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User_donation',
    required: true,
  },
});

const DonationCampaign = mongoose.model('DonationCampaign', donationCampaignSchema);

export default DonationCampaign;
