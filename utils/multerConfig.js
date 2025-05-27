// utils/multerConfig.js
import multer from "multer";
import path from "path";
import fs from "fs";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const campaignId = req.body.campaignId || req.params.campaignId;
    const subFolder = req.body.subFolder || "others";

    if (!campaignId) {
      return cb(new Error("Campaign ID is required in body or params"), null);
    }

    const uploadPath = path.resolve(
      "images",
      "campaign_images",
      `campaign_${campaignId}`,
      subFolder
    );

    fs.mkdirSync(uploadPath, { recursive: true });

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const campaignId = req.body.campaignId || req.params.campaignId;
    const subFolder = req.body.subFolder || "others";

    const fileName = `${campaignId}-${subFolder}-${Date.now()}${ext}`;
    cb(null, fileName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error("Unsupported file format. Allowed: jpeg, jpg, png, webp"),
      false
    );
  }
};

const limits = {
  fileSize: 5 * 1024 * 1024, // 5 MB
};

const upload = multer({ storage, fileFilter, limits });

export default upload;
