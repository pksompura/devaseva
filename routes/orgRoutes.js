// routes/orgRoutes.js (ESM)
import { Router } from "express";
import {
  authenticateUser,
  requireRoles,
  // optional org-role guard if you enabled it
  // requireOrgRole,
} from "../middleware/authMiddleware.js";
import * as orgCtrl from "../controllers/organization.js";

const router = Router();

// NGO Apply (any logged-in user or fundraiser can apply)
// If you want to restrict: requireRoles('user','fundraiser','ngo_owner','ngo_staff','admin')
router.post("/apply", authenticateUser, orgCtrl.apply);

// Application status + ticket
router.get("/:orgId/application", authenticateUser, orgCtrl.getApplication);

// Upload KYC doc (ORG side)
router.post("/:orgId/kyc/upload", authenticateUser, orgCtrl.uploadKyc);

// ORG → Admin thread messages
router.post("/:orgId/ticket/message", authenticateUser, orgCtrl.ticketMessage);

// Payouts (recommend OWNER only; if you use requireOrgRole)
/// router.post("/:orgId/payouts", authenticateUser, requireOrgRole("OWNER"), orgCtrl.requestPayout);
router.post("/:orgId/payouts", authenticateUser, orgCtrl.requestPayout);
router.get("/:orgId/payouts", authenticateUser, orgCtrl.getPayouts);

export default router;
