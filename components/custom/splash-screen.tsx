'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useLogoSrc } from './logo-src-provider';

export function SplashScreen({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(true);
  const [isFading, setIsFading] = useState(false);
  const logoSrc = useLogoSrc();

  useEffect(() => {
    // 6 seconds splash duration
    const timer = setTimeout(() => {
      setIsFading(true);
      const hideTimer = setTimeout(() => {
        setShowSplash(false);
      }, 600); // 600ms fade out transition
      return () => clearTimeout(hideTimer);
    }, 6000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {showSplash && (
        <div
          className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#FAF5F5] text-[#722F37] transition-opacity duration-600 ${
            isFading ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        >
          {/* Subtle red wine blur ambient glow effect */}
          <div className="absolute w-80 h-80 rounded-full bg-[#722F37]/15 blur-3xl pointer-events-none animate-pulse" />
          <div className="absolute w-[30rem] h-[30rem] -top-20 -left-20 rounded-full bg-[#A93226]/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center space-y-6 p-8 text-center">
            {/* Blinking / pulsing logo container */}
            <div className="relative w-36 h-36 rounded-3xl bg-white shadow-2xl flex items-center justify-center border border-[#722F37]/25 p-5 overflow-hidden animate-[pulse_1.5s_cubic-bezier(0.4,0,0.6,1)_infinite]">
              {logoSrc ? (
                <Image
                  src={logoSrc}
                  alt="G-Squad Logo"
                  fill
                  className="object-contain p-3"
                  referrerPolicy="no-referrer"
                  priority
                />
              ) : (
                <span className="text-5xl font-extrabold tracking-wider text-[#722F37]">GS</span>
              )}
            </div>
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight text-[#722F37]">
                G-Squad
              </h1>
            </div>
          </div>
        </div>
      )}
      {children}
    </>
  );
}
