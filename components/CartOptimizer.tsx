
import React, { useMemo, useState } from 'react';
import { ShoppingListItem, Product, ComparisonResult, Supermarket } from '../types';
import { optimizeShoppingList } from '../services/geminiService';

interface CartOptimizerProps {
  items: ShoppingListItem[];
  allProducts: Product[];
  stores: Supermarket[];
}

export const CartOptimizer: React.FC<CartOptimizerProps> = ({ items, allProducts, stores }) => {
  const [selectedStoreModal, setSelectedStoreModal] = useState<string | null>(null);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);

  const storeFactorsMap = useMemo(() => {
    const map: Record<string, number> = {};
    stores.forEach(s => {
      map[s.name] = s.priceIndex;
    });
    return map;
  }, [stores]);

  const comparison = useMemo(() => {
    if (items.length === 0) return [];

    const results: ComparisonResult[] = stores.map(store => {
      let totalEstimated = 0;
      let totalConfirmed = 0;
      let confirmedCount = 0;

      items.forEach(item => {
        const storeProduct = allProducts.find(p => 
          p.name === item.productName && p.supermarket === store.name
        );

        if (storeProduct) {
          const price = storeProduct.isPromo ? storeProduct.promoPrice : storeProduct.normalPrice;
          totalConfirmed += price * item.quantity;
          totalEstimated += price * item.quantity;
          confirmedCount++;
        } else {
          const targetFactor = store.priceIndex;
          const originFactor = storeFactorsMap[item.originalStore] || 1.0;
          const estimatedPrice = (item.originalPrice / originFactor) * targetFactor;
          totalEstimated += estimatedPrice * item.quantity;
        }
      });

      return {
        storeName: store.name,
        logo: store.logo,
        totalEstimated,
        totalConfirmed,
        confirmedCount,
        itemsCount: items.length,
        isBestOption: false
      };
    });

    const filteredResults = results
      .filter(res => res.confirmedCount > 0)
      .sort((a, b) => a.totalEstimated - b.totalEstimated)
      .slice(0, 4);

    if (filteredResults.length > 0) filteredResults[0].isBestOption = true;

    return filteredResults;
  }, [items, allProducts, stores, storeFactorsMap]);

  const handleAIOptimize = async () => {
    setIsAIThinking(true);
    try {
      const result = await optimizeShoppingList(items, allProducts);
      setAiResponse(result);
    } catch (e) {
      setAiResponse("Erro ao consultar a IA. Tente novamente em instantes.");
    } finally {
      setIsAIThinking(false);
    }
  };

  const modalItems = useMemo(() => {
    if (!selectedStoreModal) return [];
    return items.filter(item => 
      allProducts.some(p => p.name === item.productName && p.supermarket === selectedStoreModal)
    ).map(item => {
      const p = allProducts.find(prod => prod.name === item.productName && prod.supermarket === selectedStoreModal)!;
      return {
        ...item,
        price: p.isPromo ? p.promoPrice : p.normalPrice
      };
    });
  }, [selectedStoreModal, items, allProducts]);

  if (items.length === 0) return null;

  const bestOption = comparison[0];
  if (!bestOption) return null;

  const worstOption = comparison[comparison.length - 1];
  const savings = worstOption.totalEstimated - bestOption.totalEstimated;

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-right-4 duration-700">
      {/* AI Assistant Card */}
      <div className="bg-gradient-to-br from-[#111827] to-[#1e293b] text-white p-8 sm:p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-brand/20 rounded-full blur-3xl group-hover:bg-brand/30 transition-colors duration-700"></div>
        <div className="relative z-10">
          <div className="flex items-center space-x-3 mb-6">
            <div className="bg-brand p-2 rounded-xl shadow-lg shadow-brand/20">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-xs font-black uppercase tracking-widest text-brand">Assistente IA EcoFeira</span>
          </div>
          
          <h3 className="text-2xl sm:text-3xl font-[900] tracking-tighter leading-tight mb-6">
            Otimize sua lista com inteligência artificial
          </h3>
          
          {!aiResponse ? (
            <button 
              onClick={handleAIOptimize}
              disabled={isAIThinking}
              className={`w-full py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center space-x-3 ${isAIThinking ? 'bg-gray-700 cursor-wait' : 'bg-brand hover:bg-brand-dark shadow-xl shadow-brand/20 hover:scale-[1.02] active:scale-95'}`}
            >
              {isAIThinking ? (
                <>
                  <div className="w-5 h-5 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                  <span>Analisando Preços...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <span>Consultar Estratégia IA</span>
                </>
              )}
            </button>
          ) : (
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 sm:p-8 border border-white/10 animate-in fade-in slide-in-from-top-4 duration-500 max-h-[400px] overflow-y-auto custom-scrollbar">
              <div className="flex justify-between items-start mb-4">
                 <h4 className="text-brand font-black text-xs uppercase tracking-widest">Dicas do Consultor:</h4>
                 <button onClick={() => setAiResponse(null)} className="text-white/40 hover:text-white transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4l16 16m0-16L4 20" /></svg>
                 </button>
              </div>
              <div className="text-white/90 text-sm sm:text-base leading-relaxed whitespace-pre-wrap font-medium">
                {aiResponse}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Simulation Banner */}
      <div className="bg-brand text-white p-8 sm:p-10 rounded-[2.5rem] shadow-2xl shadow-brand/10 relative overflow-hidden flex items-center justify-between">
        <div className="absolute top-1/2 right-4 -translate-y-1/2 opacity-10">
          <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.82v-1.91c-1.57-.31-3.04-1.22-3.89-2.52l1.58-1.29c.64.93 1.54 1.51 2.31 1.74v-3.72c-1.54-.36-3.89-1.22-3.89-4.22 0-2.22 1.59-3.79 3.89-4.13V2h2.82v1.94c1.3.2 2.45.86 3.19 1.78l-1.54 1.34c-.45-.55-1.05-.93-1.65-1.1v3.42c1.94.55 4.31 1.48 4.31 4.54 0 2.51-1.74 4.07-4.31 4.41zM10.59 8.05c0 .76.65 1.14 1.41 1.33V6.66c-.66.17-1.41.54-1.41 1.39zm2.82 7.74c.82-.2 1.49-.66 1.49-1.49 0-.85-.71-1.21-1.49-1.43v2.92z"/>
          </svg>
        </div>
        <div className="relative z-10">
          <p className="text-white/70 font-bold text-[10px] uppercase tracking-[2px] mb-2">Simulação de Economia</p>
          <h3 className="text-2xl sm:text-3xl font-[900] tracking-tighter leading-tight">
            Economize <span className="bg-white text-brand px-3 py-1 rounded-xl">R$ {savings.toFixed(2).replace('.', ',')}</span> nesta compra!
          </h3>
          <p className="text-white/80 font-bold text-xs mt-4">Escolhendo a melhor opção entre os parceiros EcoFeira.</p>
        </div>
      </div>

      {/* Comparison List */}
      <div className="bg-white dark:bg-[#1e293b] rounded-[2.5rem] border border-gray-100 dark:border-gray-800 p-8 sm:p-10 shadow-sm">
        <h4 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-8">Comparativo Automático</h4>
        <div className="space-y-4">
          {comparison.map((res) => (
            <div 
              key={res.storeName} 
              className={`relative flex items-center p-6 sm:p-7 rounded-3xl transition-all duration-500 border ${res.isBestOption ? 'bg-brand/5 border-brand/20 shadow-lg shadow-brand/5' : 'bg-gray-50/50 dark:bg-[#0f172a]/50 border-gray-100 dark:border-gray-800/40 opacity-90'}`}
            >
              <div className="flex items-center space-x-5 w-full">
                <div className="w-14 h-14 bg-white dark:bg-[#1e293b] rounded-2xl flex-shrink-0 flex items-center justify-center p-2 shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                  <img 
                    src={res.logo} 
                    alt={res.storeName} 
                    className="w-full h-full object-contain pointer-events-none" 
                    draggable={false}
                    onContextMenu={(e) => e.preventDefault()}
                  />
                </div>
                
                <div className="flex-grow min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-extrabold text-lg text-gray-900 dark:text-white tracking-tight truncate pr-2">{res.storeName}</span>
                    {res.isBestOption && (
                      <span className="bg-brand text-white text-[8px] font-black px-2 py-1 rounded-md uppercase tracking-tighter">MELHOR OPÇÃO</span>
                    )}
                  </div>
                  
                  <div className="flex items-end justify-between">
                    <div>
                       <span className={`text-2xl font-[1000] tracking-tighter ${res.isBestOption ? 'text-brand' : 'text-gray-900 dark:text-white'}`}>
                          R$ {res.totalEstimated.toFixed(2).replace('.', ',')}
                       </span>
                       <p className="text-[8px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest leading-none mt-1">Total Estimado</p>
                    </div>
                    <button 
                      onClick={() => setSelectedStoreModal(res.storeName)}
                      className="text-[10px] font-black text-brand bg-brand/10 hover:bg-brand hover:text-white px-3 py-1.5 rounded-lg transition-all border border-brand/10"
                    >
                      {res.confirmedCount}/{res.itemsCount} itens
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {selectedStoreModal && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#0f172a]/80 backdrop-blur-md" onClick={() => setSelectedStoreModal(null)}></div>
          <div className="relative bg-white dark:bg-[#1e293b] w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-gray-100 dark:border-gray-800">
            <div className="p-8 bg-gray-50 dark:bg-[#0f172a]/50 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-[#111827] dark:text-white tracking-tighter">Cesta no {selectedStoreModal}</h3>
                <p className="text-[10px] font-black text-brand uppercase tracking-widest mt-1">Itens disponíveis na base de dados</p>
              </div>
              <button onClick={() => setSelectedStoreModal(null)} className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-xl transition-all"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <div className="max-h-[50vh] overflow-y-auto custom-scrollbar p-6 space-y-3">
              {modalItems.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-white dark:bg-[#1e293b] rounded-2xl border border-gray-100 dark:border-gray-800/40">
                  <div className="flex items-center space-x-3">
                    <div className="bg-brand/10 text-brand px-2 py-1 rounded-lg text-xs font-black">{item.quantity}x</div>
                    <span className="font-bold text-gray-900 dark:text-gray-100 text-sm">{item.productName}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-black text-gray-900 dark:text-white tracking-tighter">R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-8 bg-gray-50 dark:bg-[#0f172a]/50 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total dos Confirmados</span>
              <span className="text-2xl font-[1000] text-brand tracking-tighter">
                R$ {modalItems.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0).toFixed(2).replace('.', ',')}
              </span>
            </div>
          </div>
        </div>
      )}
      
      <p className="text-[9px] text-gray-400 dark:text-gray-600 font-bold italic text-center px-6 leading-relaxed">
        * Os valores da IA e do comparador são baseados nas ofertas atualizadas hoje nos supermercados parceiros.
      </p>
    </div>
  );
};
