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

// ─────────────────────── Gemini Related ─────────────────────── //
const { importTransaction } = require("../controllers/dbquerryAgentController");
router.post("/import-transaction", importTransaction);

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
const { addOrUpdateFund, getAllFunds, getFundByName, getPortfolioSummary } = require("../controllers/mfController");

router.post("/add-mutual-fund", addOrUpdateFund);
router.get("/all-mutual-fund/", getAllFunds);
router.get("/select-mutual-fund/:name", getFundByName);
router.get("/get-summary", getPortfolioSummary);




export default router;
