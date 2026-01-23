
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export interface ExtractedJobData {
  company: string;
  salaryRange: string;
}

export const extractJobDetails = async (description: string): Promise<ExtractedJobData> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Extract the company name and salary range (e.g., "$100k - $150k" or "Not specified") from the following job description:\n\n${description}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            company: {
              type: Type.STRING,
              description: "The name of the company hiring."
            },
            salaryRange: {
              type: Type.STRING,
              description: "The estimated or stated salary range."
            }
          },
          required: ["company", "salaryRange"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text) as ExtractedJobData;
  } catch (error) {
    console.error("Gemini Extraction Error:", error);
    return {
      company: "Unknown Company",
      salaryRange: "Not extracted"
    };
  }
};
