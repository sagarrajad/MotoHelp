import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export const geminiModel = "gemini-3-flash-preview";

export async function scanDocument(base64Image: string, mimeType: string) {
  const prompt = `Analyze this vehicle document (Bluebook, License, or Insurance). 
  Extract key information including:
  - Personal Info (Name, Address)
  - Vehicle Info (Model, Make, Reg Number, Engine/Chassis number)
  - Dates (Issue Date, Expiry Date)
  Return the data in a clean JSON format. If it's a Nepalese document, identify and translate relevant fields to English.`;

  try {
    const response = await ai.models.generateContent({
      model: geminiModel,
      contents: [
        {
          parts: [
            { text: prompt },
            { inlineData: { data: base64Image, mimeType } }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json"
      }
    });
    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("AI Scan Error:", error);
    throw error;
  }
}

export async function scanMaintenanceBill(base64Image: string, mimeType: string) {
  const prompt = `Extract details from this maintenance bill/invoice.
  Identify:
  - Business Name
  - Place/Location
  - Date
  - Total Cost
  - List of works/services (Itemized description and price)
  Convert any handwriting to clear text. If the bill is in Nepali, translate it to English.
  Return as JSON.`;

  try {
    const response = await ai.models.generateContent({
      model: geminiModel,
      contents: [
        {
          parts: [
            { text: prompt },
            { inlineData: { data: base64Image, mimeType } }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json"
      }
    });
    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("AI Bill Scan Error:", error);
    throw error;
  }
}

export async function getFuelPriceRecommendation(fuelType: string) {
  // Simple heuristic/mock for demo purposes if we can't scrape live in browser easily
  // In a real app, this would call a proxy API to NOC
  const prices = {
    petrol: 172.00,
    diesel: 160.00
  };
  return prices[fuelType as keyof typeof prices] || 0;
}
