import { GoogleGenAI, Type } from "@google/genai";

// Satisfy TypeScript compiler for the environment variable injected by Vite/GitHub Actions
declare var process: {
  env: {
    API_KEY: string;
  };
};

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface ExtractedJobData {
  company: string;
  salaryRange: string;
  description?: string;
  sources?: { uri: string; title: string }[];
}

export interface MatchAnalysisResult {
  score: number;
  strengths: string[];
  gaps: string[];
}

/**
 * Robust retry utility with exponential backoff for handling 429 errors.
 */
async function callWithRetry<T>(fn: () => Promise<T>, retries = 4, delay = 2000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const isRateLimit = 
      error?.message?.includes('429') || 
      error?.status === 429 || 
      error?.code === 429 ||
      error?.message?.includes('Too Many Requests');
      
    if (isRateLimit && retries > 0) {
      const backoff = delay + Math.random() * 1000; // Add jitter
      console.warn(`Rate limit hit (429). Retrying in ${Math.round(backoff)}ms... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, backoff));
      return callWithRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

export const fetchJobFromUrl = async (url: string): Promise<ExtractedJobData> => {
  return callWithRetry(async () => {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `Analyze this URL for job details including title, company name, salary range, and a summary: ${url}`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            company: { type: Type.STRING },
            salaryRange: { type: Type.STRING },
            description: { type: Type.STRING, description: "A summary of requirements." }
          },
          required: ["company", "salaryRange", "description"]
        }
      }
    });

    let data: ExtractedJobData = { company: "Unknown", salaryRange: "Not found", description: "" };
    
    try {
      if (response.text) {
        data = JSON.parse(response.text) as ExtractedJobData;
      }
    } catch (e) {
      console.error("Failed to parse JSON response from search grounding:", e);
    }
    
    // Extract grounding URLs as required by API guidelines using safe type assertions
    const candidates = (response as any).candidates;
    const groundingMetadata = candidates?.[0]?.groundingMetadata;
    const chunks = groundingMetadata?.groundingChunks;
    
    if (chunks && Array.isArray(chunks)) {
      data.sources = chunks
        .filter((c: any) => c.web)
        .map((c: any) => ({ uri: c.web.uri, title: c.web.title }));
    }
    
    return data;
  });
};

export const extractJobDetails = async (description: string): Promise<ExtractedJobData> => {
  return callWithRetry(async () => {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Extract the company name and salary range from this job description:\n\n${description}`,
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
      model: "gemini-3-flash-preview",
      contents: `Analyze fit between Resume and Job. RESUME:\n${resume}\n\nJOB:\n${jobDescription}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            gaps: { type: Type.ARRAY, items: { type: Type.STRING } }
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
      model: "gemini-3-flash-preview",
      contents: `Rank these offers: ${JSON.stringify(offers)}`,
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
              why: { type: Type.STRING },
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