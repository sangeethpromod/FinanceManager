const FinanceRequirement = require("../models/financeModel");
// const PartyCategoryMap = require("../models/partyCategoryMap");

export const bulkUpdateFinanceCategory = async (
  party: string,
  label: string,
  category: string
): Promise<void> => {
  try {
    const result = await FinanceRequirement.updateMany(
      { party, $or: [{ category: { $ne: category } }, { label: { $ne: label } }] },
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
