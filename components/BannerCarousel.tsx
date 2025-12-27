
import React, { useState, useEffect } from 'react';
import { MainBanner } from '../types';

interface BannerCarouselProps {
  banners: MainBanner[];
}

export const BannerCarousel: React.FC<BannerCarouselProps> = ({ banners }) => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % banners.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [banners]);

  if (banners.length === 0) return null;

  const currentBanner = banners[current];

  return (
    <div className="relative w-full h-[450px] sm:h-[540px] overflow-hidden rounded-[3rem] shadow-2xl shadow-gray-200 dark:shadow-none transition-all duration-500">
      <div className="absolute inset-0">
        <img 
          src={currentBanner.imageUrl} 
          alt={currentBanner.title}
          className="w-full h-full object-cover transition-transform duration-[3000ms] scale-105 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-center items-center text-center px-8">
          <div className="max-w-4xl animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <h2 className="text-5xl sm:text-7xl font-[900] text-white mb-8 leading-[1.1] tracking-tighter">
              {currentBanner.title}
            </h2>
            <p className="text-white/90 text-xl font-medium mb-12 max-w-2xl mx-auto leading-relaxed">
              {currentBanner.description}
            </p>
            <a 
              href={currentBanner.link}
              className="bg-brand hover:bg-brand-dark text-white font-[900] text-lg py-5 px-14 rounded-2xl transition-all inline-flex items-center space-x-3 shadow-2xl shadow-brand/40 hover:scale-105 active:scale-95 group"
            >
              <span>{currentBanner.buttonText}</span>
              <svg className="w-6 h-6 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </a>
          </div>
        </div>
      </div>
      
      {banners.length > 1 && (
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex space-x-4 items-center">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-2.5 rounded-full transition-all duration-700 ${i === current ? 'bg-white w-14 shadow-lg' : 'bg-white/30 w-2.5'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
