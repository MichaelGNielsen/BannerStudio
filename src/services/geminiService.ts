import { GoogleGenAI } from "@google/genai";

export async function generateBannerImage(prompt: string, referenceFile?: { data: string, mimeType: string }) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  
  const parts: any[] = [{ text: prompt }];
  
  if (referenceFile) {
    parts.unshift({
      inlineData: {
        data: referenceFile.data,
        mimeType: referenceFile.mimeType
      }
    });
    parts.push({ text: "Use the uploaded image/video as a reference for the style, tone, and lighting of the scene." });
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-image-preview',
      contents: {
        parts: parts,
      },
      config: {
        imageConfig: {
          aspectRatio: "4:1",
          imageSize: "1K"
        },
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image data returned from Gemini");
  } catch (error) {
    console.error("Error generating image:", error);
    throw error;
  }
}
