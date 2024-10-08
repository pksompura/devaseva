 

import DonationCategory from '../models/donationCategory.js';

export const createDonationCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    const category = new DonationCategory({ name, description });
    await category.save();

    res.status(201).json({
      status: true,
      message: 'Donation category created successfully',
      data: category,
    });
  } catch (error) {
    res.status(400).json({ status: false, message: error.message, data: null });
  }
};

export const listDonationCategories = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const perPage = parseInt(req.query.perPage) || 10;

  try {
    const count = await DonationCategory.countDocuments();
    const categories = await DonationCategory.find()
      .limit(perPage)
      .skip((page - 1) * perPage);

    const totalPages = Math.ceil(count / perPage);

    res.status(200).json({
      categories: categories,
      currentPage: page,
      totalPages: totalPages,
      totalItems: count,
    });
  } catch (error) {
    res.status(400).json({ status: false, message: error.message, data: null });
  }
};

export const getDonationCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await DonationCategory.findById(id);

    if (!category) {
      return res.status(404).json({ status: false, message: 'Donation category not found', data: null });
    }

    res.status(200).json({
      status: true,
      message: 'Donation category fetched successfully',
      data: category,
    });
  } catch (error) {
    res.status(400).json({ status: false, message: error.message, data: null });
  }
};

export const updateDonationCategory = async (req, res) => {
  try {
    const { name, description ,_id} = req.body;

    const category = await DonationCategory.findById(_id);
   console.log(category)
    if (!category) {
      return res.status(404).json({ status: false, message: 'Donation category not found', data: null });
    }

    category.name = name || category.name;
    category.description = description || category.description;

    await category.save();

    res.status(200).json({
      status: true,
      message: 'Donation category updated successfully',
      data: category,
    });
  } catch (error) {
    res.status(400).json({ status: false, message: error.message, data: null });
  }
};

export const deleteDonationCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await DonationCategory.findById(id);

    if (!category) {
      return res.status(404).json({ status: false, message: 'Donation category not found', data: null });
    }

    await DonationCategory.findByIdAndDelete(id);

    res.status(200).json({
      status: true,
      message: 'Donation category deleted successfully',
    });
  } catch (error) {
    res.status(400).json({ status: false, message: error.message, data: null });
  }
};
