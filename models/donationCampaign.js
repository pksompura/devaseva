import mongoose from 'mongoose';

// Donation Campaign Schema
const donationCampaignSchema = new mongoose.Schema({
  featured_image_base_url: String,
  featured_image_path: String,
  temple_name: String,
  campaign_name: String,
  description: String,
  short_name: String,
  short_description: String,
  location: String,
  event: String,
  priority: Number,
  target_amount: mongoose.Types.Decimal128,
  donated_amount: {
    type: mongoose.Types.Decimal128,
    default: 0.00,
  },
  start_date: Date,
  expiry_date: Date,
  is_published: Boolean,
  is_expired: Boolean,
  tax_beneficiary: Boolean,
  billing_address: Boolean,
  about: String,
  is_active: Boolean,
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
 
  row_pre_id: String,
  is_anonymous: Boolean,
  is_whatsapp_update: Boolean,
  minimum_amount: mongoose.Types.Decimal128,
  banner_image_id: mongoose.Schema.Types.ObjectId,
  trust: String,
  category_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DonationCategory',
  },
  // Add subdonations field to link with Subdonation model
  subdonations: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subdonations',
  }],
});

const DonationCampaign = mongoose.model('DonationCampaign', donationCampaignSchema);

export default DonationCampaign;
