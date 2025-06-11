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
      status,
      allowMerge = true // New parameter to control merging behavior
    }: {
      category: string;
      mappings: { label: string; parties: string[] }[];
      description?: string;
      status?: string;
      allowMerge?: boolean;
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

      if (!label) {
        console.warn(`⚠️ Label is missing, skipping mapping`);
        continue;
      }

      // Allow empty parties array for creating labels without parties
      if (!Array.isArray(parties)) {
        console.warn(`⚠️ Parties must be an array for label '${label}', skipping`);
        continue;
      }

      const labelIdx = mappingDoc.mappings.findIndex((m: any) => m.label === label);

      if (labelIdx >= 0) {
        // Label exists - merge or replace based on allowMerge flag
        if (allowMerge) {
          // Merge: Add new parties to existing ones (avoid duplicates)
          const existingParties = mappingDoc.mappings[labelIdx].parties || [];
          const mergedParties = Array.from(new Set([...existingParties, ...parties]));
          mappingDoc.mappings[labelIdx].parties = mergedParties;
          console.log(`✅ Merged parties for existing label '${label}' in category '${category}'`);
        } else {
          // Replace: Overwrite existing parties with new ones
          mappingDoc.mappings[labelIdx].parties = parties;
          console.log(`✅ Replaced parties for existing label '${label}' in category '${category}'`);
        }
      } else {
        // Label doesn't exist - create new label
        mappingDoc.mappings.push({ label, parties });
        console.log(`✅ Created new label '${label}' with ${parties.length} parties in category '${category}'`);
      }

      // Update each party's finance category (only if parties exist)
      for (const party of parties) {
        if (party && party.trim()) {
          await bulkUpdateFinanceCategory(party, label, category);
        }
      }
    }

    if (description) mappingDoc.description = description;
    if (status) mappingDoc.status = status;

    await mappingDoc.save();

    res.status(201).json({
      success: true,
      message: "Party category mapping updated successfully",
      data: mappingDoc
    });
  } catch (err: any) {
    console.error("Error in createPartyMap:", err);
    res.status(500).json({ 
      error: "Failed to create mapping", 
      details: err.message 
    });
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

const updatePartyMap = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      category,
      newCategory,
      label,
      newLabel,
      parties,
      description,
      status,
    }: {
      category: string;
      newCategory?: string;
      label: string;
      newLabel?: string;
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

    interface Mapping {
      label: string;
      parties: string[];
    }

    interface PartyCategoryMapDoc {
      category: string;
      mappings: Mapping[];
      description?: string;
      status?: string;
      save: () => Promise<void>;
    }

    const labelIdx = (mappingDoc as PartyCategoryMapDoc).mappings.findIndex((m: Mapping) => m.label === label);
    if (labelIdx === -1) {
      res.status(404).json({ message: "Label not found in category." });
      return;
    }

    // Update parties if provided
    if (parties) {
      mappingDoc.mappings[labelIdx].parties = Array.from(new Set(parties));
      for (const party of parties) {
        await bulkUpdateFinanceCategory(party, newLabel || label, newCategory || category);
      }
    }

    // Rename label
    if (newLabel) {
      mappingDoc.mappings[labelIdx].label = newLabel;
    }

    // Update top-level description and status
    if (description !== undefined) mappingDoc.description = description;
    if (status !== undefined) mappingDoc.status = status;

    // Rename category name itself
    if (newCategory) {
      mappingDoc.category = newCategory;
    }

    await mappingDoc.save();

    res.status(200).json({ message: "Mapping updated", data: mappingDoc });
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



const deletePartyMap = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      category,
      label,
      parties
    }: {
      category: string;
      label?: string;
      parties?: string[];
    } = req.body;

    if (!category) {
      res.status(400).json({ message: "category is required." });
      return;
    }

    const mappingDoc = await PartyCategoryMap.findOne({ category });
    if (!mappingDoc) {
      res.status(404).json({ message: "Category not found." });
      return;
    }

    // If only category is given, delete the whole category doc
    if (!label && !parties) {
      await PartyCategoryMap.deleteOne({ category });
      res.status(200).json({ message: `Category '${category}' deleted.` });
      return;
    }

    const labelIdx = mappingDoc.mappings.findIndex((m: any) => m.label === label);
    if (labelIdx === -1) {
      res.status(404).json({ message: "Label not found in category." });
      return;
    }

    // If label is given, and no parties => delete entire label
    if (label && !parties) {
      mappingDoc.mappings.splice(labelIdx, 1);
      await mappingDoc.save();
      res.status(200).json({ message: `Label '${label}' deleted from category '${category}'.` });
      return;
    }

    // If label and parties are given => remove only those parties
    if (label && Array.isArray(parties)) {
      const existingParties = mappingDoc.mappings[labelIdx].parties;
      mappingDoc.mappings[labelIdx].parties = existingParties.filter(
        (p: string) => !parties.includes(p)
      );

      // If after removal no parties left, remove the label itself
      if (mappingDoc.mappings[labelIdx].parties.length === 0) {
        mappingDoc.mappings.splice(labelIdx, 1);
      }

      await mappingDoc.save();
      res.status(200).json({ message: `Parties removed from label '${label}' in category '${category}'.`, updatedDoc: mappingDoc });
      return;
    }

    res.status(400).json({ message: "Invalid combination of inputs." });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to delete mapping", details: err.message });
  }
};


module.exports = {
  createPartyMap,
  getUnmappedParties,
  updatePartyMap,
  getAllMappings,
  deletePartyMap ,
};