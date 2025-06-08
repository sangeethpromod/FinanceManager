const PartyCategoryMap = require("../models/partyCategoryMap");
const Finance = require("../models/financeModel");
import { Request, Response } from "express";

const getCategorySummary = async (_req: Request, res: Response) => {
  try {
    const categoryMappings = await PartyCategoryMap.find({ status: "ACTIVE" });

    interface LabelMapping {
      label: string;
    }

    interface CategoryMapping {
      category: string;
      mappings: LabelMapping[];
    }

    interface LabelTotal {
      label: string;
      total: number;
    }

    interface CategorySummary {
      category: string;
      categoryTotal: number;
      labels: LabelTotal[];
    }

    const response: CategorySummary[] = await Promise.all(
      (categoryMappings as CategoryMapping[]).map(async (category: CategoryMapping) => {
        const categoryTotalAgg = await Finance.aggregate([
          { $match: { category: category.category } },
          {
            $group: {
              _id: null,
              total: { $sum: { $toDouble: "$amount" } },
            },
          },
        ]);

        const labels: LabelTotal[] = await Promise.all(
          category.mappings.map(async (map: LabelMapping) => {
            const labelTotalAgg = await Finance.aggregate([
              {
                $match: {
                  category: category.category,
                  label: map.label,
                },
              },
              {
                $group: {
                  _id: null,
                  total: { $sum: { $toDouble: "$amount" } },
                },
              },
            ]);

            return {
              label: map.label,
              total: labelTotalAgg[0]?.total || 0,
            };
          })
        );

        return {
          category: category.category,
          categoryTotal: categoryTotalAgg[0]?.total || 0,
          labels,
        };
      })
    );

    return res.status(200).json({ status: "ok", data: response });
  } catch (err) {
    console.error("Error in getCategorySummary:", err);
    return res.status(500).json({ status: "error", message: "Internal Server Error" });
  }
};



//Get Category by Name
const getCategoryByName = async (req: Request, res: Response) => {
  try {
    const categoryName = req.query.name || req.params.name;
    if (!categoryName || typeof categoryName !== "string") {
      return res.status(400).json({ status: "error", message: "Category name is required" });
    }

    // Fetch the category mapping for the given name and status ACTIVE
    const categoryMapping = await PartyCategoryMap.findOne({ category: categoryName, status: "ACTIVE" });

    if (!categoryMapping) {
      return res.status(404).json({ status: "error", message: `Category '${categoryName}' not found or inactive` });
    }

    // Calculate total for category
    const categoryTotalAgg = await Finance.aggregate([
      { $match: { category: categoryName } },
      {
        $group: {
          _id: null,
          total: { $sum: { $toDouble: "$amount" } },
        },
      },
    ]);

    // For each label, get parties with their total amounts
    const labels = await Promise.all(
      categoryMapping.mappings.map(async (map: { label: string }) => {
        // Aggregate by party within this label and category
        const partiesAgg = await Finance.aggregate([
          {
            $match: {
              category: categoryName,
              label: map.label,
            },
          },
          {
            $group: {
              _id: "$party", // assuming the party field is named 'party'
              totalAmount: { $sum: { $toDouble: "$amount" } },
            },
          },
          {
            $project: {
              _id: 0,
              party: "$_id",
              totalAmount: 1,
            },
          },
        ]);

        return {
          label: map.label,
          parties: partiesAgg, // array of { party, totalAmount }
        };
      })
    );

    return res.status(200).json({
      status: "ok",
      data: {
        category: categoryName,
        categoryTotal: categoryTotalAgg[0]?.total || 0,
        labels,
      },
    });
  } catch (err) {
    console.error("Error in getCategoryByName:", err);
    return res.status(500).json({ status: "error", message: "Internal Server Error" });
  }
};



export { getCategorySummary, getCategoryByName };
