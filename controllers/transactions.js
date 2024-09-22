import Razorpay from 'razorpay';
import crypto from 'crypto';
import Payment from '../models/Payment.js';
import User from '../models/User.js';
// import DonationCampaign from '../models/DonationCampaign.js';
import 'dotenv/config';
import Donation from '../models/donation.js';

// Initialize Razorpay instance
const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_SECRET,
});

// Controller to create a Razorpay order
export const createOrder = async (req, res) => {
    const { amount } = req.body;

    try {
        const options = {
            amount: Number(amount * 100), // Amount in paise
            currency: "INR",
            receipt: crypto.randomBytes(10).toString("hex"),
        };

        const order = await razorpayInstance.orders.create(options);
        res.status(200).json({ data: order });
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error!" });
    }
};

// Controller to verify payment and create a donation entry
export const verifyPayment = async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, user_id, donation_campaign_id, amount } = req.body;

    try {
        const sign = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSign = crypto.createHmac("sha256", process.env.RAZORPAY_SECRET)
            .update(sign.toString())
            .digest("hex");

        if (expectedSign === razorpay_signature) {
            // Create a new payment entry
            const payment = new Payment({
                razorpay_order_id,
                razorpay_payment_id,
                razorpay_signature
            });

            await payment.save();

            // Create a new donation entry
            const donation = new Donation({
                user_id,
                donation_campaign_id,
                total_amount: amount,
                payment_id: payment._id, // Link payment to the donation
            });

            await donation.save();

            res.json({ message: "Payment Verified and Donation Created Successfully" });
        } else {
            res.status(400).json({ message: "Invalid Signature!" });
        }
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error!" });
    }
};

// Controller to fetch all donations by a user
export const getDonationsByUser = async (req, res) => {
    const { userId } = req.params;

    try {
        const donations = await Donation.find({ user_id: userId }).populate('donation_campaign_id');
        if (!donations) {
            return res.status(404).json({ message: "No donations found for this user." });
        }
        res.status(200).json(donations);
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error!" });
    }
};

// Controller to fetch all donations by campaign
export const getDonationsByCampaign = async (req, res) => {
    const { campaignId } = req.params;

    try {
        const donations = await Donation.find({ donation_campaign_id: campaignId }).populate('user_id');
        if (!donations) {
            return res.status(404).json({ message: "No donations found for this campaign." });
        }
        res.status(200).json(donations);
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error!" });
    }
};

// Controller to fetch donations by transaction/payment ID
export const getDonationsByTransactionId = async (req, res) => {
    const { paymentId } = req.params;

    try {
        const payment = await Payment.findOne({ razorpay_payment_id: paymentId }).populate('donation_campaign_id');
        if (!payment) {
            return res.status(404).json({ message: "No donations found for this transaction." });
        }
        res.status(200).json(payment);
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error!" });
    }
};
