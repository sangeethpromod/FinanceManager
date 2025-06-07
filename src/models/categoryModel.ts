import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
  categoryName: { type: String, required: true },
  categoryDescription: { type: String, required: true },
    categoryStatus: { 
    type: String, 
    enum: ['ACTIVE', 'INACTIVE'], 
    default: 'ACTIVE' 
  },
}, { timestamps: true });

const Category = mongoose.model("Category", categorySchema);

module.exports = Category;