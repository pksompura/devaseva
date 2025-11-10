import express from "express";
import path from "path";
import cors from "cors";
import { fileURLToPath } from "url";
import connectDB from "./db/db.js";
import userRoutes from "./routes/userRoutes.js";
import kycRoutes from "./routes/kycRoutes.js";
import donationRoutes from "./routes/donationRoutes.js";
import enquiryRoutes from "./routes/enquiry.js";
import subDonationRoutes from "./routes/subDonationRoutes.js";
import categoryRoutes from "./routes/category.js";
import transactionRoutes from "./routes/transactionRoutes.js";
import fundraiserRoutes from "./routes/fundraiserRoutes.js";
import orgRoutes from "./routes/orgRoutes.js";
import orgAdminRoutes from "./routes/orgAdminRoutes.js";

import "./workers/paymentWorker.js";

connectDB();
const app = express();
const PORT = process.env.PORT || 5001;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const allowedOrigins = [
  "http://88.222.214.214:3001",
  "http://88.222.214.214:3000",
  "https://88.222.214.214",
  "https://giveaze.com",
  "https://www.giveaze.com",
  "https://admin.giveaze.com",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://192.168.117.114:5173",
  "http://192.168.165.114:5174",
  "http://192.168.65.114:5173",
  "http://172.20.10.3:5173",
  "http://172.30.128.1:5173",
  "http://10.14.151.119:5173",
];

// const corsOptions = {
//   origin: function (origin, callback) {
//     // Allow requests with no origin like curl or mobile apps
//     if (!origin || allowedOrigins.includes(origin)) {
//       callback(null, true);
//     } else {
//       console.log("Blocked by CORS:", origin);
//       callback(new Error("Not allowed by CORS"));
//     }
//   },
//   credentials: true,
// };
// const corsOptions = {
//   origin: function (origin, callback) {
//     if (!origin || allowedOrigins.includes(origin)) {
//       callback(null, true);
//     } else {
//       console.log("❌ Blocked by CORS:", origin);
//       callback(new Error("Not allowed by CORS"));
//     }
//   },
//   methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
//   allowedHeaders: ["Content-Type", "Authorization"],
//   exposedHeaders: ["x-rtb-fingerprint-id"], // ← Add this

//   credentials: true,
//   optionsSuccessStatus: 200,
// };

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log("❌ Blocked by CORS:", origin);
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// app.use(cors(corsOptions));
// app.use(cors("*"));

// app.use(cors());

// app.options("*", cors());
// app.use(
//   cors({
//     origin: "*",
//   })
// );

// Body parser configuration to handle large image/file uploads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Static file serving for images
// app.use("/images", express.static(path.join(__dirname, "images")));
app.use("/images", express.static(path.join(process.cwd(), "images")));
// Serve receipts as static
// app.use("/receipts", express.static(path.join(process.cwd(), "receipts")));

// Routes
app.use("/api/users", userRoutes);
app.use("/api/kyc", kycRoutes);
app.use("/api/fundraiser", fundraiserRoutes);
app.use("/api/donation_campaign", donationRoutes);
app.use("/api/enquiry", enquiryRoutes);
app.use("/api/subDonation", subDonationRoutes);
app.use("/api/category", categoryRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/org", orgRoutes);
app.use("/api/orgAdmin", orgAdminRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`⚡ Payment worker also running in same process`);
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});
