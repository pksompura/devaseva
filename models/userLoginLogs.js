// import mongoose from "mongoose";

// const loginLogSchema = new mongoose.Schema({
//   userId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "User",
//     required: true,
//   },
//   loginAt: {
//     type: Date,
//     default: Date.now,
//   },
//   logoutAt: {
//     type: Date,
//     default: null,
//   },
//   ipAddress: String,
//   location: String,

//   deviceInfo: {
//     browser: String,
//     os: String,
//     deviceType: String, // mobile, tablet, desktop, etc.
//     model: String,
//     vendor: String,
//   },
// });

// export default mongoose.model("LoginLog", loginLogSchema);

import mongoose from "mongoose";

const loginLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User_donation",
    required: true,
  },
  loginAt: {
    type: Date,
    default: Date.now,
  },
  logoutAt: {
    type: Date,
    default: null,
  },
  ipAddress: String,
  location: String,
  deviceInfo: {
    browser: String,
    os: String,
    deviceType: String,
    model: String,
    vendor: String,
  },
  
});

export default mongoose.model("LoginLog", loginLogSchema);
