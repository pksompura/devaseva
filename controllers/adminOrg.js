// // controllers/adminOrg.js (ESM)
// import Organization from "../models/Organization.js";
// import VerificationTicket from "../models/VerificationTicket.js";
// import Payout from "../models/Payout.js";

// export const listOrgs = async (req, res) => {
//   const { status } = req.query;
//   const q = status ? { status } : {};
//   const orgs = await Organization.find(q).sort({ createdAt: -1 }).limit(200);
//   res.json({ ok: true, data: orgs });
// };

// export const decideOrg = async (req, res) => {
//   const { orgId } = req.params;
//   const { decision, checklist = [], reasons = [] } = req.body; // APPROVE | REJECT | REQUEST_INFO
//   const org = await Organization.findById(orgId);
//   const ticket = await VerificationTicket.findOne({
//     targetType: "ORGANIZATION",
//     targetId: orgId,
//   }).sort({ createdAt: -1 });
//   if (!org || !ticket) return res.status(404).json({ error: "Not found" });

//   if (checklist?.length) ticket.checklist = checklist;

//   if (decision === "APPROVE") {
//     org.status = "APPROVED";
//     ticket.status = "APPROVED";
//   } else if (decision === "REJECT") {
//     org.status = "REJECTED";
//     org.review = { ...(org.review || {}), reasons };
//     ticket.status = "REJECTED";
//   } else {
//     org.status = "INFO_REQUESTED";
//     org.review = { ...(org.review || {}), reasons };
//     ticket.status = "INFO_REQUESTED";
//   }

//   await org.save();
//   await ticket.save();
//   res.json({ ok: true });
// };

// export const verifyPayoutAccount = async (req, res) => {
//   const { orgId } = req.params;
//   const { verified, ref } = req.body;
//   const org = await Organization.findById(orgId);
//   if (!org) return res.status(404).json({ error: "Org not found" });
//   org.payoutStatus = verified ? "VERIFIED" : "PENDING";
//   org.notes = verified ? `Penny-drop ref: ${ref}` : org.notes || "";
//   await org.save();
//   res.json({ ok: true });
// };

// export const approvePayout = async (req, res) => {
//   const { payoutId } = req.params;
//   const payout = await Payout.findById(payoutId);
//   if (!payout) return res.status(404).json({ error: "Payout not found" });
//   payout.status = "APPROVED";
//   await payout.save();
//   res.json({ ok: true });
// };

// export const rejectPayout = async (req, res) => {
//   const { payoutId } = req.params;
//   const { adminNote } = req.body;
//   const payout = await Payout.findByIdAndUpdate(
//     payoutId,
//     { status: "REJECTED", adminNote },
//     { new: true }
//   );
//   res.json({ ok: true, data: payout });
// };

// export const markPayoutPaid = async (req, res) => {
//   const { payoutId } = req.params;
//   const { settlementRef } = req.body;
//   const payout = await Payout.findByIdAndUpdate(
//     payoutId,
//     { status: "PAID", settlementRef },
//     { new: true }
//   );
//   res.json({ ok: true, data: payout });
// };
// controllers/adminOrg.js (ESM)
import Organization from "../models/Organization.js";
import VerificationTicket from "../models/VerificationTicket.js";
import Payout from "../models/Payout.js";

// ------------------------------------------------------------
// Get all organizations for admin
// ------------------------------------------------------------
export const listOrgs = async (req, res) => {
  try {
    const { status } = req.query;
    const q = status ? { status } : {};
    const orgs = await Organization.find(q).sort({ createdAt: -1 }).limit(200);
    res.json({ ok: true, data: orgs });
  } catch (err) {
    console.error("ListOrgs error:", err);
    res
      .status(500)
      .json({ ok: false, message: "Failed to fetch organizations" });
  }
};

// ------------------------------------------------------------
// Approve / Reject / Request Info (entire NGO application)
// ------------------------------------------------------------
export const decideOrg = async (req, res) => {
  try {
    const { orgId } = req.params;
    const { decision, checklist = [], reasons = [] } = req.body; // APPROVED | REJECTED | INFO_REQUESTED

    const org = await Organization.findById(orgId);
    const ticket = await VerificationTicket.findOne({
      targetType: "ORGANIZATION",
      targetId: orgId,
    }).sort({ createdAt: -1 });

    if (!org || !ticket)
      return res
        .status(404)
        .json({ ok: false, message: "Organization or ticket not found" });

    if (Array.isArray(checklist) && checklist.length) {
      ticket.checklist = checklist;
    }

    switch (decision) {
      case "APPROVED":
        org.status = "APPROVED";
        ticket.status = "APPROVED";
        break;
      case "REJECTED":
        org.status = "REJECTED";
        org.review = { ...(org.review || {}), reasons };
        ticket.status = "REJECTED";
        break;
      case "INFO_REQUESTED":
        org.status = "INFO_REQUESTED";
        org.review = { ...(org.review || {}), reasons };
        ticket.status = "INFO_REQUESTED";
        break;
      default:
        return res
          .status(400)
          .json({ ok: false, message: "Invalid decision type" });
    }

    await org.save();
    await ticket.save();

    res.json({
      ok: true,
      message: `Organization ${decision.toLowerCase()} successfully.`,
    });
  } catch (err) {
    console.error("DecideOrg error:", err);
    res
      .status(500)
      .json({ ok: false, message: "Failed to update organization status" });
  }
};

// ------------------------------------------------------------
// Admin verifies a specific KYC document
// ------------------------------------------------------------
export const verifyDocument = async (req, res) => {
  try {
    const { orgId } = req.params;
    const { key, passed, comment } = req.body;

    const ticket = await VerificationTicket.findOne({
      targetType: "ORGANIZATION",
      targetId: orgId,
    }).sort({ createdAt: -1 });

    if (!ticket)
      return res.status(404).json({ ok: false, message: "Ticket not found" });

    // Update specific document status
    ticket.checklist = ticket.checklist.map((item) =>
      item.key === key
        ? {
            ...item,
            passed,
            comment: comment || (passed ? "Verified by admin" : "Rejected"),
          }
        : item
    );

    // Add system message for history
    ticket.messages.push({
      by: "ADMIN",
      text: passed
        ? `✅ ${key} document verified`
        : `❌ ${key} document rejected - ${comment || "No reason provided"}`,
      at: new Date(),
    });

    await ticket.save();

    res.json({
      ok: true,
      message: `${key} marked as ${passed ? "verified" : "rejected"}`,
    });
  } catch (err) {
    console.error("Verify document error:", err);
    res
      .status(500)
      .json({ ok: false, message: "Failed to verify/reject document" });
  }
};
// ------------------------------------------------------------
// Verify NGO's payout account
// ------------------------------------------------------------
export const verifyPayoutAccount = async (req, res) => {
  try {
    const { orgId } = req.params;
    const { verified, ref } = req.body;
    const org = await Organization.findById(orgId);

    if (!org)
      return res
        .status(404)
        .json({ ok: false, message: "Organization not found" });

    org.payoutStatus = verified ? "VERIFIED" : "PENDING";
    org.notes = verified ? `Penny-drop ref: ${ref}` : org.notes || "";

    await org.save();
    res.json({ ok: true, message: "Payout account status updated" });
  } catch (err) {
    console.error("verifyPayoutAccount error:", err);
    res
      .status(500)
      .json({ ok: false, message: "Failed to verify payout account" });
  }
};

// ------------------------------------------------------------
// Approve payout
// ------------------------------------------------------------
export const approvePayout = async (req, res) => {
  try {
    const { payoutId } = req.params;
    const payout = await Payout.findById(payoutId);
    if (!payout)
      return res.status(404).json({ ok: false, message: "Payout not found" });

    payout.status = "APPROVED";
    await payout.save();
    res.json({ ok: true, message: "Payout approved successfully" });
  } catch (err) {
    console.error("approvePayout error:", err);
    res.status(500).json({ ok: false, message: "Failed to approve payout" });
  }
};

// ------------------------------------------------------------
// Reject payout
// ------------------------------------------------------------
export const rejectPayout = async (req, res) => {
  try {
    const { payoutId } = req.params;
    const { adminNote } = req.body;
    const payout = await Payout.findByIdAndUpdate(
      payoutId,
      { status: "REJECTED", adminNote },
      { new: true }
    );
    res.json({
      ok: true,
      message: "Payout rejected successfully",
      data: payout,
    });
  } catch (err) {
    console.error("rejectPayout error:", err);
    res.status(500).json({ ok: false, message: "Failed to reject payout" });
  }
};

// ------------------------------------------------------------
// Mark payout as paid
// ------------------------------------------------------------
export const markPayoutPaid = async (req, res) => {
  try {
    const { payoutId } = req.params;
    const { settlementRef } = req.body;
    const payout = await Payout.findByIdAndUpdate(
      payoutId,
      { status: "PAID", settlementRef },
      { new: true }
    );
    res.json({ ok: true, message: "Payout marked as paid", data: payout });
  } catch (err) {
    console.error("markPayoutPaid error:", err);
    res
      .status(500)
      .json({ ok: false, message: "Failed to mark payout as paid" });
  }
};
