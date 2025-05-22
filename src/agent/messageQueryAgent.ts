const PreTransaction = require("../models/txnModel");
const Finance = require("../models/financeModel");
const { v4: uuidv4 } = require("uuid");
const { getGeminiModel } = require("../agentConfig/agentic_initialization");
const { updateBalance } = require("../services/accountService");

// Helper: get today’s date string in dd/mm/yyyy
function getTodayDate() {
  const today = new Date();
  const d = today.getDate().toString().padStart(2, "0");
  const m = (today.getMonth() + 1).toString().padStart(2, "0");
  const y = today.getFullYear();
  return `${d}/${m}/${y}`;
}

const DataExtractor_Agent = async () => {
  const model = getGeminiModel();
  const today = getTodayDate();

  console.log(`🚀 Fetching transactions for today: ${today}`);

  const todaysTxns = await PreTransaction.find({ date: today });

  console.log(`🔎 Found ${todaysTxns.length} transactions for today.`);

  for (const txn of todaysTxns) {
    const exists = await Finance.findOne({ uuid: txn.uuid });
    if (exists) {
      console.log(`⏭️ Skipping transaction UUID ${txn.uuid} (already processed)`);
      continue;
    }

    console.log(`🔍 Processing transaction UUID ${txn.uuid}: ${txn.message}`);

    const prompt = `
You are an expert financial data extractor. 

From the given SMS message, extract and return strictly valid JSON with these keys:
- amount (number, without currency symbol)
- account (one of: "Federal Bank", "HDFC Bank", "Jupiter", "OneCard", "Diners Club", "HDFC Biz")
- sender_or_receiver (REQUIRED: the party involved - person name, UPI ID, merchant name, or if not clear, use "Bank Transfer" or "Unknown")
- note (any extra relevant info like transaction type, date, or reference)
- category (auto-tag expense category: food, travel, etc.)
- comment (leave it empty)
- type (one of: "credit", "debit")

Rules:
- If sender_or_receiver is missing, use:
  - "Bank Deposit" for credits
  - "Bank Withdrawal" for debits
  - "Account Transfer" for internal transfers

Example input:
"Rs 15.00 debited via UPI on 21-05-2025 17:55:11 to VPA reyvanthrm@okaxis.Ref No 550730368484.Small txns?Use UPI Lite!-Federal Bank"

Now extract JSON from this message:
"${txn.message}"
`;

    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text();

      console.log(`📩 Raw Response:\n${text}`);

      const cleanText = text.trim().replace(/^```json|```$/gim, '').trim();
      const parsed = JSON.parse(cleanText);

      console.log("✅ Parsed Result:", parsed);

      await Finance.create({
        uuid: txn.uuid,
        amount: parsed.amount,
        account: parsed.account,
        party: parsed.sender_or_receiver,
        note: parsed.note,
        category: parsed.category,
        comment: parsed.comment,
        type: parsed.type,
      });

      console.log(`💾 Saved transaction UUID ${txn.uuid} to Finance DB.`);

      // ✅ Now correctly calling the service function
      await updateBalance(parsed.account, parsed.amount, parsed.type);

      console.log(`💰 Updated balance for ${parsed.account}.\n`);

    } catch (err) {
      console.error(`❌ Failed to process transaction UUID ${txn.uuid}:`, err, "\n");
    }
  }

  console.log("🎉 Processing completed for today’s transactions.\n");
};

module.exports = { DataExtractor_Agent };
