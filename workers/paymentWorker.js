import { Worker } from "bullmq";
import { redisConnection } from "../redis.js";
import Donation from "../models/donation.js";
import {
  sendDonationReceipt,
  razorpayInstance,
} from "../controllers/transactions.js";
import generateReceiptPDF from "../utils/generateReceiptPDF.js";

const paymentWorker = new Worker(
  "paymentQueue",
  async (job) => {
    console.log("Processing Job:", job.id, job.data);

    const { razorpay_payment_id, donation_id } = job.data;

    // fetch payment
    const paymentDetails = await razorpayInstance.payments.fetch(
      razorpay_payment_id
    );
    if (paymentDetails.status !== "captured") {
      throw new Error("Payment not captured!");
    }

    // find donation
    const donation = await Donation.findById(donation_id)
      .populate("donation_campaign_id")
      .populate("user_id");

    if (!donation) throw new Error("Donation not found!");

    // update donation
    donation.payment_status = "successful";
    donation.paid = true;
    donation.transaction_id = razorpay_payment_id;
    await donation.save();

    // // update campaign
    // const campaign = donation.donation_campaign_id;
    // if (campaign) {
    //   campaign.raised_amount =
    //     (Number(campaign.raised_amount) || 0) + Number(donation.total_amount);
    //   await campaign.save();
    // }

    // generate receipt
    const receiptFileName = `receipt_${razorpay_payment_id}.pdf`; // ✅ always use Razorpay ID

    // const receiptFileName = `receipt_${donation.transaction_id}.pdf`;
    const receiptPath = await generateReceiptPDF(
      donation,
      donation.user_id,
      receiptFileName
    );
    donation.receipt_url = `/receipts/${receiptFileName}`;
    await donation.save();

    // send email
    await sendDonationReceipt(
      donation.user_id.email,
      donation.user_id.full_name,
      new Date().toLocaleString(),
      donation.total_amount,
      razorpay_payment_id,
      donation.notes || "",
      receiptPath
    );

    return { status: "done", donationId: donation._id };
  },
  { connection: redisConnection }
);

paymentWorker.on("completed", (job) => {
  console.log(`✅ Job ${job.id} completed`);
});

paymentWorker.on("failed", (job, err) => {
  console.error(`❌ Job ${job.id} failed:`, err.message);
});
