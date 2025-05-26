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

const { getMFInvestmentAdvice } = require("../agent/mfAnalyzerAgent");
router.get("/mf-analyze", getMFInvestmentAdvice);


// ─────────────────────── Account Related ─────────────────────── //
const { createAccount } = require("../controllers/accountController");
router.post("/create-account", createAccount);

// ─────────────────────── Aggregation Related ─────────────────────── //
const {
  aggregateDaily,
  aggregateWeekly,
  aggregateMonthly,
  aggregateQuarterly,
  aggregateYearly
} = require("../controllers/aggregationController");

router.post("/aggregate/daily", async (req, res) => {
  const msg = await aggregateDaily();
  res.send({ status: "ok", message: msg });
});

router.post("/aggregate/weekly", async (req, res) => {
  const msg = await aggregateWeekly();
  res.send({ status: "ok", message: msg });
});

router.post("/aggregate/monthly", async (req, res) => {
  const msg = await aggregateMonthly();
  res.send({ status: "ok", message: msg });
});

router.post("/aggregate/quarterly", async (req, res) => {
  const msg = await aggregateQuarterly();
  res.send({ status: "ok", message: msg });
});

router.post("/aggregate/yearly", async (req, res) => {
  const msg = await aggregateYearly();
  res.send({ status: "ok", message: msg });
});


// ─────────────────────── Mutual Funds Related ─────────────────────── //
const { addFund, getAllFunds, getFundByName, getPortfolioSummary, addLumpsum, updateSipStatus } = require("../controllers/mfController");

router.post("/add-mutual-fund", addFund);
router.get("/all-mutual-fund/", getAllFunds);
router.get("/select-mutual-fund/:name", getFundByName);
router.post('/funds/lumpsum', addLumpsum);        
router.put('/funds/sip-status', updateSipStatus);
router.get("/get-summary", getPortfolioSummary);


// ─────────────────────── Target Related ─────────────────────── //
const { createTarget, getAllTargets, getCurrentPeriodStatus, getTargetComparison } = require("../controllers/targetController");
router.post("/create-target", createTarget);
router.get("/getall-target", getAllTargets);
router.get("/current-period-status", getCurrentPeriodStatus);
router.get("/target-comparison", getTargetComparison);



// ─────────────────────── Category Related ─────────────────────── //
const { createCategory, getAllCategories } = require("../controllers/categoryController");
router.post("/create-category", createCategory);
router.get("/getall-category", getAllCategories);




export default router;
