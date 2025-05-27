import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// __dirname replacement in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const generateReceiptPDF = async (donation, userDonations, outputFileName) => {
  const amount = donation.total_amount?.$numberDecimal || donation.total_amount;
  //   const htmlContent = `
  //     <html>
  //     <head>
  //       <title>Donation Receipt</title>
  //       <style>
  //         body { font-family: Arial, sans-serif; padding: 30px; background: #fff; }
  //         .container { max-width: 800px; margin: auto; border: 1px solid #ccc; padding: 20px; border-radius: 8px; }
  //         .logo { text-align: center; margin-bottom: 20px; }
  //         .title { font-size: 26px; color: #333; text-align: center; margin-bottom: 20px; }
  //         .section { margin-bottom: 20px; }
  //         .section h3 { font-size: 18px; color: #222; margin-bottom: 12px; }
  //         .section p { margin: 6px 0; color: #555; }
  //         .footer { border-top: 1px solid #ddd; padding-top: 20px; font-size: 14px; color: #555; text-align: center; }
  //         .footer a { color: #007BFF; }
  //       </style>
  //     </head>
  //     <body>
  //       <div class="container">
  //         <div class="logo">
  //           <img src="https://giveaze.com/giveaze2.png" alt="Giveaze Logo" width="120" />
  //         </div>
  //         <div class="title">Donation Receipt</div>

  //         <div class="section">
  //           <p>We acknowledge with gratitude the generous donation received from <strong>${
  //             userDonations?.full_name
  //           }</strong> in support of the campaign
  //             <strong>${donation?.donation_campaign_id?.campaign_title}</strong>.
  //           </p>
  //         </div>

  //         <div style="display: flex; gap: 40px;">
  //           <div class="section" style="flex: 1;">
  //             <h3>Donation Details</h3>
  //             <p>Transaction ID: ${donation.transaction_id}</p>
  //             <p>Campaign ID: ${donation?.donation_campaign_id?._id}</p>
  //             <p>Amount Donated: ₹${amount}</p>
  //             <p>Status: ${donation.payment_status}</p>
  //             <p>Date: ${new Date(donation.donated_date).toLocaleDateString(
  //               "en-GB"
  //             )}</p>
  //           </div>
  //           <div class="section" style="flex: 1;">
  //             <h3>Donor Information</h3>
  //             <p>Name: ${userDonations?.full_name}</p>
  //             <p>Email: ${userDonations?.email}</p>
  //             <p>Phone: ${userDonations?.mobile_number}</p>
  //             ${
  //               donation?.issued_80g
  //                 ? `
  //               <p>PAN: ${donation?.pan_number || "N/A"}</p>
  //               <p>Address: ${donation?.full_address || "N/A"}</p>
  //               `
  //                 : ""
  //             }
  //           </div>
  //         </div>

  //         <div class="footer">
  //           <p><strong>Giveaze Foundation</strong></p>
  //           <p>MPC1705, Parkwest, Hosakere Road, Binnypet, Bangalore - 560023</p>
  //           <p>Email: info@giveaze.com</p>
  //           <p>Website: <a href="https://giveaze.com">www.giveaze.com</a></p>
  //           <p><em>This receipt is for acknowledgment only. For 80G, contact us at <a href="mailto:info@giveaze.com">info@giveaze.com</a></em></p>
  //         </div>
  //       </div>
  //     </body>
  //     </html>
  //   `;

  const htmlContent = `
  <html>
    <head>
      <title>Donation Receipt</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 30px;
          background: #fff;
          margin: 0;
        }
        .container {
          max-width: 800px;
          margin: auto;
          border: 1px solid #ccc;
          padding: 25px 30px;
          border-radius: 8px;
          background-color: #fff;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
        }
        .logo-title {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          margin-bottom: 20px;
        }
        .logo-title img {
          margin-bottom: 10px;
        }
        .logo-title h2 {
          font-size: 26px;
          color: #333;
          margin-bottom: 5px;
        }
        .acknowledgment {
          margin-top: 30px;
          text-align: center;
        }
        .acknowledgment p {
          font-size: 16px;
          font-style: italic;
          color: #444;
        }
        .section {
          display: flex;
          gap: 40px;
          margin-top: 30px;
        }
        .section h3 {
          font-size: 18px;
          color: #222;
          margin-bottom: 12px;
        }
        .section p {
          margin: 6px 0;
          font-size: 14px;
        }
        .label {
          color: #333;
          font-weight: bold;
        }
        .value {
          color: #666;
        }

        .footer {
          margin-top: 50px;
          padding-top: 20px;
          text-align: left;
          position: relative;
        }

        .footer::before {
          content: "";
          display: block;
          width: 60%;
          height: 1px;
          background: #ddd;
          margin: 0 auto 20px auto;
        }

        .footer h4 {
          font-size: 16px;
          color: #333;
        }

        .footer p {
          font-size: 14px;
          color: #555;
          margin: 5px 0;
        }

        .footer a {
          color: #007BFF;
          text-decoration: none;
        }

        .footer-gap {
          margin-top: 15px; /* space between website and note */
            border-bottom: 1px solid #ddd;  /* <-- Add this line */
        }

        .note {
          font-size: 12px;
          color: #999;
          margin-top: 20px;
          text-align:center;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Logo & Title -->
        <div class="logo-title">
          <img src="https://giveaze.com/giveaze2.png" alt="Giveaze Logo" width="120" />
          <h2>Donation Receipt</h2>
        </div>

        <!-- Acknowledgment Message -->
        <div class="acknowledgment">
          <p>
            We acknowledge with gratitude the generous donation received from 
            <strong>${userDonations?.full_name} </strong> 
            This contribution was made through 
            <a href="https://giveaze.com" target="_blank" style="color: #007BFF; text-decoration: none;">www.giveaze.com</a>, 
            in support of the campaign titled 
            "<a href="https://giveaze.com/campaign/${
              donation?.donation_campaign_id?._id
            }" 
            target="_blank" style="color: #007BFF; font-weight: bold; text-decoration: none;">
            ${donation?.donation_campaign_id?.campaign_title}
            </a>".
          </p>
        </div>

        <!-- Two Column Section -->
        <div class="section">
          <!-- Left Column - Donation Details -->
          <div style="flex: 1;">
            <h3>Donation Details</h3>
            <p><span class="label">Transaction ID:</span> <span class="value">${
              donation.transaction_id
            }</span></p>
            <p><span class="label">Campaign ID:</span> <span class="value">${
              donation?.donation_campaign_id?._id
            }</span></p>
            <p><span class="label">Amount Donated:</span> <span class="value">₹${amount}</span></p>
            <p><span class="label">Status:</span> <span class="value">${
              donation.payment_status
            }</span></p>
            <p><span class="label">Date:</span> <span class="value">${new Date(
              donation.donated_date
            ).toLocaleDateString("en-GB")}</span></p>
          </div>

          <!-- Right Column - Donor Info -->
          <div style="flex: 1;">
            <h3>Donor Information</h3>
            <p><span class="label">Name:</span> <span class="value">${
              userDonations?.full_name
            }</span></p>
            <p><span class="label">Email:</span> <span class="value">${
              userDonations?.email
            }</span></p>
            <p><span class="label">Phone:</span> <span class="value">${
              userDonations?.mobile_number
            }</span></p>
            ${
              donation?.issued_80g
                ? `
            <p><span class="label">PAN:</span> <span class="value">${
              donation?.pan_number || "N/A"
            }</span></p>
            <p><span class="label">Address:</span> <span class="value">${
              donation?.full_address || "N/A"
            }</span></p>
              `
                : ""
            }
          </div>
        </div>

        <!-- Footer -->
        <div class="footer">
          <h4>Giveaze Foundation</h4>
          <p>MPC1705, Parkwest, Hosakere Road, </p>
          <p>Binnypet, Bangalore - 560023</p>
          <p><strong>Email:</strong> info@giveaze.com</p>
          <p><strong>Website:</strong> <a href="https://giveaze.com" target="_blank">www.giveaze.com</a></p>
          <div class="footer-gap"></div>
          <p class="note">
            <em>This receipt is for acknowledgment purposes only. For official tax exemption documents, please contact us at 
            <a href="mailto:info@giveaze.com">info@giveaze.com</a>.</em>
          </p>
        </div>
      </div>
    </body>
  </html>
`;

  const receiptsDir = path.join(__dirname, "../receipts");
  if (!fs.existsSync(receiptsDir)) {
    fs.mkdirSync(receiptsDir, { recursive: true });
  }

  const filePath = path.join(receiptsDir, outputFileName);

  // Delete old receipt file if exists
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
      console.log(`Deleted old receipt file: ${filePath}`);
    } catch (error) {
      console.error(`Failed to delete old receipt file: ${error.message}`);
    }
  }

  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: "networkidle0" });

  await page.pdf({
    path: filePath,
    format: "A4",
    printBackground: true,
    margin: { top: "20px", bottom: "20px" },
  });

  await browser.close();

  return filePath;
};

export default generateReceiptPDF;
