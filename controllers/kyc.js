import axios from "axios";
import querystring from "querystring";
import Kyc from "../models/kycModel.js";

const DIGI_CLIENT_ID = process.env.DIGI_CLIENT_ID;
const DIGI_CLIENT_SECRET = process.env.DIGI_CLIENT_SECRET;
const DIGI_REDIRECT_URI = process.env.DIGI_REDIRECT_URI; // e.g., https://yourdomain.com/api/kyc/callback
const DIGI_AUTH_URL =
  "https://api.digitallocker.gov.in/public/oauth2/1/authorize";
const DIGI_TOKEN_URL = "https://api.digitallocker.gov.in/public/oauth2/1/token";
const DIGI_RESOURCE_URL = "https://api.digitallocker.gov.in/public/kyc/1/xml"; // Aadhaar/PAN/DL docs

// Step 1: Redirect to DigiLocker login
export const initAuth = (req, res) => {
  const authUrl = `${DIGI_AUTH_URL}?response_type=code&client_id=${DIGI_CLIENT_ID}&redirect_uri=${DIGI_REDIRECT_URI}&state=1234&scope=profile+kyc`;
  res.redirect(authUrl);
};

// Step 2: Callback from DigiLocker with code
export const digiCallback = async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).json({ error: "No code returned" });

  try {
    // Exchange code for access token
    const response = await axios.post(
      DIGI_TOKEN_URL,
      querystring.stringify({
        code,
        client_id: DIGI_CLIENT_ID,
        client_secret: DIGI_CLIENT_SECRET,
        redirect_uri: DIGI_REDIRECT_URI,
        grant_type: "authorization_code",
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    const { access_token } = response.data;

    // Save token temporarily (or in DB for user session)
    req.session.digiAccessToken = access_token;

    return res.redirect(`/kyc/success?token=${access_token}`); // redirect to frontend success page
  } catch (err) {
    console.error("DigiLocker Token Error:", err.response?.data || err.message);
    return res.status(500).json({ error: "Failed to get access token" });
  }
};

// Step 3: Fetch Aadhaar KYC data
export const fetchKycData = async (req, res) => {
  const token = req.query.token;
  if (!token) return res.status(400).json({ error: "Missing access token" });

  try {
    const response = await axios.get(DIGI_RESOURCE_URL, {
      headers: { Authorization: `Bearer ${token}` },
    });

    // Parse Aadhaar/PAN XML (response.data)
    const parsedData = {
      aadhaar: "XXXX-XXXX-" + response.data.uid.slice(-4),
      name: response.data.name || "Unknown",
      dob: response.data.dob || "",
      gender: response.data.gender || "",
      verified: true,
    };

    // Save to DB
    const kyc = new Kyc(parsedData);
    await kyc.save();

    return res.status(200).json({ status: true, data: parsedData });
  } catch (err) {
    console.error("DigiLocker Fetch Error:", err.response?.data || err.message);
    return res.status(500).json({ error: "Failed to fetch KYC data" });
  }
};
