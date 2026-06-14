import React from 'react';

interface DevMeetLogoProps {
  size?: number;
  className?: string;
}

export default function DevMeetLogo({ size = 24, className = '' }: DevMeetLogoProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ minWidth: size, minHeight: size }}
    >
      {/* Outer Border */}
      <rect x="5" y="5" width="90" height="90" fill="transparent" stroke="currentColor" strokeWidth="10" />
      
      {/* Greater Than Sign */}
      <text 
        x="24" 
        y="68" 
        fontFamily="'JetBrains Mono', monospace" 
        fontSize="52" 
        fontWeight="900" 
        fill="currentColor"
      >
        &gt;
      </text>
      
      {/* Yellow Cursor */}
      <rect x="62" y="58" width="20" height="12" fill="#facc15" />
    </svg>
  );
}
