import express from "express";
import {
  deleteUser,
  getSettings,
  getUserProfile,
  listUsers,
  logout,
  registerOrLoginUser,
  sendOTP,
  updateSettings,
  updateUserInfo,
  verifyOTP,
  getUserWithLoginHistory,
  blockUser,
  guestLogin,
} from "../controllers/user.js";
import {
  authenticateAdmin,
  authenticateUser,
} from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/update", authenticateUser, updateUserInfo);
router.post("/update-settings", authenticateUser, updateSettings);
router.get("/get-settings", getSettings);
router.post("/sendOtp", sendOTP);
router.post("/verifyOtp", verifyOTP);
router.get("/get-all-users", listUsers);
router.post("/logout", logout);
router.post("/login", registerOrLoginUser);
router.post("/guest-login", guestLogin);
router.get("/get-user-profile", authenticateUser, getUserProfile);
router.delete("/delete/:id", authenticateUser, deleteUser);
router.patch("/block/:id", authenticateAdmin, blockUser);

router.get(
  "/get-user-login-history/:id",
  authenticateAdmin,
  getUserWithLoginHistory
);

export default router;
