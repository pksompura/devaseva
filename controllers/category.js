import DonationCategory from "../models/DonationCategory.js";

// Create a new donation category
export const createDonationCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    // Create a new category
    const category = await DonationCategory.create({ name, description });

    res.status(201).json({
      status: true,
      message: 'Donation category created successfully',
      data: category,
    });
  } catch (error) {
    res.status(400).json({ status: false, message: error.message, data: null });
  }
};

// Get all donation categories with pagination
export const listDonationCategories = async (req, res) => {
  const page = parseInt(req.query.page) || 1; // Current page number, default to 1
  const perPage = parseInt(req.query.perPage) || 10;  

  try {
    const { count, rows } = await DonationCategory.findAndCountAll({
      limit: perPage,
      offset: (page - 1) * perPage,
    });

    const totalPages = Math.ceil(count / perPage);

    res.status(200).json({
      categories: rows,
      currentPage: page,
      totalPages: totalPages,
      totalItems: count,
    });
  } catch (error) {
    res.status(400).json({ status: false, message: error.message, data: null });
  }
};

// Get a single donation category by ID
export const getDonationCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await DonationCategory.findByPk(id);

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

// Update a donation category
export const updateDonationCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const category = await DonationCategory.findByPk(id);

    if (!category) {
      return res.status(404).json({ status: false, message: 'Donation category not found', data: null });
    }

    await category.update({ name, description });

    res.status(200).json({
      status: true,
      message: 'Donation category updated successfully',
      data: category,
    });
  } catch (error) {
    res.status(400).json({ status: false, message: error.message, data: null });
  }
};

// Delete a donation category
export const deleteDonationCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await DonationCategory.findByPk(id);

    if (!category) {
      return res.status(404).json({ status: false, message: 'Donation category not found', data: null });
    }

    await category.destroy();

    res.status(200).json({
      status: true,
      message: 'Donation category deleted successfully',
    });
  } catch (error) {
    res.status(400).json({ status: false, message: error.message, data: null });
  }
};
