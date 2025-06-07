import { Request, Response } from "express";
const AutoPayManager = require("../models/AutoPayManager");
import dayjs from "dayjs";

const createAutoPay = async (req: Request, res: Response) => {
  try {
    const { bills = [], emis = [], subs = [] } = req.body;

    const processedEmis = emis.map((emi: any) => {
      const monthsCompleted = Math.min(
        dayjs().diff(dayjs(emi.emiStartDate, "D MMM YYYY"), "month"),
        emi.tenure
      );

      const paidAmount = monthsCompleted * emi.monthlyAmount;
      const pendingAmount = Math.max(emi.totalAmount - paidAmount, 0);
      const payPercentage = Math.min(
        ((paidAmount / emi.totalAmount) * 100),
        100
      );

      return {
        ...emi,
        pendingAmount: Number(pendingAmount.toFixed(2)),
        payPercentage: Number(payPercentage.toFixed(2)),
      };
    });

    const entry = new AutoPayManager({
      bills,
      emis: processedEmis,
      subs,
    });

    await entry.save();

    return res.status(201).json({ status: "ok", data: entry });
  } catch (err) {
    console.error("❌ Error in createAutoPay:", err);
    return res.status(500).json({ status: "error", message: "Internal Server Error" });
  }
};


const getAutoPay = async (_req: Request, res: Response) => {
  try {
    const records = await AutoPayManager.find().sort({ createdAt: -1 });
    return res.status(200).json({ status: "ok", data: records });
  } catch (err) {
    console.error("❌ Error in getAutoPay:", err);
    return res.status(500).json({ status: "error", message: "Internal Server Error" });
  }
};


module.exports = { createAutoPay, getAutoPay };
