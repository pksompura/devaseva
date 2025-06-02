import express from "express";
import path from "path";
import cors from "cors";
import { fileURLToPath } from "url";
import connectDB from "./db/db.js";
import userRoutes from "./routes/userRoutes.js";
import donationRoutes from "./routes/donationRoutes.js";
import enquiryRoutes from "./routes/enquiry.js";
import subDonationRoutes from "./routes/subDonationRoutes.js";
import categoryRoutes from "./routes/category.js";
import transactionRoutes from "./routes/transactionRoutes.js";
connectDB();
const app = express();
const PORT = process.env.PORT || 5001;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const allowedOrigins = [
  "http://88.222.214.214:3001",
  "https://giveaze.com",
  "https://admin.giveaze.com",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://192.168.117.114:5173",
  "http://192.168.165.114:5174",
  "http://192.168.65.114:5173",
  "http://172.20.10.4:5173",
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
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like Postman or curl)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log("❌ Blocked by CORS:", origin);
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  optionsSuccessStatus: 200, // Fix for legacy browsers (IE)
};

// app.use(cors(corsOptions));
// app.options("*", cors(corsOptions)); // ✅ must come before routes

app.use(cors(corsOptions));

// Handle preflight requests explicitly before routes
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

// Routes
app.use("/api/users", userRoutes);
app.use("/api/donation_campaign", donationRoutes);
app.use("/api/enquiry", enquiryRoutes);
app.use("/api/subDonation", subDonationRoutes);
app.use("/api/category", categoryRoutes);
app.use("/api/transactions", transactionRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});
