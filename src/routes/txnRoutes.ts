import express from "express";
const router = express.Router();

//Transaction Related
const {
  createTransaction,
  getAllTransactions,
//   deleteTransactionById,
} = require("../controllers/txnController");


//Import Transaction Related
const {importTransaction} = require("../controllers/dbquerryAgentController");


//Account Related
const {createAccount} = require("../controllers/accountController");

router.post("/new-transaction", createTransaction);
router.get("/all-transactions", getAllTransactions);
// router.delete("/:id", deleteTransactionById);

//Gemni Related
router.post("/import-transaction", importTransaction);

//Account Related
router.post("/create-account", createAccount);

export default router;
