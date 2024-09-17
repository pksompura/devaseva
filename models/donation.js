import mongoose from 'mongoose';

const donationSchema = new mongoose.Schema({
  donated_date: {
    type: Date,
    default: Date.now,
  },
  total_amount: {
    type: mongoose.Types.Decimal128,
    required: true,
  },
  donation_campaign_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DonationCampaign',
    required: true,
  },
  transaction_id: {
    type: String,
    required: true,
    unique: true,
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  payment_method: {
    type: String,
    enum: ['credit_card', 'debit_card', 'net_banking', 'wallet', 'upi', 'other'],
    required: true,
  },
  paid: {
    type: Boolean,
    default: true,
    required: true,
  },
  payment_status: {
    type: String,
    enum: ['successful', 'failed', 'pending'],
    default: 'pending',
  },
  currency: {
    type: String,
    default: 'INR',
  },
  receipt_url: {
    type: String,
  },
  notes: {
    type: String,
  },
});

donationSchema.index({ user_id: 1 });
donationSchema.index({ donation_campaign_id: 1 });
donationSchema.index({ transaction_id: 1 });

const Donation = mongoose.model('Donation', donationSchema);

export default Donation;
