
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Product, Supermarket, MainBanner, GridBanner, ShoppingListItem } from './types.ts';
import { getProducts, getSupermarkets, getMainBanners, getGridBanners, getPopularSuggestions } from './services/googleSheetsService.ts';
import { Layout } from './components/Layout.tsx';
import { ProductCard } from './components/ProductCard.tsx';
import { BannerCarousel } from './components/BannerCarousel.tsx';
import { CartOptimizer } from './components/CartOptimizer.tsx';

const normalizeString = (str: string) => 
  str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

const App: React.FC = () => {
  const [view, setView] = useState<View>('home');
  const [products, setProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<Supermarket[]>([]);
  const [mainBanners, setMainBanners] = useState<MainBanner[]>([]);
  const [gridBanners, setGridBanners] = useState<GridBanner[]>([]);
  const [shoppingList, setShoppingList] = useState<ShoppingListItem[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [popularSuggestions, setPopularSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const categoriesRef = useRef<HTMLDivElement>(null);
  const storesRef = useRef<HTMLDivElement>(null);
  const searchSuggestionRef = useRef<HTMLDivElement>(null);
  const suggestionRef = useRef<HTMLDivElement>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [storeSearchQuery, setStoreSearchQuery] = useState('');
  const [showStoreSuggestions, setShowStoreSuggestions] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [selectedSupermarket, setSelectedSupermarket] = useState<string>('Todos');
  const [sortBy, setSortBy] = useState<'none' | 'price-asc' | 'price-desc'>('none');
  const [onlyPromos, setOnlyPromos] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [p, s, mb, gb, suggs] = await Promise.all([
          getProducts(),
          getSupermarkets(),
          getMainBanners(),
          getGridBanners(),
          getPopularSuggestions()
        ]);
        
        setProducts(p);
        setStores(s);
        setMainBanners(mb);
        setGridBanners(gb);
        setPopularSuggestions(suggs);
        
        const savedFavorites = localStorage.getItem('ecofeira_favorites');
        if (savedFavorites) {
          setFavorites(JSON.parse(savedFavorites));
        }
      } catch (err) {
        console.error("Erro ao carregar dados:", err);
        setError("Não foi possível conectar ao servidor. Verifique sua internet.");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (!loading && favorites.length >= 0) {
      localStorage.setItem('ecofeira_favorites', JSON.stringify(favorites));
    }
  }, [favorites, loading]);

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

  const removeFromList = (id: string) => setShoppingList(prev => prev.filter(item => item.id !== id));
  const updateQuantity = (id: string, delta: number) => {
    setShoppingList(prev => prev.map(item => 
      item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
    ));
  };

  const toggleFavorite = (productId: string) => {
    setFavorites(prev => 
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    );
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

    if (sortBy === 'price-asc') {
      result.sort((a, b) => (a.isPromo ? a.promoPrice : a.normalPrice) - (b.isPromo ? b.promoPrice : b.normalPrice));
    } else if (sortBy === 'price-desc') {
      result.sort((a, b) => {
        const discA = a.isPromo ? (a.normalPrice - a.promoPrice) : 0;
        const discB = b.isPromo ? (b.normalPrice - b.promoPrice) : 0;
        return discB - discA;
      });
    }
    return result;
  }, [products, searchQuery, selectedCategory, selectedSupermarket, sortBy, onlyPromos]);

  const searchSuggestions = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return [];
    const q = normalizeString(searchQuery);
    const names = products.filter(p => normalizeString(p.name).includes(q)).map(p => ({ label: p.name, type: 'produto' }));
    const cats = Array.from(new Set(products.map(p => p.category))).filter(c => normalizeString(c).includes(q)).map(c => ({ label: c, type: 'categoria' }));
    return [...cats, ...names].slice(0, 6);
  }, [products, searchQuery]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-[#0f172a] p-6">
        <div className="relative">
          <div className="w-20 h-20 border-[8px] border-brand/10 border-t-brand rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-4 h-4 bg-brand rounded-full animate-ping"></div>
          </div>
        </div>
        <div className="mt-8 text-center">
          <p className="text-2xl font-black text-gray-900 dark:text-white mb-2">EcoFeira</p>
          <p className="text-gray-500 dark:text-gray-400 font-bold animate-pulse">Sincronizando as melhores ofertas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#fef2f2] dark:bg-[#1a0c0c] p-6">
        <div className="bg-white dark:bg-[#1e1e1e] p-10 rounded-[3rem] shadow-2xl text-center max-w-md border border-red-100">
          <div className="text-6xl mb-6">📡</div>
          <h2 className="text-2xl font-black text-red-600 mb-4">Ops! Erro de Conexão</h2>
          <p className="text-gray-600 dark:text-gray-400 font-medium mb-8">{error}</p>
          <button onClick={() => window.location.reload()} className="w-full bg-red-600 text-white py-4 rounded-2xl font-black hover:bg-red-700 transition-all shadow-xl shadow-red-200">Tentar Novamente</button>
        </div>
      </div>
    );
  }

  return (
    <Layout 
      currentView={view} 
      setView={setView} 
      cartCount={shoppingList.length}
      favoritesCount={favorites.length}
    >
      {view === 'home' && (
        <div className="space-y-12 sm:space-y-20 animate-in fade-in duration-700">
          <div className="text-center max-w-5xl mx-auto space-y-8 pt-6 relative">
            <div className="relative z-10 px-4">
              <h1 className="text-5xl sm:text-8xl font-[900] text-[#111827] dark:text-white tracking-tighter leading-[0.95] mb-6">
                A maneira <span className="text-brand">inteligente</span> <br/> de economizar
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-lg sm:text-2xl font-medium max-w-3xl mx-auto leading-relaxed">
                Analisamos <span className="text-gray-900 dark:text-white font-black">{products.length} ofertas</span> em {stores.length} mercados para você nunca mais pagar caro.
              </p>
            </div>
            
            <div className="relative marquee-mask overflow-hidden py-10 select-none">
              <div className="flex animate-marquee whitespace-nowrap gap-6 w-max">
                {[...stores, ...stores].map((store, idx) => (
                  <div key={`${store.id}-${idx}`} className="flex items-center space-x-4 bg-white dark:bg-[#1e293b] border border-gray-100 dark:border-gray-800 px-8 py-4 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
                    <img src={store.logo} alt={store.name} className="w-10 h-10 object-contain rounded-lg" />
                    <span className="text-lg font-black text-gray-700 dark:text-gray-200">{store.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="max-w-4xl mx-auto px-4 -mt-4">
            <div className="relative" ref={searchSuggestionRef}>
              <div className="flex bg-white dark:bg-[#1e293b] rounded-[2.5rem] p-3 shadow-2xl border border-gray-100 dark:border-gray-800 focus-within:ring-4 focus-within:ring-brand/10 transition-all">
                <input 
                  type="text"
                  placeholder="Busque por arroz, feijão, fralda..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setShowSearchSuggestions(true); }}
                  onFocus={() => setShowSearchSuggestions(true)}
                  className="w-full bg-transparent border-none focus:ring-0 py-4 px-6 text-xl font-bold dark:text-white placeholder-gray-400"
                />
                <button onClick={() => setView('products')} className="bg-brand hover:bg-brand-dark text-white font-black px-12 rounded-[1.8rem] transition-all shadow-xl shadow-brand/20">Buscar</button>
              </div>

              {showSearchSuggestions && searchSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-4 bg-white dark:bg-[#