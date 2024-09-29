import mongoose from 'mongoose';

// Donation Campaign Schema
const donationCampaignSchema = new mongoose.Schema({
  campaign_title: {
    type: String,
    required: true, // Required during creation
  },
  
  // Short Description
  short_description: {
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
  
  // Campaign Start Date (Optional during creation, can be added later)
  start_date: {
    type: Date,
    required: false,
  },
  
  // Campaign End Date (Optional during creation, can be added later)
  end_date: {
    type: Date,
    required: false,
    validate: {
      validator: function(value) {
        return value > this.start_date;
      },
      message: 'End date must be after the start date',
    },
  },

  video_link: {
    type: String,
    required: false,
  },
  
  ngo_name: {
    type: String,
    required: false,
  },
  
  establishment_year: {
    type: Number,
    required: false,
  },
  
  state: {
    type: String,
    required: false,
  },
  
  // Beneficiary Details (Optional during creation)
  beneficiary: {
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
  
  // Reference to Category (Optional during creation)
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: false,
  },

  // Reference to User (Creator of the Campaign)
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User_donation',
    required: true,
  },
});

const DonationCampaign = mongoose.model('DonationCampaign', donationCampaignSchema);

export default DonationCampaign;
