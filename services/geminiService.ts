import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from "../types";

declare var process: {
  env: {
    API_KEY: string;
  };
};

const SYSTEM_INSTRUCTION = `
You are a "Survival Brother" (求生兄弟), a professional, calm, and dark-humored survival expert for men. 
Your goal is to analyze images for potential relationship risks.
Focus on: 
1. Female features (hair, hands, clothing) in background or edges.
2. Reflections in mirrors, windows, or shiny surfaces.
3. Dating vibes: two drinks, couple meals, candle-lit settings, shopping bags from female brands.

Tone: Professional, Cantonese-style Hong Kong slang (e.g., "兄弟", "瀨嘢", "搞唔掂"), no preaching, strictly action-oriented.
`;

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    riskLevel: {
      type: Type.STRING,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    },
    riskSpots: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    scripts: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    excuses: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    summary: {
      type: Type.STRING,
    },
    actionNeeded: {
      type: Type.STRING,
      enum: ['BLUR', 'PRIVATE', 'NONE'],
    }
  },
  required: ["riskLevel", "riskSpots", "scripts", "excuses", "summary", "actionNeeded"]
};

const wait = (ms: number) => new Promise(res => setTimeout(res, ms));

export const analyzePhoto = async (base64Image: string, retryCount = 3): Promise<AnalysisResult> => {
  const apiKey = process.env.API_KEY;

  if (!apiKey || apiKey === "undefined" || apiKey === "") {
    throw new Error("API_KEY_MISSING: 兄弟，仲未得！請去 Vercel 設定 API_KEY (全大寫) 並重新 Deploy。");
  }

  let lastError: any = null;

  for (let attempt = 1; attempt <= retryCount; attempt++) {
    try {
      // Create a fresh instance for each attempt to ensure the key is correctly applied
      const ai = new GoogleGenAI({ apiKey });
      
      const analysisPromise = ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            { text: "Analyze this photo for relationship risks. Be precise and use the 'Survival Brother' persona." },
            { inlineData: { mimeType: "image/jpeg", data: base64Image.split(',')[1] || base64Image } }
          ]
        },
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
          responseSchema: RESPONSE_SCHEMA
        }
      });

      // Timeout logic: 20 seconds
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("TIMEOUT_ERROR")), 20000)
      );

      const response: any = await Promise.race([analysisPromise, timeoutPromise]);
      const resultText = response.text || "{}";
      return JSON.parse(resultText) as AnalysisResult;

    } catch (error: any) {
      lastError = error;
      console.warn(`Attempt ${attempt} failed:`, error.message);

      // Handle specific errors
      if (error.message === "TIMEOUT_ERROR") {
        if (attempt === retryCount) throw new Error("TIMEOUT: AI 諗得太耐，請再試。");
      } else if (error.status === 429) {
        if (attempt === retryCount) throw new Error("ERROR_429: 太頻繁喇，AI 都要唞唞，等陣再試。");
      } else if (error.status >= 500) {
        if (attempt === retryCount) throw new Error(`ERROR_${error.status}: Google Server 爆咗，請稍後。`);
      }

      // If not the last attempt, wait before retrying
      if (attempt < retryCount) {
        await wait(1000 * attempt); // Exponential backoff: 1s, 2s...
      }
    }
  }

  throw new Error(lastError?.message || "未知錯誤，請聯絡開發者兄弟。");
};