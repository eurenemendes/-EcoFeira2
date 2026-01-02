
import React, { useState, useEffect } from 'react';
import { MainBanner } from '../types';

interface BannerCarouselProps {
  banners: MainBanner[];
}

export const BannerCarousel: React.FC<BannerCarouselProps> = ({ banners }) => {
  const [current, setCurrent] = useState(0);
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % banners.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [banners]);

  const handleImageLoad = (index: number) => {
    setLoadedImages(prev => new Set(prev).add(index));
  };

  if (banners.length === 0) return null;

  return (
    <div className="relative w-full h-[450px] sm:h-[540px] overflow-hidden rounded-[3rem] shadow-2xl shadow-gray-200 dark:shadow-none transition-all duration-500 bg-gray-100 dark:bg-gray-900">
      {banners.map((banner, index) => (
        <div 
          key={banner.id}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === current ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
        >
          {/* Skeleton para o Banner */}
          {!loadedImages.has(index) && (
             <div className="absolute inset-0 bg-gray-200 dark:bg-gray-800 animate-pulse" />
          )}
          
          <img 
            src={banner.imageUrl} 
            alt={banner.title}
            onLoad={() => handleImageLoad(index)}
            className={`w-full h-full object-cover transition-transform duration-[4000ms] ${index === current ? 'scale-110' : 'scale-100'} pointer-events-none select-none`}
            loading={index === 0 ? "eager" : "lazy"} // Eager para o primeiro banner (LCP)
            fetchPriority={index === 0 ? "high" : "auto"}
            draggable={false}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-center items-center text-center px-8">
            <div className={`max-w-4xl transition-all duration-700 delay-300 ${index === current ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <h2 className="text-4xl sm:text-7xl font-[900] text-white mb-8 leading-[1.1] tracking-tighter">
                {banner.title}
              </h2>
              <p className="text-white/90 text-lg sm:text-xl font-medium mb-12 max-w-2xl mx-auto leading-relaxed">
                {banner.description}
              </p>
              <a 
                href={banner.link}
                className="bg-brand hover:bg-brand-dark text-white font-[900] text-lg py-5 px-14 rounded-2xl transition-all inline-flex items-center space-x-3 shadow-2xl shadow-brand/40 hover:scale-105 active:scale-95 group"
              >
                <span>{banner.buttonText}</span>
                <svg className="w-6 h-6 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      ))}
      
      {banners.length > 1 && (
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex space-x-4 items-center z-20">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-2.5 rounded-full transition-all duration-700 ${i === current ? 'bg-white w-14 shadow-lg' : 'bg-white/30 w-2.5 hover:bg-white/50'}`}
              aria-label={`Ir para o banner ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
