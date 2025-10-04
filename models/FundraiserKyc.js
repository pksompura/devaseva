import mongoose from "mongoose";

const fundraiserKycSchema = new mongoose.Schema(
  {
    fundraiser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Fundraiser",
      required: true,
    },
    pan_number: { type: String },
    aadhaar_number: { type: String },
    bank_account: { type: String },
    ifsc_code: { type: String },
    documents: [{ type: String }], // File URLs
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
    },
  },
  { timestamps: true }
);

export default mongoose.model("FundraiserKyc", fundraiserKycSchema);
