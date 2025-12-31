
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Routes, Route, useNavigate, useParams, useLocation, Navigate, Link } from 'react-router-dom';
import { Product, Supermarket, MainBanner, GridBanner, ShoppingListItem } from './types.ts';
import { getProducts, getSupermarkets, getMainBanners, getGridBanners, getPopularSuggestions } from './services/googleSheetsService.ts';
import { Layout } from './components/Layout.tsx';
import { ProductCard } from './components/ProductCard.tsx';
import { BannerCarousel } from './components/BannerCarousel.tsx';
import { CartOptimizer } from './components/CartOptimizer.tsx';

const normalizeString = (str: string) => 
  str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export const slugify = (text: string) => {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
};

const setupDragScroll = (ref: React.RefObject<HTMLDivElement | null>) => {
  const el = ref.current;
  if (!el) return;

  let isDown = false;
  let startX: number;
  let scrollLeft: number;

  const onMouseDown = (e: MouseEvent) => {
    isDown = true;
    el.classList.add('cursor-grabbing');
    el.classList.remove('cursor-grab');
    startX = e.pageX - el.offsetLeft;
    scrollLeft = el.scrollLeft;
  };

  const onMouseLeave = () => {
    isDown = false;
    el.classList.remove('cursor-grabbing');
    el.classList.add('cursor-grab');
  };

  const onMouseUp = () => {
    isDown = false;
    el.classList.remove('cursor-grabbing');
    el.classList.add('cursor-grab');
  };

  const onMouseMove = (e: MouseEvent) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - el.offsetLeft;
    const walk = (x - startX) * 2;
    el.scrollLeft = scrollLeft - walk;
  };

  el.addEventListener('mousedown', onMouseDown);
  el.addEventListener('mouseleave', onMouseLeave);
  el.addEventListener('mouseup', onMouseUp);
  el.addEventListener('mousemove', onMouseMove);

  return () => {
    el.removeEventListener('mousedown', onMouseDown);
    el.removeEventListener('mouseleave', onMouseLeave);
    el.removeEventListener('mouseup', onMouseUp);
    el.removeEventListener('mousemove', onMouseMove);
  };
};

// Componente extraído para evitar remontagem e perda de foco
const ProductDetailView = ({ products, stores, favorites, toggleFavorite, addToList }: { 
  products: Product[], 
  stores: Supermarket[], 
  favorites: string[], 
  toggleFavorite: (id: string) => void,
  addToList: (p: Product) => void
}) => {
  const navigate = useNavigate();
  const { productId } = useParams();
  const product = products.find(p => p.id === productId);
  
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const allImages = useMemo(() => {
    if (!product) return [];
    return [product.imageUrl, ...(product.additionalImages || [])].filter(Boolean);
  }, [product]);

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImageIndex((prev) => (prev + 1) % allImages.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };
  
  const comparisons = useMemo(() => {
    if (!product) return [];
    const baseName = normalizeString(product.name);
    // Filtrar por nome base, remover o produto atual e ordenar pelo menor preço
    // Garantimos que os 4 mais baratos aparecem aqui
    return products
      .filter(p => normalizeString(p.name) === baseName && p.id !== product.id)
      .sort((a, b) => (a.isPromo ? a.promoPrice : a.normalPrice) - (b.isPromo ? b.promoPrice : b.normalPrice))
      .slice(0, 4); 
  }, [product, products]);

  if (!product) return null;

  const currentPrice = product.isPromo ? product.promoPrice : product.normalPrice;
  const store = stores.find(s => s.name === product.supermarket);

  return (
    <div className="space-y-12 sm:space-y-16 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center space-x-2 text-sm font-black text-gray-400 hover:text-brand transition-colors group"
      >
        <svg className="w-5 h-5 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" />
        </svg>
        <span>Voltar</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 sm:gap-20">
        <div className="bg-white dark:bg-[#1e293b] rounded-[3rem] p-6 sm:p-10 flex items-center justify-center border border-gray-100 dark:border-gray-800 shadow-sm relative group overflow-hidden h-[400px] sm:h-[600px]">
          <div className="absolute inset-0 bg-brand/5 scale-0 group-hover:scale-100 transition-transform duration-1000 rounded-full blur-3xl"></div>
          
          <div className="relative z-10 w-full h-full flex items-center justify-center overflow-hidden">
             {allImages.map((img, idx) => (
                <img 
                  key={idx}
                  src={img} 
                  alt={`${product.name} - ${idx + 1}`} 
                  className={`absolute inset-0 w-full h-full object-contain p-4 sm:p-10 transition-all duration-700 ease-in-out ${
                    idx === activeImageIndex ? 'opacity-100 translate-x-0 scale-100' : 
                    idx < activeImageIndex ? 'opacity-0 -translate-x-full scale-90' : 'opacity-0 translate-x-full scale-90'
                  }`}
                />
             ))}
          </div>

          {allImages.length > 1 && (
            <>
              <button 
                onClick={prevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md p-3 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 hover:scale-110 active:scale-95 transition-all text-gray-400 hover:text-brand"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" /></svg>
              </button>
              <button 
                onClick={nextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md p-3 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 hover:scale-110 active:scale-95 transition-all text-gray-400 hover:text-brand"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
              </button>
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex space-x-2">
                {allImages.map((_, i) => (
                  <button 
                    key={i} 
                    onClick={() => setActiveImageIndex(i)}
                    className={`h-2 rounded-full transition-all duration-300 ${i === activeImageIndex ? 'bg-brand w-8' : 'bg-gray-200 dark:bg-gray-700 w-2'}`}
                  />
                ))}
              </div>
            </>
          )}
          
          {product.isPromo && (
            <div className="absolute top-8 left-8 bg-red-500 text-white text-xs font-black px-6 py-2 rounded-2xl shadow-xl shadow-red-500/20 animate-pulse z-20">
              OFERTA IMPERDÍVEL
            </div>
          )}
        </div>

        <div className="flex flex-col justify-center space-y-6 sm:space-y-8">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
               <span className="text-[10px] font-black text-brand bg-brand/10 px-3 py-1.5 rounded-lg uppercase tracking-widest">{product.category}</span>
               {product.brand && (
                 <span className="text-[10px] font-black text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-lg uppercase tracking-widest">Marca: {product.brand}</span>
               )}
            </div>
            <h1 className="text-4xl sm:text-6xl font-[1000] text-[#111827] dark:text-white tracking-tighter leading-none">{product.name}</h1>
          </div>

          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-white rounded-2xl p-2 shadow-sm border border-gray-100 flex items-center justify-center overflow-hidden">
              <img src={store?.logo} className="w-full h-full object-contain" />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Vendido por</p>
              <Link to={`/supermercado/${store?.id}`} className="text-xl font-black text-gray-800 dark:text-gray-200 hover:text-brand transition-colors">{product.supermarket}</Link>
            </div>
          </div>

          <div className="bg-[#f8fafc] dark:bg-[#0f172a] p-10 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 space-y-4">
            <div className="flex items-baseline space-x-2">
              <p className="text-5xl sm:text-7xl font-[1000] text-brand tracking-tighter">R$ {currentPrice.toFixed(2).replace('.', ',')}</p>
              {product.isPromo && <span className="text-xl text-gray-400 line-through font-bold">R$ {product.normalPrice.toFixed(2).replace('.', ',')}</span>}
            </div>
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Preço atualizado em {product.lastUpdate || 'Hoje'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              onClick={() => addToList(product)}
              className="flex-grow bg-brand text-white font-black py-6 rounded-3xl shadow-2xl shadow-brand/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center space-x-3"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
              <span>Adicionar à Lista</span>
            </button>
            <button 
              onClick={() => toggleFavorite(product.id)}
              className={`p-6 rounded-3xl border-2 transition-all flex items-center justify-center ${favorites.includes(product.id) ? 'bg-red-500 border-red-500 text-white shadow-xl shadow-red-500/20' : 'border-gray-100 dark:border-gray-800 text-gray-400 hover:border-red-200'}`}
            >
              <svg className={`w-6 h-6 ${favorites.includes(product.id) ? 'fill-current' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {product.description && (
        <div className="bg-white dark:bg-[#1e293b] p-8 sm:p-16 rounded-[3rem] border border-gray-100 dark:border-gray-800 animate-in fade-in duration-700">
           <h2 className="text-2xl sm:text-3xl font-black text-[#111827] dark:text-white tracking-tighter mb-6">Descrição do Produto</h2>
           <p className="text-gray-500 dark:text-gray-400 text-base sm:text-xl font-medium leading-relaxed whitespace-pre-wrap">
              {product.description}
           </p>
        </div>
      )}

      <div className="space-y-10 pt-10">
        <div className="flex items-center justify-between px-4 sm:px-0">
          <h2 className="text-3xl font-black text-[#111827] dark:text-white tracking-tighter">Compare Preços</h2>
          <span className="text-xs font-black text-gray-400 uppercase tracking-widest">{comparisons.length} opções exibidas</span>
        </div>

        {comparisons.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            {comparisons.map((comp, idx) => {
              const compStore = stores.find(s => s.name === comp.supermarket);
              const compPrice = comp.isPromo ? comp.promoPrice : comp.normalPrice;
              // A lista já está ordenada pelo menor preço, então o primeiro item (idx === 0) é o mais barato entre as opções
              const isOverallCheapest = compPrice <= currentPrice && idx === 0;

              return (
                <div 
                  key={comp.id} 
                  className={`relative bg-white dark:bg-[#1e293b]/60 p-6 sm:p-8 rounded-[2rem] border transition-all group overflow-visible flex items-center justify-between hover:shadow-2xl ${
                    isOverallCheapest 
                      ? 'border-brand/40 shadow-xl shadow-brand/10 dark:border-brand/30 ring-1 ring-brand/10' 
                      : 'border-gray-100 dark:border-gray-800/60'
                  }`}
                >
                  {isOverallCheapest && (
                    <div className="absolute -top-3 left-6 z-20">
                      <span className="bg-brand text-white text-[10px] font-black px-4 py-1.5 rounded-full shadow-lg shadow-brand/30 uppercase tracking-widest border border-white/20 animate-in zoom-in duration-500">
                        Menor Preço
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-6">
                    <div className="w-14 h-14 bg-white dark:bg-[#0f172a] rounded-2xl flex-shrink-0 flex items-center justify-center p-2.5 shadow-sm border border-gray-100 dark:border-gray-800">
                      <img src={compStore?.logo} className="w-full h-full object-contain" />
                    </div>
                    <div>
                      <p className="font-black text-lg sm:text-xl text-gray-800 dark:text-gray-100 leading-tight">{comp.supermarket}</p>
                      <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1">{compStore?.neighborhood}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-3xl font-black tracking-tighter ${isOverallCheapest ? 'text-brand' : 'text-gray-900 dark:text-white'}`}>
                      R$ {compPrice.toFixed(2).replace('.', ',')}
                    </p>
                    <button 
                      onClick={() => {
                        const storeSlug = slugify(comp.supermarket);
                        const categorySlug = slugify(comp.category);
                        const nameSlug = slugify(comp.name);
                        navigate(`/${storeSlug}/${categorySlug}/${comp.id}/${nameSlug}`);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="text-[11px] font-black text-brand uppercase tracking-widest hover:underline mt-1 transition-all"
                    >
                      VER DETALHES
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-16 text-center bg-gray-50/50 dark:bg-[#1e293b]/50 rounded-[3rem] border-2 border-dashed border-gray-100 dark:border-gray-800">
            <p className="text-xl font-bold text-gray-400">Não encontramos este item em outras lojas no momento.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Componente extraído para evitar remontagem e perda de foco no input de busca
const StoreDetailView = ({ 
  products, 
  stores, 
  searchQuery, 
  setSearchQuery, 
  selectedCategory, 
  setSelectedCategory, 
  sortBy, 
  setSortBy, 
  favorites, 
  toggleFavorite, 
  addToList,
  showSearchSuggestions,
  setShowSearchSuggestions,
  searchSuggestionRef,
  storeCategoriesRef,
  categories
}: {
  products: Product[],
  stores: Supermarket[],
  searchQuery: string,
  setSearchQuery: (q: string) => void,
  selectedCategory: string,
  setSelectedCategory: (c: string) => void,
  sortBy: 'none' | 'price-asc' | 'price-desc',
  setSortBy: (s: 'none' | 'price-asc' | 'price-desc') => void,
  favorites: string[],
  toggleFavorite: (id: string) => void,
  addToList: (p: Product) => void,
  showSearchSuggestions: boolean,
  setShowSearchSuggestions: (b: boolean) => void,
  searchSuggestionRef: React.RefObject<HTMLDivElement | null>,
  storeCategoriesRef: React.RefObject<HTMLDivElement | null>,
  categories: string[]
}) => {
  const navigate = useNavigate();
  const { storeId } = useParams();
  const currentStore = stores.find(s => s.id === storeId);
  
  const storeDetailProducts = useMemo(() => {
    if (!currentStore) return [];
    let result = products.filter(p => p.supermarket === currentStore.name);
    if (searchQuery) {
      const q = normalizeString(searchQuery);
      result = result.filter(p => normalizeString(p.name).includes(q));
    }
    if (selectedCategory !== 'Todas') result = result.filter(p => p.category === selectedCategory);
    if (sortBy === 'price-asc') result.sort((a, b) => (a.isPromo ? a.promoPrice : a.normalPrice) - (b.isPromo ? b.promoPrice : b.normalPrice));
    else if (sortBy === 'price-desc') {
      result.sort((a, b) => {
        const discA = a.isPromo ? (a.normalPrice - a.promoPrice) / a.normalPrice : 0;
        const discB = b.isPromo ? (b.normalPrice - b.promoPrice) / b.normalPrice : 0;
        return discB - discA;
      });
    }
    return result;
  }, [products, currentStore, searchQuery, selectedCategory, sortBy]);

  const storeSearchSuggestions = useMemo(() => {
    if (!currentStore || !searchQuery || searchQuery.length < 2) return [];
    const q = normalizeString(searchQuery);
    const storeProducts = products.filter(p => p.supermarket === currentStore.name);
    
    const names = storeProducts
      .filter(p => normalizeString(p.name).includes(q))
      .map(p => ({ label: p.name, type: 'produto' }));
      
    return names.slice(0, 8);
  }, [products, searchQuery, currentStore]);

  if (!currentStore) return null;

  return (
    <div className="space-y-12 sm:space-y-16 animate-in fade-in slide-in-from-bottom-6 duration-700">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 sm:gap-12 bg-white dark:bg-[#1e293b] rounded-2xl sm:rounded-[3.5rem] p-6 sm:p-16 border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
          
          <button 
            onClick={() => navigate('/supermercados')}
            className="absolute top-6 left-6 flex items-center space-x-2 text-xs sm:text-sm font-[900] text-gray-400 hover:text-brand transition-colors group"
          >
            <svg className="w-4 h-4 sm:w-5 h-5 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" />
            </svg>
            <span>Voltar aos Parceiros</span>
          </button>

          <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-12 mt-8 lg:mt-0 w-full lg:w-auto">
            <div className="w-24 h-24 sm:w-44 sm:h-44 bg-[#f8fafc] dark:bg-[#0f172a] rounded-xl sm:rounded-[2.8rem] flex items-center justify-center p-4 sm:p-10 border border-gray-100 dark:border-gray-800 shadow-inner">
              <img src={currentStore.logo} alt={currentStore.name} className="w-full h-full object-contain" />
            </div>
            <div className="text-center sm:text-left space-y-4">
              <div className="space-y-1 sm:space-y-2">
                <h1 className="text-3xl sm:text-6xl font-[1000] text-[#111827] dark:text-white tracking-tighter leading-none">{currentStore.name}</h1>
                <div className={`inline-flex items-center px-4 py-1.5 rounded-full border text-[10px] sm:text-xs font-black uppercase tracking-widest space-x-2 ${
                  currentStore.status?.toLowerCase() === 'aberto' 
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' 
                    : 'bg-red-500/10 border-red-500/20 text-red-500'
                }`}>
                  <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${
                    currentStore.status?.toLowerCase() === 'aberto' 
                      ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)] animate-pulse' 
                      : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]'
                  }`}></span>
                  <span>{currentStore.status || 'Fechado'}</span>
                </div>
              </div>
              <div className="flex flex-col items-center sm:items-start space-y-1">
                <p className="text-gray-500 dark:text-gray-400 font-bold text-xs sm:text-lg flex items-center">
                  <svg className="w-4 h-4 sm:w-5 h-5 mr-2 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {currentStore.street}, N°{currentStore.number}
                </p>
                <p className="text-gray-400 dark:text-gray-500 font-bold text-[10px] sm:text-sm pl-0 sm:pl-7">Bairro: {currentStore.neighborhood}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 w-full lg:w-auto">
            {currentStore.flyerUrl && (
              <a 
                href={currentStore.flyerUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full lg:w-auto flex items-center justify-center space-x-3 bg-brand text-white font-[900] py-4 sm:py-6 px-10 rounded-xl sm:rounded-[2rem] shadow-xl shadow-brand/30 hover:scale-105 active:scale-95 transition-all text-sm uppercase tracking-wider"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Ver Encarte Digital</span>
              </a>
            )}
          </div>
        </div>

        <div className="space-y-8 sm:space-y-12">
          <div className="flex flex-col space-y-8">
            <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
              <div className="relative flex-grow w-full" ref={searchSuggestionRef}>
                <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800/40 rounded-xl sm:rounded-[2.5rem] -m-1"></div>
                <div className="relative flex items-center bg-white dark:bg-[#1e293b] rounded-xl sm:rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-sm transition-all focus-within:ring-4 focus-within:ring-brand/10">
                  <div className="pl-4 sm:pl-8 pr-2 sm:pr-4 text-gray-400">
                    <svg className="w-5 h-5 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input 
                    type="text"
                    placeholder={`Buscar ofertas no ${currentStore.name}...`}
                    value={searchQuery}
                    onChange={(e) => {setSearchQuery(e.target.value); setShowSearchSuggestions(true);}}
                    onFocus={() => setShowSearchSuggestions(true)}
                    className="w-full bg-transparent border-none focus:ring-0 py-4 sm:py-6 text-base sm:text-xl font-bold dark:text-white outline-none"
                  />
                  {searchQuery && (
                    <div className="p-2 pr-3 sm:pr-6">
                      <button 
                        onClick={() => {setSearchQuery(''); setShowSearchSuggestions(false);}}
                        className="bg-red-500 text-white p-2 rounded-lg sm:rounded-xl shadow-lg shadow-red-500/30 hover:scale-105 active:scale-95 transition-all"
                      >
                        <svg className="w-4 h-4 sm:w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
                {showSearchSuggestions && storeSearchSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-4 bg-white/95 dark:bg-[#1e293b]/95 backdrop-blur-md rounded-2xl sm:rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden z-[200]">
                    <div className="p-3 sm:p-5 bg-gray-50/50 dark:bg-[#0f172a]/30 border-b border-gray-100 dark:border-gray-800"><span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ofertas no {currentStore.name}</span></div>
                    {storeSearchSuggestions.map((s, idx) => (
                      <button key={idx} onClick={() => {setSearchQuery(s.label); setShowSearchSuggestions(false);}} className="w-full flex items-center justify-between p-4 sm:p-6 hover:bg-brand/5 transition-colors border-b border-gray-50 dark:border-gray-800/50 last:border-none group text-left">
                        <div className="flex items-center space-x-3 sm:space-x-4">
                          <div className={`p-2 rounded-lg sm:p-2.5 sm:rounded-xl bg-brand/10 text-brand`}><svg className="w-4 h-4 sm:w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg></div>
                          <span className="text-base sm:text-lg font-bold text-gray-700 dark:text-gray-200 group-hover:text-brand">{s.label}</span>
                        </div>
                        <span className="text-[10px] font-black text-gray-400 uppercase">{s.type}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex-shrink-0 flex items-center bg-white dark:bg-[#1e293b] p-2.5 rounded-xl sm:rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm">
                <div className="flex items-center px-4 sm:px-6 space-x-3 text-gray-400">
                  <svg className="w-4 h-4 sm:w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                  <select 
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-transparent border-none focus:ring-0 text-[10px] sm:text-sm font-[900] text-[#111827] dark:text-white cursor-pointer py-2 px-0"
                  >
                    <option value="none">Relevantes</option>
                    <option value="price-asc">Menor Preço</option>
                    <option value="price-desc">Desconto %</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="overflow-hidden">
              <span className="text-[10px] font-[900] text-gray-400 dark:text-gray-500 uppercase tracking-[1px] mb-4 block">CATEGORIAS DISPONÍVEIS:</span>
              <div 
                ref={storeCategoriesRef}
                className="flex items-center gap-2 sm:gap-4 overflow-x-auto no-scrollbar pb-2 cursor-grab select-none active:cursor-grabbing"
              >
                {categories.map(cat => {
                  const hasItems = cat === 'Todas' || products.some(p => p.supermarket === currentStore.name && p.category === cat);
                  if (!hasItems) return null;
                  
                  return (
                    <button 
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`flex-shrink-0 px-8 sm:px-12 py-3 sm:py-5 rounded-xl sm:rounded-[1.8rem] text-xs sm:text-[15px] font-[800] transition-all shadow-sm ${selectedCategory === cat ? 'bg-brand text-white shadow-xl shadow-brand/30 scale-105' : 'bg-white dark:bg-[#1e293b] text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-gray-800 hover:border-brand'}`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {storeDetailProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-12">
              {storeDetailProducts.map((p) => (
                <ProductCard 
                  key={p.id}
                  product={p} 
                  onAddToList={addToList} 
                  onToggleFavorite={toggleFavorite}
                  isFavorite={favorites.includes(p.id)}
                  storeLogo={currentStore.logo} 
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-24 sm:py-40 bg-white dark:bg-[#1e293b] rounded-2xl sm:rounded-[4rem] border-2 border-dashed border-gray-100 dark:border-gray-800 flex flex-col items-center px-4">
              <div className="w-20 h-20 sm:w-32 sm:h-32 bg-gray-50 dark:bg-[#0f172a] rounded-2xl sm:rounded-[2.5rem] flex items-center justify-center mb-6 sm:mb-10 shadow-inner">
                <svg className="w-10 h-10 sm:w-16 sm:h-16 text-gray-300 dark:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <p className="text-gray-400 dark:text-gray-500 font-[800] text-xl sm:text-3xl tracking-tight mb-4">Nenhuma oferta encontrada</p>
              <p className="text-gray-400 dark:text-gray-600 font-bold max-w-md mx-auto">Tente ajustar seus filtros ou pesquisar por outro termo.</p>
            </div>
          )}
        </div>
      </div>
  );
};

const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [products, setProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<Supermarket[]>([]);
  const [mainBanners, setMainBanners] = useState<MainBanner[]>([]);
  const [gridBanners, setGridBanners] = useState<GridBanner[]>([]);
  const [shoppingList, setShoppingList] = useState<ShoppingListItem[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [popularSuggestions, setPopularSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Histórico de pesquisas recentes
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    const saved = localStorage.getItem('ecofeira_recent_searches');
    return saved ? JSON.parse(saved) : [];
  });
  
  const categoriesRef = useRef<HTMLDivElement>(null);
  const storesRef = useRef<HTMLDivElement>(null);
  const storeCategoriesRef = useRef<HTMLDivElement>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const searchSuggestionRef = useRef<HTMLDivElement>(null);
  
  const [storeSearchQuery, setStoreSearchQuery] = useState('');
  const [showStoreSuggestions, setShowStoreSuggestions] = useState(false);
  const suggestionRef = useRef<HTMLDivElement>(null);

  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [selectedSupermarket, setSelectedSupermarket] = useState<string>('Todos');
  const [sortBy, setSortBy] = useState<'none' | 'price-asc' | 'price-desc'>('none');
  const [onlyPromos, setOnlyPromos] = useState(false);

  // Modal States
  const [isClearFavoritesModalOpen, setIsClearFavoritesModalOpen] = useState(false);
  const [isClearListModalOpen, setIsClearListModalOpen] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [p, s, mb, gb, suggs] = await Promise.all([
          getProducts(),
          getSupermarkets(),
          getMainBanners(),
          getGridBanners(),
          getPopularSuggestions()
        ]);
        setProducts(p || []);
        setStores(s || []);
        setMainBanners(mb || []);
        setGridBanners(gb || []);
        setPopularSuggestions(suggs || []);
        
        const savedFavorites = localStorage.getItem('ecofeira_favorites');
        if (savedFavorites) {
          setFavorites(JSON.parse(savedFavorites));
        }

        const savedList = localStorage.getItem('ecofeira_shopping_list');
        if (savedList) {
          setShoppingList(JSON.parse(savedList));
        }
      } catch (e) {
        console.error("Erro ao carregar dados:", e);
      }
      setLoading(false);
    };
    loadData();
  }, []);

  useEffect(() => {
    if (!loading) {
      localStorage.setItem('ecofeira_favorites', JSON.stringify(favorites));
    }
  }, [favorites, loading]);

  useEffect(() => {
    if (!loading) {
      localStorage.setItem('ecofeira_shopping_list', JSON.stringify(shoppingList));
    }
  }, [shoppingList, loading]);
  
  useEffect(() => {
    localStorage.setItem('ecofeira_recent_searches', JSON.stringify(recentSearches));
  }, [recentSearches]);

  useEffect(() => {
    if (!loading && (location.pathname === '/produtos' || location.pathname.startsWith('/supermercado/'))) {
      const cleanCats = setupDragScroll(categoriesRef);
      const cleanStores = setupDragScroll(storesRef);
      const cleanStoreCats = setupDragScroll(storeCategoriesRef);
      return () => {
        cleanCats?.();
        cleanStores?.();
        cleanStoreCats?.();
      };
    }
  }, [loading, location.pathname]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
        setShowStoreSuggestions(false);
      }
      if (searchSuggestionRef.current && !searchSuggestionRef.current.contains(event.target as Node)) {
        setShowSearchSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const saveSearch = (term: string) => {
    if (!term.trim()) return;
    setRecentSearches(prev => {
      const filtered = prev.filter(s => s.toLowerCase() !== term.toLowerCase());
      return [term, ...filtered].slice(0, 8);
    });
  };

  const removeRecentSearch = (term: string) => {
    setRecentSearches(prev => prev.filter(s => s !== term));
  };

  const handleSearchSubmit = (term: string) => {
    setSearchQuery(term);
    setShowSearchSuggestions(false);
    saveSearch(term);
    navigate('/produtos');
  };

  const addToList = (product: Product) => {
    setShoppingList(prev => {
      const existing = prev.find(item => item.productName === product.name);
      if (existing) {
        return prev.map(item => 
          item.productName === product.name 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { 
        id: Date.now().toString(), 
        productName: product.name, 
        quantity: 1, 
        checked: false,
        originalPrice: product.isPromo ? product.promoPrice : product.normalPrice,
        originalStore: product.supermarket
      }];
    });
  };

  const removeFromList = (id: string) => {
    setShoppingList(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setShoppingList(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const toggleFavorite = (productId: string) => {
    setFavorites(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId) 
        : [...prev, productId]
    );
  };

  const clearAllFavorites = () => {
    setFavorites([]);
    localStorage.setItem('ecofeira_favorites', JSON.stringify([]));
    setIsClearFavoritesModalOpen(false);
  };

  const clearShoppingList = () => {
    setShoppingList([]);
    localStorage.setItem('ecofeira_shopping_list', JSON.stringify([]));
    setIsClearListModalOpen(false);
  };

  const filteredProducts = useMemo(() => {
    let result = [...products];
    if (searchQuery) {
      const q = normalizeString(searchQuery);
      result = result.filter(p => 
        normalizeString(p.name).includes(q) || 
        normalizeString(p.category).includes(q) ||
        normalizeString(p.supermarket).includes(q)
      );
    }
    if (selectedCategory !== 'Todas') result = result.filter(p => p.category === selectedCategory);
    if (selectedSupermarket !== 'Todos') result = result.filter(p => p.supermarket === selectedSupermarket);
    if (onlyPromos) result = result.filter(p => p.isPromo);
    if (sortBy === 'price-asc') result.sort((a, b) => (a.isPromo ? a.promoPrice : a.normalPrice) - (b.isPromo ? b.promoPrice : b.normalPrice));
    else if (sortBy === 'price-desc') {
      result.sort((a, b) => {
        const discA = a.isPromo ? (a.normalPrice - a.promoPrice) / a.normalPrice : 0;
        const discB = b.isPromo ? (b.normalPrice - b.promoPrice) / b.normalPrice : 0;
        return discB - discA;
      });
    }
    return result;
  }, [products, searchQuery, selectedCategory, selectedSupermarket, sortBy, onlyPromos]);

  const searchSuggestions = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return [];
    const q = normalizeString(searchQuery);
    const names = products.filter(p => normalizeString(p.name).includes(q)).map(p => ({ label: p.name, type: 'produto' }));
    const cats = Array.from(new Set<string>(products.map(p => p.category))).filter(c => normalizeString(c).includes(q)).map(c => ({ label: c, type: 'categoria' }));
    return [...cats, ...names].slice(0, 8);
  }, [products, searchQuery]);

  const favoritedProducts = useMemo(() => products.filter(p => favorites.includes(p.id)), [products, favorites]);

  const filteredStores = useMemo(() => {
    if (!storeSearchQuery) return stores;
    const q = normalizeString(storeSearchQuery);
    return stores.filter(s => normalizeString(s.name).includes(q) || normalizeString(s.neighborhood).includes(q) || normalizeString(s.street).includes(q));
  }, [stores, storeSearchQuery]);

  const storeSuggestions = useMemo(() => {
    if (storeSearchQuery.length < 1) return [];
    const q = normalizeString(storeSearchQuery);
    return stores.filter(s => normalizeString(s.name).includes(q) || normalizeString(s.neighborhood).includes(q)).slice(0, 5);
  }, [stores, storeSearchQuery]);

  const categories = useMemo(() => ['Todas', ...Array.from(new Set<string>(products.map(p => p.category)))], [products]);
  const supermarketNames = useMemo(() => ['Todos', ...Array.from(new Set<string>(products.map(p => p.supermarket)))], [products]);

  const openStoreDetail = (store: Supermarket) => {
    setSelectedCategory('Todas');
    setSearchQuery('');
    setSortBy('none');
    navigate(`/supermercado/${store.id}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-[#0f172a]">
        <div className="w-16 h-16 border-[6px] border-brand/10 border-t-brand rounded-full animate-spin mb-8"></div>
        <p className="text-gray-500 dark:text-gray-400 font-[800] text-xl animate-pulse tracking-tight">EcoFeira: Otimizando sua economia...</p>
      </div>
    );
  }

  return (
    <Layout 
      cartCount={shoppingList.length}
      favoritesCount={favorites.length}
    >
      <Routes>
        <Route path="/" element={
          <div className="space-y-12 sm:space-y-24">
            <div className="text-center max-w-4xl mx-auto space-y-6 sm:space-y-8 pt-4 sm:pt-6 pb-2 sm:pb-4 relative overflow-hidden">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[18vw] sm:text-[12vw] font-[900] text-brand/10 dark:text-brand/5 pointer-events-none select-none tracking-tighter leading-none z-0">
                economize
              </div>
              <div className="relative z-10 px-4">
                <h1 className="text-4xl sm:text-8xl font-[900] text-[#111827] dark:text-white tracking-tighter leading-[1.1] sm:leading-[1] animate-in fade-in slide-in-from-top-4 duration-700">
                  Compare e <span className="text-brand">economize</span>
                </h1>
                <p className="text-gray-500 dark:text-gray-400 text-base sm:text-xl font-medium max-w-3xl mx-auto leading-relaxed mt-4 sm:mt-8">
                  Os melhores preços de <span className="text-gray-900 dark:text-white font-black">{products.length} produtos</span> em {stores.length} supermercados locais, incluindo {products.filter(p => p.isPromo).length} promoções imperdíveis.
                </p>
              </div>
              <div className="relative pt-8 sm:pt-12 z-10 marquee-mask overflow-hidden py-6 sm:py-10 select-none pointer-events-none cursor-default">
                <div className="flex animate-marquee whitespace-nowrap gap-4 sm:gap-6 w-max">
                  {stores.length > 0 ? [...stores, ...stores].map((store, idx) => (
                    <div 
                      key={`${store.id}-${idx}`} 
                      onClick={() => openStoreDetail(store)}
                      className="flex items-center space-x-3 sm:space-x-4 bg-white/80 dark:bg-[#1e293b]/60 backdrop-blur-sm border border-gray-100 dark:border-gray-800 px-5 sm:px-8 py-3 sm:py-5 rounded-xl sm:rounded-2xl shadow-sm min-w-[200px] sm:min-w-[280px] cursor-pointer hover:bg-white transition-colors"
                    >
                      <div className="w-8 h-8 sm:w-12 h-12 rounded-lg sm:rounded-xl bg-white flex items-center justify-center p-1.5 sm:p-2 shadow-sm border border-gray-100 dark:border-gray-800">
                        <img src={store.logo} alt={store.name} className="w-full h-full object-contain" />
                      </div>
                      <span className="text-[14px] sm:text-[18px] font-[900] text-gray-700 dark:text-gray-200 tracking-tight">{store.name}</span>
                    </div>
                  )) : null}
                </div>
              </div>
            </div>
            <div className="max-w-4xl mx-auto space-y-8 sm:space-y-10 px-4 -mt-8 sm:-mt-16 mb-8 sm:mb-16">
              <div className="relative group" ref={searchSuggestionRef}>
                <div className="absolute inset-0 bg-brand/10 blur-3xl rounded-full scale-90 group-focus-within:scale-100 transition-transform duration-700"></div>
                <div className="relative flex bg-white dark:bg-[#1e293b] rounded-2xl sm:rounded-[2.5rem] p-2 sm:p-3 shadow-2xl shadow-gray-200/40 dark:shadow-none border border-gray-100 dark:border-gray-800 transition-all focus-within:ring-2 focus-within:ring-brand/20">
                  <div className="flex items-center flex-grow px-3 sm:px-8">
                    <svg className="w-5 h-5 sm:w-7 sm:h-7 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input 
                      type="text"
                      placeholder="O que você precisa hoje?"
                      value={searchQuery}
                      onChange={(e) => {setSearchQuery(e.target.value); setShowSearchSuggestions(true);}}
                      onFocus={() => setShowSearchSuggestions(true)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit(searchQuery)}
                      className="w-full bg-transparent border-none focus:ring-0 py-3 sm:py-6 px-2 sm:px-5 text-base sm:text-xl font-bold dark:text-white placeholder-gray-400"
                    />
                  </div>
                  {searchQuery ? (
                    <button onClick={() => {setSearchQuery(''); setShowSearchSuggestions(false);}} className="bg-red-500 hover:bg-red-600 text-white p-3 sm:p-6 rounded-xl sm:rounded-[2rem] transition-all shadow-xl shadow-red-500/30 hover:scale-105 active:scale-95">
                      <svg className="w-5 h-5 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  ) : (
                    <button onClick={() => handleSearchSubmit(searchQuery)} className="bg-brand hover:bg-brand-dark text-white font-[900] px-6 sm:px-16 rounded-xl sm:rounded-[2rem] transition-all shadow-xl shadow-brand/30 hover:scale-105 active:scale-95 text-sm sm:text-base">Buscar</button>
                  )}
                </div>
                
                {showSearchSuggestions && (
                  <div className="absolute top-full left-0 right-0 mt-4 bg-white/95 dark:bg-[#1e293b]/95 backdrop-blur-md rounded-2xl sm:rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden z-[200]">
                    {searchQuery.length === 0 && recentSearches.length > 0 && (
                      <div className="animate-in fade-in duration-300">
                        <div className="p-3 sm:p-5 bg-gray-50/50 dark:bg-[#0f172a]/30 border-b border-gray-100 dark:border-gray-800">
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pesquisas Recentes</span>
                        </div>
                        {recentSearches.map((s, idx) => (
                          <div key={idx} className="w-full flex items-center justify-between p-4 sm:p-6 hover:bg-brand/5 transition-colors border-b border-gray-50 dark:border-gray-800/50 last:border-none group">
                            <button onClick={() => handleSearchSubmit(s)} className="flex items-center space-x-3 sm:space-x-4 flex-grow text-left">
                              <div className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-400 group-hover:bg-brand group-hover:text-white transition-all">
                                <svg className="w-4 h-4 sm:w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <span className="text-base sm:text-lg font-bold text-gray-700 dark:text-gray-200 group-hover:text-brand">{s}</span>
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); removeRecentSearch(s); }}
                              className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                              title="Remover do histórico"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {searchSuggestions.length > 0 && (
                      <div className="animate-in fade-in duration-300">
                        <div className="p-3 sm:p-5 bg-gray-50/50 dark:bg-[#0f172a]/30 border-b border-gray-100 dark:border-gray-800">
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sugestões EcoFeira</span>
                        </div>
                        {searchSuggestions.map((s, idx) => (
                          <button key={idx} onClick={() => handleSearchSubmit(s.label)} className="w-full flex items-center justify-between p-4 sm:p-6 hover:bg-brand/5 transition-colors border-b border-gray-50 dark:border-gray-800/50 last:border-none group text-left">
                            <div className="flex items-center space-x-3 sm:space-x-4">
                              <div className={`p-2 rounded-lg sm:p-2.5 sm:rounded-xl ${s.type === 'categoria' ? 'bg-orange-50 text-orange-500' : 'bg-brand/10 text-brand'}`}>
                                {s.type === 'categoria' ? (
                                  <svg className="w-4 h-4 sm:w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                                ) : (
                                  <svg className="w-4 h-4 sm:w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                                )}
                              </div>
                              <span className="text-base sm:text-lg font-bold text-gray-700 dark:text-gray-200 group-hover:text-brand">{s.label}</span>
                            </div>
                            <span className="text-[10px] font-black text-gray-400 uppercase">{s.type}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4">
                <span className="text-[10px] font-[900] text-gray-400 uppercase tracking-widest block w-full text-center sm:w-auto sm:mr-4">Sugestões Populares</span>
                {popularSuggestions.map(tag => (
                  <button key={tag} onClick={() => {setSearchQuery(tag); setOnlyPromos(false); handleSearchSubmit(tag);}} className="bg-white dark:bg-[#1e293b] border border-gray-100 dark:border-gray-800 px-4 sm:px-7 py-2 sm:py-3 rounded-lg sm:rounded-2xl text-xs sm:text-[15px] font-[800] text-gray-700 dark:text-gray-300 hover:border-brand hover:text-brand transition-all hover:shadow-md">{tag}</button>
                ))}
                {!popularSuggestions.includes('Promoções') && (
                  <button onClick={() => {setSearchQuery(''); setOnlyPromos(true); navigate('/produtos');}} className="bg-brand/5 dark:bg-brand/10 border border-brand/20 px-4 sm:px-7 py-2 sm:py-3 rounded-lg sm:rounded-2xl text-xs sm:text-[15px] font-[900] text-brand hover:bg-brand hover:text-white transition-all">🔥 Promoções</button>
                )}
              </div>
            </div>
            {mainBanners.length > 0 && <BannerCarousel banners={mainBanners} />}
          </div>
        } />
        
        <Route path="/produtos" element={
          <div className="space-y-8 sm:space-y-16">
            <div className="flex flex-col space-y-6 sm:space-y-10">
              <div className="flex flex-row items-center gap-3 sm:gap-6">
                <div className="relative flex-grow group" ref={searchSuggestionRef}>
                  <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800/40 rounded-xl sm:rounded-[2.5rem] -m-1"></div>
                  <div className="relative flex items-center bg-white dark:bg-[#1e293b] rounded-xl sm:rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-sm transition-all focus-within:ring-4 focus-within:ring-brand/10">
                    <div className="pl-4 sm:pl-8 pr-2 sm:pr-4">
                      <svg className="w-5 h-5 sm:w-7 sm:h-7 text-gray-400 group-focus-within:text-brand transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                    <input 
                      type="text" 
                      placeholder="Pesquisar itens..." 
                      value={searchQuery} 
                      onChange={(e) => {setSearchQuery(e.target.value); setShowSearchSuggestions(true);}} 
                      onFocus={() => setShowSearchSuggestions(true)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit(searchQuery)}
                      className="w-full bg-transparent border-none focus:ring-0 py-4 sm:py-6 text-base sm:text-xl font-[800] dark:text-white outline-none" 
                    />
                    <div className="p-2 pr-3 sm:pr-4">{searchQuery && <button onClick={() => {setSearchQuery(''); setShowSearchSuggestions(false);}} className="bg-red-500 text-white p-2.5 sm:p-4 rounded-lg sm:rounded-3xl shadow-lg shadow-red-500/20 hover:scale-105 transition-all"><svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg></button>}</div>
                  </div>
                  
                  {showSearchSuggestions && (
                    <div className="absolute top-full left-0 right-0 mt-4 bg-white/95 dark:bg-[#1e293b]/95 backdrop-blur-md rounded-2xl sm:rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden z-[200]">
                      {searchQuery.length === 0 && recentSearches.length > 0 && (
                        <div className="animate-in fade-in duration-300">
                          <div className="p-3 sm:p-5 bg-gray-50/50 dark:bg-[#0f172a]/30 border-b border-gray-100 dark:border-gray-800">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pesquisas Recentes</span>
                          </div>
                          {recentSearches.map((s, idx) => (
                            <div key={idx} className="w-full flex items-center justify-between p-4 sm:p-6 hover:bg-brand/5 transition-colors border-b border-gray-50 dark:border-gray-800/50 last:border-none group">
                              <button onClick={() => handleSearchSubmit(s)} className="flex items-center space-x-3 sm:space-x-4 flex-grow text-left">
                                <div className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-400 group-hover:bg-brand group-hover:text-white transition-all">
                                  <svg className="w-4 h-4 sm:w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </div>
                                <span className="text-base sm:text-lg font-bold text-gray-700 dark:text-gray-200 group-hover:text-brand">{s}</span>
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); removeRecentSearch(s); }}
                                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                title="Remover do histórico"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {searchSuggestions.length > 0 && (
                        <div className="animate-in fade-in duration-300">
                          <div className="p-3 sm:p-5 bg-gray-50/50 dark:bg-[#0f172a]/30 border-b border-gray-100 dark:border-gray-800">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Encontrado no EcoFeira</span>
                          </div>
                          {searchSuggestions.map((s, idx) => (
                            <button key={idx} onClick={() => handleSearchSubmit(s.label)} className="w-full flex items-center justify-between p-4 sm:p-6 hover:bg-brand/5 transition-colors border-b border-gray-50 dark:border-gray-800/50 last:border-none group text-left">
                              <div className="flex items-center space-x-3 sm:space-x-4">
                                <div className={`p-2 sm:p-2.5 rounded-lg sm:rounded-xl ${s.type === 'categoria' ? 'bg-orange-50 text-orange-500' : 'bg-brand/10 text-brand'}`}>{s.type === 'categoria' ? <svg className="w-4 h-4 sm:w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg> : <svg className="w-4 h-4 sm:w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>}</div>
                                <span className="text-base sm:text-lg font-bold text-gray-700 dark:text-gray-200 group-hover:text-brand">{s.label}</span>
                              </div>
                              <span className="text-[10px] font-black text-gray-400 uppercase">{s.type}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex-shrink-0 flex items-center bg-white dark:bg-[#1e293b] p-1.5 sm:p-2.5 rounded-xl sm:rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm transition-all hover:scale-102">
                  <div className="flex items-center px-2 sm:px-6 space-x-2 sm:space-x-4 text-gray-400"><svg className="w-4 h-4 sm:w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" /></svg><select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="bg-transparent border-none focus:ring-0 text-[10px] sm:text-sm font-[900] text-[#111827] dark:text-white cursor-pointer py-2 px-0 max-w-[80px] sm:max-w-none"><option value="none">Relevantes</option><option value="price-asc">Menor Preço</option><option value="price-desc">Desconto %</option></select></div>
                </div>
              </div>
              
              <div className="space-y-6 sm:space-y-10">
                <div className="overflow-hidden">
                  <span className="text-[10px] font-[900] text-gray-400 uppercase tracking-[1px] mb-3 block">CATEGORIAS:</span>
                  <div ref={categoriesRef} className="flex items-center gap-2 sm:gap-4 overflow-x-auto no-scrollbar pb-2 cursor-grab select-none active:cursor-grabbing">
                    {categories.map(cat => <button key={cat} onClick={() => setSelectedCategory(cat)} className={`flex-shrink-0 px-6 sm:px-10 py-3 sm:py-4 rounded-xl sm:rounded-[1.5rem] text-xs sm:text-[15px] font-[800] transition-all shadow-sm ${selectedCategory === cat ? 'bg-brand text-white shadow-xl shadow-brand/30 scale-105' : 'bg-white dark:bg-[#1e293b] text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-gray-800 hover:border-brand'}`}>{cat}</button>)}
                  </div>
                </div>
                <div className="overflow-hidden">
                  <span className="text-[10px] font-[900] text-gray-400 uppercase tracking-[1px] mb-3 block">LOJAS:</span>
                  <div ref={storesRef} className="flex items-center gap-2 sm:gap-4 overflow-x-auto no-scrollbar pb-2 cursor-grab select-none active:cursor-grabbing">
                    {supermarketNames.map(store => {
                      const storeData = stores.find(s => s.name === store);
                      return (
                        <button key={store} onClick={() => setSelectedSupermarket(store)} className={`flex-shrink-0 px-6 sm:px-10 py-3 sm:py-4 rounded-xl sm:rounded-[1.5rem] text-xs sm:text-[15px] font-[800] transition-all shadow-sm flex items-center space-x-2 sm:space-x-3 ${selectedSupermarket === store ? 'bg-brand text-white shadow-xl shadow-brand/30 scale-105' : 'bg-white dark:bg-[#1e293b] text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-gray-800 hover:border-brand'}`}>
                          {store !== 'Todos' && storeData?.logo && <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-md overflow-hidden bg-white flex items-center justify-center p-0.5 ${selectedSupermarket === store ? 'opacity-100' : 'opacity-80'}`}><img src={storeData.logo} alt={store} className="w-full h-full object-contain" /></div>}
                          <span>{store}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-12">
              {filteredProducts.map((p, idx) => {
                const storeLogo = stores.find(s => s.name === p.supermarket)?.logo;
                return (
                  <React.Fragment key={p.id}>
                    <ProductCard product={p} onAddToList={addToList} onToggleFavorite={toggleFavorite} isFavorite={favorites.includes(p.id)} storeLogo={storeLogo} />
                    {(idx + 1) % 7 === 0 && gridBanners.length > 0 && (
                      <div className="hidden sm:flex col-span-2 rounded-[3rem] overflow-hidden bg-[#111827] relative flex-col justify-center items-start p-16 group shadow-2xl min-h-[480px]">
                        {(() => {
                          const ad = gridBanners[idx % gridBanners.length];
                          return (
                            <>
                              <div className="absolute inset-0"><img src={ad.imageUrl} className="w-full h-full object-cover opacity-20 group-hover:scale-110 transition-transform duration-[4000ms]" /><div className="absolute inset-0 bg-gradient-to-r from-[#111827] via-[#111827]/80 to-transparent"></div></div>
                              <div className="relative z-10 space-y-10 max-w-lg"><span className="bg-brand text-white text-[11px] font-[900] px-6 py-2 rounded-xl uppercase tracking-widest">{ad.tag}</span><h4 className="text-5xl font-[900] text-white leading-tight tracking-tight">{ad.title}</h4><p className="text-white/60 font-bold text-lg leading-relaxed">{ad.subtitle}</p><button className="bg-white text-[#111827] font-[900] py-6 px-14 rounded-2xl shadow-2xl hover:scale-105 transition-all text-sm uppercase tracking-wider">{ad.cta}</button></div>
                            </>
                          )
                        })()}
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        } />
        
        <Route path="/supermercados" element={
          <div className="space-y-12 sm:space-y-20">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 sm:gap-12">
              <div><h1 className="text-4xl sm:text-6xl font-[900] text-[#111827] dark:text-white tracking-tighter mb-4">Parceiros</h1><p className="text-gray-500 dark:text-gray-400 font-[800] text-base sm:text-xl">Encontre as melhores ofertas próximas de você</p></div>
              <div className="relative w-full lg:w-[450px] group" ref={suggestionRef}>
                <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800/40 rounded-xl sm:rounded-[2.5rem] -m-1"></div>
                <div className="relative flex items-center bg-white dark:bg-[#1e293b] rounded-xl sm:rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-sm transition-all focus-within:ring-4 focus-within:ring-brand/10"><div className="pl-4 sm:pl-8 pr-2 sm:pr-4 text-gray-400"><svg className="w-5 h-5 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg></div><input type="text" placeholder="Nome ou Bairro..." value={storeSearchQuery} onChange={(e) => {setStoreSearchQuery(e.target.value); setShowStoreSuggestions(true);}} onFocus={() => setShowStoreSuggestions(true)} className="w-full bg-transparent border-none focus:ring-0 py-4 sm:py-6 text-base sm:text-xl font-bold dark:text-white outline-none" /><div className="p-2 pr-3 sm:pr-4">{storeSearchQuery && <button onClick={() => {setStoreSearchQuery(''); setShowStoreSuggestions(false);}} className="bg-red-500 text-white p-2.5 sm:p-4 rounded-lg shadow-red-500/20 hover:scale-105 transition-all"><svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg></button>}</div></div>
                {showStoreSuggestions && storeSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-4 bg-white dark:bg-[#1e293b] rounded-xl sm:rounded-[2rem] shadow-2xl border border-gray-100 overflow-hidden z-[200]">
                    <div className="p-3 bg-gray-50 border-b border-gray-100"><span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sugestões EcoFeira</span></div>
                    {storeSuggestions.map((s) => <button key={s.id} onClick={() => {setStoreSearchQuery(s.name); setShowStoreSuggestions(false); openStoreDetail(s);}} className="w-full flex items-center space-x-4 p-4 hover:bg-brand/5 border-b border-gray-50 last:border-none group text-left"><div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center p-1.5 shadow-sm border border-gray-100 group-hover:scale-105"><img src={s.logo} alt={s.name} className="w-full h-full object-contain" /></div><div><p className="text-base font-black text-gray-900 leading-none">{s.name}</p><p className="text-[10px] font-bold text-gray-400 mt-1">{s.neighborhood}</p></div></button>)}
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-16">
              <div className="bg-[#1e293b] relative rounded-2xl sm:rounded-[3.5rem] overflow-hidden flex flex-col justify-center items-center text-center p-6 sm:p-16 group shadow-2xl min-h-[300px] sm:min-h-[520px] col-span-2 lg:col-span-1"><div className="absolute inset-0"><img src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80" className="w-full h-full object-cover opacity-20 group-hover:scale-110 transition-transform duration-[4000ms]" /></div><div className="relative z-10 space-y-4 sm:space-y-12"><div className="w-12 h-12 sm:w-24 sm:h-24 bg-brand/20 backdrop-blur-md rounded-xl sm:rounded-[2.2rem] flex items-center justify-center mx-auto shadow-2xl"><svg className="w-6 h-6 sm:w-12 sm:h-12 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.167a2.407 2.407 0 00-2.454-1.554H2.03a1.76 1.76 0 01-1.76-1.76V8.291c0-.972.788-1.76 1.76-1.76h.542a2.407 2.407 0 002.454-1.554l2.147-6.167A1.76 1.76 0 0111 5.882z" /></svg></div><div className="space-y-2 sm:space-y-6"><span className="bg-brand text-white text-[8px] sm:text-[12px] font-[900] px-3 sm:px-7 py-1.5 sm:py-2.5 rounded-lg uppercase tracking-widest">ECOFEIRA PROMO</span><h4 className="text-xl sm:text-5xl font-[900] text-white leading-tight tracking-tight">Sua Marca em Destaque</h4></div><button className="bg-white text-[#111827] font-[900] py-3 sm:py-6 px-6 sm:px-16 rounded-xl sm:rounded-3xl shadow-2xl hover:scale-105 active:scale-95 transition-all text-[10px] sm:text-base uppercase tracking-wider">Saber Mais</button></div></div>
              {filteredStores.map(store => (
                <div key={store.id} className="bg-white dark:bg-[#1e293b] border border-gray-100 dark:border-gray-800 rounded-2xl sm:rounded-[3.5rem] p-4 sm:p-16 shadow-sm hover:shadow-2xl transition-all duration-700 flex flex-col items-center text-center space-y-4 sm:space-y-10 group"><div className="w-16 h-16 sm:w-40 sm:h-40 bg-[#f8fafc] dark:bg-[#0f172a] rounded-xl sm:rounded-[2.8rem] flex items-center justify-center p-3 sm:p-10 border border-gray-100 group-hover:scale-110 transition-all duration-700"><img src={store.logo} alt={store.name} className="w-full h-full object-contain" /></div><div className="space-y-1 sm:space-y-4"><h3 className="text-base sm:text-4xl font-[900] text-[#111827] dark:text-white tracking-tighter leading-tight line-clamp-1">{store.name}</h3><p className="text-[8px] sm:text-base text-gray-400 font-bold max-w-[200px] sm:max-w-none">{store.neighborhood}</p><div className="flex justify-center mt-2"><div className={`inline-flex items-center px-4 py-1.5 rounded-full border text-[10px] sm:text-xs font-black uppercase tracking-widest space-x-2 ${store.status?.toLowerCase() === 'aberto' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}><span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${store.status?.toLowerCase() === 'aberto' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span><span>{store.status || 'Fechado'}</span></div></div></div><div className="pt-2 sm:pt-8 w-full"><button onClick={() => openStoreDetail(store)} className="w-full py-3 sm:py-6 border-2 border-gray-100 dark:border-gray-800 text-[#111827] dark:text-white font-[900] rounded-xl sm:rounded-[2rem] hover:border-brand hover:text-brand dark:hover:bg-brand dark:hover:text-white transition-all flex items-center justify-center space-x-2 sm:space-x-4 text-xs sm:text-xl"><span>Ver Ofertas</span><svg className="w-3 h-3 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg></button></div></div>
              ))}
            </div>
          </div>
        } />
        
        <Route path="/supermercado/:storeId" element={
          <StoreDetailView 
            products={products}
            stores={stores}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            sortBy={sortBy}
            setSortBy={setSortBy}
            favorites={favorites}
            toggleFavorite={toggleFavorite}
            addToList={addToList}
            showSearchSuggestions={showSearchSuggestions}
            setShowSearchSuggestions={setShowSearchSuggestions}
            searchSuggestionRef={searchSuggestionRef}
            storeCategoriesRef={storeCategoriesRef}
            categories={categories}
          />
        } />
        
        <Route path="/:storeName/:categoryName/:productId/:productName" element={
          <ProductDetailView 
            products={products}
            stores={stores}
            favorites={favorites}
            toggleFavorite={toggleFavorite}
            addToList={addToList}
          />
        } />
        
        <Route path="/favoritos" element={
          <div className="space-y-8 sm:space-y-12 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 sm:gap-8">
              <div><h1 className="text-4xl sm:text-6xl font-[900] text-[#111827] dark:text-white tracking-tighter mb-2 sm:mb-4">Favoritos</h1><p className="text-gray-500 dark:text-gray-400 font-[800] text-base sm:text-xl">Sua seleção personalizada</p></div>
              {favorites.length > 0 && <button onClick={() => setIsClearFavoritesModalOpen(true)} className="bg-red-500 hover:bg-red-600 text-white font-black px-6 sm:px-10 py-3 sm:py-5 rounded-xl shadow-red-500/30 hover:scale-105 flex items-center justify-center space-x-2 transition-all"><svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg><span>Limpar Tudo</span></button>}
            </div>
            {favoritedProducts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-12">
                {favoritedProducts.map((p) => {
                  const storeLogo = stores.find(s => s.name === p.supermarket)?.logo;
                  return <ProductCard key={p.id} product={p} onAddToList={addToList} onToggleFavorite={toggleFavorite} isFavorite={true} storeLogo={storeLogo} />;
                })}
              </div>
            ) : (
              <div className="text-center py-24 sm:py-40 bg-white dark:bg-[#1e293b] rounded-2xl sm:rounded-[4rem] border-2 border-dashed border-gray-100 flex flex-col items-center px-4"><div className="w-20 h-20 sm:w-32 sm:h-32 bg-red-50 rounded-2xl flex items-center justify-center mb-6 shadow-inner"><svg className="w-10 h-10 sm:w-16 sm:h-16 text-red-200" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg></div><p className="text-gray-400 font-[800] text-xl tracking-tight mb-4">Lista de favoritos vazia</p><button onClick={() => navigate('/produtos')} className="mt-4 bg-brand hover:bg-brand-dark text-white font-[900] py-4 px-10 rounded-xl shadow-brand/40 text-sm uppercase tracking-widest">Explorar Ofertas</button></div>
            )}
            {isClearFavoritesModalOpen && (
              <div className="fixed inset-0 z-[300] flex items-center justify-center p-4"><div className="absolute inset-0 bg-black/40 backdrop-blur-md" onClick={() => setIsClearFavoritesModalOpen(false)}></div><div className="relative bg-white dark:bg-[#1e293b] w-full max-md rounded-[3rem] p-8 text-center"><div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-8"><svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></div><h3 className="text-2xl font-[900] text-[#111827] dark:text-white mb-4">Limpar Favoritos?</h3><p className="text-gray-500 dark:text-gray-400 mb-10">Esta ação irá remover permanentemente todos os favoritos. Deseja continuar?</p><div className="grid grid-cols-2 gap-4"><button onClick={() => setIsClearFavoritesModalOpen(false)} className="py-4 font-[900] text-gray-500 hover:bg-gray-50 rounded-2xl">Cancelar</button><button onClick={clearAllFavorites} className="bg-brand text-white font-[900] py-4 rounded-2xl shadow-brand/30">Limpar Tudo</button></div></div></div>
            )}
          </div>
        } />
        
        <Route path="/lista" element={
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-16">
            <div className="lg:col-span-7 xl:col-span-8 space-y-8 sm:space-y-12">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 sm:gap-8">
                <div><h1 className="text-4xl sm:text-6xl font-[900] text-[#111827] dark:text-white tracking-tighter mb-2 sm:mb-4">Minha Lista</h1><p className="text-gray-500 dark:text-gray-400 font-[800] text-base sm:text-xl">Gerencie seus itens</p></div>
                {shoppingList.length > 0 && <button onClick={() => setIsClearListModalOpen(true)} className="bg-red-500 hover:bg-red-600 text-white font-black px-6 sm:px-10 py-3 sm:py-5 rounded-xl shadow-red-500/30 hover:scale-105 flex items-center justify-center space-x-2 transition-all"><svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg><span>Limpar Lista</span></button>}
              </div>
              <div className="space-y-4 sm:space-y-8">
                {shoppingList.length > 0 ? (
                  <div className="bg-white dark:bg-[#1e293b] rounded-2xl sm:rounded-[3.5rem] shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                    {shoppingList.map((item, idx) => {
                      const storeLogo = stores.find(s => s.name === item.originalStore)?.logo;
                      return (
                        <div key={item.id} className={`flex flex-col sm:flex-row items-center justify-between p-4 sm:p-8 ${idx !== shoppingList.length - 1 ? 'border-b border-gray-50 dark:border-gray-800/50' : ''} hover:bg-brand/5 dark:hover:bg-brand transition-all duration-300 group gap-4`}>
                          <div className="flex items-center space-x-4 w-full"><div className="min-w-0"><p className="text-lg sm:text-2xl font-[900] truncate text-gray-900 dark:text-gray-100 group-hover:text-brand dark:group-hover:text-white transition-colors">{item.productName}</p><div className="flex items-center mt-1 space-x-2">{storeLogo && <div className="w-5 h-5 bg-white rounded-md p-0.5 border border-gray-100 flex items-center justify-center"><img src={storeLogo} alt="" className="w-full h-full object-contain" /></div>}<p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest group-hover:text-brand/80 dark:group-hover:text-white/80 transition-colors">{item.originalStore}</p></div></div></div>
                          <div className="flex items-center space-x-4 w-full sm:w-auto justify-end"><div className="flex items-center bg-[#f4f7f6] dark:bg-[#0f172a] rounded-xl p-1"><button onClick={() => updateQuantity(item.id, -1)} className="w-8 h-8 sm:w-12 flex items-center justify-center text-gray-400 hover:bg-white dark:hover:bg-gray-800 rounded-lg transition active:scale-90"><svg className="w-4 h-4 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M20 12H4" /></svg></button><span className="w-10 sm:w-16 text-center font-[900] text-lg sm:text-3xl text-[#111827] dark:text-white group-hover:text-brand dark:group-hover:text-white transition-colors">{item.quantity}</span><button onClick={() => updateQuantity(item.id, 1)} className="w-8 h-8 sm:w-12 flex items-center justify-center text-gray-400 hover:bg-white dark:hover:bg-gray-800 rounded-lg transition active:scale-90"><svg className="w-4 h-4 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M12 4v16m8-8H4" /></svg></button></div><button onClick={() => removeFromList(item.id)} className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button></div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-24 bg-white dark:bg-[#1e293b] rounded-2xl sm:rounded-[4rem] border-2 border-dashed border-gray-100 flex flex-col items-center px-4"><div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center mb-6"><svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg></div><p className="text-gray-400 font-[800] text-xl tracking-tight mb-4">Sua lista está vazia</p><button onClick={() => navigate('/produtos')} className="mt-4 bg-brand hover:bg-brand-dark text-white font-[900] py-4 px-10 rounded-xl shadow-brand/40 text-sm uppercase tracking-widest">Começar a comprar</button></div>
                )}
              </div>
            </div>
            <div className="lg:col-span-5 xl:col-span-4 px-4 sm:px-0">
              <CartOptimizer items={shoppingList} allProducts={products} stores={stores} />
            </div>
            {isClearListModalOpen && (
              <div className="fixed inset-0 z-[300] flex items-center justify-center p-4"><div className="absolute inset-0 bg-black/40 backdrop-blur-md" onClick={() => setIsClearListModalOpen(false)}></div><div className="relative bg-white dark:bg-[#1e293b] w-full max-md rounded-[3rem] p-8 text-center"><div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-8"><svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></div><h3 className="text-2xl font-[900] text-[#111827] dark:text-white mb-4">Limpar Lista?</h3><p className="text-gray-500 dark:text-gray-400 mb-10">Deseja remover todos os itens da sua lista de compras? Esta ação não pode ser desfeita.</p><div className="grid grid-cols-2 gap-4"><button onClick={() => setIsClearListModalOpen(false)} className="py-4 font-[900] text-gray-500 hover:bg-gray-50 rounded-2xl">Cancelar</button><button onClick={clearShoppingList} className="bg-brand text-white font-[900] py-4 rounded-2xl shadow-brand/30">Limpar Lista</button></div></div></div>
            )}
          </div>
        } />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
};

export default App;
