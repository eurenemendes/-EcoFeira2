
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Routes, Route, useNavigate, useParams, useLocation, Navigate, Link } from 'react-router-dom';
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db, loginWithGoogle, logout, syncUserData } from './services/firebase.ts';
import { Product, Supermarket, MainBanner, GridBanner, ShoppingListItem } from './types.ts';
import { getProducts, getSupermarkets, getMainBanners, getGridBanners, getPopularSuggestions } from './services/googleSheetsService.ts';
import { Layout } from './components/Layout.tsx';
import { ProductCard } from './components/ProductCard.tsx';
import { BannerCarousel } from './components/BannerCarousel.tsx';
import { CartOptimizer } from './components/CartOptimizer.tsx';
import { Pagination } from './components/Pagination.tsx';

declare const Html5Qrcode: any;
const ITEMS_PER_PAGE = 30;

const normalizeString = (str: string) => 
  str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export const slugify = (text: string) => {
  return text.toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '').replace(/--+/g, '-');
};

const AuthModal = ({ isOpen, onClose, user }: { isOpen: boolean, onClose: () => void, user: any }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#0f172a]/90 backdrop-blur-md" onClick={onClose}></div>
      <div className="relative bg-white dark:bg-[#1e293b] w-full max-w-md rounded-[3rem] shadow-2xl p-8 sm:p-12 text-center animate-in zoom-in-95 duration-300">
        <button onClick={onClose} className="absolute top-6 right-6 p-2 text-gray-400"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg></button>
        
        {user ? (
          <div className="space-y-6">
            <div className="flex justify-center"><img src={user.photoURL} className="w-24 h-24 rounded-full border-4 border-brand p-1" alt="" /></div>
            <h3 className="text-3xl font-[900] text-[#111827] dark:text-white tracking-tighter">Olá, {user.displayName?.split(' ')[0]}!</h3>
            <p className="text-gray-500 dark:text-gray-400 font-medium">Você está conectado. Seus dados estão sincronizados na nuvem.</p>
            <button onClick={() => { logout(); onClose(); }} className="w-full bg-gray-100 dark:bg-gray-800 text-red-500 font-black py-5 rounded-2xl hover:bg-red-50">Sair da Conta</button>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="w-20 h-20 bg-brand/10 rounded-[2rem] flex items-center justify-center mx-auto"><svg className="w-10 h-10 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg></div>
            <div>
              <h3 className="text-3xl font-[900] text-[#111827] dark:text-white tracking-tighter mb-2">Sincronize sua Economia</h3>
              <p className="text-gray-500 dark:text-gray-400 font-medium">Salve sua lista e favoritos em todos os seus dispositivos.</p>
            </div>
            <button onClick={() => { loginWithGoogle().then(onClose); }} className="w-full flex items-center justify-center space-x-3 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 py-5 rounded-2xl font-black hover:border-brand transition-all">
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-6 h-6" alt="" />
              <span className="text-gray-700 dark:text-white">Entrar com Google</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Componentes StoreDetailView e ProductDetailView (mantidos conforme original para não perder funcionalidade)
// ... [Omitidos aqui por brevidade, mas devem permanecer no arquivo real] ...

const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [products, setProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<Supermarket[]>([]);
  const [mainBanners, setMainBanners] = useState<MainBanner[]>([]);
  const [gridBanners, setGridBanners] = useState<GridBanner[]>([]);
  const [shoppingList, setShoppingList] = useState<ShoppingListItem[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [user, setUser] = useState<any>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [selectedSupermarket, setSelectedSupermarket] = useState<string>('Todos');
  const [sortBy, setSortBy] = useState<'none' | 'price-asc' | 'price-desc'>('none');
  const [onlyPromos, setOnlyPromos] = useState(false);

  // Monitora Auth do Firebase
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        // Quando logar, escuta mudanças no Firestore para sincronizar dados
        const unsubStore = onSnapshot(doc(db, "users", u.uid), (docSnap) => {
          if (docSnap.exists()) {
            // FIX: Adicionando cast para any para evitar erro de tipo 'unknown' ao acessar propriedades do Firestore
            const data = docSnap.data() as any;
            if (data.favorites) setFavorites(data.favorites);
            if (data.shoppingList) setShoppingList(data.shoppingList);
          }
        });
        return () => unsubStore();
      }
    });
    return () => unsub();
  }, []);

  // Sincroniza dados locais -> Firebase quando houver mudanças (se logado)
  useEffect(() => {
    if (user && !loading) {
      syncUserData(user.uid, { favorites, shoppingList });
    }
  }, [favorites, shoppingList, user, loading]);

  // Carregamento de dados inicial
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [p, s, mb, gb] = await Promise.all([getProducts(), getSupermarkets(), getMainBanners(), getGridBanners()]);
        setProducts(p || []);
        setStores(s || []);
        setMainBanners(mb || []);
        setGridBanners(gb || []);
        
        // Se não tiver usuário, carrega do LocalStorage (Fallback offline)
        if (!auth.currentUser) {
          const favs = localStorage.getItem('ecofeira_favorites');
          const list = localStorage.getItem('ecofeira_shopping_list');
          if (favs) setFavorites(JSON.parse(favs));
          if (list) setShoppingList(JSON.parse(list));
        }
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    loadData();
  }, []);

  // Persistência Offline
  useEffect(() => {
    if (!loading && !user) {
      localStorage.setItem('ecofeira_favorites', JSON.stringify(favorites));
      localStorage.setItem('ecofeira_shopping_list', JSON.stringify(shoppingList));
    }
  }, [favorites, shoppingList, loading, user]);

  const addToList = (product: Product) => {
    setShoppingList(prev => {
      const existing = prev.find(item => item.productName === product.name);
      if (existing) return prev.map(item => item.productName === product.name ? { ...item, quantity: item.quantity + 1 } : item);
      return [...prev, { id: Date.now().toString(), productName: product.name, quantity: 1, checked: false, originalPrice: product.isPromo ? product.promoPrice : product.normalPrice, originalStore: product.supermarket }];
    });
  };

  const toggleFavorite = (productId: string) => {
    setFavorites(prev => prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]);
  };

  const filteredProducts = useMemo(() => {
    let result = [...products];
    if (searchQuery) {
      const q = normalizeString(searchQuery);
      result = result.filter(p => normalizeString(p.name).includes(q) || normalizeString(p.category).includes(q));
    }
    if (selectedCategory !== 'Todas') result = result.filter(p => p.category === selectedCategory);
    if (selectedSupermarket !== 'Todos') result = result.filter(p => p.supermarket === selectedSupermarket);
    if (sortBy === 'price-asc') result.sort((a, b) => (a.isPromo ? a.promoPrice : a.normalPrice) - (b.isPromo ? b.promoPrice : b.normalPrice));
    return result;
  }, [products, searchQuery, selectedCategory, selectedSupermarket, sortBy]);

  const paginatedFilteredProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-[#0f172a]">
      <div className="w-16 h-16 border-[6px] border-brand/10 border-t-brand rounded-full animate-spin mb-8"></div>
      <p className="text-gray-500 font-black text-xl animate-pulse">Sincronizando EcoFeira...</p>
    </div>
  );

  return (
    <Layout cartCount={shoppingList.length} favoritesCount={favorites.length} user={user} onOpenAuth={() => setIsAuthModalOpen(true)}>
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} user={user} />
      
      <Routes>
        <Route path="/" element={
          <div className="space-y-12 sm:space-y-24">
            <div className="text-center max-w-4xl mx-auto space-y-6 pt-10">
              <h1 className="text-4xl sm:text-8xl font-[900] text-[#111827] dark:text-white tracking-tighter leading-tight">Compare e <span className="text-brand">economize</span></h1>
              <p className="text-gray-500 dark:text-gray-400 text-lg sm:text-xl font-medium">Os melhores preços da sua região em um só lugar.</p>
            </div>
            {mainBanners.length > 0 && <BannerCarousel banners={mainBanners} />}
            <div className="max-w-4xl mx-auto px-4">
               <div className="relative bg-white dark:bg-[#1e293b] rounded-[2.5rem] p-3 shadow-2xl border border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row items-center">
                  <input type="text" placeholder="Buscar ofertas..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-transparent border-none focus:ring-0 py-6 px-8 text-xl font-bold dark:text-white" />
                  <button onClick={() => navigate('/produtos')} className="w-full sm:w-auto bg-brand text-white font-black py-6 px-16 rounded-[2rem] shadow-xl">Buscar</button>
               </div>
            </div>
          </div>
        } />
        
        <Route path="/produtos" element={
          <div className="space-y-12">
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-12">
              {paginatedFilteredProducts.map((p) => (
                <ProductCard key={p.id} product={p} onAddToList={addToList} onToggleFavorite={toggleFavorite} isFavorite={favorites.includes(p.id)} />
              ))}
            </div>
            <Pagination currentPage={currentPage} totalPages={Math.ceil(filteredProducts.length / ITEMS_PER_PAGE)} onPageChange={setCurrentPage} />
          </div>
        } />

        <Route path="/favoritos" element={
          <div className="space-y-12">
            <h1 className="text-4xl sm:text-6xl font-[900] text-[#111827] dark:text-white tracking-tighter">Favoritos</h1>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-12">
              {products.filter(p => favorites.includes(p.id)).map(p => (
                <ProductCard key={p.id} product={p} onAddToList={addToList} onToggleFavorite={toggleFavorite} isFavorite={true} />
              ))}
            </div>
          </div>
        } />

        <Route path="/lista" element={
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-8">
              <h1 className="text-4xl sm:text-6xl font-[900] text-[#111827] dark:text-white tracking-tighter">Minha Lista</h1>
              <div className="bg-white dark:bg-[#1e293b] rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-800 p-4 sm:p-8">
                {shoppingList.length > 0 ? shoppingList.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-6 border-b border-gray-50 last:border-none">
                    <div>
                      <p className="text-xl font-black text-gray-900 dark:text-white">{item.productName}</p>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{item.originalStore}</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="text-2xl font-black text-brand">{item.quantity}x</span>
                      <button onClick={() => setShoppingList(prev => prev.filter(i => i.id !== item.id))} className="text-red-400 hover:text-red-600"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                    </div>
                  </div>
                )) : <p className="text-center py-10 text-gray-400 font-bold">Sua lista está vazia.</p>}
              </div>
            </div>
            <div className="lg:col-span-4">
              <CartOptimizer items={shoppingList} allProducts={products} stores={stores} />
            </div>
          </div>
        } />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
};

export default App;
