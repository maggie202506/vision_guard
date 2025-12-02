import { GoogleGenAI } from "@google/genai";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API_KEY is missing in environment variables");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const generateEyeCareTip = async (): Promise<string> => {
  const client = getClient();
  if (!client) return "记得多眨眼，保持眼睛湿润！";

  try {
    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "给我一个简短的、一句话的护眼或数字健康建议。少于20个字。不要使用Markdown格式。请用中文回答。",
    });
    return response.text.trim();
  } catch (error) {
    console.error("Failed to fetch tip:", error);
    return "休息一下，看看窗外吧！";
  }
};

export const chatWithEyeCoach = async (history: { role: 'user' | 'model', text: string }[], message: string): Promise<string> => {
  const client = getClient();
  if (!client) return "我现在无法连接，请检查您的API密钥。";

  try {
    // Using chat model for better conversation flow
    const chat = client.chats.create({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: "你是一位名叫 Dr. Vision 的友好护眼教练。你的目标是帮助用户养成健康的用眼习惯，预防数字眼疲劳，并保持动力。请用中文回答。回答要简洁、实用且富有同理心。不要给出医疗诊断，如果遇到严重问题，请始终建议用户看医生。"
      },
      history: history.map(h => ({
        role: h.role,
        parts: [{ text: h.text }]
      }))
    });

    const result = await chat.sendMessage({
      message: message
    });

    return result.text;
  } catch (error) {
    console.error("Chat error:", error);
    return "抱歉，我暂时无法处理您的请求，请稍后再试。";
  }
};