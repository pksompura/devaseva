// import mongoose from "mongoose";

// const userSchema = new mongoose.Schema({
//   full_name: String,
//   email: {
//     type: String,
//     required: false,
//     default: "no-email@example.com",
//     unique: false,
//   },
//   mobile_number: {
//     type: String,
//     unique: true,
//   },
//   address: String,
//   profile_pic: String,
//   otp: String,
//   pan_number: {
//     type: String,
//     required: false,
//   },
//   role: {
//     type: String,
//     enum: ["user", "admin"],
//     default: "user",
//   },
// });

// const User = mongoose.model("User_donation", userSchema);

// export default User;

import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    full_name: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      default: "no-email@example.com",
      lowercase: true,
      trim: true,
    },
    mobile_number: {
      type: String,
      unique: true,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    profile_pic: {
      type: String,
    },
    otp: {
      type: String,
    },
    pan_number: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    is_guest: { type: Boolean, default: false },
  },
  {
    timestamps: true, // adds createdAt and updatedAt
  }
);

const User = mongoose.model("User_donation", userSchema);

export default User;

const settingsSchema = new mongoose.Schema(
  {
    privacypolicy: {
      type: String,
      default: "",
    },
    terms: {
      type: String,
      default: "",
    },
    about_us: {
      type: String,
      default: "",
    },
    banner_title: {
      type: String,
      default: "",
    },
    banner_description: {
      type: String,
      default: "",
    },
    banner_link: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

const Settings = mongoose.model("Settings", settingsSchema);

export { Settings };
