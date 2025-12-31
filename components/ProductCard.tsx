
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Product } from '../types';
import { slugify } from '../App';

interface ProductCardProps {
  product: Product;
  onAddToList: (product: Product) => void;
  onToggleFavorite: (id: string) => void;
  isFavorite: boolean;
  storeLogo?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToList, onToggleFavorite, isFavorite, storeLogo }) => {
  const navigate = useNavigate();
  const [isAdded, setIsAdded] = useState(false);
  const [isShared, setIsShared] = useState(false);
  
  const currentPrice = product.isPromo ? product.promoPrice : product.normalPrice;
  const discount = product.isPromo ? Math.round((1 - product.promoPrice / product.normalPrice) * 100) : 0;

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToList(product);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1500);
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Constrói a URL absoluta base, removendo o hash se existir
    const baseUrl = window.location.href.split('#')[0].replace(/\/$/, "");
    const storeSlug = slugify(product.supermarket);
    const categorySlug = slugify(product.category);
    const nameSlug = slugify(product.name);
    
    // Formato profissional para HashRouter
    const shareUrl = `${baseUrl}/#/${storeSlug}/${categorySlug}/${product.id}/${nameSlug}`;
    
    const shareData = {
      title: `EcoFeira - ${product.name}`,
      text: `Confira esta oferta no ${product.supermarket}: ${product.name} por apenas R$ ${currentPrice.toFixed(2).replace('.', ',')}!`,
      url: shareUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareUrl);
        setIsShared(true);
        setTimeout(() => setIsShared(false), 2000);
      }
    } catch (err) {
      console.error('Erro ao compartilhar:', err);
    }
  };

  const handleCardClick = () => {
    const storeSlug = slugify(product.supermarket);
    const categorySlug = slugify(product.category);
    const nameSlug = slugify(product.name);
    navigate(`/${storeSlug}/${categorySlug}/${product.id}/${nameSlug}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div 
      onClick={handleCardClick}
      className="bg-white dark:bg-[#1e293b] rounded-2xl sm:rounded-[2.5rem] shadow-[0_4px_12px_rgba(0,0,0,0.04)] sm:shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_60px_rgba(0,0,0,0.1)] transition-all duration-500 overflow-hidden border border-gray-100 dark:border-gray-800 flex flex-col group relative h-full cursor-pointer"
    >
      <div className="relative pt-[85%] bg-[#f4f7f6] dark:bg-[#0f172a]/60 m-1 sm:m-2 rounded-xl sm:rounded-[2rem] overflow-hidden flex items-center justify-center">
        <img 
          src={product.imageUrl} 
          alt={product.name}
          className="absolute inset-0 w-full h-full object-contain p-4 sm:p-8 transition-transform duration-700 group-hover:scale-110 pointer-events-none select-none"
          loading="lazy"
          draggable={false}
          onContextMenu={(e) => e.preventDefault()}
        />
        
        {product.isPromo && discount > 0 && (
          <div className="absolute top-2 left-2 sm:top-4 sm:left-4 bg-red-500 text-white text-[8px] sm:text-[10px] font-black px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl shadow-lg shadow-red-500/30 animate-pulse-soft z-20">
            <span>{discount}% OFF</span>
          </div>
        )}

        <div className="absolute top-2 right-2 sm:top-4 sm:right-4 flex flex-col space-y-2 z-20">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(product.id);
            }}
            className={`p-1.5 sm:p-2.5 rounded-lg sm:rounded-2xl shadow-lg transition-all hover:scale-110 active:scale-90 ${isFavorite ? 'bg-red-500 text-white shadow-red-500/30' : 'bg-white/80 dark:bg-gray-800/80 text-gray-400 backdrop-blur-md'}`}
            title={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
          >
            <svg className={`w-4 h-4 sm:w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>

          <button 
            onClick={handleShare}
            className={`p-1.5 sm:p-2.5 rounded-lg sm:rounded-2xl shadow-lg transition-all hover:scale-110 active:scale-90 backdrop-blur-md relative group/share ${isShared ? 'bg-brand text-white' : 'bg-white/80 dark:bg-gray-800/80 text-gray-400'}`}
            title="Compartilhar produto"
          >
            {isShared ? (
              <svg className="w-4 h-4 sm:w-5 h-5 animate-success-pop" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4 sm:w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            )}
            {isShared && (
              <span className="absolute right-full mr-2 top-1/2 -translate-y-1/2 bg-brand text-white text-[10px] font-black px-2 py-1 rounded-md shadow-xl whitespace-nowrap animate-in fade-in slide-in-from-right-1">
                Copiado!
              </span>
            )}
          </button>
        </div>

        {storeLogo && (
          <div className="absolute bottom-2 left-2 sm:bottom-4 sm:left-4 flex items-center bg-white/90 dark:bg-[#1e293b]/90 backdrop-blur-md rounded-lg sm:rounded-2xl p-1 pr-2 sm:p-1.5 sm:pr-4 shadow-lg border border-gray-100 dark:border-gray-700 z-10 transition-all group-hover:translate-x-1 group-hover:scale-105">
            <div className="w-5 h-5 sm:w-8 h-8 bg-white dark:bg-gray-800 rounded-md sm:rounded-xl p-0.5 sm:p-1 mr-1 sm:mr-2 shadow-sm flex items-center justify-center">
              <img 
                src={storeLogo} 
                alt={product.supermarket} 
                className="w-full h-full object-contain pointer-events-none" 
                draggable={false}
                onContextMenu={(e) => e.preventDefault()}
              />
            </div>
            <span className="text-[7px] sm:text-[10px] font-[1000] text-gray-700 dark:text-gray-100 uppercase tracking-wider truncate max-w-[50px] sm:max-w-[120px]">
              {product.supermarket}
            </span>
          </div>
        )}
      </div>
      
      <div className="p-3 sm:p-7 pt-2 sm:pt-4 flex flex-col flex-grow">
        <div className="flex justify-between items-center mb-1.5 sm:mb-3">
          <span className="text-[7px] sm:text-[9px] font-black text-brand bg-brand/10 dark:bg-brand/20 px-1.5 py-0.5 sm:px-3 sm:py-1.5 rounded-md sm:rounded-lg uppercase tracking-widest border border-brand/5">
            {product.category}
          </span>
        </div>
        
        <h3 className="font-extrabold text-[#111827] dark:text-gray-100 text-[13px] sm:text-[1.05rem] leading-tight mb-2 sm:mb-6 group-hover:text-brand transition-colors h-[2rem] sm:h-[2.6rem] line-clamp-2">
          {product.name}
        </h3>
        
        <div className="mt-auto flex items-end justify-between gap-1">
          <div className="flex flex-col min-w-0 overflow-hidden">
            {product.isPromo && (
              <span className="text-[9px] sm:text-[12px] text-gray-400 dark:text-gray-500 line-through font-bold mb-0.5 sm:mb-1">
                R${product.normalPrice.toFixed(2).replace('.', ',')}
              </span>
            )}
            <div className="flex items-baseline">
              <span className={`text-base sm:text-3xl font-[1000] tracking-tighter truncate ${product.isPromo ? 'text-brand' : 'text-gray-900 dark:text-white'}`}>
                R${currentPrice.toFixed(2).replace('.', ',')}
              </span>
            </div>
            <div className="mt-1 sm:mt-2 flex items-center text-[7px] sm:text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest whitespace-nowrap">
              <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="truncate">Atu: {product.lastUpdate || 'Hoje'}</span>
            </div>
          </div>
          
          <div className="flex flex-col items-end flex-shrink-0">
             <button 
                onClick={handleAdd}
                className={`${isAdded ? 'bg-brand-dark animate-success-pop scale-105' : 'bg-brand hover:bg-brand-dark'} text-white p-2.5 sm:p-4 rounded-lg sm:rounded-2xl transition-all shadow-xl shadow-brand/20 active:scale-95 group transform relative flex items-center justify-center overflow-hidden`}
                disabled={isAdded}
              >
                <div className={`transition-all duration-300 transform ${isAdded ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}>
                  <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div className={`absolute transition-all duration-300 transform ${isAdded ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}>
                  <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </button>
          </div>
        </div>
      </div>
    </div>
  );
};
