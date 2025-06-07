import mongoose from "mongoose";

const mappingSchema = new mongoose.Schema({
  category: { type: String, required: true },
  mappings: [
    {
      label: { type: String, required: true },
      parties: [{ type: String, required: true }],
    },
  ],
  description: { type: String, default: "" },
  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE'],
    default: 'ACTIVE',
  },
}, { timestamps: true });

const PartyCategoryMap = mongoose.model("PartyCategoryMap", mappingSchema);

module.exports = PartyCategoryMap;