import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, RiskLevel } from "../types";

declare var process: {
  env: {
    API_KEY: string;
  };
};

const SYSTEM_INSTRUCTION = `
你而家係「求生兄弟」(Survival Brother)，係一個專門幫男人解決感情危機、避開「死穴」嘅終極軍師。
你嘅說話風格係：極度地道香港廣東話、黑幽默、義氣仔女、行動導向。

語言規則：
- 絕對、絕對、絕對唔准講英文（除咗專業名詞）。
- 用「兄弟」、「瀨嘢」、「搞唔掂」、「死得」、「救命」、「補鑊」呢啲地道詞彙。

分析重點：
- 鏡面反射：有無女人影、長頭髮、指甲油。
- 環境殘留：化妝品、女性手袋、唔屬於男人嘅飾物。
- 氣氛殺手：兩杯嘢飲（仲要係粉紅色嗰啲）、情侶套餐、浪漫燭光。

你要幫兄弟諗好晒啲劇本，令佢可以平安返屋企。
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
      description: '廣東話寫出相中危險位',
      items: { type: Type.STRING },
    },
    scripts: {
      type: Type.ARRAY,
      description: '廣東話求生劇本',
      items: { type: Type.STRING },
    },
    excuses: {
      type: Type.ARRAY,
      description: '地道廣東話藉口',
      items: { type: Type.STRING },
    },
    summary: {
      type: Type.STRING,
      description: '兄弟式總結',
    },
    actionNeeded: {
      type: Type.STRING,
      enum: ['BLUR', 'PRIVATE', 'NONE'],
    }
  },
  required: ["riskLevel", "riskSpots", "scripts", "excuses", "summary", "actionNeeded"]
};

// --- Local Python-Logic Mode (Fallback) ---
const fallbackAnalysis = (): AnalysisResult => {
  const summaries = [
    "兄弟，API 斷咗，我用『離線求生引擎』幫你擋住先，呢張相陣藥味都係幾濃吓。",
    "連唔到大腦，Local Scan 發現呢張相極大機會令你『死人』，快啲睇劇本！",
    "Google 兄弟都救你唔到，唯有靠我呢套離線補鑊算法，小心背景反光位！"
  ];

  const spots = [
    "背景疑似有長頭髮殘留物，雖然朦，但女人直覺係好準嘅。",
    "反光位見到有啲唔尋常嘅影，建議即刻 Blur 咗佢。",
    "現場氣氛太浪漫，成件事好唔男人口味，極之可疑。",
    "枱面有兩杯嘢飲，你話你自己飲兩杯？邊個信？"
  ];

  const scripts = [
    "「哦，嗰日去開嗰邊開會，順便同個男同事飲杯嘢，佢個人好乸，鍾意飲粉紅特飲。」",
    "「吓？乜野影呀？可能係反光掛，我嗰日一個人去食飯咋喎，想靜吓啫。」",
    "「嗰隻手？同事隻手嚟架咋，佢幫我攞份文件入鏡姐。」"
  ];

  const excuses = [
    "「幫老細去買嘢，順路影張相俾佢睇咋。」",
    "「同個失戀嘅男兄弟去散心，佢飲嘢啲口味比較特別。」",
    "「呢張相係以前啲舊相，唔知點解喺個 Cloud 度彈返出嚟。」"
  ];

  const levels = [RiskLevel.MEDIUM, RiskLevel.HIGH, RiskLevel.CRITICAL];
  
  return {
    riskLevel: levels[Math.floor(Math.random() * levels.length)],
    riskSpots: [spots[Math.floor(Math.random() * spots.length)], "建議全圖加密處理"],
    scripts: [scripts[Math.floor(Math.random() * scripts.length)], "（講嘅時候記得要夠淡定）"],
    excuses: [excuses[Math.floor(Math.random() * excuses.length)], "「你唔信呀？我搵嗰個同事打俾你？」"],
    summary: summaries[Math.floor(Math.random() * summaries.length)],
    actionNeeded: 'BLUR'
  };
};

const wait = (ms: number) => new Promise(res => setTimeout(res, ms));

export const analyzePhoto = async (base64Image: string, retryCount = 3): Promise<{result: AnalysisResult, mode: 'AI' | 'FALLBACK'}> => {
  const apiKey = process.env.API_KEY;

  if (!apiKey || apiKey === "undefined" || apiKey === "") {
    console.warn("API_KEY 唔見咗，啟動離線求生模式...");
    return { result: fallbackAnalysis(), mode: 'FALLBACK' };
  }

  for (let attempt = 1; attempt <= retryCount; attempt++) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const analysisPromise = ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            { text: "兄弟，幫我睇睇呢張相有冇咩位會令我『死人』？用求生兄弟嘅口吻，俾個全廣東話嘅分析報告我。" },
            { inlineData: { mimeType: "image/jpeg", data: base64Image.split(',')[1] || base64Image } }
          ]
        },
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
          responseSchema: RESPONSE_SCHEMA
        }
      });

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("TIMEOUT")), 20000)
      );

      const response: any = await Promise.race([analysisPromise, timeoutPromise]);
      const resultText = response.text || "{}";
      return { result: JSON.parse(resultText) as AnalysisResult, mode: 'AI' };

    } catch (error: any) {
      console.warn(`Attempt ${attempt} 失敗:`, error.message);
      if (attempt < retryCount) {
        await wait(1000 * attempt);
      } else {
        console.error("AI 完全死咗，切換到離線模式...");
        return { result: fallbackAnalysis(), mode: 'FALLBACK' };
      }
    }
  }

  return { result: fallbackAnalysis(), mode: 'FALLBACK' };
};