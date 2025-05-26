// src/controllers/partyMapController.js
const PartyCategoryMap = require("../models/partyCategoryMap");
const { bulkUpdateFinanceCategory } = require("../services/mappingService");

const createPartyMap = async (req, res) => {
  try {
    const { party, label, category } = req.body;

    const exists = await PartyCategoryMap.findOne({ party });
    if (exists) return res.status(409).json({ message: "Mapping already exists." });

    const mapping = await PartyCategoryMap.create({ party, label, category });

    await bulkUpdateFinanceCategory(party, label, category);

    res.status(201).json(mapping);
  } catch (err) {
    res.status(500).json({ error: "Failed to create mapping", details: err.message });
  }
};

module.exports = { createPartyMap };
