const FinanceRequirement = require("../models/financeModel");
const PartyCategoryMap = require("../models/partyCategoryMap");

export const bulkUpdateFinanceCategory = async (
  party: string,
  label: string,
  category: string
): Promise<void> => {
  try {
    // Validate if the mapping actually exists and is active
    const mapping = await PartyCategoryMap.findOne({
      category,
      status: "ACTIVE",
      mappings: {
        $elemMatch: {
          label,
          parties: party
        }
      }
    });

    if (!mapping) {
      console.warn(`⚠️ No ACTIVE mapping found for party "${party}" under label "${label}" in category "${category}"`);
      return;
    }

    // Update all finance entries for this party ONLY if their label/category are not already correct
    const result = await FinanceRequirement.updateMany(
      { party, $or: [ { category: { $ne: category } }, { label: { $ne: label } } ] },
      {
        $set: {
          category,
          label,
        },
      }
    );

    if (result.modifiedCount === 0) {
      console.warn(`🟡 No finance entries updated for party: ${party}`);
    } else {
      console.log(`✅ ${result.modifiedCount} finance entries updated for party: ${party}, label: ${label}, category: ${category}`);
    }
  } catch (err) {
    console.error(`❌ Error updating finance entries for party: ${party}`, err);
  }
};