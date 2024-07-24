import { Op } from "sequelize";
import Enquiry from "../models/enquiry.js";

// Create a new enquiry
export const createEnquiry = async (req, res) => {
  const { name, email, number, purpose, trust } = req.body;

  if (!name || !email || !number || !purpose || !trust) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    // Check if email or number already exists
    const existingEnquiry = await Enquiry.findOne({
      where: {
        [Op.or]: [{ email }, { number }],
      },
    });

    if (existingEnquiry) {
      return res.status(400).json({ error: 'Email or Mobile number already exists' });
    }

    const enquiry = await Enquiry.create({ name, email, number, purpose, trust });
    res.status(201).json({ status: true, message: "Campaign Added Successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


// Update an existing enquiry
export const updateEnquiry = async (req, res) => {
  const { id } = req.params;
  const { name, email, number, purpose, trust } = req.body;

  try {
    const enquiry = await Enquiry.findByPk(id);

    if (!enquiry) {
      return res.status(404).json({ error: 'Enquiry not found' });
    }

    enquiry.name = name || enquiry.name;
    enquiry.email = email || enquiry.email;
    enquiry.number = number || enquiry.number;
    enquiry.purpose = purpose || enquiry.purpose;
    enquiry.trust = trust || enquiry.trust;

    await enquiry.save();

    res.status(200).json(enquiry);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete an enquiry
export const deleteEnquiry = async (req, res) => {
  const { id } = req.params;

  try {
    const enquiry = await Enquiry.findByPk(id);

    if (!enquiry) {
      return res.status(404).json({ error: 'Enquiry not found' });
    }

    await enquiry.destroy();

    res.status(200).json({ message: 'Enquiry deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
