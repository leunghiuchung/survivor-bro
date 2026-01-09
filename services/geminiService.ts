import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from "../types";

// 宣告 process 俾 TypeScript 睇，解決 TS2580 報錯
declare global {
  interface Window {
    process: any;
  }
}
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

export const analyzePhoto = async (base64Image: string): Promise<AnalysisResult> => {
  // 喺 Vite 環境，process.env.API_KEY 會喺 Build time 被替換
  const apiKey = process.env.API_KEY;

  if (!apiKey || apiKey === "undefined" || apiKey === "") {
    throw new Error("API_KEY_MISSING: 兄弟屌你，系統仲係讀唔到粒 Key。請去 Vercel 設定 API_KEY 並確保 Deployment 係綠色成功狀態。");
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
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

    const resultText = response.text || "{}";
    return JSON.parse(resultText) as AnalysisResult;
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
};