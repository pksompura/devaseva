// controllers/adminOrg.js (ESM)
import Organization from "../models/Organization.js";
import VerificationTicket from "../models/VerificationTicket.js";
import Payout from "../models/Payout.js";

export const listOrgs = async (req, res) => {
  const { status } = req.query;
  const q = status ? { status } : {};
  const orgs = await Organization.find(q).sort({ createdAt: -1 }).limit(200);
  res.json({ ok: true, data: orgs });
};

export const decideOrg = async (req, res) => {
  const { orgId } = req.params;
  const { decision, checklist = [], reasons = [] } = req.body; // APPROVE | REJECT | REQUEST_INFO
  const org = await Organization.findById(orgId);
  const ticket = await VerificationTicket.findOne({
    targetType: "ORGANIZATION",
    targetId: orgId,
  }).sort({ createdAt: -1 });
  if (!org || !ticket) return res.status(404).json({ error: "Not found" });

  if (checklist?.length) ticket.checklist = checklist;

  if (decision === "APPROVE") {
    org.status = "APPROVED";
    ticket.status = "APPROVED";
  } else if (decision === "REJECT") {
    org.status = "REJECTED";
    org.review = { ...(org.review || {}), reasons };
    ticket.status = "REJECTED";
  } else {
    org.status = "INFO_REQUESTED";
    org.review = { ...(org.review || {}), reasons };
    ticket.status = "INFO_REQUESTED";
  }

  await org.save();
  await ticket.save();
  res.json({ ok: true });
};

export const verifyPayoutAccount = async (req, res) => {
  const { orgId } = req.params;
  const { verified, ref } = req.body;
  const org = await Organization.findById(orgId);
  if (!org) return res.status(404).json({ error: "Org not found" });
  org.payoutStatus = verified ? "VERIFIED" : "PENDING";
  org.notes = verified ? `Penny-drop ref: ${ref}` : org.notes || "";
  await org.save();
  res.json({ ok: true });
};

export const approvePayout = async (req, res) => {
  const { payoutId } = req.params;
  const payout = await Payout.findById(payoutId);
  if (!payout) return res.status(404).json({ error: "Payout not found" });
  payout.status = "APPROVED";
  await payout.save();
  res.json({ ok: true });
};

export const rejectPayout = async (req, res) => {
  const { payoutId } = req.params;
  const { adminNote } = req.body;
  const payout = await Payout.findByIdAndUpdate(
    payoutId,
    { status: "REJECTED", adminNote },
    { new: true }
  );
  res.json({ ok: true, data: payout });
};

export const markPayoutPaid = async (req, res) => {
  const { payoutId } = req.params;
  const { settlementRef } = req.body;
  const payout = await Payout.findByIdAndUpdate(
    payoutId,
    { status: "PAID", settlementRef },
    { new: true }
  );
  res.json({ ok: true, data: payout });
};
