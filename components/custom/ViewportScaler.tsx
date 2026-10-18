'use client';

/**
 * Viewport wrapper that enables smooth, natural scrolling on all viewport sizes
 * without layout-thrashing ResizeObservers, transform scaling, or frozen overflow bugs.
 */
export default function ViewportScaler({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full min-h-dvh flex flex-col">
      {children}
    </div>
  );
}
