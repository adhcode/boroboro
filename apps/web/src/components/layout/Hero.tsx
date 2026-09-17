'use client';

import Image from 'next/image';

export function Hero() {
  return (
    <section className="relative min-h-[480px] lg:min-h-[620px] w-full overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src="/tent22.png"
          alt="Party tent rental at outdoor event"
          fill
          priority
          className="object-cover"
          style={{ objectPosition: '50% 75%' }}
          sizes="100vw"
        />
        
        {/* Dark gradient overlay - bottom third only */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.25) 40%, transparent 70%)'
          }}
        />
      </div>
      
      {/* Content - centered vertically using absolute positioning */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-full px-4 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="max-w-3xl mx-auto text-center">
              {/* Headline */}
              <h1 
                className="font-bold leading-tight mb-3 lg:mb-4"
                style={{ 
                  fontSize: 'clamp(28px, 6vw, 56px)',
                  color: '#FFFFFF',
                  textShadow: '0 2px 8px rgba(0, 0, 0, 0.45)'
                }}
              >
                Rent what you need, nearby.
              </h1>
              
              {/* Subheadline */}
              <p 
                className="text-[14px] lg:text-[22px] leading-relaxed mb-4 lg:mb-6 mx-auto max-w-2xl"
                style={{
                  color: '#F8FAF5',
                  textShadow: '0 2px 6px rgba(0, 0, 0, 0.35)'
                }}
              >
                Events, gadgets, tools — from people near you.
              </p>
              
              {/* Search Bar */}
              <div className="max-w-3xl mx-auto">
                <div className="flex items-center gap-3 px-4 lg:px-6 py-3 lg:py-4 bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl">
                  {/* Search Input */}
                  <div className="flex-1 flex items-center gap-3">
                    <svg className="w-5 h-5 text-neutral-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Search tents, drills, cameras..."
                      className="flex-1 text-[14px] lg:text-[16px] outline-none border-0 focus:border-0 focus:ring-0 bg-transparent placeholder:text-neutral-400 text-neutral-900 font-medium"
                    />
                  </div>
                  
                  {/* Divider */}
                  <div className="h-8 w-px bg-neutral-300" />
                  
                  {/* Location */}
                  <div className="flex items-center gap-2 min-w-[140px]">
                    <svg className="w-5 h-5 text-neutral-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Ikeja, Lagos"
                      className="flex-1 text-[14px] lg:text-[16px] outline-none border-0 focus:border-0 focus:ring-0 bg-transparent placeholder:text-neutral-400 text-neutral-900 font-medium"
                    />
                  </div>
                  
                  {/* Search Button */}
                  <button className="w-12 h-12 bg-coral-500 hover:bg-coral-600 active:bg-coral-700 rounded-xl flex items-center justify-center transition-colors shadow-lg flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
