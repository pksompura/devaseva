import express from "express";
import {
  sendFundraiserOTP,
  verifyFundraiserOTP,
  logoutFundraiser,
  updateFundraiser,
  getFundraiser,
  listFundraisers,
  upsertKYC,
  listKYC,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  getCampaign,
  listCampaigns,
  createTransaction,
  getTransaction,
  listTransactions,
  get80GReference,
} from "../controllers/fundraiser.js";

import {
  authenticateUser,
  authenticateAdmin,
} from "../middleware/authMiddleware.js";

const router = express.Router();

/* ----- AUTH ----- */
router.post("/sendOtp", sendFundraiserOTP);
router.post("/verifyOtp", verifyFundraiserOTP);

router.post("/logout", authenticateUser, logoutFundraiser);

/* ----- FUNDRAISER PROFILE ----- */
router.get("/profile", authenticateUser, getFundraiser);
router.put("/profile", authenticateUser, updateFundraiser);

/* ----- LIST ALL FUNDRAISERS (ADMIN ONLY) ----- */
router.get("/", authenticateAdmin, listFundraisers);

/* ----- KYC ----- */
router.put("/kyc", authenticateUser, upsertKYC);
router.get("/kyc", authenticateAdmin, listKYC);

/* ----- CAMPAIGNS ----- */
router.post("/campaign", authenticateUser, createCampaign);
router.put("/campaign/:id", authenticateUser, updateCampaign);
router.delete("/campaign/:id", authenticateUser, deleteCampaign);
router.get("/campaign/:id", authenticateUser, getCampaign);
router.get("/campaigns", authenticateUser, listCampaigns);

/* ----- TRANSACTIONS ----- */
router.post("/transaction", authenticateUser, createTransaction);
router.get("/transaction/:id", authenticateUser, getTransaction);
router.get("/transactions", authenticateUser, listTransactions);

/* ----- 80G REFERENCE ----- */
router.get("/80g-reference", authenticateUser, get80GReference);

export default router;
