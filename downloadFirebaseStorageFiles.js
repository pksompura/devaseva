// downloadFirebaseStorageFiles.js

import { initializeApp, cert } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
import fs from "fs";
import path from "path";

// Read and parse the JSON file manually
const serviceAccountPath = path.resolve("./serviceAccountKey.json");
const serviceAccountData = fs.readFileSync(serviceAccountPath, "utf8");
const serviceAccount = JSON.parse(serviceAccountData);

// Initialize Firebase Admin SDK
initializeApp({
  credential: cert(serviceAccount),
  storageBucket: "donation-site-f991f.appspot.com",
});

const bucket = getStorage().bucket();

const downloadAllFiles = async () => {
  try {
    const [files] = await bucket.getFiles();

    for (const file of files) {
      const localFilePath = path.join("./downloaded_images", file.name);
      const dir = path.dirname(localFilePath);

      // Ensure directory exists
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Download the file
      await file.download({ destination: localFilePath });
      console.log(`✅ Downloaded: ${file.name}`);
    }

    console.log("🎉 All files downloaded successfully!");
  } catch (error) {
    console.error("❌ Error downloading files:", error);
  }
};

// Run the download
downloadAllFiles();
