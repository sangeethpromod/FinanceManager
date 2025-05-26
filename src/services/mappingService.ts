// src/services/mappingService.js
const FinanceRequirement = require("../models/financeModel");

interface BulkUpdateFinanceCategoryParams {
    party: string;
    label: string;
    category: string;
}

const bulkUpdateFinanceCategory = async (
    party: BulkUpdateFinanceCategoryParams["party"],
    label: BulkUpdateFinanceCategoryParams["label"],
    category: BulkUpdateFinanceCategoryParams["category"]
): Promise<void> => {
    const result: { modifiedCount: number } = await FinanceRequirement.updateMany(
        { party },
        { $set: { category, label } }
    );
    console.log(`🔁 Updated ${result.modifiedCount} finance entries with new mapping.`);
};
