import mongoose, { model } from "mongoose";
const { Schema, Types } = mongoose;

const PayoutSchema = new Schema(
  {
    orgId: { type: Types.ObjectId, ref: "Organization", index: true },
    campaignId: { type: Types.ObjectId, ref: "Campaign" },
    amountRequested: { type: Number, required: true },
    status: {
      type: String,
      enum: ["REQUESTED", "IN_REVIEW", "APPROVED", "PAID", "REJECTED"],
      default: "REQUESTED",
    },
    adminNote: String,
    settlementRef: String,
  },
  { timestamps: true }
);

export default model("Payout", PayoutSchema);
