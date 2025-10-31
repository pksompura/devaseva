// import jwt from "jsonwebtoken";
// import LoginLog from "../models/userLoginLogs.js"; // Import LoginLog model to update logout time

// // Middleware to authenticate user via JWT
// // export const authenticateUser = async (req, res, next) => {
// //   const token = req.headers.authorization?.split(" ")[1]; // Assuming the token is sent in the 'Authorization' header in the format 'Bearer <token>'

// //   if (!token) {
// //     return res.status(401).json({ error: "Access denied. No token provided." });
// //   }

// //   try {
// //     // Verify the token using the same secret used during generation
// //     // const decoded = jwt.verify(token, "praveen1"); // Ensure the secret matches the one used in token generation
// //     const decoded = jwt.verify(token, process.env.JWT_SECRET || "praveen1");

// //     // req.user = decoded;
// //     // If token expired, log out and update logoutAt in LoginLog
// //     if (decoded.exp * 1000 < Date.now()) {
// //       // Update logout time if token expired
// //       await LoginLog.findOneAndUpdate(
// //         { userId: decoded.id, logoutAt: null },
// //         { logoutAt: new Date() },
// //         { sort: { createdAt: -1 } } // Update the latest record
// //       );
// //       return res
// //         .status(401)
// //         .json({ error: "Token expired. Please log in again." });
// //     }
// //     // Attach decoded token (user info) to request object
// //     next(); // Continue to the next middleware or route handler
// //   } catch (error) {
// //     return res.status(400).json({ error: "Invalid token." });
// //   }
// // };
// export const authenticateUser = async (req, res, next) => {
//   const token = req.headers.authorization?.split(" ")[1];

//   if (!token) {
//     return res.status(401).json({ error: "Access denied. No token provided." });
//   }

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET || "praveen1");

//     // Check token expiration manually if needed
//     if (decoded.exp * 1000 < Date.now()) {
//       // Token expired - update logoutAt
//       await LoginLog.findOneAndUpdate(
//         { userId: decoded.id, logoutAt: null },
//         { logoutAt: new Date() },
//         { sort: { loginAt: -1 } }
//       );
//       return res
//         .status(401)
//         .json({ error: "Token expired. Please log in again." });
//     }

//     req.user = decoded;
//     next();
//   } catch (error) {
//     return res.status(401).json({ error: "Invalid token." });
//   }
// };

// // Middleware to authenticate admin
// // export const authenticateAdmin = async (req, res, next) => {
// //   const token = req.headers.authorization?.split(" ")[1]; // Assuming the token is sent in the 'Authorization' header in the format 'Bearer <token>'
// //   console.log("Received Token:", token); // Check the token in the console

// //   if (!token) {
// //     return res.status(401).json({ error: "Access denied. No token provided." });
// //   }

// //   try {
// //     // Verify the token
// //     const decoded = jwt.verify(token, "praveen1"); // Ensure the secret matches the one used in token generation
// //     console.log("Decoded Token:", decoded); // Check if the token is decoded correctly

// //     req.user = decoded;
// //     if (decoded.role !== "admin") {
// //       return res.status(403).json({ error: "Access denied. Admins only." });
// //     }

// //     // If token expired, log out and update logoutAt in LoginLog
// //     if (decoded.exp * 1000 < Date.now()) {
// //       // Update logout time if token expired
// //       await LoginLog.findOneAndUpdate(
// //         { userId: decoded.id, logoutAt: null },
// //         { logoutAt: new Date() },
// //         { sort: { createdAt: -1 } } // Update the latest record
// //       );
// //       return res
// //         .status(401)
// //         .json({ error: "Token expired. Please log in again." });
// //     }
// //     next(); // Continue to the next middleware or route handler
// //   } catch (error) {
// //     return res.status(400).json({ error: "Invalid token." });
// //   }
// // };
// export const authenticateAdmin = async (req, res, next) => {
//   const token = req.headers.authorization?.split(" ")[1];

//   if (!token) {
//     return res.status(401).json({ error: "Access denied. No token provided." });
//   }

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET || "praveen1");

//     if (decoded.role !== "admin") {
//       return res.status(403).json({ error: "Access denied. Admins only." });
//     }

//     if (decoded.exp * 1000 < Date.now()) {
//       await LoginLog.findOneAndUpdate(
//         { userId: decoded.id, logoutAt: null },
//         { logoutAt: new Date() },
//         { sort: { loginAt: -1 } }
//       );
//       return res
//         .status(401)
//         .json({ error: "Token expired. Please log in again." });
//     }

//     req.user = decoded;
//     next();
//   } catch (error) {
//     return res.status(401).json({ error: "Invalid token." });
//   }
// };
// middleware/auth.js (ESM)
import jwt from "jsonwebtoken";
import LoginLog from "../models/userLoginLogs.js";

// --- helpers
export const hasRole = (user, ...roles) => {
  const userRole = user?.role; // e.g. 'user' | 'fundraiser' | 'admin' | 'ngo_owner' | 'ngo_staff'
  const userRoles = user?.roles || [userRole]; // support either a string 'role' or array 'roles'
  return roles.some((r) => userRoles?.includes(r));
};

export const requireRoles =
  (...roles) =>
  (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    if (!hasRole(req.user, ...roles)) {
      return res.status(403).json({ error: "Forbidden: insufficient role" });
    }
    return next();
  };

// ---- your existing authenticateUser (kept, just ESM and a tiny attach of roles[])
export const authenticateUser = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token)
    return res.status(401).json({ error: "Access denied. No token provided." });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "praveen1");

    // Optional: normalize roles array for helpers (non-breaking)
    if (!decoded.roles && decoded.role) decoded.roles = [decoded.role];

    // Manual exp check (kept)
    if (decoded.exp * 1000 < Date.now()) {
      await LoginLog.findOneAndUpdate(
        { userId: decoded.id, logoutAt: null },
        { logoutAt: new Date() },
        { sort: { loginAt: -1 } }
      );
      return res
        .status(401)
        .json({ error: "Token expired. Please log in again." });
    }

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid token." });
  }
};

// ---- your existing authenticateAdmin (kept)
export const authenticateAdmin = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token)
    return res.status(401).json({ error: "Access denied. No token provided." });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "praveen1");

    if (decoded.exp * 1000 < Date.now()) {
      await LoginLog.findOneAndUpdate(
        { userId: decoded.id, logoutAt: null },
        { logoutAt: new Date() },
        { sort: { loginAt: -1 } }
      );
      return res
        .status(401)
        .json({ error: "Token expired. Please log in again." });
    }

    // Allow only admin here
    if (decoded.role !== "admin" && !(decoded.roles || []).includes("admin")) {
      return res.status(403).json({ error: "Access denied. Admins only." });
    }

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid token." });
  }
};
