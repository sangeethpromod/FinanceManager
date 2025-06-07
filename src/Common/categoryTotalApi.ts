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

export { getCategorySummary };
