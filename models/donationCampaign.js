// import mongoose from "mongoose";

// const donationCampaignSchema = new mongoose.Schema(
//   {
//     campaign_title: {
//       type: String,
//       required: true,
//     },
//     // Campaign Description
//     campaign_description: {
//       type: String,
//       required: true,
//     },
//     story: {
//       type: String,
//       required: false,
//     },
//     main_picture: {
//       type: String,
//       required: true,
//     },

//     other_pictures: [
//       {
//         type: String,
//       },
//     ],

//     target_amount: {
//       type: mongoose.Types.Decimal128,
//       required: false,
//     },

//     minimum_amount: {
//       type: mongoose.Types.Decimal128,
//       required: false,
//     },

//     raised_amount: {
//       type: mongoose.Types.Decimal128,
//       required: false,
//     },

//     video_link: {
//       type: String,
//       required: false,
//     },

//     ngo_name: {
//       type: String,
//       required: false,
//     },
//     beneficiary: {
//       type: String,
//       required: false,
//     },
//     state: {
//       type: String,
//       required: false,
//     },

//     video: {
//       type: String,
//       required: false,
//     },

//     // Approval Status
//     is_approved: {
//       type: Boolean,
//       default: false,
//     },

//     is_tax: {
//       type: Boolean,
//       default: false,
//     },

//     // Expiration Status
//     is_validated: {
//       type: Boolean,
//       default: false,
//     },
//     hidden: {
//       type: Boolean,
//       default: false,
//     },
//     category: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Category",
//       required: false,
//     },

//     created_by: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User_donation",
//       required: true,
//     },
//     donation_amounts: [
//       {
//         type: mongoose.Types.Decimal128,
//         required: false,
//       },
//     ],
//   },
//   { timestamps: true }
// );

// const DonationCampaign = mongoose.model(
//   "DonationCampaign",
//   donationCampaignSchema
// );

// export default DonationCampaign;
import mongoose from "mongoose";

const donationCampaignSchema = new mongoose.Schema(
  {
    // Common fields
    campaign_title: {
      type: String,
      required: true,
    },
    short_description: {
      type: String,
      required: false, // Fundraiser fills this, Admin may ignore
    },
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

    // Fundraiser-specific extra fields
    beneficiary_type: {
      type: String, // myself, family, NGO, etc.
      required: false,
    },
    cause_category: {
      type: String, // medical, education, memorial, others
      required: false,
    },
    dynamic_fields: {
      type: mongoose.Schema.Types.Mixed, // flexible JSON object
      default: {},
    },
    phone_number: {
      type: String, // OTP verification
      required: false,
    },
    terms_agreed: {
      type: Boolean,
      default: false,
    },

    // Financials
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
    donation_amounts: [
      {
        type: mongoose.Types.Decimal128,
        required: false,
      },
    ],

    // Media
    video_link: {
      type: String,
      required: false,
    },

    // Metadata
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

    // Status flags
    is_approved: {
      type: Boolean,
      default: false,
    },
    is_tax: {
      type: Boolean,
      default: false,
    },
    is_validated: {
      type: Boolean,
      default: false,
    },
    hidden: {
      type: Boolean,
      default: false,
    },

    // Relations
    // in donationCampaignSchema
    category: {
      type: String, // ✅ accept plain string instead of ObjectId
      required: false,
    },

    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User_donation",
      required: true,
    },
  },
  { timestamps: true }
);

const DonationCampaign = mongoose.model(
  "DonationCampaign",
  donationCampaignSchema
);

export default DonationCampaign;
