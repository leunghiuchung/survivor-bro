
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, RiskLevel } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const SYSTEM_INSTRUCTION = `
You are a "Survival Brother" (求生兄弟), a professional, calm, and dark-humored survival expert for men. 
Your goal is to analyze images for potential relationship risks.
Focus on: 
1. Female features (hair, hands, clothing) in background or edges.
2. Reflections in mirrors, windows, or shiny surfaces.
3. Dating vibes: two drinks, couple meals, candle-lit settings, shopping bags from female brands.

Tone: Professional, Cantonese-style Hong Kong slang (e.g., "兄弟", "瀨嘢", "搞唔掂"), no preaching, strictly action-oriented.

You must return a JSON object.
`;

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    riskLevel: {
      type: Type.STRING,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      description: "Assessment of how much trouble the user is in."
    },
    riskSpots: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of 'screw-up points' (瀨嘢位) identified."
    },
    scripts: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Step-by-step survival scripts for dialogue."
    },
    excuses: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "3 plausible excuses for being there or having that in the photo."
    },
    summary: {
      type: Type.STRING,
      description: "Brief summary in the Survival Brother tone."
    },
    actionNeeded: {
      type: Type.STRING,
      enum: ['BLUR', 'PRIVATE', 'NONE'],
      description: "Recommended immediate action."
    }
  },
  required: ["riskLevel", "riskSpots", "scripts", "excuses", "summary", "actionNeeded"]
};

export const analyzePhoto = async (base64Image: string): Promise<AnalysisResult> => {
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

    const result = JSON.parse(response.text);
    return result as AnalysisResult;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};
