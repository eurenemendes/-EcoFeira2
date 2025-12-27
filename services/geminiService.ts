
import { GoogleGenAI } from "@google/genai";
import { Product, ShoppingListItem } from "../types";

// Always use the named parameter for apiKey and obtain it from process.env.API_KEY.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const optimizeShoppingList = async (items: ShoppingListItem[], availableProducts: Product[]) => {
  if (items.length === 0) return "Sua lista está vazia! Adicione itens para que eu possa otimizar sua economia.";

  const prompt = `
    Aja como um especialista em economia doméstica.
    Tenho esta lista de compras: ${items.map(i => `${i.quantity}x ${i.productName}`).join(', ')}.
    
    Estes são os produtos disponíveis nos supermercados locais:
    ${availableProducts.map(p => `${p.name} no ${p.supermarket} por R$${p.isPromo ? p.promoPrice : p.normalPrice}`).join('\n')}
    
    Por favor, analise as melhores opções e sugira onde comprar cada item para economizar o máximo possível. 
    Destaque as promoções mais vantajosas. Responda em Português de forma amigável e estruturada em tópicos.
  `;

  try {
    // Correctly calling generateContent with both model name and prompt.
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    return response.text || "Não foi possível gerar a otimização no momento.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Desculpe, tive um problema ao analisar sua lista. Tente novamente mais tarde.";
  }
};
