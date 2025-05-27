// utils/base64Helper.js

export const base64ToBuffer = (base64) => {
  const matches = base64.match(/^data:(.+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    throw new Error("Invalid base64 string");
  }

  const mimeType = matches[1]; // e.g., "image/jpeg"
  const extension = mimeType.split("/")[1]; // e.g., "jpeg"
  const buffer = Buffer.from(matches[2], "base64");

  return { buffer, mimeType, extension };
};
