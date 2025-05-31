import express from "express";
const router = express.Router();

// ─────────────────────── Transaction Related ─────────────────────── //
const {
  createTransaction,
  getAllTransactions,
  // deleteTransactionById,
} = require("../controllers/txnController");

router.post("/new-transaction", createTransaction);
router.get("/all-transactions", getAllTransactions);
// router.delete("/:id", deleteTransactionById);

// ─────────────────────── Agents Related ─────────────────────── //
const { importTransaction } = require("../controllers/dbquerryAgentController");
router.post("/import-transaction", importTransaction);
router.get("/get-all-transactions-messages", getAllTransactions);


const { getMFInvestmentAdvice } = require("../agent/mfAnalyzerAgent");
router.get("/mf-analyze", getMFInvestmentAdvice);


// ─────────────────────── Account Related ─────────────────────── //
const { createAccount, addManualTransaction, getAllAccounts } = require("../controllers/accountController");
router.post("/create-account", createAccount);
router.post("/maunual-transaction", addManualTransaction);

router.get("/all-accounts", getAllAccounts);

// ─────────────────────── Aggregation Related ─────────────────────── //
const {
  aggregateDaily,
  aggregateWeekly,
  aggregateMonthly,
  aggregateQuarterly,
  aggregateYearly
} = require("../controllers/aggregationController");

router.post("/aggregate/daily", async (_req, res) => {
  const msg = await aggregateDaily();
  res.send({ status: "ok", message: msg });
});

router.post("/aggregate/weekly", async (_req, res) => {
  const msg = await aggregateWeekly();
  res.send({ status: "ok", message: msg });
});

router.post("/aggregate/monthly", async (_req, res) => {
  const msg = await aggregateMonthly();
  res.send({ status: "ok", message: msg });
});

router.post("/aggregate/quarterly", async (_req, res) => {
  const msg = await aggregateQuarterly();
  res.send({ status: "ok", message: msg });
});

router.post("/aggregate/yearly", async (_req, res) => {
  const msg = await aggregateYearly();
  res.send({ status: "ok", message: msg });
});


// ─────────────────────── Mutual Funds Related ─────────────────────── //
const { addFund, getAllFunds, getPortfolioSummary, addLumpsum, updateSipStatus, getAllFundsSummary, getFundAllocation, getAssetclassAllocation } = require("../controllers/mfController");

router.post("/add-mutual-fund", addFund);
router.get("/all-mutual-fund/", getAllFunds);
router.post('/funds/lumpsum', addLumpsum);        
router.put('/funds/sip-status', updateSipStatus);
router.get("/get-summary", getPortfolioSummary);
router.get("/get-allfunds-summary", getAllFundsSummary);
router.get("/get-fund-allocation", getFundAllocation);
router.get("/get-asset-allocation", getAssetclassAllocation);


// ─────────────────────── Target Related ─────────────────────── //
const { createTarget, getAllTargets, getCurrentPeriodStatus, getTargetComparison } = require("../controllers/targetController");
router.post("/create-target", createTarget);
router.get("/getall-target", getAllTargets);
router.get("/current-period-status", getCurrentPeriodStatus);
router.get("/target-comparison", getTargetComparison);



// ─────────────────────── Finance Related ─────────────────────── //

const { getAllFinanceTransactions } = require("../controllers/financeController");
router.get("/get-all-transactions",  getAllFinanceTransactions);

// ─────────────────────── Indices Related ─────────────────────── //
const { getRealTimeIndices } = require("../controllers/Indices");
router.get("/get-realtime-indices", getRealTimeIndices);

// ─────────────────────── Party Map Related ─────────────────────── //
const { createPartyMap, getUnmappedParties, updatePartyMap, getAllMappings } = require("../controllers/partyMapController");

router.post("/create-party-map", createPartyMap); // Create or update mapping for a category
router.get("/party-map-unmapped", getUnmappedParties); // Get unknown/unmapped parties
router.put("/update-party-map", updatePartyMap); // Update mapping by category and label
router.get("/get-allparty-map", getAllMappings); // List all mappings

export default router;
