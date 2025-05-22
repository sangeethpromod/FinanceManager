// src/controllers/cardController.ts
import { Request, Response } from "express";
const Cards = require("../models/CardModel");

const createCard = async (req: Request, res: Response) => {
  try {
    const {
      CardName,
      ExpDate,
      CVV,
      CardNumber,
      BillingCycle,
      BillGenerationDate,
      BillDueDate,
      PaymentStatus,
    } = req.body;

    // Mandatory field check
    if (
      !CardName ||
      !ExpDate ||
      !CVV ||
      !CardNumber ||
      !BillingCycle ||
      !BillDueDate ||
      !PaymentStatus
    ) {
      return res.status(400).json({ error: "Missing required card details" });
    }

    const newCard = new Cards({
      CardName,
      ExpDate,
      CVV,
      CardNumber,
      BillingCycle,
      BillGenerationDate,
      BillDueDate,
      PaymentStatus,
    });

    await newCard.save();

    return res.status(201).json({ success: true });
  } catch (err) {
    console.error("Error saving card:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

module.exports = { createCard };
