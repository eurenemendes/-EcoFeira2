
import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center space-x-3 order-2 sm:order-1">
        <button
          onClick={() => {
            onPageChange(Math.max(1, currentPage - 1));
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          disabled={currentPage === 1}
          className="flex items-center space-x-2 px-6 py-4 rounded-2xl bg-white dark:bg-[#1e293b] text-gray-700 dark:text-gray-200 font-bold border border-gray-100 dark:border-gray-800 shadow-sm hover:border-brand hover:text-brand disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-gray-700 transition-all active:scale-95 group"
        >
          <svg className="w-5 h-5 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" />
          </svg>
          <span className="hidden sm:inline">Anterior</span>
        </button>

        <div className="flex items-center px-6 py-3 bg-white dark:bg-[#1e293b] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-inner">
          <div className="flex items-center space-x-3">
            <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Página</span>
            <span className="text-xl font-black text-brand tracking-tighter">
              {currentPage}
            </span>
            <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">de</span>
            <span className="text-xl font-black text-[#111827] dark:text-white tracking-tighter">
              {totalPages}
            </span>
          </div>
        </div>

        <button
          onClick={() => {
            onPageChange(Math.min(totalPages, currentPage + 1));
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          disabled={currentPage === totalPages}
          className="flex items-center space-x-2 px-6 py-4 rounded-2xl bg-white dark:bg-[#1e293b] text-gray-700 dark:text-gray-200 font-bold border border-gray-100 dark:border-gray-800 shadow-sm hover:border-brand hover:text-brand disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-gray-700 transition-all active:scale-95 group"
        >
          <span className="hidden sm:inline">Próxima</span>
          <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      
      <div className="order-1 sm:order-2">
        <p className="text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-[2px]">Navegação EcoFeira</p>
      </div>
    </div>
  );
};
