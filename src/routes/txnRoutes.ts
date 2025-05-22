import express from "express";
const router = express.Router();

const {
  createTransaction,
  getAllTransactions,
//   deleteTransactionById,
} = require("../controllers/txnController");

const {importTransaction} = require("../controllers/dbquerryAgentController");

router.post("/new-transaction", createTransaction);
router.get("/all-transactions", getAllTransactions);
// router.delete("/:id", deleteTransactionById);

//Gemni Related
router.post("/import-transaction", importTransaction);


export default router;
