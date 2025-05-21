import express from "express";
const router = express.Router();

const {
  createTransaction,
//   getTransactions,
//   deleteTransactionById,
} = require("../controllers/txnController");

router.post("/new-transaction", createTransaction);
// router.get("/", getTransactions);
// router.delete("/:id", deleteTransactionById);

export default router;
