const Account = require("../models/accountModel");

interface AccountDocument {
    currentBalance: number;
    lastupdate: string;
    save: () => Promise<void>;
}

type TransactionType = "debit" | "credit";

export const updateBalance = async (
    account: string,
    amount: number,
    type: TransactionType
): Promise<number> => {
    if (!account || !amount || !type) throw new Error("Missing fields");

    const acc: AccountDocument | null = await Account.findOne({ fetcherName: account });
    if (!acc) throw new Error("Account not found");

    let updatedBalance: number = acc.currentBalance;

    if (type === "debit") {
        updatedBalance -= amount;
    } else if (type === "credit") {
        updatedBalance += amount;
    } else {
        throw new Error("Invalid transaction type");
    }

    acc.currentBalance = updatedBalance;
    acc.lastupdate = new Date().toISOString();
    await acc.save();

    return updatedBalance;
};
