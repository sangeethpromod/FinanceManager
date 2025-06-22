// src/controllers/agentController.ts
import { getAllFinance } from "./financeChatController";
import { filterFinanceByDate } from "../../utils/filterUtils";
import { analyseFinance } from "../ChatAgent/chatAgent";

export const handleFinanceQuery = async (userMessage: string) => {
  const rawData = await getAllFinance();

  // Optional date extraction logic here (if message contains dates)
  const filteredData = filterFinanceByDate(rawData, "2025-06-01", "2025-06-10"); // mock range

  const response = await analyseFinance(userMessage, filteredData);
  return response;
};
