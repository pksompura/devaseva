import mongoose, { model } from "mongoose";
const { Schema, Types } = mongoose;

const OrgMemberSchema = new Schema(
  {
    orgId: { type: Types.ObjectId, ref: "Organization", index: true },
    userId: { type: Types.ObjectId, ref: "User", index: true },
    role: { type: String, enum: ["OWNER", "STAFF"], default: "STAFF" },
  },
  { timestamps: true }
);

OrgMemberSchema.index({ orgId: 1, userId: 1 }, { unique: true });

export default model("OrgMember", OrgMemberSchema);
