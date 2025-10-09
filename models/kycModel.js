import mongoose from "mongoose";

const kycSchema = new mongoose.Schema(
  {
    aadhaar: { type: String },
    name: String,
    dob: String,
    gender: String,
    verified: { type: Boolean, default: false },
    linked_user: { type: mongoose.Schema.Types.ObjectId, ref: "User_donation" },
  },
  { timestamps: true }
);

export default mongoose.model("Kyc", kycSchema);
