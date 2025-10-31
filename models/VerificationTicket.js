import mongoose, { model } from "mongoose";
const { Schema, Types } = mongoose;

const VerificationTicketSchema = new Schema(
  {
    targetType: {
      type: String,
      enum: ["ORGANIZATION", "CAMPAIGN"],
      required: true,
    },
    targetId: { type: Types.ObjectId, required: true, index: true },
    status: {
      type: String,
      enum: ["OPEN", "INFO_REQUESTED", "APPROVED", "REJECTED"],
      default: "OPEN",
    },
    checklist: [
      {
        key: String,
        label: String,
        passed: Boolean,
        comment: String,
      },
    ],
    messages: [
      {
        by: { type: String, enum: ["ADMIN", "ORG", "SYSTEM"] },
        text: String,
        attachments: [String],
        at: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

export default model("VerificationTicket", VerificationTicketSchema);
