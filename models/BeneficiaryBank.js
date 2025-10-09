import mongoose from "mongoose";

const beneficiaryBankSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User_donation",
      required: true,
    },
    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DonationCampaign",
      required: true,
    },
    bank_name: { type: String, required: true },
    account_holder_name: { type: String, required: true },
    account_number: { type: String, required: true },
    ifsc_code: { type: String, required: true },
    verified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const BeneficiaryBank = mongoose.model(
  "BeneficiaryBank",
  beneficiaryBankSchema
);
export default BeneficiaryBank;
