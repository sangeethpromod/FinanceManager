import { getGeminiModel } from "../../agentConfig/agentic_initialization";

export const analyseFinance = async (userMessage: string, financeData: any[]) => {
  const model = getGeminiModel();

  const prompt = `
You are a finance assistant. The user has asked:
"${userMessage}"

Here is the list of finance transactions:
${JSON.stringify(financeData, null, 2)}

Analyse the data and provide a helpful summary including total spend, major categories, and insights.
`;

  const result = await model.generateContent(prompt);
  const text = await result.response.text();
  return text;
};
