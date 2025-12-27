
import React, { useMemo, useState } from 'react';
import { ShoppingListItem, Product, ComparisonResult, Supermarket } from '../types';

interface CartOptimizerProps {
  items: ShoppingListItem[];
  allProducts: Product[];
  stores: Supermarket[];
}

export const CartOptimizer: React.FC<CartOptimizerProps> = ({ items, allProducts, stores }) => {
  const [selectedStoreModal, setSelectedStoreModal] = useState<string | null>(null);

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

    results.sort((a, b) => a.totalEstimated - b.totalEstimated);
    if (results.length > 0) results[0].isBestOption = true;

    return results;
  }, [items, allProducts, stores, storeFactorsMap]);

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
  const worstOption = comparison[comparison.length - 1];
  const savings = worstOption.totalEstimated - bestOption.totalEstimated;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-700">
      {/* Simulation Banner */}
      <div className="bg-brand text-white p-10 rounded-[2.5rem] shadow-2xl shadow-brand/20 relative overflow-hidden flex items-center justify-between">
        <div className="absolute top-1/2 right-4 -translate-y-1/2 opacity-10">
          <svg className="w-48 h-48" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.82v-1.91c-1.57-.31-3.04-1.22-3.89-2.52l1.58-1.29c.64.93 1.54 1.51 2.31 1.74v-3.72c-1.54-.36-3.89-1.22-3.89-4.22 0-2.22 1.59-3.79 3.89-4.13V2h2.82v1.94c1.3.2 2.45.86 3.19 1.78l-1.54 1.34c-.45-.55-1.05-.93-1.65-1.1v3.42c1.94.55 4.31 1.48 4.31 4.54 0 2.51-1.74 4.07-4.31 4.41zM10.59 8.05c0 .76.65 1.14 1.41 1.33V6.66c-.66.17-1.41.54-1.41 1.39zm2.82 7.74c.82-.2 1.49-.66 1.49-1.49 0-.85-.71-1.21-1.49-1.43v2.92z"/>
          </svg>
        </div>
        <div className="relative z-10">
          <p className="text-white/70 font-bold text-[10px] uppercase tracking-[2px] mb-2">Simulação Inteligente</p>
          <h3 className="text-4xl font-[900] tracking-tighter leading-tight">
            Você economiza <span className="underline decoration-[6px] underline-offset-8">R$ {savings.toFixed(2).replace('.', ',')}</span> nesta escolha!
          </h3>
          <p className="text-white/80 font-bold text-sm mt-6">Considerando a lista completa entre {stores.length} estabelecimentos.</p>
        </div>
      </div>

      {/* Comparison List */}
      <div className="bg-white dark:bg-[#1e293b] rounded-[3rem] border border-gray-100 dark:border-gray-800 p-10 shadow-sm">
        <h4 className="text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-10">Comparativo por Loja</h4>
        <div className="space-y-4">
          {comparison.map((res) => (
            <div 
              key={res.storeName} 
              className={`relative flex items-center p-8 rounded-[2rem] transition-all duration-500 border ${res.isBestOption ? 'bg-brand/5 border-brand/20' : 'bg-gray-50/50 dark:bg-[#0f172a]/50 border-gray-50 dark:border-gray-800/40 opacity-90'}`}
            >
              <div className="flex items-center space-x-6 w-full">
                <div className="w-16 h-16 bg-white dark:bg-[#1e293b] rounded-2xl flex-shrink-0 flex items-center justify-center p-2.5 shadow-sm border border-gray-100 dark:border-gray-800">
                  <img src={res.logo} alt={res.storeName} className="w-full h-full object-contain" />
                </div>
                
                <div className="flex-grow">
                  {/* Badge positioned above the name as per screenshot */}
                  {res.isBestOption && (
                    <div className="mb-2">
                      <span className="bg-brand text-white text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-tighter shadow-lg shadow-brand/20">Melhor Preço</span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xl text-gray-900 dark:text-white tracking-tight">{res.storeName}</span>
                  </div>
                  
                  {/* Price Section */}
                  <div className="mt-3 mb-3">
                    <div className="flex items-baseline space-x-2">
                       <span className={`text-3xl font-[1000] tracking-tighter ${res.isBestOption ? 'text-brand' : 'text-gray-900 dark:text-white'}`}>
                          R$ {res.totalEstimated.toFixed(2).replace('.', ',')}
                       </span>
                    </div>
                    <p className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest leading-none">Total Estimado</p>
                  </div>

                  <div className="flex items-center space-x-2">
                     <button 
                        onClick={() => setSelectedStoreModal(res.storeName)}
                        className="flex items-center text-[11px] font-bold text-brand bg-brand/5 dark:bg-brand/10 px-2.5 py-1 rounded-lg border border-brand/10 hover:bg-brand/20 transition-colors"
                     >
                        <svg className="w-3.5 h-3.5 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        {res.confirmedCount} de {res.itemsCount} confirmados
                     </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Confirmed Items Modal */}
      {selectedStoreModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
          <div 
            className="absolute inset-0 bg-[#0f172a]/80 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setSelectedStoreModal(null)}
          ></div>
          
          <div className="relative bg-white dark:bg-[#1e293b] w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300 border border-gray-100 dark:border-gray-800">
            <div className="p-8 sm:p-10 bg-gray-50 dark:bg-[#0f172a]/50 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-[900] text-[#111827] dark:text-white tracking-tighter">Itens Confirmados</h3>
                <p className="text-[10px] font-black text-brand uppercase tracking-widest mt-1">{selectedStoreModal}</p>
              </div>
              <button 
                onClick={() => setSelectedStoreModal(null)}
                className="p-3 bg-white dark:bg-[#1e293b] text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-2xl border border-gray-100 dark:border-gray-800 transition-all shadow-sm"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="max-h-[60vh] overflow-y-auto custom-scrollbar p-8 sm:p-10 space-y-4">
              {modalItems.length > 0 ? (
                modalItems.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-6 bg-gray-50/50 dark:bg-[#0f172a]/30 rounded-2xl border border-gray-50 dark:border-gray-800/40">
                    <div className="flex items-center space-x-4">
                      <div className="bg-brand/10 text-brand p-2 rounded-xl">
                        <span className="text-sm font-black">{item.quantity}x</span>
                      </div>
                      <span className="font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">{item.productName}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-[900] text-gray-900 dark:text-white tracking-tighter">R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}</p>
                      <p className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Un: R$ {item.price.toFixed(2).replace('.', ',')}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-10 text-center space-y-4">
                  <div className="w-16 h-16 bg-gray-50 dark:bg-[#0f172a] rounded-2xl flex items-center justify-center mx-auto text-gray-300">
                     <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                     </svg>
                  </div>
                  <p className="font-bold text-gray-400 dark:text-gray-500">Nenhum item localizado nesta loja.</p>
                </div>
              )}
            </div>

            <div className="p-8 sm:p-10 bg-gray-50 dark:bg-[#0f172a]/50 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <span className="text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Total da Cesta</span>
              <span className="text-3xl font-[1000] text-brand tracking-tighter">
                R$ {modalItems.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0).toFixed(2).replace('.', ',')}
              </span>
            </div>
          </div>
        </div>
      )}
      
      <p className="text-[10px] text-gray-400 dark:text-gray-600 font-bold italic text-center px-10 leading-relaxed">
        * Cálculos baseados em preços confirmados hoje e índices de precificação dinâmicos para itens não localizados.
      </p>
    </div>
  );
};
