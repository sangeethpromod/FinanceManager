import { Request, Response } from "express";
const PartyCategoryMap = require("../models/partyCategoryMap");
const { bulkUpdateFinanceCategory } = require("../services/mappingService");

const createPartyMap = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      parties, 
      label, 
      category, 
      description, 
      status 
    }: { 
      parties: string[]; 
      label: string; 
      category: string; 
      description?: string; 
      status?: string; 
    } = req.body;

    // Validate that parties array is provided and not empty
    if (!parties || !Array.isArray(parties) || parties.length === 0) {
      res.status(400).json({ message: "Parties array is required and cannot be empty." });
      return;
    }

    // Find existing mapping by label + category
    const existingMapping = await PartyCategoryMap.findOne({ label, category });

    if (existingMapping) {
      // Check if any of the parties already exist
      const existingParties = parties.filter(party => existingMapping.parties.includes(party));
      
      if (existingParties.length > 0) {
        res.status(409).json({ 
          message: "Some parties already exist in this mapping", 
          existingParties 
        });
        return;
      }

      // Add new parties to existing mapping
      existingMapping.parties.push(...parties);
      
      // Update other fields if provided
      if (description) existingMapping.description = description;
      if (status) existingMapping.status = status;
      
      await existingMapping.save();

      // Update finance categories for all parties
      for (const party of parties) {
        await bulkUpdateFinanceCategory(party, label, category);
      }

      res.status(200).json({ 
        message: "Parties added to existing mapping", 
        mapping: existingMapping 
      });
      return;
    }

    // If no existing mapping, create new one
    const newMapping = await PartyCategoryMap.create({
      parties: parties,
      label,
      category,
      description: description || "",
      status: status || "ACTIVE"
    });

    // Update finance categories for all parties
    for (const party of parties) {
      await bulkUpdateFinanceCategory(party, label, category);
    }

    res.status(201).json(newMapping);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to create mapping", details: err.message });
  }
};

// Get all current mappings
const getAllMappings = async (req: Request, res: Response): Promise<void> => {
  try {
    const mappings = await PartyCategoryMap.find({});
    res.status(200).json(mappings);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch mappings", details: err.message });
  }
};

// Update existing mapping
const updatePartyMap = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params; // Changed from party to id since we're dealing with arrays
    const { 
      parties, 
      label, 
      category, 
      description, 
      status 
    }: { 
      parties?: string[]; 
      label?: string; 
      category?: string; 
      description?: string; 
      status?: string; 
    } = req.body;

    const updateData: any = {};
    if (parties) updateData.parties = parties;
    if (label) updateData.label = label;
    if (category) updateData.category = category;
    if (description !== undefined) updateData.description = description;
    if (status) updateData.status = status;

    const mapping = await PartyCategoryMap.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!mapping) {
      res.status(404).json({ message: "Mapping not found." });
      return;
    }

    // Update finance categories for all parties if they changed
    if (parties && label && category) {
      for (const party of parties) {
        await bulkUpdateFinanceCategory(party, label, category);
      }
    }

    res.status(200).json(mapping);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to update mapping", details: err.message });
  }
};

// Get all distinct parties from Finance not mapped yet
const getUnmappedParties = async (req: Request, res: Response): Promise<void> => {
  try {
    const Finance = require("../models/finance"); // Make sure to import Finance model
    
    const allParties = await Finance.distinct("party");
    const mappedParties = await PartyCategoryMap.distinct("parties"); // Changed from "party" to "parties"

    // Flatten the mapped parties array since it's now an array of arrays
    const flatMappedParties = mappedParties.flat();

    const unmapped: string[] = (allParties as string[]).filter(
      (party: string) => !flatMappedParties.includes(party)
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
  getAllMappings 
};