
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
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

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

  const handleAIAnalyze = async () => {
    setIsAnalyzing(true);
    const result = await optimizeShoppingList(items, allProducts);
    setAiAnalysis(result);
    setIsAnalyzing(false);
  };

  if (items.length === 0) return null;

  const bestOption = comparison[0];
  if (!bestOption) return null;

  const worstOption = comparison[comparison.length - 1];
  const savings = worstOption.totalEstimated - bestOption.totalEstimated;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-700">
      {/* Simulation Banner */}
      <div className="bg-brand text-white p-8 sm:p-10 rounded-[2.5rem] shadow-2xl shadow-brand/20 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center space-x-2 mb-4">
            <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">IA EcoFeira</span>
          </div>
          <h3 className="text-3xl sm:text-4xl font-[900] tracking-tighter leading-tight">
            Economia de <span className="underline decoration-4 underline-offset-4">R$ {savings.toFixed(2).replace('.', ',')}</span>
          </h3>
          <p className="text-white/80 font-bold text-sm mt-4">Escolhendo o {bestOption.storeName} para sua lista completa.</p>
          
          <button 
            onClick={handleAIAnalyze}
            disabled={isAnalyzing}
            className={`mt-8 w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center space-x-2 ${
              isAnalyzing ? 'bg-white/10 text-white/50 cursor-not-allowed' : 'bg-white text-brand hover:bg-gray-100 active:scale-95'
            }`}
          >
            {isAnalyzing ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Analisando com IA...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                <span>Otimizar Lista com IA</span>
              </>
            )}
          </button>
        </div>
      </div>

      {aiAnalysis && (
        <div className="bg-brand/5 dark:bg-brand/10 border border-brand/20 p-8 rounded-[2.5rem] animate-in slide-in-from-top-4 duration-500">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-sm font-black text-brand uppercase tracking-widest">Análise do Especialista IA</h4>
            <button onClick={() => setAiAnalysis(null)} className="text-brand/40 hover:text-brand">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 font-medium leading-relaxed">
            {aiAnalysis.split('\n').map((line, i) => (
              <p key={i} className="mb-2">{line}</p>
            ))}
          </div>
        </div>
      )}

      {/* Comparison List */}
      <div className="bg-white dark:bg-[#1e293b] rounded-[3rem] border border-gray-100 dark:border-gray-800 p-8 sm:p-10 shadow-sm">
        <h4 className="text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-8">Onde sua lista custa menos</h4>
        <div className="space-y-4">
          {comparison.map((res) => (
            <div 
              key={res.storeName} 
              className={`flex flex-col p-6 rounded-[2rem] transition-all duration-500 border ${res.isBestOption ? 'bg-brand/5 border-brand/20 ring-1 ring-brand/10' : 'bg-gray-50/50 dark:bg-[#0f172a]/50 border-gray-50 dark:border-gray-800/40'}`}
            >
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-white rounded-xl flex-shrink-0 flex items-center justify-center p-2 shadow-sm border border-gray-100">
                  <img src={res.logo} alt="" className="w-full h-full object-contain" />
                </div>
                <div className="flex-grow">
                  <h5 className="font-black text-gray-900 dark:text-white leading-tight">{res.storeName}</h5>
                  <div className="w-full bg-gray-200 dark:bg-gray-800 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${res.isBestOption ? 'bg-brand' : 'bg-gray-400'}`}
                      style={{ width: `${(res.confirmedCount / res.itemsCount) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="flex items-end justify-between">
                <div>
                  <p className={`text-2xl font-[1000] tracking-tighter ${res.isBestOption ? 'text-brand' : 'text-gray-900 dark:text-white'}`}>
                    R$ {res.totalEstimated.toFixed(2).replace('.', ',')}
                  </p>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Total Estimado</p>
                </div>
                <button 
                  onClick={() => setSelectedStoreModal(res.storeName)}
                  className="px-4 py-2 bg-white dark:bg-[#1e293b] border border-gray-100 dark:border-gray-700 rounded-xl text-[10px] font-black uppercase text-gray-500 hover:text-brand hover:border-brand transition-all"
                >
                  Ver Detalhes
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {selectedStoreModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#0f172a]/80 backdrop-blur-sm" onClick={() => setSelectedStoreModal(null)}></div>
          <div className="relative bg-white dark:bg-[#1e293b] w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <h3 className="text-xl font-black dark:text-white">Itens em {selectedStoreModal}</h3>
              <button onClick={() => setSelectedStoreModal(null)} className="text-gray-400"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <div className="max-h-[50vh] overflow-y-auto p-8 space-y-3">
              {items.map((item, idx) => {
                const p = allProducts.find(prod => prod.name === item.productName && prod.supermarket === selectedStoreModal);
                return (
                  <div key={idx} className={`p-4 rounded-xl border flex items-center justify-between ${p ? 'bg-emerald-50/30 border-emerald-100 dark:bg-emerald-500/5 dark:border-emerald-500/20' : 'bg-gray-50/30 border-gray-100 opacity-60'}`}>
                    <div className="flex flex-col">
                      <span className="font-bold text-sm dark:text-gray-200">{item.productName}</span>
                      <span className="text-[10px] text-gray-400 font-bold uppercase">{p ? 'Confirmado' : 'Estimado'}</span>
                    </div>
                    <span className="font-black text-brand">
                      R$ {p ? (p.isPromo ? p.promoPrice : p.normalPrice).toFixed(2) : '---'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
