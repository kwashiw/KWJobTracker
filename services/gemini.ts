
import { GoogleGenAI, Type } from "@google/genai";

// Satisfy TypeScript compiler for the environment variable injected by Vite/GitHub Actions
declare var process: {
  env: {
    API_KEY: string;
  };
};

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface ExtractedJobData {
  title?: string;
  company: string;
  salaryRange: string;
  description?: string;
  sources?: { uri: string; title: string }[];
}

export type ImportMethod = 'cors_proxy' | 'google_search' | 'none';

export interface MagicImportResult {
  data: ExtractedJobData;
  method: ImportMethod;
  confidence: 'high' | 'low';
  warning?: string;
}

export interface MatchAnalysisResult {
  score: number;
  strengths: string[];
  gaps: string[];
}

/**
 * Strips markdown code blocks and safely parses JSON.
 */
function safeParseJson<T>(text: string | undefined, defaultValue: T): T {
  if (!text) return defaultValue;
  try {
    // Remove markdown code blocks if present
    const cleanText = text.replace(/```json\n?|```/g, "").trim();
    return JSON.parse(cleanText) as T;
  } catch (e) {
    console.error("JSON Parsing Error:", e, "Raw text:", text);
    return defaultValue;
  }
}

/**
 * Robust retry utility with exponential backoff for handling 429, 503, and 504 errors.
 */
async function callWithRetry<T>(fn: () => Promise<T>, retries = 5, delay = 2000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    // Check for transient errors: 429 (Rate Limit), 503 (Overloaded), 504 (Timeout)
    const errorMsg = error?.message || "";
    const status = error?.status || error?.code;
    
    const isRetryable = 
      errorMsg.includes('429') || 
      status === 429 || 
      errorMsg.includes('503') || 
      status === 503 ||
      errorMsg.includes('504') ||
      status === 504 ||
      errorMsg.toLowerCase().includes('overloaded') ||
      errorMsg.toLowerCase().includes('too many requests');
      
    if (isRetryable && retries > 0) {
      const backoff = delay + Math.random() * 1000; // Add jitter
      console.warn(`Transient error (${status}). Retrying in ${Math.round(backoff)}ms... (${retries} left)`);
      await new Promise(resolve => setTimeout(resolve, backoff));
      return callWithRetry(fn, retries - 1, delay * 2);
    }
    
    // Attempt to extract a cleaner message if it's a stringified JSON error
    if (typeof errorMsg === 'string' && errorMsg.startsWith('{')) {
      try {
        const parsed = JSON.parse(errorMsg);
        if (parsed.error?.message) {
          error.message = parsed.error.message;
        }
      } catch (e) {
        // Keep original if parsing fails
      }
    }
    
    throw error;
  }
}

/**
 * Detects LinkedIn URLs (which require auth and can't be proxied).
 */
function isLinkedInUrl(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return hostname.includes('linkedin.com');
  } catch {
    return false;
  }
}

/**
 * Fetches page content via a CORS proxy and strips HTML to plain text.
 */
async function fetchViaCorsProxy(url: string): Promise<string | null> {
  try {
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    const response = await fetch(proxyUrl, { signal: AbortSignal.timeout(10000) });
    if (!response.ok) return null;
    const html = await response.text();

    // Strip HTML to plain text
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // If very little text returned, proxy likely failed silently
    if (text.length < 100) return null;

    // Truncate to stay within reasonable Gemini context limits
    return text.slice(0, 30000);
  } catch {
    return null;
  }
}

/**
 * Extracts structured job data from raw page text using Gemini.
 */
async function extractFromPageContent(pageText: string, url: string): Promise<ExtractedJobData> {
  return callWithRetry(async () => {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are extracting job posting details from a webpage's text content.
The URL was: ${url}

Extract the following fields. If a field is not found, use "Not found" for strings.

PAGE CONTENT:
${pageText}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "The job title (e.g. 'Senior Software Engineer')" },
            company: { type: Type.STRING, description: "The company name" },
            salaryRange: { type: Type.STRING, description: "The salary or compensation range, if mentioned" },
            description: { type: Type.STRING, description: "A detailed summary of the role's responsibilities, requirements, and qualifications (max 500 words)" }
          },
          required: ["title", "company", "salaryRange", "description"]
        }
      }
    });
    return safeParseJson<ExtractedJobData>(response.text, {
      title: "Not found", company: "Unknown", salaryRange: "Not found", description: ""
    });
  });
}

/**
 * Fallback: uses Google Search grounding to find job details when direct page access fails.
 */
const fetchJobFromUrlViaSearch = async (url: string): Promise<ExtractedJobData> => {
  return callWithRetry(async () => {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `Search Google for information about this job posting URL: ${url}

Find and extract:
- The exact job title
- The company name
- The salary/compensation range (if available)
- A detailed summary of the job responsibilities and requirements

If you cannot find specific information, respond with "Not found" for that field. Do not make up information.`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "The exact job title" },
            company: { type: Type.STRING, description: "The company name" },
            salaryRange: { type: Type.STRING, description: "Salary or compensation range" },
            description: { type: Type.STRING, description: "Detailed summary of responsibilities and requirements" }
          },
          required: ["title", "company", "salaryRange", "description"]
        }
      }
    });

    const data = safeParseJson<ExtractedJobData>(response.text, {
      title: "Not found", company: "Unknown", salaryRange: "Not found", description: ""
    });

    // Extract grounding URLs as required for search grounding tool usage
    const candidates = response.candidates;
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

/**
 * Magic Import: two-strategy pipeline for extracting job details from a URL.
 * 1. Try CORS proxy to fetch actual page content (skipped for LinkedIn)
 * 2. Fall back to Google Search grounding
 */
export const magicImport = async (url: string): Promise<MagicImportResult> => {
  const linkedIn = isLinkedInUrl(url);

  // Strategy 1: CORS proxy (skip for LinkedIn — it requires auth)
  if (!linkedIn) {
    const pageText = await fetchViaCorsProxy(url);
    if (pageText) {
      try {
        const data = await extractFromPageContent(pageText, url);
        return { data, method: 'cors_proxy', confidence: 'high' };
      } catch (err) {
        console.warn("CORS proxy fetch succeeded but Gemini extraction failed, falling through to search grounding", err);
      }
    }
  }

  // Strategy 2: Google Search grounding
  try {
    const data = await fetchJobFromUrlViaSearch(url);
    const hasUsefulData = data.company !== "Unknown" && data.description && data.description.length > 20;
    return {
      data,
      method: 'google_search',
      confidence: 'low',
      warning: linkedIn
        ? "LinkedIn jobs require authentication. The AI searched Google for public info about this posting, but results may be incomplete. Consider pasting the description directly."
        : hasUsefulData
          ? "Could not access the page directly. Details were found via Google Search and may be incomplete."
          : "Could not access this page or find it via Google Search. Please paste the job description manually."
    };
  } catch (err) {
    return {
      data: { title: undefined, company: "Unknown", salaryRange: "Not found", description: "" },
      method: 'none',
      confidence: 'low',
      warning: linkedIn
        ? "LinkedIn jobs are behind a login wall and cannot be imported automatically. Please copy and paste the job description."
        : "Could not fetch details from this URL. Please paste the job description manually."
    };
  }
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

    return safeParseJson<ExtractedJobData>(response.text, { company: "Unknown Company", salaryRange: "Not extracted" });
  }).catch(() => ({ company: "Unknown Company", salaryRange: "Not extracted" }));
};

export const analyzeJobMatch = async (resume: string, jobDescription: string): Promise<MatchAnalysisResult> => {
  return callWithRetry(async () => {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Perform a detailed compatibility analysis between this professional Resume and Job Description.
      
      RESUME:
      ${resume}
      
      JOB DESCRIPTION:
      ${jobDescription}
      
      Instructions: Be objective and critical. If skills are missing, list them as gaps.`,
      config: {
        thinkingConfig: { thinkingBudget: 8000 },
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

    return safeParseJson<MatchAnalysisResult>(response.text, { score: 0, strengths: [], gaps: ["Analysis failed to parse."] });
  });
};

export const compareOffers = async (offers: { title: string, company: string, description: string }[]) => {
  return callWithRetry(async () => {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Rank these offers: ${JSON.stringify(offers)}`,
      config: {
        thinkingConfig: { thinkingBudget: 4000 },
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

    return safeParseJson<any[]>(response.text, []);
  });
};
