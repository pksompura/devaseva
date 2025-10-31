import mongoose, { model } from "mongoose";
const { Schema, Types } = mongoose;

const OrganizationSchema = new Schema(
  {
    registrationType: {
      type: String,
      enum: ["TRUST", "SOCIETY", "SECTION8", "NONE"],
      required: true,
    },
    name: { type: String, required: true },
    registeredAddress: { type: String, required: true },
    causes: [{ type: String, index: true }],
    founders: [{ name: String, linkedinUrl: String }],
    primaryContact: {
      name: String,
      phone: String,
      email: String,
      role: String,
    },
    has80G: { type: Boolean, default: false },
    hasFCRA: { type: Boolean, default: false },
    profile: {
      website: String,
      lastFYBudgetBand: { type: String, enum: ["0_25L", "25L_1CR", "GT_1CR"] },
      donorBaseBand: { type: String, enum: ["0_100", "100_500", "GT_500"] },
      employeeCountBand: { type: String, enum: ["0_25", "25_100", "GT_100"] },
      crowdfundedBefore: { type: Boolean, default: false },
      planToCreateIn: { type: String, enum: ["3_5", "8_10", "GT_15"] },
    },
    ownerUserId: { type: Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["PENDING_REVIEW", "INFO_REQUESTED", "APPROVED", "REJECTED"],
      default: "PENDING_REVIEW",
      index: true,
    },
    notes: String,
    payoutAccount: {
      beneficiaryName: String,
      accountNumber: String,
      ifsc: String,
      upiVpa: String,
    },
    payoutStatus: {
      type: String,
      enum: ["UNSET", "PENDING", "VERIFIED"],
      default: "UNSET",
    },
    review: {
      riskScore: { type: Number, default: 0 },
      reviewerUserId: { type: Types.ObjectId, ref: "User" },
      reasons: [String],
    },
  },
  { timestamps: true }
);

export default model("Organization", OrganizationSchema);
