import { Request, Response } from "express";
const PartyCategoryMap = require("../models/partyCategoryMap")
const { bulkUpdateFinanceCategory } = require("../services/mappingService");

// Create or update mapping for a category
const createPartyMap = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      category,
      mappings,
      description,
      status
    }: {
      category: string;
      mappings: { label: string; parties: string[] }[];
      description?: string;
      status?: string;
    } = req.body;

    if (!category || !Array.isArray(mappings) || mappings.length === 0) {
      res.status(400).json({ message: "category and mappings[] are required." });
      return;
    }

    // Fetch or create base doc
    let mappingDoc = await PartyCategoryMap.findOne({ category });

    if (!mappingDoc) {
      mappingDoc = await PartyCategoryMap.create({
        category,
        mappings: [],
        description: description || "",
        status: status || "ACTIVE",
      });
    }

    for (const map of mappings) {
      const { label, parties } = map;

      if (!label || !Array.isArray(parties) || parties.length === 0) continue;

      const labelIdx = mappingDoc.mappings.findIndex((m: any) => m.label === label);

      if (labelIdx >= 0) {
        const existingParties = mappingDoc.mappings[labelIdx].parties;
        mappingDoc.mappings[labelIdx].parties = Array.from(new Set([...existingParties, ...parties]));
      } else {
        mappingDoc.mappings.push({ label, parties });
      }

      // Update each party's finance category
      for (const party of parties) {
        await bulkUpdateFinanceCategory(party, label, category);
      }
    }

    if (description) mappingDoc.description = description;
    if (status) mappingDoc.status = status;

    await mappingDoc.save();

    res.status(201).json(mappingDoc);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to create mapping", details: err.message });
  }
};


// Get all current mappings
const getAllMappings = async (_req: Request, res: Response): Promise<void> => {
  try {
    const mappings = await PartyCategoryMap.find({});
    res.status(200).json(mappings);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch mappings", details: err.message });
  }
};

// Update existing mapping (by category and label)
const updatePartyMap = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, label, parties, description, status }: {
      category: string;
      label: string;
      parties?: string[];
      description?: string;
      status?: string;
    } = req.body;

    if (!category || !label) {
      res.status(400).json({ message: "category and label are required." });
      return;
    }

    const mappingDoc = await PartyCategoryMap.findOne({ category });
    if (!mappingDoc) {
      res.status(404).json({ message: "Mapping category not found." });
      return;
    }
    const labelIdx = mappingDoc.mappings.findIndex((m: any) => m.label === label);
    if (labelIdx === -1) {
      res.status(404).json({ message: "Label not found in category." });
      return;
    }
    if (parties) {
      mappingDoc.mappings[labelIdx].parties = Array.from(new Set(parties));
    }
    if (description !== undefined) mappingDoc.description = description;
    if (status) mappingDoc.status = status;
    await mappingDoc.save();

    // Update finance categories for all parties
    if (parties) {
      for (const party of parties) {
        await bulkUpdateFinanceCategory(party, label, category);
      }
    }

    res.status(200).json(mappingDoc);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to update mapping", details: err.message });
  }
};

// Get all distinct parties from Finance not mapped yet
const getUnmappedParties = async (_req: Request, res: Response): Promise<void> => {
  try {
    const Finance = require("../models/financeModel");
    const allParties = await Finance.distinct("party");
    const mappings = await PartyCategoryMap.find({});
    // Flatten all parties from all mappings
    const mappedParties = mappings.flatMap((doc: any) => doc.mappings.flatMap((m: any) => m.parties));
    const unmapped: string[] = (allParties as string[]).filter(
      (party: string) => !mappedParties.includes(party)
    );
    res.status(200).json({ unmappedParties: unmapped });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch unmapped parties", details: err.message });
  }
};

module.exports = {
  createPartyMap,
  getUnmappedParties,
  updatePartyMap,
  getAllMappings,
};