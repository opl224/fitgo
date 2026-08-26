
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getCoachInsight = async (sessionData: any, language: string): Promise<string | null> => {
  try {
    const prompt = `You are a professional fitness coach. Analyze this session: ${JSON.stringify(sessionData)}. 
    Provide a short, encouraging insight and one tip for improvement. 
    Respond in ${language} language. Keep the response under 50 words.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: "You are Gemini Coach, an expert fitness mentor. Be concise, motivating, and focus on health and performance data.",
        temperature: 0.7,
      },
    });

    // Directly access the text property of the response object
    return response.text || null;
  } catch (error) {
    console.error("Coach insight generation failed:", error);
    return null;
  }
};
