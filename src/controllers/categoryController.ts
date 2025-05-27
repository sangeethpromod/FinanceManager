import { Request, Response } from "express";
const Category = require("../models/categoryModel");

const createCategory = async (req: Request, res: Response) => {
  try {
    const {
      categoryName,
      categoryDescription,
      categoryStatus
    } = req.body;

    // Mandatory field check
    if (
      !categoryName ||
      !categoryDescription ||
      !categoryStatus
    ) {
      return res.status(400).json({ error: "Missing required category details" });
    }

    const newCategory = new Category({
      categoryName,
      categoryDescription,
      categoryStatus
    });

    await newCategory.save();

    return res.status(201).json({ success: true });
  } catch (err) {
    console.error("Error saving category:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

const getAllCategories = async (_: Request, res: Response) => {
  try {
    const categories = await Category.find();
    return res.status(200).json(categories);
  } catch (err) {
    console.error("Error fetching categories:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

module.exports = { createCategory, getAllCategories };
