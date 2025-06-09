import mongoose from "mongoose";

const donationSchema = new mongoose.Schema(
  {
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
      ref: "DonationCampaign",
      required: true,
    },
    transaction_id: {
      type: String,
      required: true,
      unique: true,
    },
    razorpay_payment_id: {
      type: String,
    },

    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User_donation",
      required: true,
    },
    payment_method: {
      type: String,
      enum: [
        "credit_card",
        "debit_card",
        "net_banking",
        "wallet",
        "upi",
        "other",
      ],
      required: false,
    },
    paid: {
      type: Boolean,
      default: true,
      required: true,
    },
    payment_status: {
      type: String,
      enum: ["successful", "failed", "pending"],
      default: "pending",
    },
    currency: {
      type: String,
      default: "INR",
    },
    receipt_url: {
      type: String,
    },
    notes: {
      type: String,
    },
    ip_address: {
      type: String,
      required: false,
    },
    device_info: {
      type: String,
      required: false,
    },
    browser_type: {
      type: String,
      required: false,
    },
    retry_count: {
      type: Number,
      default: 0,
    },
    is_anonymous: {
      type: Boolean,
      default: false,
    },

    // ✅ Add these new fields below
    pan_number: {
      type: String,
      maxlength: 10,
      minlength: 10,
      uppercase: true,
      match: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, // PAN number format validation
    },
    full_address: {
      type: String,
      required: false,
    },
    issued_80g: { type: Boolean, default: false }, // for tracking certificate status
  },
  { timestamps: true }
);

donationSchema.index({ user_id: 1 });
donationSchema.index({ donation_campaign_id: 1 });
donationSchema.index({ transaction_id: 1 });

const Donation = mongoose.model("Donation", donationSchema);

export default Donation;
