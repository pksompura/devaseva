// routes/orgAdminRoutes.js (ESM)
import { Router } from "express";
import { authenticateAdmin } from "../middleware/authMiddleware.js";
import * as adminCtrl from "../controllers/adminOrg.js";

const router = Router();

// NGO review list
router.get("/orgs", authenticateAdmin, adminCtrl.listOrgs);

// Approve/Reject/Request Info
router.post("/orgs/:orgId/decision", authenticateAdmin, adminCtrl.decideOrg);

// Payout verification & actions
router.post(
  "/orgs/:orgId/payout-verify",
  authenticateAdmin,
  adminCtrl.verifyPayoutAccount
);
router.post(
  "/payouts/:payoutId/approve",
  authenticateAdmin,
  adminCtrl.approvePayout
);
router.post(
  "/payouts/:payoutId/reject",
  authenticateAdmin,
  adminCtrl.rejectPayout
);
router.post(
  "/payouts/:payoutId/mark-paid",
  authenticateAdmin,
  adminCtrl.markPayoutPaid
);

export default router;
