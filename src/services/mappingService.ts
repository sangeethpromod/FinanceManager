const FinanceRequirement = require("../models/financeModel");
const PartyCategoryMap = require("../models/partyCategoryMap");

interface BulkUpdateFinanceCategoryParams {
  party: string;
  label: string;
  category: string;
}

export const bulkUpdateFinanceCategory = async (
  party: BulkUpdateFinanceCategoryParams["party"],
  label: BulkUpdateFinanceCategoryParams["label"],
  category: BulkUpdateFinanceCategoryParams["category"]
): Promise<void> => {
  try {
    // Find the ACTIVE mapping where the party exists in the 'parties' array
    const activeMapping = await PartyCategoryMap.findOne({
      parties: party,
      status: "ACTIVE",
    });

    if (!activeMapping) {
      console.warn(`⚠️ No ACTIVE mapping found for party: ${party}`);
      return;
    }

    const result = await FinanceRequirement.updateMany(
      { party },
      {
        $set: {
          category: activeMapping.category,
          label: activeMapping.label,
        },
      }
    );

    if (result.modifiedCount === 0) {
      console.warn(`🟡 No finance entries updated for party: ${party}`);
    } else {
      console.log(`✅ ${result.modifiedCount} finance entries updated for party: ${party} &${label} in category: ${category}`);
    }
  } catch (err) {
    console.error(`❌ Error updating finance entries for party: ${party}`, err);
  }
};
