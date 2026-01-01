
import { GoogleGenAI } from "@google/genai";
import { Product, ShoppingListItem } from "../types";

/**
 * Serviço de Inteligência Artificial EcoFeira
 * Utiliza o modelo Gemini 3 Flash para otimização de economia doméstica.
 */

export const optimizeShoppingList = async (items: ShoppingListItem[], availableProducts: Product[]) => {
  if (items.length === 0) return "Sua lista está vazia! Adicione itens para que eu possa otimizar sua economia.";

  // Inicialização conforme diretrizes: sempre criar nova instância com a API_KEY do ambiente
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    Aja como o 'Consultor EcoFeira', um especialista sênior em economia doméstica e análise de varejo.
    
    LISTA DO USUÁRIO:
    ${items.map(i => `- ${i.quantity}x ${i.productName} (Preço original: R$${i.originalPrice.toFixed(2)} no ${i.originalStore})`).join('\n')}
    
    BASE DE DADOS ATUAL (PRODUTOS DISPONÍVEIS):
    ${availableProducts.map(p => `- ${p.name} no ${p.supermarket}: R$${(p.isPromo ? p.promoPrice : p.normalPrice).toFixed(2)} (${p.isPromo ? 'EM PROMOÇÃO' : 'Preço Normal'})`).join('\n')}
    
    SUA TAREFA:
    1. Compare os itens da lista com a base de dados.
    2. Identifique onde cada item está mais barato.
    3. Sugira substituições de marcas se houver uma economia significativa (mais de 15%).
    4. Crie uma estratégia de rota: Vale a pena ir em mais de uma loja? Qual a economia total estimada?
    5. Destaque 2 "Achados do Dia" baseados nas promoções da base de dados que combinam com o perfil da lista.

    FORMATO DE RESPOSTA:
    - Use tom profissional, amigável e motivador.
    - Estruture em tópicos curtos e claros.
    - Use negrito para nomes de lojas e preços.
    - Finalize com uma estimativa de quanto tempo e dinheiro o usuário economizará seguindo sua dica.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        temperature: 0.7,
        thinkingConfig: { thinkingBudget: 0 } // Desabilitando thinking para menor latência em tarefas de texto simples
      }
    });

    if (!response || !response.text) {
      throw new Error("Resposta vazia da IA.");
    }

    return response.text;
  } catch (error: any) {
    console.error("Erro no GeminiService:", error);
    return "Desculpe, tive um breve soluço digital ao analisar sua lista. Mas não pare de economizar! Confira abaixo o comparativo manual que preparei para você.";
  }
};
