import jwt from "jsonwebtoken";
import LoginLog from "../models/userLoginLogs.js"; // Import LoginLog model to update logout time

// Middleware to authenticate user via JWT
export const authenticateUser = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1]; // Assuming the token is sent in the 'Authorization' header in the format 'Bearer <token>'

  if (!token) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  try {
    // Verify the token using the same secret used during generation
    const decoded = jwt.verify(token, "praveen1"); // Ensure the secret matches the one used in token generation
    req.user = decoded;
    // If token expired, log out and update logoutAt in LoginLog
    if (decoded.exp * 1000 < Date.now()) {
      // Update logout time if token expired
      await LoginLog.findOneAndUpdate(
        { userId: decoded.id, logoutAt: null },
        { logoutAt: new Date() },
        { sort: { createdAt: -1 } } // Update the latest record
      );
      return res
        .status(401)
        .json({ error: "Token expired. Please log in again." });
    }
    // Attach decoded token (user info) to request object
    next(); // Continue to the next middleware or route handler
  } catch (error) {
    return res.status(400).json({ error: "Invalid token." });
  }
};

// Middleware to authenticate admin
export const authenticateAdmin = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1]; // Assuming the token is sent in the 'Authorization' header in the format 'Bearer <token>'
  console.log("Received Token:", token); // Check the token in the console

  if (!token) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, "praveen1"); // Ensure the secret matches the one used in token generation
    console.log("Decoded Token:", decoded); // Check if the token is decoded correctly

    req.user = decoded;
    if (decoded.role !== "admin") {
      return res.status(403).json({ error: "Access denied. Admins only." });
    }

    // If token expired, log out and update logoutAt in LoginLog
    if (decoded.exp * 1000 < Date.now()) {
      // Update logout time if token expired
      await LoginLog.findOneAndUpdate(
        { userId: decoded.id, logoutAt: null },
        { logoutAt: new Date() },
        { sort: { createdAt: -1 } } // Update the latest record
      );
      return res
        .status(401)
        .json({ error: "Token expired. Please log in again." });
    }
    next(); // Continue to the next middleware or route handler
  } catch (error) {
    return res.status(400).json({ error: "Invalid token." });
  }
};
