'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { 
  LayoutDashboard, FolderOpen, UsersRound,
  Bookmark, User, Activity, Settings, HelpCircle, LogOut, UserPlus
} from 'lucide-react';

const mainNav = [
  { name: 'Dashboard',  href: '/dashboard',          icon: LayoutDashboard },
  { name: 'My Rooms',   href: '/dashboard/hosted',   icon: FolderOpen },
  { name: 'Friends',    href: '/dashboard/friends',  icon: UserPlus },
  { name: 'Community',  href: '/community',           icon: UsersRound },
  { name: 'Saved',      href: '/dashboard/saved',    icon: Bookmark },
];

const bottomNav = [
  { name: 'Profile',   href: '/dashboard/profile',  icon: User },
  { name: 'Activity',  href: '/dashboard/activity', icon: Activity },
  { name: 'Settings',  href: '/dashboard/settings', icon: Settings },
  { name: 'Help',      href: '/help',                icon: HelpCircle },
];

const COLLAPSED = 68;
const EXPANDED  = 220;

const navItemStyle = (isActive: boolean): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '11px 14px',
  borderRadius: '10px',
  fontWeight: 600,
  transition: 'all 150ms',
  minWidth: `${EXPANDED - 16}px`,
  textDecoration: 'none',
  background: isActive ? 'rgba(52,211,153,0.1)' : 'transparent',
  color: isActive ? '#34d399' : '#78716c',
});

const iconStyle = (isActive: boolean): React.CSSProperties => ({
  width: '20px', height: '20px', flexShrink: 0,
  color: isActive ? '#34d399' : '#78716c',
});

const labelStyle: React.CSSProperties = {
  whiteSpace: 'nowrap', fontSize: '14px',
  opacity: 0, transition: 'opacity 200ms ease 75ms',
};

const Sidebar = () => {
  const pathname = usePathname();
  const active = (href: string) => pathname === href || (href !== '/dashboard' && pathname?.startsWith(href));

  return (
    <aside
      className="nsoc-sidebar"
      style={{
        position: 'fixed', left: 0, top: 0,
        height: '100vh', zIndex: 40,
        width: `${COLLAPSED}px`,
        paddingTop: '64px',
        backgroundColor: '#080a0f',
        borderRight: '1px solid rgba(255,255,255,0.05)',
        overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        transition: 'width 300ms ease-in-out',
      }}
    >
      {/* Main nav */}
      <nav style={{ flex: 1, padding: '16px 8px', display: 'flex', flexDirection: 'column', gap: '2px', overflowY: 'auto', overflowX: 'hidden' }}>
        {mainNav.map(item => (
          <Link key={item.name} href={item.href} title={item.name}
            className="sidebar-nav-item" style={navItemStyle(active(item.href))}>
            <item.icon style={iconStyle(active(item.href))} />
            <span className="sidebar-label" style={labelStyle}>{item.name}</span>
          </Link>
        ))}
      </nav>

      {/* Divider */}
      <div style={{ margin: '4px 14px', borderTop: '1px solid rgba(255,255,255,0.05)', minWidth: `${EXPANDED - 28}px` }} />

      {/* Bottom nav */}
      <nav style={{ padding: '8px 8px 16px', display: 'flex', flexDirection: 'column', gap: '2px', overflowX: 'hidden' }}>
        {bottomNav.map(item => (
          <Link key={item.name} href={item.href} title={item.name}
            className="sidebar-nav-item" style={navItemStyle(active(item.href))}>
            <item.icon style={iconStyle(active(item.href))} />
            <span className="sidebar-label" style={labelStyle}>{item.name}</span>
          </Link>
        ))}

        {/* Logout */}
        <button
          title="Logout"
          onClick={() => signOut({ callbackUrl: '/sign-in' })}
          className="sidebar-nav-item"
          style={{ ...navItemStyle(false), border: 'none', cursor: 'pointer', width: '100%' }}
        >
          <LogOut style={{ width: '20px', height: '20px', flexShrink: 0, color: '#78716c' }} />
          <span className="sidebar-label" style={{ ...labelStyle, color: '#f87171' }}>Logout</span>
        </button>
      </nav>
    </aside>
  );
};

export default Sidebar;
