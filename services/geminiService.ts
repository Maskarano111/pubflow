

import { GoogleGenAI } from "@google/genai";

// Fix: Adhering to Gemini API guidelines by initializing with process.env.API_KEY directly.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateDescription = async (itemName: string): Promise<string> => {
  try {
    const prompt = `Generate a short, catchy, and appealing menu description for a drink or food item called "${itemName}". Keep it to one or two sentences.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.8,
        topP: 0.9,
      }
    });

    // FIX: Changed to call .text() as a function. The error "This expression is not callable"
    // suggests a mismatch between SDK version and documentation, where .text may be a function
    // in the version used by the project.
    if (typeof (response as any).text === 'function') {
      return (response as any).text().trim();
    }
    return response.text.trim();
  } catch (error) {
    console.error("Error generating description with Gemini:", error);
    return "Could not generate AI description.";
  }
};
