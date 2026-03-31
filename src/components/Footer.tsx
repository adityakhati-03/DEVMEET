// components/Footer.tsx
"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';

const Footer: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <footer style={{
      background: 'rgba(8,10,15,0.8)',
      backdropFilter: 'blur(12px)',
      borderTop: '1px solid rgba(255,255,255,0.04)',
      padding: '40px 24px',
      marginTop: 'auto',
      textAlign: 'center'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <p style={{
          fontSize: '14px',
          color: '#78716c',
          fontWeight: 500,
          margin: 0
        }}>
          &copy; {mounted ? new Date().getFullYear() : '2026'} <span style={{ color: '#34d399', fontWeight: 700 }}>DevMeet</span>. All rights reserved.
        </p>
        
        <ul style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '24px',
          marginTop: '16px',
          listStyle: 'none',
          padding: 0
        }}>
          <li>
            <Link href="/privacy" style={{ color: '#78716c', fontSize: '13px', textDecoration: 'none', transition: 'color 0.2s' }} className="nsoc-nav-link">
              Privacy Policy
            </Link>
          </li>
          <li>
            <Link href="/terms" style={{ color: '#78716c', fontSize: '13px', textDecoration: 'none', transition: 'color 0.2s' }} className="nsoc-nav-link">
              Terms of Service
            </Link>
          </li>
          <li>
            <Link href="/docs" style={{ color: '#78716c', fontSize: '13px', textDecoration: 'none', transition: 'color 0.2s' }} className="nsoc-nav-link">
              Documentation
            </Link>
          </li>
        </ul>
      </div>
    </footer>
  );
};

export default Footer;