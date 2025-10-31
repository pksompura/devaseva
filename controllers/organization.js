// controllers/organization.js (ESM)
import Organization from "../models/Organization.js";
import OrgMember from "../models/OrgMember.js";
import VerificationTicket from "../models/VerificationTicket.js";
import Payout from "../models/Payout.js";

const seedChecklist = (org) => {
  const items = [
    { key: "REG_PROOF", label: "Registration Proof", passed: false },
    { key: "PAN", label: "Organization PAN", passed: false },
    {
      key: "BANK_PROOF",
      label: "Cancelled Cheque / Bank Letter",
      passed: false,
    },
    {
      key: "BOARD_RESOLUTION",
      label: "Board Resolution for Payouts",
      passed: false,
    },
    { key: "WEBSITE_OK", label: "Website reachable", passed: false },
    {
      key: "CONTACT_VERIFIED",
      label: "Primary contact verified",
      passed: false,
    },
  ];
  if (org.has80G)
    items.push({ key: "EIGHTY_G", label: "80G Certificate", passed: false });
  if (org.hasFCRA)
    items.push({ key: "FCRA", label: "FCRA Certificate", passed: false });
  return items;
};

export const apply = async (req, res) => {
  const payload = req.body;
  const ownerUserId = req.user.id; // from JWT
  const org = await Organization.create({ ...payload, ownerUserId });
  await OrgMember.create({
    orgId: org._id,
    userId: ownerUserId,
    role: "OWNER",
  });
  await VerificationTicket.create({
    targetType: "ORGANIZATION",
    targetId: org._id,
    status: "OPEN",
    checklist: seedChecklist(org),
    messages: [{ by: "SYSTEM", text: "Application submitted", at: new Date() }],
  });
  res.json({ ok: true, data: org });
};

export const getApplication = async (req, res) => {
  const { orgId } = req.params;
  const org = await Organization.findById(orgId);
  const ticket = await VerificationTicket.findOne({
    targetType: "ORGANIZATION",
    targetId: orgId,
  }).sort({ createdAt: -1 });
  res.json({ ok: true, data: { org, ticket } });
};

export const uploadKyc = async (req, res) => {
  const { orgId } = req.params;
  const { key, fileUrl, comment } = req.body;
  const ticket = await VerificationTicket.findOne({
    targetType: "ORGANIZATION",
    targetId: orgId,
  }).sort({ createdAt: -1 });
  if (!ticket) return res.status(404).json({ error: "Ticket not found" });

  ticket.checklist = ticket.checklist.map((i) =>
    i.key === key ? { ...i, passed: true, comment: comment || i.comment } : i
  );
  ticket.status = "OPEN";
  ticket.messages.push({
    by: "ORG",
    text: `Uploaded ${key}`,
    attachments: [fileUrl],
    at: new Date(),
  });
  await ticket.save();

  res.json({ ok: true, data: ticket });
};

export const ticketMessage = async (req, res) => {
  const { orgId } = req.params;
  const { text, attachments = [] } = req.body;
  const ticket = await VerificationTicket.findOne({
    targetType: "ORGANIZATION",
    targetId: orgId,
  }).sort({ createdAt: -1 });
  if (!ticket) return res.status(404).json({ error: "Ticket not found" });
  ticket.messages.push({ by: "ORG", text, attachments, at: new Date() });
  await ticket.save();
  res.json({ ok: true });
};

export const requestPayout = async (req, res) => {
  const { orgId } = req.params;
  const { campaignId = null, amount } = req.body;
  const payout = await Payout.create({
    orgId,
    campaignId,
    amountRequested: Number(amount),
  });
  res.json({ ok: true, data: payout });
};

export const getPayouts = async (req, res) => {
  const { orgId } = req.params;
  const items = await Payout.find({ orgId }).sort({ createdAt: -1 });
  res.json({ ok: true, data: items });
};
