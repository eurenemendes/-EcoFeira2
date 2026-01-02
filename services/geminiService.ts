
import { GoogleGenAI } from "@google/genai";
import { Product, ShoppingListItem } from "../types";

const getAIInstance = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const optimizeShoppingList = async (items: ShoppingListItem[], availableProducts: Product[]) => {
  if (items.length === 0) return "Sua lista está vazia! Adicione itens para que eu possa otimizar sua economia.";

  const ai = getAIInstance();

  const prompt = `
    Aja como um especialista sênior em economia doméstica.
    Lista do usuário: ${items.map(i => `${i.quantity}x ${i.productName}`).join(', ')}.
    
    Produtos disponíveis hoje:
    ${availableProducts.map(p => `- ${p.name} no ${p.supermarket}: R$${p.isPromo ? p.promoPrice : p.normalPrice}`).join('\n')}
    
    Analise e responda em Markdown:
    1. **Onde comprar cada item**: Aponte a loja com o menor preço real.
    2. **Troca Inteligente**: Sugira trocar marcas caras por similares em promoção (ex: Leite Moça por Itambé se a economia for > 30%).
    3. **Veredito de Logística**: Vale a pena ir em mais de uma loja? Considere que cada deslocamento "custa" R$ 5,00.
    4. **Economia Total Estimada**: Quanto o usuário poupará seguindo suas dicas em comparação a comprar tudo na loja mais cara.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        temperature: 0.2, // Mais factual
        topP: 0.8,
        topK: 40,
      }
    });

    return response.text || "Não foi possível gerar a otimização no momento.";
  } catch (error: any) {
    console.error("Erro no GeminiService:", error);
    return "Desculpe, tive um problema ao analisar sua lista. Mas os menores preços estão destacados abaixo!";
  }
};

export const smartSearch = async (query: string, availableProducts: Product[]) => {
  const ai = getAIInstance();
  
  const productNames = Array.from(new Set(availableProducts.map(p => p.name)));
  
  const prompt = `
    Dada a consulta do usuário: "${query}"
    E esta lista de produtos disponíveis: ${productNames.slice(0, 100).join(', ')}
    
    Quais são os 5 produtos mais prováveis que o usuário está procurando, mesmo que haja erros de digitação ou ele use termos genéricos (ex: "danone" para iogurte)?
    Retorne APENAS um array JSON de strings com os nomes exatos dos produtos da lista.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });
    
    const result = JSON.parse(response.text || "[]");
    return Array.isArray(result) ? result : [];
  } catch (error) {
    console.error("Erro na busca inteligente:", error);
    return [];
  }
};
