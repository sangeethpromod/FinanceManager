import mongoose from "mongoose";
const PreTransactionWatcher = require("../models/txnModel");
const FinanceWatcher = require("../models/financeModel");
const { DataExtractor_Agent: DataExtractor_Agent_Watcher } = require("../agent/messageQueryAgent");

const startTxnWatcher = () => {
  const changeStream = PreTransactionWatcher.watch([], { fullDocument: "updateLookup" });

  console.log("📡 Transaction Watcher Active...");

interface TransactionDocument extends mongoose.Document {
    uuid: string;
    [key: string]: any;
}

interface ChangeEvent {
    operationType: string;
    fullDocument: TransactionDocument;
    [key: string]: any;
}

changeStream.on("change", async (change: ChangeEvent) => {
    if (change.operationType === "insert") {
        const txn: TransactionDocument = change.fullDocument;
        console.log(`🔔 New Transaction Inserted: ${txn.uuid}`);

        try {
            const exists: TransactionDocument | null = await FinanceWatcher.findOne({ uuid: txn.uuid });
            if (exists) {
                console.log(`⏭️ UUID ${txn.uuid} already processed.`);
                return;
            }

            // Pass the transaction or uuid to the agent
            await DataExtractor_Agent_Watcher(txn);
        } catch (err: any) {
            console.error(`❌ Error processing txn UUID ${txn.uuid}:`, err);
        }
    }
});
};

module.exports = startTxnWatcher;
