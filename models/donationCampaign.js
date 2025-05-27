import mongoose from "mongoose";

const donationCampaignSchema = new mongoose.Schema(
  {
    campaign_title: {
      type: String,
      required: true,
    },
    // Campaign Description
    campaign_description: {
      type: String,
      required: true,
    },
    story: {
      type: String,
      required: false,
    },
    main_picture: {
      type: String,
      required: true,
    },

    other_pictures: [
      {
        type: String,
      },
    ],

    target_amount: {
      type: mongoose.Types.Decimal128,
      required: false,
    },

    minimum_amount: {
      type: mongoose.Types.Decimal128,
      required: false,
    },

    raised_amount: {
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
    beneficiary: {
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
    is_validated: {
      type: Boolean,
      default: false,
    },
    hidden: {
      type: Boolean,
      default: false,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: false,
    },

    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User_donation",
      required: true,
    },
    donation_amounts: [
      {
        type: mongoose.Types.Decimal128,
        required: false,
      },
    ],
  },
  { timestamps: true }
);

const DonationCampaign = mongoose.model(
  "DonationCampaign",
  donationCampaignSchema
);

export default DonationCampaign;
