export const calculatePortfolioSummary = (fund: Document & any) => {
  const totalInvested = fund.transactions.reduce((sum: number, txn: any) => sum + txn.amount, 0);
  const totalUnits = fund.transactions.reduce((sum: number, txn: any) => sum + txn.units, 0);
  const currentValue = totalUnits * parseFloat(fund.fundNav || "0");

  fund.totalAmountInvested = totalInvested.toFixed(2);
  fund.totalUnitsHeld = parseFloat(totalUnits.toFixed(3));
  fund.currentAmount = currentValue.toFixed(2);
  fund.currentinvestment = currentValue.toFixed(2); // ✅ add this line
};
