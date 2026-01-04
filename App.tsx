
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Routes, Route, useNavigate, useParams, useLocation, Navigate, Link } from 'react-router-dom';
import { Product, Supermarket, MainBanner, GridBanner, ShoppingListItem } from './types.ts';
import { getProducts, getSupermarkets, getMainBanners, getGridBanners, getPopularSuggestions } from './services/googleSheetsService.ts';
import { Layout } from './components/Layout.tsx';
import { ProductCard } from './components/ProductCard.tsx';
import { BannerCarousel } from './components/BannerCarousel.tsx';
import { CartOptimizer } from './components/CartOptimizer.tsx';
import { Pagination } from './components/Pagination.tsx';
import { optimizeShoppingList } from './services/geminiService.ts';

// Declaração global para Firebase e Html5Qrcode
declare const Html5Qrcode: any;
declare const firebaseAuth: any;
declare const firebaseGoogleProvider: any;

const ITEMS_PER_PAGE = 30;

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

const NotFoundState = ({ title, message, buttonText, onAction }: { title: string, message: string, buttonText: string, onAction: () => void }) => (
  <div className="flex flex-col items-center justify-center py-20 sm:py-32 px-4 text-center animate-in fade-in zoom-in-95 duration-500">
    <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gray-50 dark:bg-[#1e293b] rounded-[2.5rem] flex items-center justify-center mb-10 shadow-inner">
      <svg className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </div>
    <h2 className="text-3xl sm:text-5xl font-[1000] text-[#111827] dark:text-white tracking-tighter mb-4">{title}</h2>
    <p className="text-gray-500 dark:text-gray-400 font-medium text-lg max-w-md mb-10">{message}</p>
    <button 
      onClick={onAction}
      className="bg-brand hover:bg-brand-dark text-white font-black py-5 px-12 rounded-2xl shadow-xl shadow-brand/20 transition-all hover:scale-105 active:scale-95 text-lg"
    >
      {buttonText}
    </button>
  </div>
);

// --- Componentes de Visualização (Views) ---

const HomeView = ({ products, stores, mainBanners, popularSuggestions, onAddToList, onToggleFavorite, favorites }: any) => {
  const navigate = useNavigate();
  return (
    <div className="space-y-16 animate-in fade-in duration-700">
      <BannerCarousel banners={mainBanners} />
      
      <div className="flex overflow-x-auto pb-4 gap-3 no-scrollbar">
        {popularSuggestions.map((term: string, i: number) => (
          <button 
            key={i} 
            onClick={() => navigate(`/produtos?q=${term}`)}
            className="whitespace-nowrap px-6 py-3 bg-white dark:bg-[#1e293b] rounded-2xl border border-gray-100 dark:border-gray-800 font-bold text-gray-600 dark:text-gray-400 hover:border-brand hover:text-brand transition-all shadow-sm"
          >
            {term}
          </button>
        ))}
      </div>

      <section>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-[1000] text-[#111827] dark:text-white tracking-tighter">Supermercados</h2>
          <Link to="/supermercados" className="text-brand font-black text-sm uppercase tracking-widest hover:underline">Ver todos</Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          {stores.slice(0, 4).map((store: Supermarket) => (
            <Link key={store.id} to={`/supermercado/${store.id}`} className="bg-white dark:bg-[#1e293b] p-6 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 text-center hover:shadow-xl transition-all group">
              <div className="w-20 h-20 mx-auto mb-4 bg-gray-50 dark:bg-[#0f172a]/50 rounded-2xl p-4 flex items-center justify-center group-hover:scale-110 transition-transform">
                <img src={store.logo} alt={store.name} className="max-h-full max-w-full object-contain pointer-events-none" />
              </div>
              <h3 className="font-extrabold text-[#111827] dark:text-white truncate">{store.name}</h3>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-3xl font-[1000] text-[#111827] dark:text-white tracking-tighter mb-8">Ofertas em Destaque</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {products.filter((p: Product) => p.isPromo).slice(0, 8).map((product: Product) => (
            <ProductCard 
              key={product.id} 
              product={product} 
              onAddToList={onAddToList} 
              onToggleFavorite={onToggleFavorite} 
              isFavorite={favorites.includes(product.id)}
              storeLogo={stores.find((s: Supermarket) => s.name === product.supermarket)?.logo}
            />
          ))}
        </div>
      </section>
    </div>
  );
};

const ProductsView = ({ products, stores, onAddToList, onToggleFavorite, favorites }: any) => {
  const [search, setSearch] = useState("");
  const filtered = products.filter((p: Product) => normalizeString(p.name).includes(normalizeString(search)));
  
  return (
    <div className="space-y-10">
      <div className="bg-white dark:bg-[#1e293b] p-6 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm flex items-center space-x-4">
        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        <input 
          type="text" 
          placeholder="O que você está procurando hoje?" 
          className="w-full bg-transparent outline-none font-bold text-lg"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filtered.map((p: Product) => (
          <ProductCard 
            key={p.id} 
            product={p} 
            onAddToList={onAddToList} 
            onToggleFavorite={onToggleFavorite} 
            isFavorite={favorites.includes(p.id)}
            storeLogo={stores.find((s: Supermarket) => s.name === p.supermarket)?.logo}
          />
        ))}
      </div>
    </div>
  );
};

const SupermarketsView = ({ stores }: { stores: Supermarket[] }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
    {stores.map(store => (
      <Link key={store.id} to={`/supermercado/${store.id}`} className="bg-white dark:bg-[#1e293b] rounded-[3rem] p-10 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl transition-all group">
        <div className="w-24 h-24 bg-gray-50 dark:bg-[#0f172a] rounded-[2rem] p-4 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
          <img src={store.logo} alt={store.name} className="max-h-full max-w-full object-contain" />
        </div>
        <h3 className="text-2xl font-black text-[#111827] dark:text-white tracking-tighter mb-2">{store.name}</h3>
        <p className="text-gray-500 dark:text-gray-400 font-bold mb-6">{store.street}, {store.number} - {store.neighborhood}</p>
        <div className="flex items-center justify-between">
           <span className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest ${store.status === 'Aberto' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
             {store.status}
           </span>
           <span className="text-brand font-black text-sm uppercase tracking-widest">Ver Ofertas →</span>
        </div>
      </Link>
    ))}
  </div>
);

const ShoppingListView = ({ shoppingList, products, stores, onUpdateQuantity, onRemoveFromList }: any) => {
  const [optimization, setOptimization] = useState<string | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);

  const handleOptimize = async () => {
    setIsOptimizing(true);
    const result = await optimizeShoppingList(shoppingList, products);
    setOptimization(result);
    setIsOptimizing(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
      <div className="lg:col-span-2 space-y-8">
        <div className="bg-white dark:bg-[#1e293b] rounded-[3rem] p-10 border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-3xl font-black tracking-tighter">Minha Lista</h2>
            <button onClick={handleOptimize} disabled={isOptimizing || shoppingList.length === 0} className="bg-brand text-white px-8 py-4 rounded-2xl font-black shadow-lg shadow-brand/20 disabled:opacity-50">
              {isOptimizing ? 'Otimizando...' : 'Otimizar com IA'}
            </button>
          </div>
          
          {optimization && (
            <div className="mb-10 p-8 bg-brand/5 border border-brand/10 rounded-[2rem] relative overflow-hidden">
               <div className="text-[10px] font-black text-brand uppercase tracking-widest mb-4">Recomendações da EcoIA</div>
               <div className="text-gray-700 dark:text-gray-200 font-medium whitespace-pre-wrap leading-relaxed">{optimization}</div>
               <button onClick={() => setOptimization(null)} className="absolute top-4 right-4 text-brand/40 hover:text-brand"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
          )}

          <div className="space-y-4">
            {shoppingList.map((item: ShoppingListItem) => (
              <div key={item.id} className="flex items-center justify-between p-6 bg-gray-50 dark:bg-[#0f172a]/50 rounded-2xl border border-gray-100 dark:border-gray-800/40">
                <div className="flex items-center space-x-6">
                  <div className="flex flex-col items-center bg-white dark:bg-[#1e293b] rounded-xl border border-gray-100 dark:border-gray-800">
                    <button onClick={() => onUpdateQuantity(item.id, 1)} className="p-2 text-brand hover:bg-brand/5"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg></button>
                    <span className="font-black text-lg">{item.quantity}</span>
                    <button onClick={() => onUpdateQuantity(item.id, -1)} className="p-2 text-gray-400 hover:bg-gray-50"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M20 12H4" /></svg></button>
                  </div>
                  <div>
                    <h4 className="font-extrabold text-xl text-gray-900 dark:text-white tracking-tight">{item.productName}</h4>
                    <p className="text-xs font-bold text-gray-400">R$ {item.originalPrice.toFixed(2).replace('.', ',')} em {item.originalStore}</p>
                  </div>
                </div>
                <button onClick={() => onRemoveFromList(item.id)} className="p-4 text-red-500 hover:bg-red-50 rounded-2xl transition-all"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
              </div>
            ))}
            {shoppingList.length === 0 && <div className="py-20 text-center text-gray-400 font-bold">Sua lista está vazia. Adicione produtos para começar a economizar.</div>}
          </div>
        </div>
      </div>
      <div className="lg:col-span-1">
        <CartOptimizer items={shoppingList} allProducts={products} stores={stores} />
      </div>
    </div>
  );
};

const FavoritesView = ({ favoritedProducts, onAddToList, onToggleFavorite, stores }: any) => (
  <div className="space-y-10">
    <h2 className="text-4xl font-black tracking-tighter">Meus Favoritos</h2>
    {favoritedProducts.length > 0 ? (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {favoritedProducts.map((p: Product) => (
          <ProductCard 
            key={p.id} 
            product={p} 
            onAddToList={onAddToList} 
            onToggleFavorite={onToggleFavorite} 
            isFavorite={true}
            storeLogo={stores.find((s: Supermarket) => s.name === p.supermarket)?.logo}
          />
        ))}
      </div>
    ) : (
      <NotFoundState title="Sem favoritos" message="Você ainda não salvou nenhum produto como favorito." buttonText="Explorar Ofertas" onAction={() => window.location.hash = '/produtos'} />
    )}
  </div>
);

const StoreDetailView = ({ products, stores, onAddToList, onToggleFavorite, favorites }: any) => {
  const { storeId } = useParams();
  const store = stores.find((s: Supermarket) => s.id === storeId);
  const storeProducts = products.filter((p: Product) => p.supermarket === store?.name);
  
  if (!store) return <NotFoundState title="Loja não encontrada" message="Não conseguimos localizar este supermercado." buttonText="Ver Lojas" onAction={() => window.location.hash = '/supermercados'} />;

  return (
    <div className="space-y-12">
      <div className="bg-white dark:bg-[#1e293b] rounded-[3rem] p-12 border border-gray-100 dark:border-gray-800 flex flex-col md:flex-row items-center gap-10">
        <div className="w-32 h-32 bg-gray-50 dark:bg-[#0f172a] rounded-3xl p-6 flex items-center justify-center shadow-inner">
          <img src={store.logo} alt={store.name} className="max-h-full max-w-full object-contain" />
        </div>
        <div>
          <h1 className="text-5xl font-black tracking-tighter mb-4">{store.name}</h1>
          <p className="text-xl font-bold text-gray-500">{store.street}, {store.number} - {store.neighborhood}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {storeProducts.map((p: Product) => (
          <ProductCard 
            key={p.id} 
            product={p} 
            onAddToList={onAddToList} 
            onToggleFavorite={onToggleFavorite} 
            isFavorite={favorites.includes(p.id)}
            storeLogo={store.logo}
          />
        ))}
      </div>
    </div>
  );
};

const ProductDetailView = ({ products, stores, favorites, toggleFavorite, addToList }: any) => {
  const { productId } = useParams();
  const product = products.find((p: Product) => p.id === productId);
  if (!product) return <NotFoundState title="Produto não encontrado" message="Este produto não está disponível." buttonText="Ver Produtos" onAction={() => window.location.hash = '/produtos'} />;
  
  const store = stores.find((s: Supermarket) => s.name === product.supermarket);
  const isFavorite = favorites.includes(product.id);
  
  return (
    <div className="bg-white dark:bg-[#1e293b] rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden animate-in fade-in duration-700">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-16 p-12 lg:p-20">
        <div className="bg-gray-50 dark:bg-[#0f172a]/50 rounded-[3rem] p-10 flex items-center justify-center">
          <img src={product.imageUrl} alt={product.name} className="max-h-[500px] w-full object-contain" />
        </div>
        <div className="flex flex-col justify-center">
          <div className="mb-6 flex items-center justify-between">
            <span className="text-brand font-black text-sm uppercase tracking-widest bg-brand/10 px-4 py-2 rounded-xl">{product.category}</span>
            <button onClick={() => toggleFavorite(product.id)} className={`p-4 rounded-2xl border transition-all ${isFavorite ? 'bg-red-500 text-white border-red-500 shadow-lg shadow-red-500/30' : 'bg-white text-gray-400 border-gray-100 hover:border-red-500 hover:text-red-500'}`}>
              <svg className={`w-6 h-6 ${isFavorite ? 'fill-current' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
            </button>
          </div>
          <h1 className="text-5xl font-black text-[#111827] dark:text-white tracking-tighter mb-4 leading-tight">{product.name}</h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium text-xl mb-10 leading-relaxed">{product.description || 'Nenhuma descrição detalhada disponível para este produto.'}</p>
          
          <div className="flex items-center space-x-6 mb-12 p-8 bg-gray-50 dark:bg-[#0f172a]/50 rounded-[2.5rem] border border-gray-100 dark:border-gray-800">
             <div className="w-20 h-20 bg-white dark:bg-[#1e293b] rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800">
               <img src={store?.logo} alt={store?.name} className="max-h-full max-w-full object-contain" />
             </div>
             <div>
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Vendido por</p>
               <h3 className="text-2xl font-black tracking-tight">{product.supermarket}</h3>
             </div>
          </div>

          <div className="flex items-end justify-between mb-12">
            <div>
               {product.isPromo && <p className="text-xl text-gray-400 line-through font-bold mb-2">R$ {product.normalPrice.toFixed(2).replace('.', ',')}</p>}
               <p className={`text-6xl font-[1000] tracking-tighter ${product.isPromo ? 'text-brand' : 'text-gray-900 dark:text-white'}`}>R$ {(product.isPromo ? product.promoPrice : product.normalPrice).toFixed(2).replace('.', ',')}</p>
            </div>
          </div>

          <button onClick={() => addToList(product)} className="w-full bg-brand text-white text-2xl font-black py-8 rounded-[2.5rem] shadow-2xl shadow-brand/30 hover:scale-105 active:scale-95 transition-all">Adicionar à Lista</button>
        </div>
      </div>
    </div>
  );
};

const ProfileView = ({ user, onLogout, favoritesCount, shoppingListCount }: { user: any, onLogout: () => void, favoritesCount: number, shoppingListCount: number }) => {
  const navigate = useNavigate();
  
  const userData = {
    name: user?.displayName || "Usuário EcoFeira",
    email: user?.email || "",
    photo: user?.photoURL || "https://api.dicebear.com/7.x/avataaars/svg?seed=EcoFeira",
    memberSince: user?.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) : "Recém Chegado",
    totalSaved: 0.00,
    tier: "Econômico Pro"
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 sm:space-y-16 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="bg-white dark:bg-[#1e293b] rounded-[3rem] p-8 sm:p-16 border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden text-center sm:text-left">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
        
        <div className="flex flex-col sm:flex-row items-center gap-8 sm:gap-12 relative z-10">
          <div className="w-32 h-32 sm:w-44 sm:h-44 bg-brand/10 rounded-[3rem] flex items-center justify-center border-4 border-white dark:border-gray-800 shadow-xl overflow-hidden">
             <img 
               src={userData.photo} 
               alt="Avatar" 
               className="w-full h-full object-cover"
             />
          </div>
          
          <div className="space-y-4">
            <div>
              <h1 className="text-3xl sm:text-6xl font-[1000] text-[#111827] dark:text-white tracking-tighter leading-none">{userData.name}</h1>
              <p className="text-gray-500 dark:text-gray-400 font-bold text-lg mt-2">{userData.email}</p>
            </div>
            <div className="inline-flex items-center px-4 py-2 bg-brand text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-brand/20">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
              <span>{userData.tier}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-[#1e293b] p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm hover:scale-105 transition-transform">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Economia Total</p>
          <p className="text-3xl font-[1000] text-brand tracking-tighter">R$ {userData.totalSaved.toFixed(2).replace('.', ',')}</p>
        </div>
        <div className="bg-white dark:bg-[#1e293b] p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm hover:scale-105 transition-transform">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Favoritos</p>
          <p className="text-3xl font-[1000] text-gray-900 dark:text-white tracking-tighter">{favoritesCount}</p>
        </div>
        <div className="bg-white dark:bg-[#1e293b] p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm hover:scale-105 transition-transform">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Na Lista</p>
          <p className="text-3xl font-[1000] text-gray-900 dark:text-white tracking-tighter">{shoppingListCount}</p>
        </div>
        <div className="bg-white dark:bg-[#1e293b] p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm hover:scale-105 transition-transform">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Membro desde</p>
          <p className="text-xl font-[1000] text-gray-900 dark:text-white tracking-tighter">{userData.memberSince}</p>
        </div>
      </div>

      <div className="space-y-8">
        <h2 className="text-2xl sm:text-3xl font-black text-[#111827] dark:text-white tracking-tighter px-4">Minha Conta</h2>
        <div className="bg-white dark:bg-[#1e293b] rounded-[3rem] border border-gray-100 dark:border-gray-800 divide-y divide-gray-50 dark:divide-gray-800 overflow-hidden shadow-sm">
          <button onClick={() => navigate('/favoritos')} className="w-full p-8 flex items-center justify-between hover:bg-brand/5 transition-colors group">
            <div className="flex items-center space-x-6">
              <div className="p-4 bg-red-50 dark:bg-red-500/10 text-red-500 rounded-2xl"><svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" /></svg></div>
              <span className="text-xl font-[800] text-gray-700 dark:text-gray-200 group-hover:text-brand transition-colors">Meus Itens Favoritos</span>
            </div>
            <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
          </button>
          <button onClick={() => navigate('/lista')} className="w-full p-8 flex items-center justify-between hover:bg-brand/5 transition-colors group">
            <div className="flex items-center space-x-6">
              <div className="p-4 bg-brand/10 text-brand rounded-2xl"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg></div>
              <span className="text-xl font-[800] text-gray-700 dark:text-gray-200 group-hover:text-brand transition-colors">Lista de Compras Ativa</span>
            </div>
            <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
        
        <button 
          onClick={onLogout} 
          className="w-full bg-red-50 dark:bg-red-500/10 text-red-500 font-black py-8 rounded-[2.5rem] hover:bg-red-500 hover:text-white transition-all shadow-sm border border-red-100 dark:border-red-900/30 flex items-center justify-center space-x-3"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          <span>Sair da Conta</span>
        </button>
      </div>
    </div>
  );
};

const LoginView = ({ onLogin }: { onLogin: () => void }) => {
  return (
    <div className="max-w-md mx-auto py-20 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="bg-white dark:bg-[#1e293b] rounded-[3rem] p-10 border border-gray-100 dark:border-gray-800 shadow-2xl text-center space-y-10">
        <div className="w-24 h-24 bg-brand/10 rounded-[2rem] flex items-center justify-center mx-auto shadow-lg">
          <svg className="w-12 h-12 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        
        <div className="space-y-4">
          <h2 className="text-4xl font-[1000] text-[#111827] dark:text-white tracking-tighter">Bem-vindo!</h2>
          <p className="text-gray-500 dark:text-gray-400 font-medium">Faça login para salvar seus favoritos, sincronizar sua lista e economizar ainda mais.</p>
        </div>

        <button 
          onClick={onLogin}
          className="w-full flex items-center justify-center space-x-4 bg-white dark:bg-[#0f172a] border-2 border-gray-100 dark:border-gray-800 p-6 rounded-2xl hover:border-brand transition-all group active:scale-95 shadow-sm"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/action/google.svg" className="w-6 h-6" alt="" />
          <span className="text-lg font-[800] text-gray-700 dark:text-gray-200 group-hover:text-brand">Entrar com o Google</span>
        </button>
        
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Seguro via Firebase Auth</p>
      </div>
    </div>
  );
};

// Componente App principal

const App: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<Supermarket[]>([]);
  const [mainBanners, setMainBanners] = useState<MainBanner[]>([]);
  const [gridBanners, setGridBanners] = useState<GridBanner[]>([]);
  const [shoppingList, setShoppingList] = useState<ShoppingListItem[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [popularSuggestions, setPopularSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Handlers de Auth
  useEffect(() => {
    import("https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js").then(({ onAuthStateChanged }) => {
      onAuthStateChanged(firebaseAuth, (currentUser: any) => {
        setUser(currentUser);
      });
    });
  }, []);

  const handleLogin = async () => {
    const { signInWithPopup } = await import("https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js");
    try {
      await signInWithPopup(firebaseAuth, firebaseGoogleProvider);
      navigate('/');
    } catch (error) {
      console.error("Erro no login:", error);
    }
  };

  const handleLogout = async () => {
    const { signOut } = await import("https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js");
    try {
      await signOut(firebaseAuth);
      navigate('/');
    } catch (error) {
      console.error("Erro ao sair:", error);
    }
  };

  // Carregamento de dados
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
        if (savedFavorites) setFavorites(JSON.parse(savedFavorites));

        const savedList = localStorage.getItem('ecofeira_shopping_list');
        if (savedList) setShoppingList(JSON.parse(savedList));
      } catch (e) {
        console.error("Erro ao carregar dados:", e);
      }
      setLoading(false);
    };
    loadData();
  }, []);

  const toggleFavorite = (id: string) => {
    setFavorites(prev => {
      const next = prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id];
      localStorage.setItem('ecofeira_favorites', JSON.stringify(next));
      return next;
    });
  };

  const addToList = (product: Product) => {
    setShoppingList(prev => {
      const existing = prev.find(item => item.productName === product.name && item.originalStore === product.supermarket);
      let next;
      if (existing) {
        next = prev.map(item => item === existing ? { ...item, quantity: item.quantity + 1 } : item);
      } else {
        next = [...prev, {
          id: Date.now().toString(),
          productName: product.name,
          quantity: 1,
          checked: false,
          originalPrice: product.isPromo ? product.promoPrice : product.normalPrice,
          originalStore: product.supermarket
        }];
      }
      localStorage.setItem('ecofeira_shopping_list', JSON.stringify(next));
      return next;
    });
  };

  const removeFromList = (id: string) => {
    setShoppingList(prev => {
      const next = prev.filter(item => item.id !== id);
      localStorage.setItem('ecofeira_shopping_list', JSON.stringify(next));
      return next;
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setShoppingList(prev => {
      const next = prev.map(item => {
        if (item.id === id) {
          const newQty = Math.max(1, item.quantity + delta);
          return { ...item, quantity: newQty };
        }
        return item;
      });
      localStorage.setItem('ecofeira_shopping_list', JSON.stringify(next));
      return next;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-[#0f172a]">
        <div className="w-16 h-16 border-[6px] border-brand/10 border-t-brand rounded-full animate-spin mb-8"></div>
        <p className="text-gray-500 dark:text-gray-400 font-[800] text-xl animate-pulse tracking-tight">EcoFeira: Sincronizando dados...</p>
      </div>
    );
  }

  return (
    <Layout 
      cartCount={shoppingList.length}
      favoritesCount={favorites.length}
      user={user}
      onLogin={() => navigate('/login')}
    >
      <Routes>
        <Route path="/" element={<HomeView products={products} stores={stores} mainBanners={mainBanners} popularSuggestions={popularSuggestions} onAddToList={addToList} onToggleFavorite={toggleFavorite} favorites={favorites} />} />
        <Route path="/produtos" element={<ProductsView products={products} stores={stores} onAddToList={addToList} onToggleFavorite={toggleFavorite} favorites={favorites} />} />
        <Route path="/supermercados" element={<SupermarketsView stores={stores} />} />
        <Route path="/login" element={user ? <Navigate to="/perfil" /> : <LoginView onLogin={handleLogin} />} />
        <Route path="/perfil" element={user ? <ProfileView user={user} onLogout={handleLogout} favoritesCount={favorites.length} shoppingListCount={shoppingList.length} /> : <Navigate to="/login" />} />
        <Route path="/lista" element={<ShoppingListView shoppingList={shoppingList} products={products} stores={stores} onUpdateQuantity={updateQuantity} onRemoveFromList={removeFromList} />} />
        <Route path="/favoritos" element={<FavoritesView favoritedProducts={products.filter(p => favorites.includes(p.id))} onAddToList={addToList} onToggleFavorite={toggleFavorite} stores={stores} />} />
        <Route path="/supermercado/:storeId" element={<StoreDetailView products={products} stores={stores} onAddToList={addToList} onToggleFavorite={toggleFavorite} favorites={favorites} />} />
        <Route path="/:storeName/:categoryName/:productId/:productName" element={<ProductDetailView products={products} stores={stores} favorites={favorites} toggleFavorite={toggleFavorite} addToList={addToList} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
};

export default App;
