import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface ExtractedJobData {
  company: string;
  salaryRange: string;
  description?: string;
}

export interface MatchAnalysisResult {
  score: number;
  strengths: string[];
  gaps: string[];
}

/**
 * Robust retry utility with exponential backoff for handling 429 errors.
 */
async function callWithRetry<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const isRateLimit = error?.message?.includes('429') || error?.status === 429 || error?.code === 429;
    if (isRateLimit && retries > 0) {
      console.warn(`Rate limit hit (429). Retrying in ${delay}ms... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return callWithRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

export const fetchJobFromUrl = async (url: string): Promise<ExtractedJobData> => {
  return callWithRetry(async () => {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `Find the job title, company name, salary range, and a summary of the job description for this URL: ${url}`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            company: { type: Type.STRING },
            salaryRange: { type: Type.STRING },
            description: { type: Type.STRING, description: "A detailed summary of the job requirements and role." }
          },
          required: ["company", "salaryRange", "description"]
        }
      }
    });

    return JSON.parse(response.text || "{}") as ExtractedJobData;
  });
};

export const extractJobDetails = async (description: string): Promise<ExtractedJobData> => {
  return callWithRetry(async () => {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Extract the company name and salary range (e.g., "$100k - $150k" or "Not specified") from the following job description:\n\n${description}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            company: { type: Type.STRING },
            salaryRange: { type: Type.STRING }
          },
          required: ["company", "salaryRange"]
        }
      }
    });

    return JSON.parse(response.text || "{}") as ExtractedJobData;
  }).catch(() => ({ company: "Unknown Company", salaryRange: "Not extracted" }));
};

export const analyzeJobMatch = async (resume: string, jobDescription: string): Promise<MatchAnalysisResult> => {
  return callWithRetry(async () => {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `Compare the following Resume and Job Description. Score the match out of 100 and identify top strengths and critical gaps.\n\nRESUME:\n${resume}\n\nJOB DESCRIPTION:\n${jobDescription}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER, description: "A percentage from 0 to 100." },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of skills/experiences that match well." },
            gaps: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Missing skills or areas to prepare for." }
          },
          required: ["score", "strengths", "gaps"]
        }
      }
    });

    return JSON.parse(response.text || "{}") as MatchAnalysisResult;
  });
};

export const compareOffers = async (offers: { title: string, company: string, description: string }[]) => {
  return callWithRetry(async () => {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `Analyze these competing job offers and rank them based on long-term career growth, compensation potential, and role impact. Provide a JSON list ranking them.\n\nOFFERS:\n${JSON.stringify(offers)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              rank: { type: Type.NUMBER },
              company: { type: Type.STRING },
              title: { type: Type.STRING },
              why: { type: Type.STRING, description: "Why this rank?" },
              pros: { type: Type.ARRAY, items: { type: Type.STRING } },
              cons: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["rank", "company", "title", "why", "pros", "cons"]
          }
        }
      }
    });

    return JSON.parse(response.text || "[]");
  });
};
