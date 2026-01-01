
import { GoogleGenAI } from "@google/genai";
import { Product, ShoppingListItem } from "../types";

/**
 * Nota de Segurança:
 * Em um ambiente de produção real, as chaves de API nunca devem ser expostas no frontend.
 * Este serviço foi estruturado para utilizar process.env.API_KEY, que é injetado com segurança 
 * pelo ambiente de execução. Se você estiver migrando para uma arquitetura com backend próprio,
 * este arquivo deve ser movido para uma Serverless Function (ex: /api/optimize).
 */

const getAIInstance = () => {
  if (!process.env.API_KEY) {
    throw new Error("API Key não configurada. Por favor, verifique as variáveis de ambiente.");
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const optimizeShoppingList = async (items: ShoppingListItem[], availableProducts: Product[]) => {
  if (items.length === 0) return "Sua lista está vazia! Adicione itens para que eu possa otimizar sua economia.";

  const ai = getAIInstance();

  const prompt = `
    Aja como um especialista sênior em economia doméstica e curadoria de preços.
    Tenho esta lista de compras: ${items.map(i => `${i.quantity}x ${i.productName}`).join(', ')}.
    
    Estes são os produtos reais disponíveis nos supermercados locais agora:
    ${availableProducts.map(p => `${p.name} no ${p.supermarket} por R$${p.isPromo ? p.promoPrice : p.normalPrice}`).join('\n')}
    
    Tarefa:
    1. Identifique em quais lojas cada item está mais barato.
    2. Sugira substituições de marcas se houver uma economia superior a 20%.
    3. Destaque se vale a pena dividir a compra em duas lojas ou se o custo de deslocamento não compensa (baseado na proximidade teórica).
    
    Responda em Português de forma profissional, amigável e estruturada em tópicos curtos e acionáveis.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
      }
    });

    if (!response || !response.text) {
      throw new Error("Resposta vazia da IA.");
    }

    return response.text;
  } catch (error: any) {
    console.error("Erro crítico no GeminiService:", error);
    
    // Fallback amigável sem expor detalhes técnicos sensíveis do erro
    if (error.message?.includes("API_KEY")) {
      return "Erro de configuração: Chave de API inválida ou expirada.";
    }
    
    return "Desculpe, tive um problema ao analisar sua lista agora. Mas não se preocupe, você ainda pode conferir os menores preços marcados na sua lista abaixo!";
  }
};
