// // controllers/organization.js (ESM)
// import Organization from "../models/Organization.js";
// import OrgMember from "../models/OrgMember.js";
// import VerificationTicket from "../models/VerificationTicket.js";
// import Payout from "../models/Payout.js";

// const seedChecklist = (org) => {
//   const items = [
//     { key: "REG_PROOF", label: "Registration Proof", passed: false },
//     { key: "PAN", label: "Organization PAN", passed: false },
//     {
//       key: "BANK_PROOF",
//       label: "Cancelled Cheque / Bank Letter",
//       passed: false,
//     },
//     {
//       key: "BOARD_RESOLUTION",
//       label: "Board Resolution for Payouts",
//       passed: false,
//     },
//     { key: "WEBSITE_OK", label: "Website reachable", passed: false },
//     {
//       key: "CONTACT_VERIFIED",
//       label: "Primary contact verified",
//       passed: false,
//     },
//   ];
//   if (org.has80G)
//     items.push({ key: "EIGHTY_G", label: "80G Certificate", passed: false });
//   if (org.hasFCRA)
//     items.push({ key: "FCRA", label: "FCRA Certificate", passed: false });
//   return items;
// };

// export const apply = async (req, res) => {
//   const payload = req.body;
//   const ownerUserId = req.user.id; // from JWT
//   const org = await Organization.create({ ...payload, ownerUserId });
//   await OrgMember.create({
//     orgId: org._id,
//     userId: ownerUserId,
//     role: "OWNER",
//   });
//   await VerificationTicket.create({
//     targetType: "ORGANIZATION",
//     targetId: org._id,
//     status: "OPEN",
//     checklist: seedChecklist(org),
//     messages: [{ by: "SYSTEM", text: "Application submitted", at: new Date() }],
//   });
//   res.json({ ok: true, data: org });
// };

// export const getApplication = async (req, res) => {
//   const { orgId } = req.params;
//   const org = await Organization.findById(orgId);
//   const ticket = await VerificationTicket.findOne({
//     targetType: "ORGANIZATION",
//     targetId: orgId,
//   }).sort({ createdAt: -1 });
//   res.json({ ok: true, data: { org, ticket } });
// };

// export const uploadKyc = async (req, res) => {
//   const { orgId } = req.params;
//   const { key, fileUrl, comment } = req.body;
//   const ticket = await VerificationTicket.findOne({
//     targetType: "ORGANIZATION",
//     targetId: orgId,
//   }).sort({ createdAt: -1 });
//   if (!ticket) return res.status(404).json({ error: "Ticket not found" });

//   ticket.checklist = ticket.checklist.map((i) =>
//     i.key === key ? { ...i, passed: true, comment: comment || i.comment } : i
//   );
//   ticket.status = "OPEN";
//   ticket.messages.push({
//     by: "ORG",
//     text: `Uploaded ${key}`,
//     attachments: [fileUrl],
//     at: new Date(),
//   });
//   await ticket.save();

//   res.json({ ok: true, data: ticket });
// };

// export const ticketMessage = async (req, res) => {
//   const { orgId } = req.params;
//   const { text, attachments = [] } = req.body;
//   const ticket = await VerificationTicket.findOne({
//     targetType: "ORGANIZATION",
//     targetId: orgId,
//   }).sort({ createdAt: -1 });
//   if (!ticket) return res.status(404).json({ error: "Ticket not found" });
//   ticket.messages.push({ by: "ORG", text, attachments, at: new Date() });
//   await ticket.save();
//   res.json({ ok: true });
// };

// export const requestPayout = async (req, res) => {
//   const { orgId } = req.params;
//   const { campaignId = null, amount } = req.body;
//   const payout = await Payout.create({
//     orgId,
//     campaignId,
//     amountRequested: Number(amount),
//   });
//   res.json({ ok: true, data: payout });
// };

// export const getPayouts = async (req, res) => {
//   const { orgId } = req.params;
//   const items = await Payout.find({ orgId }).sort({ createdAt: -1 });
//   res.json({ ok: true, data: items });
// };
// controllers/organization.js (ESM)
import Organization from "../models/Organization.js";
import OrgMember from "../models/OrgMember.js";
import VerificationTicket from "../models/VerificationTicket.js";
import Payout from "../models/Payout.js";
import fs from "fs/promises";
import path from "path";
import { base64ToBuffer } from "../utils/base64Helper.js";

// ------------------------------------------------------------
// Generate initial checklist for each NGO
// ------------------------------------------------------------
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

// ------------------------------------------------------------
// NGO Application Submission
// ------------------------------------------------------------
export const apply = async (req, res) => {
  try {
    const payload = req.body;
    const ownerUserId = req.user.id; // from JWT

    const org = await Organization.create({ ...payload, ownerUserId });

    // Add org owner to members
    await OrgMember.create({
      orgId: org._id,
      userId: ownerUserId,
      role: "OWNER",
    });

    // Create verification ticket
    await VerificationTicket.create({
      targetType: "ORGANIZATION",
      targetId: org._id,
      status: "OPEN",
      checklist: seedChecklist(org),
      messages: [
        { by: "SYSTEM", text: "Application submitted", at: new Date() },
      ],
    });

    res.json({ ok: true, data: org });
  } catch (err) {
    console.error("Apply error:", err);
    res
      .status(500)
      .json({ ok: false, message: "Failed to submit NGO application" });
  }
};

// ------------------------------------------------------------
// Get NGO Application (and verification ticket)
// ------------------------------------------------------------
export const getApplication = async (req, res) => {
  try {
    const { orgId } = req.params;
    const org = await Organization.findById(orgId);
    const ticket = await VerificationTicket.findOne({
      targetType: "ORGANIZATION",
      targetId: orgId,
    }).sort({ createdAt: -1 });

    res.json({ ok: true, data: { org, ticket } });
  } catch (err) {
    console.error("Get application error:", err);
    res.status(500).json({ ok: false, message: "Failed to get application" });
  }
};

// ------------------------------------------------------------
// Upload KYC Document (stores base64 as file locally)
// ------------------------------------------------------------
const uploadKycLocally = async (base64, orgId, key) => {
  try {
    const { buffer, extension } = base64ToBuffer(base64);

    // Build NGO folder
    const uploadDir = path.resolve("images", "ngo_docs", orgId);
    await fs.mkdir(uploadDir, { recursive: true });

    // Safe file name
    const fileName = `${key}_${Date.now()}.${extension}`;
    const filePath = path.join(uploadDir, fileName);

    // Write file to local storage
    await fs.writeFile(filePath, buffer);

    // Return accessible URL path
    return `/images/ngo_docs/${orgId}/${fileName}`;
  } catch (error) {
    console.error("Error saving KYC document:", error);
    throw new Error("Failed to save KYC document locally");
  }
};

export const uploadKyc = async (req, res) => {
  try {
    const { orgId } = req.params;
    const { key, comment, fileBase64 } = req.body;

    if (!fileBase64 || !key)
      return res.status(400).json({
        ok: false,
        message: "Missing required fields (key, fileBase64)",
      });

    // Store file locally
    const fileUrl = await uploadKycLocally(fileBase64, orgId, key);

    // Get latest verification ticket
    const ticket = await VerificationTicket.findOne({
      targetType: "ORGANIZATION",
      targetId: orgId,
    }).sort({ createdAt: -1 });

    if (!ticket)
      return res
        .status(404)
        .json({ ok: false, message: "Verification ticket not found" });

    // Update checklist
    ticket.checklist = ticket.checklist.map((item) =>
      item.key === key
        ? { ...item, fileUrl, passed: false, comment: comment || item.comment }
        : item
    );

    // Add message log
    ticket.messages.push({
      by: "ORG",
      text: `Uploaded ${key}`,
      attachments: [fileUrl],
      at: new Date(),
    });

    await ticket.save();

    res.json({
      ok: true,
      message: "KYC document uploaded successfully",
      data: { fileUrl },
    });
  } catch (err) {
    console.error("Upload KYC error:", err);
    res
      .status(500)
      .json({ ok: false, message: "Error uploading KYC document" });
  }
};

// ------------------------------------------------------------
// NGO → Admin Ticket Message
// ------------------------------------------------------------
export const ticketMessage = async (req, res) => {
  try {
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
  } catch (err) {
    console.error("Ticket message error:", err);
    res.status(500).json({ ok: false, message: "Failed to send message" });
  }
};

// ------------------------------------------------------------
// NGO → Request Payout
// ------------------------------------------------------------
export const requestPayout = async (req, res) => {
  try {
    const { orgId } = req.params;
    const { campaignId = null, amount } = req.body;

    const payout = await Payout.create({
      orgId,
      campaignId,
      amountRequested: Number(amount),
    });

    res.json({ ok: true, data: payout });
  } catch (err) {
    console.error("Request payout error:", err);
    res.status(500).json({ ok: false, message: "Failed to request payout" });
  }
};

// ------------------------------------------------------------
// Get All Payouts (per NGO)
// ------------------------------------------------------------
export const getPayouts = async (req, res) => {
  try {
    const { orgId } = req.params;
    const items = await Payout.find({ orgId }).sort({ createdAt: -1 });
    res.json({ ok: true, data: items });
  } catch (err) {
    console.error("Get payouts error:", err);
    res.status(500).json({ ok: false, message: "Failed to get payouts" });
  }
};
