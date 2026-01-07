
import React from 'react';
import { Product } from '../types';

interface ReportModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({ product, isOpen, onClose }) => {
  if (!isOpen) return null;

  const currentPrice = product.isPromo ? product.promoPrice : product.normalPrice;
  const fallbackImage = "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=60&w=300";

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-[#0f172a]/80 backdrop-blur-md animate-in fade-in duration-300"
        onClick={onClose}
      ></div>
      
      <div className="relative bg-white dark:bg-[#1e293b] w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh] border border-gray-100 dark:border-gray-800">
        {/* Header */}
        <div className="p-6 sm:p-10 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-white/50 dark:bg-[#1e293b]/50 backdrop-blur-xl">
          <div>
            <h3 className="text-2xl font-black text-[#111827] dark:text-white tracking-tighter">Reportar Item</h3>
            <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mt-1">Notificar erro</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-3 bg-gray-50 dark:bg-[#0f172a] text-gray-400 hover:text-red-500 rounded-2xl transition-all border border-gray-100 dark:border-gray-800 active:scale-90"
            aria-label="Fechar Modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-grow overflow-y-auto p-6 sm:p-10 space-y-8 custom-scrollbar">
          {/* Product Summary Card */}
          <div className="bg-gray-50 dark:bg-[#0f172a]/40 rounded-[2.5rem] p-6 border border-gray-100 dark:border-gray-800 flex items-center space-x-6">
            <div className="w-24 h-24 bg-white dark:bg-gray-800 rounded-3xl flex-shrink-0 p-2 shadow-sm border border-gray-100 dark:border-gray-700">
              <img 
                src={product.imageUrl || fallbackImage} 
                alt={product.name}
                className="w-full h-full object-contain pointer-events-none"
              />
            </div>
            <div className="flex-grow min-w-0">
              <p className="text-[9px] font-black text-brand bg-brand/10 dark:bg-brand/20 px-2 py-0.5 rounded-md uppercase tracking-widest inline-block mb-1">{product.supermarket}</p>
              <h4 className="font-extrabold text-[#111827] dark:text-gray-100 text-lg truncate leading-tight">{product.name}</h4>
              <p className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter mt-1">
                R$ {currentPrice.toFixed(2).replace('.', ',')}
              </p>
              <div className="mt-1 flex items-center space-x-2">
                 <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">ID: {product.id}</span>
              </div>
            </div>
          </div>

          {/* Form / Iframe Area */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Preencha os detalhes do problema</label>
            </div>
            
            <div className="w-full h-[450px] bg-gray-50 dark:bg-[#0f172a] rounded-[2.5rem] border-2 border-dashed border-gray-200 dark:border-gray-800 overflow-hidden relative">
              {/* Google Form or Custom Form Iframe would go here */}
              <iframe 
                src="about:blank" 
                className="w-full h-full border-none relative z-10"
                title="Formulário de Report"
              ></iframe>
              
              {/* Placeholder Content while iframe loads or if URL is empty */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-12 space-y-4 bg-white/5 dark:bg-[#1e293b]/5 backdrop-blur-[1px]">
                <div className="w-20 h-20 bg-white dark:bg-gray-800 rounded-[2rem] flex items-center justify-center shadow-lg border border-gray-100 dark:border-gray-700">
                  <svg className="w-10 h-10 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400 font-extrabold text-lg">O formulário de reporte será carregado aqui.</p>
                  <p className="text-gray-400 dark:text-gray-500 text-xs mt-2 font-medium max-w-xs mx-auto">Suas informações ajudam a manter o EcoFeira atualizado para toda a comunidade.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 sm:p-10 bg-gray-50/50 dark:bg-[#0f172a]/20 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest text-center sm:text-left">EcoFeira Transparência & Dados</p>
          <button 
            onClick={onClose}
            className="w-full sm:w-auto bg-brand text-white font-black py-4 px-12 rounded-2xl shadow-xl shadow-brand/20 hover:scale-105 active:scale-95 transition-all text-sm uppercase tracking-widest"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
