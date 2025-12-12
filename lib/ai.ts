import { GoogleGenAI, Type } from "@google/genai";
import { AIResponse } from '../types';

// NOTE: In a real production app, this key should be proxied or user-provided if not server-side.
// The prompt instructions state to use process.env.API_KEY directly.
const API_KEY = process.env.API_KEY || '';

const ai = new GoogleGenAI({ apiKey: API_KEY });

const SYSTEM_INSTRUCTION = `
You are an advanced writing assistant. 
Your goal is to help the user write better prompts and text.
Analyze the provided text and offer:
1. "continuations": Plausible next sentences (2-3 options).
2. "enhancements": A rewritten version of the text that improves clarity, structure, and specificity (1-2 options).
3. "typos": A list of spelling or grammar mistakes found.

Return strictly valid JSON.
`;

export const getSuggestions = async (content: string): Promise<AIResponse> => {
  if (!content || content.length < 10) {
    return { continuations: [], enhancements: [], typos: [] };
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: content,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            continuations: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            enhancements: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            typos: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  original: { type: Type.STRING },
                  suggestion: { type: Type.STRING },
                  index: { type: Type.INTEGER }
                }
              }
            }
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as AIResponse;
    }
    throw new Error("Empty response from AI");
  } catch (error) {
    console.error("AI Service Error:", error);
    return { continuations: [], enhancements: [], typos: [] };
  }
};