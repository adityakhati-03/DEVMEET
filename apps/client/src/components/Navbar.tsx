import { Link, useNavigate } from 'react-router-dom';
import { Sun, Moon, Plus, LogIn, LayoutDashboard, Users, User } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import DevMeetLogo from './DevMeetLogo';

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <nav style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: '64px',
      background: 'var(--dm-bg)',
      borderBottom: '4px solid var(--dm-border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      zIndex: 1000,
      boxShadow: '0 4px 0 rgba(0,0,0,0.05)',
      transition: 'var(--dm-transition)'
    }}>
      {/* Left: Logo & Name */}
      <Link to={user ? "/dashboard" : "/"} style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none', color: 'var(--dm-text)' }}>
        <DevMeetLogo size={24} />
        <span style={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 800, fontSize: '20px', letterSpacing: '-0.02em', textTransform: 'uppercase' }}>
          DevMeet
        </span>
      </Link>

      {/* Center: Links / Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        {user ? (
          <>
            <Link to="/dashboard" className="dm-btn-ghost" style={{ padding: '8px 16px', fontSize: '13px' }}>
              <LayoutDashboard size={16} /> Dashboard
            </Link>
            <Link to="/community" className="dm-btn-ghost" style={{ padding: '8px 16px', fontSize: '13px' }}>
              <Users size={16} /> Community
            </Link>
            <Link to="/community?tab=friends" className="dm-btn-ghost" style={{ padding: '8px 16px', fontSize: '13px' }}>
              <Users size={16} /> Friends
            </Link>
            <Link to="/create-room" className="dm-btn-primary" style={{ padding: '8px 16px', fontSize: '13px' }}>
              <Plus size={16} /> Create
            </Link>
            <Link to="/join-room" className="dm-btn-ghost" style={{ padding: '8px 16px', fontSize: '13px' }}>
              <LogIn size={16} /> Join
            </Link>
          </>
        ) : (
          <>
            <Link to="/login" className="dm-btn-ghost" style={{ padding: '8px 16px', fontSize: '13px' }}>Sign In</Link>
            <Link to="/signup" className="dm-btn-primary" style={{ padding: '8px 16px', fontSize: '13px' }}>Get Started</Link>
          </>
        )}
      </div>

      {/* Right: Theme Toggle & More */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button 
          onClick={toggleTheme}
          style={{ 
            background: 'var(--dm-card)', 
            border: '2px solid var(--dm-border)', 
            color: 'var(--dm-text)',
            cursor: 'pointer',
            padding: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'var(--dm-transition)',
            boxShadow: '2px 2px 0px rgba(0,0,0,0.1)'
          }}
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link to="/profile" style={{ color: 'var(--dm-text)', display: 'flex', alignItems: 'center' }} title="Profile">
              <User size={20} />
            </Link>
            <button 
              onClick={() => { logout(); navigate('/'); }}
              style={{ background: 'transparent', border: 'none', color: '#ef4444', fontWeight: 700, fontFamily: '"JetBrains Mono", monospace', fontSize: '13px', cursor: 'pointer', textTransform: 'uppercase' }}
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
