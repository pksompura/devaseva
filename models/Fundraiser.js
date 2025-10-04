import mongoose from "mongoose";

const fundraiserSchema = new mongoose.Schema(
  {
    mobile_number: {
      type: String,
      required: true,
      unique: true,
    },
    fundraiser_type: {
      type: String,
      enum: ["INDIVIDUAL", "NGO", "MEDIATION", "OTHER"],
      required: true,
    },
    full_name: { type: String }, // For individual fundraisers
    email: { type: String },
    ngo_name: { type: String }, // For NGOs
    mediator_name: { type: String }, // For mediation/other types
    is_verified: { type: Boolean, default: false },
    otp: { type: String }, // Temporary OTP
    otp_expiry: { type: Date },
    role: { type: String, default: "fundraiser" }, // For JWT role
    isBlocked: { type: Boolean, default: false }, // Optional: block fundraisers
  },
  { timestamps: true }
);

export default mongoose.model("Fundraiser", fundraiserSchema);
