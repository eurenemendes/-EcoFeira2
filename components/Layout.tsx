
import React, { useState, useEffect } from 'react';
import { View } from '../types.ts';

interface LayoutProps {
  children: React.ReactNode;
  currentView: View;
  setView: (view: View) => void;
  cartCount: number;
  favoritesCount: number;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentView, setView, cartCount, favoritesCount }) => {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 400) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(prev => !prev);
  const toggleMenu = () => setIsMenuOpen(prev => !prev);
  const handleNav = (view: View) => {
    setView(view);
    setIsMenuOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] dark:bg-[#0f172a] transition-colors duration-300">
      <div 
        className={`fixed inset-0 z-[200] lg:hidden transition-opacity duration-300 ${isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      >
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)}></div>
        <aside 
          className={`absolute left-0 top-0 bottom-0 w-[280px] bg-white dark:bg-[#111827] shadow-2xl transition-transform duration-300 ease-out transform ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
          <div className="p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center" onClick={() => handleNav('home')}>
                <div className="bg-brand p-2 rounded-xl mr-3">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <span className="text-xl font-black text-gray-900 dark:text-white tracking-tighter">EcoFeira</span>
              </div>
              <button onClick={() => setIsMenuOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <nav className="flex-grow space-y-2">
              <button onClick={() => handleNav('home')} className={`w-full flex items-center space-x-4 p-4 rounded-2xl font-bold transition-all ${currentView === 'home' ? 'bg-brand/10 text-brand' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                <span>Início</span>
              </button>
              <button onClick={() => handleNav('products')} className={`w-full flex items-center space-x-4 p-4 rounded-2xl font-bold transition-all ${currentView === 'products' ? 'bg-brand/10 text-brand' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                <span>Promoções</span>
              </button>
              <button onClick={() => handleNav('stores')} className={`w-full flex items-center space-x-4 p-4 rounded-2xl font-bold transition-all ${currentView === 'stores' ? 'bg-brand/10 text-brand' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                <span>Supermercados</span>
              </button>
              <button onClick={() => handleNav('favorites')} className={`w-full flex items-center space-x-4 p-4 rounded-2xl font-bold transition-all ${currentView === 'favorites' ? 'bg-red-50 text-red-500' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                <span>Favoritos</span>
              </button>
              <button onClick={() => handleNav('list')} className={`w-full flex items-center justify-between p-4 rounded-2xl font-bold transition-all ${currentView === 'list' ? 'bg-brand/10 text-brand' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                <div className="flex items-center space-x-4">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                  <span>Lista de Compras</span>
                </div>
                {cartCount > 0 && <span className="bg-brand text-white text-[10px] h-5 w-5 rounded-full flex items-center justify-center">{cartCount}</span>}
              </button>
            </nav>

            <div className="pt-6 border-t border-gray-100 dark:border-gray-800">
              <button onClick={toggleDarkMode} className="w-full flex items-center space-x-4 p-4 rounded-2xl font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">
                {isDarkMode ? (
                  <><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 5a7 7 0 100 14 7 7 0 000-14z" /></svg><span>Modo Claro</span></>
                ) : (
                  <><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg><span>Modo Escuro</span></>
                )}
              </button>
            </div>
          </div>
        </aside>
      </div>

      <header className="bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 sticky top-0 z-[100] transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <button 
              onClick={toggleMenu}
              className="p-3 mr-2 lg:hidden text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl transition-all border border-gray-100 dark:border-gray-800"
              aria-label="Menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div className="flex items-center cursor-pointer flex-grow lg:flex-grow-0" onClick={() => setView('home')}>
              <div className="bg-brand p-2.5 rounded-2xl mr-3 shadow-lg shadow-brand/20 transition-transform hover:scale-105 active:scale-95">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <span className="text-2xl font-[900] text-[#111827] dark:text-white tracking-tighter">EcoFeira</span>
            </div>
            
            <nav className="hidden lg:flex items-center space-x-12">
              <button 
                onClick={() => setView('products')}
                className={`text-[15px] font-extrabold transition-all hover:scale-105 ${currentView === 'products' ? 'text-brand' : 'text-gray-500 dark:text-gray-400 hover:text-brand'}`}
              >
                Promoções
              </button>
              <button 
                onClick={() => setView('stores')}
                className={`text-[15px] font-extrabold transition-all hover:scale-105 ${currentView === 'stores' ? 'text-brand' : 'text-gray-500 dark:text-gray-400 hover:text-brand'}`}
              >
                Supermercados
              </button>
            </nav>

            <div className="flex items-center space-x-2 sm:space-x-3">
              <button 
                onClick={() => setView('favorites')}
                className={`relative p-3 rounded-full transition-all border shadow-sm ${currentView === 'favorites' ? 'bg-red-50 text-red-500 border-red-100' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 border-gray-100 dark:border-gray-800'}`}
                data-tooltip="Meus Favoritos"
              >
                <svg className={`w-5 h-5 ${currentView === 'favorites' ? 'fill-current' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {favoritesCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black rounded-full h-5 w-5 flex items-center justify-center border-2 border-white dark:border-[#0f172a] shadow-lg">
                    {favoritesCount}
                  </span>
                )}
              </button>
              
              <button 
                onClick={toggleDarkMode}
                className="hidden sm:flex p-3 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all border border-gray-100 dark:border-gray-800"
                aria-label="Modo Noturno"
                data-tooltip={isDarkMode ? "Ativar Modo Claro" : "Ativar Modo Escuro"}
              >
                {isDarkMode ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 5a7 7 0 100 14 7 7 0 000-14z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>

              <button 
                onClick={() => setView('list')}
                className={`relative p-3 rounded-full transition-all border shadow-sm ${currentView === 'list' ? 'bg-brand/10 text-brand border-brand/20' : 'bg-white dark:bg-[#1e293b] text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-100 dark:border-gray-800'}`}
                data-tooltip="Minha Lista de Compras"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-brand text-white text-[10px] font-black rounded-full h-5 w-5 flex items-center justify-center border-2 border-white dark:border-[#0f172a] shadow-lg">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 relative">
        {children}
      </main>

      <footer className="bg-white dark:bg-[#0f172a] border-t border-gray-100 dark:border-gray-800 py-16 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 flex flex-col items-center">
          <div className="flex items-center mb-8">
            <div className="bg-brand/10 p-2.5 rounded-2xl mr-3">
              <svg className="w-6 h-6 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <span className="text-2xl font-[900] text-[#111827] dark:text-white tracking-tighter">EcoFeira</span>
          </div>
          <p className="text-gray-400 dark:text-gray-500 text-sm font-bold tracking-tight">
            © 2024 EcoFeira. Dados integrados para sua economia.
          </p>
        </div>
      </footer>

      <button 
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className={`fixed bottom-6 right-6 sm:bottom-10 sm:right-10 bg-brand/90 dark:bg-brand/80 backdrop-blur-md text-white p-4 rounded-full shadow-2xl shadow-brand/40 hover:scale-110 active:scale-90 transition-all duration-500 z-[110] group border border-white/20 dark:border-brand/30 ${
          showScrollTop ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'
        }`}
        aria-label="Ir para o topo"
        data-tooltip="Voltar ao Topo"
      >
        <svg className="w-6 h-6 transition-transform group-hover:-translate-y-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.5" d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      </button>
    </div>
  );
};
