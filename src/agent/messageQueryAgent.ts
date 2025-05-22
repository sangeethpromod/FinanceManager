const PreTransaction = require("../models/txnModel");
const Finance = require("../models/financeModel");
const { v4: uuidv4 } = require("uuid");
const { getGeminiModel } = require("../agentConfig/agentic_initialization");

// Helper: get today’s date string in dd/mm/yyyy or ISO, consistent with your stored date
function getTodayDate() {
  const today = new Date();
  const d = today.getDate().toString().padStart(2, "0");
  const m = (today.getMonth() + 1).toString().padStart(2, "0");
  const y = today.getFullYear();
  return `${d}/${m}/${y}`; // or use ISO if that’s what you saved
}

const DataExtractor_Agent = async () => {
  const model = getGeminiModel();

  const today = getTodayDate();

  console.log(`🚀 Fetching transactions for today: ${today}`);

  // Fetch transactions from PreTransaction where date === today
  const todaysTxns = await PreTransaction.find({ date: today });

  console.log(`🔎 Found ${todaysTxns.length} transactions for today.`);

  for (const txn of todaysTxns) {
    // Check if uuid already exists in Finance (already processed)
    const exists = await Finance.findOne({ uuid: txn.uuid });
    if (exists) {
      console.log(`⏭️ Skipping transaction UUID ${txn.uuid} (already processed)`);
      continue;
    }

    console.log(`🔍 Processing transaction UUID ${txn.uuid}: ${txn.message}`);

    // Your existing Gemini extraction & saving logic here, but reuse txn.uuid

    const prompt = `
You are an expert financial data extractor. 

From the given SMS message, extract and return strictly valid JSON with these keys:
- amount (number, without currency symbol)
- account (one of: "Federal Bank", "HDFC Bank", "Jupiter", "OneCard", "Diners Club", "HDFC Biz")
- sender_or_receiver (the exact party involved, e.g. a person name, UPI ID, or merchant name)
- note (any extra relevant info like transaction type, date, or reference)
-category (i need you to be smart agent and make a Auto-tagging of expenses (e.g., "food", "travel", "utilities", etc.)
-comment(leave it empty for now)

Example input message:
"Rs 15.00 debited via UPI on 21-05-2025 17:55:11 to VPA reyvanthrm@okaxis.Ref No 550730368484.Small txns?Use UPI Lite!-Federal Bank"

Example output JSON:
{
  "amount": 15.00,
  "account": "Federal Bank",
  "sender_or_receiver": "reyvanthrm@okaxis",
  "note": "Debited via UPI on 21-05-2025 17:55:11. Ref No 550730368484. Small txns? Use UPI Lite!"
}

Now, extract the JSON from this SMS message:
"${txn.message}"
`;

    try {
      const result = await model.generateContent(prompt);
      const text: string = result.response.text();

      console.log(`📩 Raw Response:\n${text}`);

      const cleanText = text.trim().replace(/^```json|```$/gim, '').trim();
      const parsed = JSON.parse(cleanText);

      console.log("✅ Parsed Result:", parsed);

      await Finance.create({
        uuid: txn.uuid, // keep the same uuid
        amount: parsed.amount,
        account: parsed.account,
        party: parsed.sender_or_receiver,
        note: parsed.note,
        category: parsed.category,
        comment: parsed.comment,
      });

      console.log(`💾 Saved transaction UUID ${txn.uuid} to Finance DB.\n`);

    } catch (err) {
      console.error(`❌ Failed to process transaction UUID ${txn.uuid}:`, err, "\n");
    }
  }

  console.log("🎉 Processing completed for today’s transactions.\n");
};

module.exports = { DataExtractor_Agent };
