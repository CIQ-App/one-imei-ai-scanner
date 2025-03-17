import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Gemini API
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

interface DeviceInfo {
  position: string;
  imei: string;
}

interface AnalysisResult {
  description: string;
  deviceCount: number;
  devices: DeviceInfo[];
  error?: string;
}

function extractJSONFromText(text: string): string {
  // Try to extract JSON from markdown code blocks
  const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
  if (jsonMatch) {
    return jsonMatch[1];
  }
  
  // If no code blocks, try to find JSON directly
  const directJsonMatch = text.match(/\{[\s\S]*\}/);
  if (directJsonMatch) {
    return directJsonMatch[0];
  }
  
  return text;
}

export async function analyzeImage(imageData: string) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    const prompt = `Analyze this image of device boxes and provide a JSON response with the following structure:

{
  "description": "A brief, clear description of what you see in the image (1-2 sentences)",
  "deviceCount": number of devices in the picture,
  "devices": array of objects, each containing:
    - "position": string describing the device's position in the image
    - "imei": string containing ONE IMEI number for that device
}

If the image is not clear enough for accurate IMEI reading, set deviceCount to 0 and include an 'error' field with the message.

Return ONLY the JSON response with no additional text or markdown formatting.`;
    
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: imageData.split(',')[1]
        }
      }
    ]);

    const response = await result.response;
    const text = response.text();
    console.log('Raw Gemini Response:', text);
    
    try {
      // Try to extract and parse JSON from the response
      const jsonText = extractJSONFromText(text);
      console.log('Extracted JSON text:', jsonText);
      
      const parsedResponse = JSON.parse(jsonText);
      return parsedResponse;
    } catch (e) {
      console.error('JSON Parse Error:', e);
      console.log('Failed to parse text:', text);
      return {
        description: "",
        deviceCount: 0,
        devices: [],
        error: "Could not understand the AI response. Please try again with a clearer image."
      };
    }
  } catch (error) {
    console.error('Gemini API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      description: "",
      deviceCount: 0,
      devices: [],
      error: `API Error: ${errorMessage}`
    };
  }
}