import OrgMember from "../models/OrgMember.js";

export const requireOrgRole =
  (role /* 'OWNER' | 'STAFF' */) => async (req, res, next) => {
    const { orgId } = req.params;
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    const membership = await OrgMember.findOne({ orgId, userId: req.user.id });
    if (!membership)
      return res.status(403).json({ error: "Not a member of this org" });
    if (role === "OWNER" && membership.role !== "OWNER") {
      return res.status(403).json({ error: "Owner only" });
    }
    return next();
  };
