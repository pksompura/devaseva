import { Vonage } from '@vonage/server-sdk'
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import User from '../models/users.js';



function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }


const vonage = new Vonage({
    apiKey: "32f2a9f4",
    apiSecret: "aQ0wZEqAB3YVwkAp"
  })

  const from = "Vonage APIs"
const to = "918861151876"
const text = ``

async function sendSMS(to, from, text) {
    await vonage.sms.send({to, from, text})
        .then(resp => { console.log('Message sent successfully'); console.log(resp); })
        .catch(err => { console.log('There was an error sending the messages.'); console.error(err); });
}




export const sendOTP = async (req, res) => {

  const { mobile_number } = req.body;
  if (!mobile_number) {
    return res.status(400).json({ error: 'Mobile number is required' });
  }

  try {
    const otp = generateOTP();
    let user = await User.findOne({ where: { mobile_number } });
    if (user) {
      user.otp = otp;
      await user.save();
    } else {
      user = await User.create({ mobile_number, otp });
    }



    await sendSMS(`91${mobile_number}`,"Vonage APIs", otp);

    res.status(200).json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const verifyOTP = async (req, res) => {
  const { mobile_number, otp } = req.body;
  if (!mobile_number || !otp) {
    return res.status(400).json({ error: 'Mobile number and OTP are required' });
  }

  try {
    const user = await User.findOne({ where: { mobile_number, otp } });

    if (!user) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    // Clear the OTP after successful verification
    user.otp = null;
    await user.save();

    // Create a JWT token
    const token = jwt.sign({ id: user.id, mobile_number: user.mobile_number }, "JWT_SECRET", {
      expiresIn: '1h', // Token expires in 1 hour
    });

    res.status(200).json({ message: 'OTP verified successfully', token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


export const listUsers = async (req, res) => {
  try {
    const users = await User.findAll(); // Use your ORM method to fetch users
    res.status(200).json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
