'use client';

import { useState, useEffect } from 'react';
import { AppLogo } from './app-logo';

export function SplashScreen({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(true);
  const [isFading, setIsFading] = useState(false);

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

          <div className="relative z-10 flex flex-col items-center space-y-5 p-8 text-center">
            {/* Custom vector bot logo with red accents and blinking animation */}
            <div className="relative w-24 h-24 rounded-2xl bg-gradient-to-br from-white to-[#FDF5F5] shadow-xl shadow-[#722F37]/25 flex items-center justify-center border-2 border-[#722F37] ring-4 ring-[#722F37]/15 p-3 overflow-hidden animate-[pulse_1.5s_cubic-bezier(0.4,0,0.6,1)_infinite]">
              <AppLogo className="w-16 h-16" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-[#722F37]">
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
