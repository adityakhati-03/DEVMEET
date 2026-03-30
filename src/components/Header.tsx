"use client"

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { User, Sun, Moon, Menu, X, Zap, LogOut, ChevronDown } from 'lucide-react';
import { useTheme } from 'next-themes';

const navLinks = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Create',    href: '/room/create-room' },
  { label: 'Join',      href: '/room/create-room?tab=join' },
  { label: 'Community', href: '/community' },
];

const Header = () => {
  const { data: session } = useSession();
  const pathname = usePathname();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  // Prevent hydration mismatch — theme is unknown on the server
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = mounted ? resolvedTheme === 'dark' : true;

  const toggleTheme = () => setTheme(isDark ? 'light' : 'dark');

  // Dynamic header style based on theme
  const headerStyle = isDark
    ? { background: 'rgba(8,10,15,0.92)', borderBottom: '1px solid rgba(255,255,255,0.04)' }
    : { background: 'rgba(250,250,252,0.95)', borderBottom: '1px solid rgba(0,0,0,0.06)' };

  const textColor   = isDark ? '#ffffff' : '#0a0a0f';
  const mutedColor  = isDark ? '#78716c' : '#6b7280';
  const accentColor = '#34d399';

  return (
    <header
      className="nsoc-header"
      style={{
        position: 'fixed', top: 0, left: 0, right: 0,
        zIndex: 100,
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        padding: '0 40px',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        transition: 'background 300ms, border-color 300ms',
        ...headerStyle,
      }}
    >
      {/* Logo */}
      <Link
        href={session ? '/dashboard' : '/'}
        style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0, marginRight: '40px', textDecoration: 'none' }}
      >
        <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Zap style={{ width: '16px', height: '16px', color: accentColor }} />
        </div>
        <span style={{ color: textColor, fontWeight: 800, fontSize: '18px', letterSpacing: '-0.5px' }}>DevMeet</span>
      </Link>

      {/* Centered nav links */}
      <nav style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} className="nsoc-header-nav">
        {navLinks.map(link => {
          const isActive = pathname === link.href || (link.href !== '/' && pathname?.startsWith(link.href));
          return (
            <Link
              key={link.href}
              href={link.href}
              style={{
                padding: '8px 20px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                textDecoration: 'none',
                transition: 'all 150ms',
                color: isActive ? accentColor : mutedColor,
                background: isActive ? 'rgba(52,211,153,0.1)' : 'transparent',
              }}
              className={isActive ? '' : 'nsoc-nav-link'}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* Right controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>

        {/* Theme toggle button */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          style={{
            width: '36px', height: '36px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: '8px',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'}`,
            background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
            color: mutedColor,
            cursor: 'pointer',
            transition: 'all 200ms',
          }}
          className="nsoc-icon-btn"
        >
          {mounted
            ? isDark
              ? <Sun style={{ width: '16px', height: '16px' }} />
              : <Moon style={{ width: '16px', height: '16px' }} />
            : <span style={{ width: '16px', height: '16px' }} />
          }
        </button>

        {/* User area */}
        {session ? (
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setUserMenuOpen(v => !v)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '4px 10px 4px 4px',
                borderRadius: '8px',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'}`,
                background: 'transparent',
                cursor: 'pointer',
                transition: 'all 150ms',
              }}
              className="nsoc-icon-btn"
            >
              {session.user?.image ? (
                <Image src={session.user.image} alt="Avatar" width={28} height={28}
                  style={{ borderRadius: '50%', border: `2px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}` }} />
              ) : (
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User style={{ width: '14px', height: '14px', color: accentColor }} />
                </div>
              )}
              <span style={{ fontSize: '14px', fontWeight: 600, color: textColor, maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                className="nsoc-header-nav">
                {session.user?.name || session.user?.email}
              </span>
              <ChevronDown style={{ width: '14px', height: '14px', color: mutedColor, transform: userMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 150ms' }}
                className="nsoc-header-nav" />
            </button>

            {userMenuOpen && (
              <div style={{
                position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                width: '208px',
                background: isDark ? '#0d0f14' : '#ffffff',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'}`,
                borderRadius: '10px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                padding: '8px 0',
                zIndex: 200,
              }}>
                <div style={{ padding: '10px 16px', borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}>
                  <p style={{ fontSize: '14px', fontWeight: 700, color: textColor, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{session.user?.name}</p>
                  <p style={{ fontSize: '12px', color: mutedColor, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{session.user?.email}</p>
                </div>
                <button
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', fontSize: '14px', color: '#f87171', background: 'transparent', border: 'none', cursor: 'pointer', transition: 'background 150ms' }}
                  onClick={() => { signOut(); setUserMenuOpen(false); }}
                  className="nsoc-signout-btn"
                >
                  <LogOut style={{ width: '14px', height: '14px' }} /> Sign out
                </button>
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} className="nsoc-header-nav">
            <Link href="/sign-in" style={{ padding: '7px 16px', fontSize: '14px', fontWeight: 600, color: mutedColor, borderRadius: '8px', textDecoration: 'none', border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'}`, transition: 'all 150ms' }}
              className="nsoc-nav-link">
              Sign in
            </Link>
            <Link href="/sign-up" style={{ padding: '7px 16px', fontSize: '14px', fontWeight: 700, color: '#080a0f', background: accentColor, borderRadius: '8px', textDecoration: 'none', transition: 'all 150ms' }}
              className="nsoc-cta-link">
              Sign up
            </Link>
          </div>
        )}

        {/* Mobile hamburger */}
        <button
          style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'}`, background: 'transparent', color: mutedColor, cursor: 'pointer' }}
          onClick={() => setMobileOpen(v => !v)}
          className="nsoc-mobile-btn nsoc-icon-btn"
          aria-label="Toggle mobile menu"
        >
          {mobileOpen ? <X style={{ width: '16px', height: '16px' }} /> : <Menu style={{ width: '16px', height: '16px' }} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div style={{
          position: 'absolute', top: '64px', left: 0, right: 0,
          background: isDark ? 'rgba(8,10,15,0.98)' : 'rgba(250,250,252,0.98)',
          backdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'}`,
          padding: '12px 16px',
          display: 'flex', flexDirection: 'column', gap: '4px',
          zIndex: 90,
        }}>
          {navLinks.map(link => {
            const isActive = pathname === link.href || (link.href !== '/' && pathname?.startsWith(link.href));
            return (
              <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)}
                style={{ padding: '10px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, textDecoration: 'none', color: isActive ? accentColor : mutedColor, background: isActive ? 'rgba(52,211,153,0.1)' : 'transparent' }}>
                {link.label}
              </Link>
            );
          })}
          {session ? (
            <button onClick={() => { signOut(); setMobileOpen(false); }}
              style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, color: '#f87171', background: 'transparent', border: 'none', cursor: 'pointer' }}>
              <LogOut style={{ width: '16px', height: '16px' }} /> Sign out
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <Link href="/sign-in" onClick={() => setMobileOpen(false)}
                style={{ flex: 1, textAlign: 'center', padding: '10px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, textDecoration: 'none', color: mutedColor, border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'}` }}>
                Sign in
              </Link>
              <Link href="/sign-up" onClick={() => setMobileOpen(false)}
                style={{ flex: 1, textAlign: 'center', padding: '10px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: 700, textDecoration: 'none', color: '#080a0f', background: accentColor }}>
                Sign up
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Header;