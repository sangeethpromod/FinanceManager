const Finance = require ("../../models/financeModel")

export const getAllFinance = async () => {
  return await Finance.find().lean(); // Fetch everything
};

// Optional: filter by date range
export const getFinanceByDate = async (start: string, end: string) => {
  return await Finance.find({
    date: { $gte: start, $lte: end }
  }).lean();
};