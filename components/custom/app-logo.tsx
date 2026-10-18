export function AppLogo({ className = "w-12 h-12" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Robot Antenna */}
      <line x1="50" y1="18" x2="50" y2="30" stroke="#722F37" strokeWidth="5" strokeLinecap="round" />
      <circle cx="50" cy="13" r="6" className="animate-pulse" fill="#E74C3C" />

      {/* Robot Head Body (Neutral/white background, not red shape) */}
      <rect x="18" y="28" width="64" height="54" rx="16" fill="#FFFFFF" stroke="#722F37" strokeWidth="4.5" />

      {/* Robot Screen / Face */}
      <rect x="25" y="36" width="50" height="38" rx="8" fill="#1E1E2F" />

      {/* Left Glowing Red Eye */}
      <circle cx="41" cy="52" r="6.5" fill="#E74C3C" className="animate-pulse" />
      <circle cx="41" cy="52" r="2.5" fill="#FFFFFF" />

      {/* Right Glowing Red Eye */}
      <circle cx="59" cy="52" r="6.5" fill="#E74C3C" className="animate-pulse" />
      <circle cx="59" cy="52" r="2.5" fill="#FFFFFF" />

      {/* Smiling / Trading Trend Mouth (Red Accent) */}
      <path
        d="M 40 63 Q 50 71 60 63"
        stroke="#E74C3C"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Left Ear with Red Accent */}
      <rect x="8" y="46" width="10" height="18" rx="3" fill="#722F37" />
      <circle cx="13" cy="55" r="2" fill="#E74C3C" />

      {/* Right Ear with Red Accent */}
      <rect x="82" y="46" width="10" height="18" rx="3" fill="#722F37" />
      <circle cx="87" cy="55" r="2" fill="#E74C3C" />
    </svg>
  );
}
