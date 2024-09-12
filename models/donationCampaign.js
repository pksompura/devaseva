import mongoose from 'mongoose';

// Donation Campaign Schema
const donationCampaignSchema = new mongoose.Schema({
  // Campaign Title
  campaign_title: {
    type: String,
    required: true,
  },
  
  // Short Description
  short_description: {
    type: String,
    required: true,
  },

  // Campaign Description
  campaign_description: {
    type: String,
    required: true,
  },
  
  // Target Amount
  target_amount: {
    type: mongoose.Types.Decimal128,
    required: true,
  },
  
  // Minimum Donation Amount
  minimum_amount: {
    type: mongoose.Types.Decimal128,
    required: true,
  },
  
  // Campaign Start Date
  start_date: {
    type: Date,
    required: true,
  },
  
  // Campaign End Date
  end_date: {
    type: Date,
    required: true,
    validate: {
      validator: function(value) {
        return value > this.start_date;
      },
      message: 'End date must be after the start date',
    },
  },
  
  // Campaign Main Picture (Single Image URL/Path)
  main_picture: {
    type: String,
  },
  
  // Campaign Other Pictures (Array of Image URLs/Paths)
  other_pictures: [{
    type: String,
  }],
  
  // Video Link
  video_link: {
    type: String,
  },
  
  // NGO Name
  ngo_name: {
    type: String,
    required: true,
  },
  
  // Establishment Year of NGO
  establishment_year: {
    type: Number,
  },
  
  // State of the Campaign
  state: {
    type: String,
    required: true,
  },
  
  // Beneficiary Details
  beneficiary: {
    type: String,
    required: true,
  },
  
  // Approval Status
  is_approved: {
    type: Boolean,
    default: false,
  },
  
  // Expiration Status
  is_expired: {
    type: Boolean,
    default: false,
  },
  
  // Reference to Category
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category', // Assuming you have a Category model
    required: true,  // Optional based on your use case
  },
});

const DonationCampaign = mongoose.model('DonationCampaign', donationCampaignSchema);

export default DonationCampaign;
