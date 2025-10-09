import express from "express";
import { initAuth, digiCallback, fetchKycData } from "../controllers/kyc.js";

const router = express.Router();

// Step 1: Start DigiLocker auth flow
router.get("/init", initAuth);

// Step 2: DigiLocker redirects here with code
router.get("/callback", digiCallback);

// Step 3: Fetch Aadhaar/PAN data after success
router.get("/fetch", fetchKycData);

export default router;
