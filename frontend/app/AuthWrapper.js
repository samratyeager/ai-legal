"use client";

import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export const SessionContext = createContext(null);
export const useSession = () => useContext(SessionContext);

export default function AuthWrapper({ children }) {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [authTab, setAuthTab] = useState('login'); // 'login' | 'register'
  const [chatSessions, setChatSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const pathname = usePathname();
  const router = useRouter();

  // Sidebar & Search State
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isLogoHovered, setIsLogoHovered] = useState(false);

  // Form State
  const [email, setEmail] = useState('advocate@law.com');
  const [password, setPassword] = useState('password123');
  const [name, setName] = useState('');
  const [role, setRole] = useState('Legal Counsel / Advocate');
  const [errorMessage, setErrorMessage] = useState('');

  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch('/api/chat/sessions');
      if (res.ok) {
        const data = await res.json();
        setChatSessions(data);
      }
    } catch (e) {
      console.error('Session fetch error:', e);
    }
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('legal_user');
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAuthChecked(true);
    }
  }, []);

  useEffect(() => {
    if (user) fetchSessions();
  }, [user, fetchSessions]);

  const handleLogin = (e) => {
    if (e) e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please provide both email and password.');
      return;
    }

    const userData = {
      name: email === 'advocate@law.com' ? 'Advocate Legal Counsel' : email.split('@')[0],
      email: email.trim(),
      role: 'Legal Practitioner',
      joined: new Date().toLocaleDateString()
    };

    localStorage.setItem('legal_user', JSON.stringify(userData));
    setUser(userData);
    setErrorMessage('');
  };

  const handleRegister = (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      setErrorMessage('Please fill in all registration fields.');
      return;
    }

    const userData = {
      name: name.trim(),
      email: email.trim(),
      role: role.trim(),
      joined: new Date().toLocaleDateString()
    };

    localStorage.setItem('legal_user', JSON.stringify(userData));
    setUser(userData);
    setErrorMessage('');
  };

  const handleQuickDemo = () => {
    const demoUser = {
      name: 'Advocate Legal Counsel',
      email: 'advocate@law.com',
      role: 'Elite Legal Counsel',
      joined: new Date().toLocaleDateString()
    };
    localStorage.setItem('legal_user', JSON.stringify(demoUser));
    setUser(demoUser);
  };

  const handleDeleteSession = async (e, sessionId) => {
    e.stopPropagation();
    try {
      await fetch(`/api/chat/sessions/${sessionId}`, { method: 'DELETE' });
      setChatSessions(prev => prev.filter(s => s.id !== sessionId));
      if (activeSessionId === sessionId) setActiveSessionId(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSelectSession = (sessionId) => {
    setActiveSessionId(sessionId);
    if (pathname !== '/') {
      router.push('/');
    }
  };

  const handleNewChat = () => {
    setActiveSessionId(null);
    if (pathname !== '/') {
      router.push('/');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('legal_user');
    setUser(null);
  };

  if (!authChecked) {
    return (
      <div style={{ height: '100vh', width: '100vw', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="typing-indicator">
          <div className="typing-dot"></div><div className="typing-dot"></div><div className="typing-dot"></div>
        </div>
      </div>
    );
  }

  // If user is not logged in, render the Glassmorphism Auth Modal
  if (!user) {
    return (
      <div className="auth-overlay">
        <div className="auth-glass-card">
          <div className="auth-header">
            <div className="auth-logo-badge">⚖️</div>
            <h1 className="auth-title">AI Legal Assistant</h1>
            <p className="auth-subtitle">Nepal Legal Research & Case Management Platform</p>
          </div>

          <div className="auth-tabs">
            <button 
              className={`auth-tab ${authTab === 'login' ? 'active' : ''}`}
              onClick={() => { setAuthTab('login'); setErrorMessage(''); }}
            >
              Sign In
            </button>
            <button 
              className={`auth-tab ${authTab === 'register' ? 'active' : ''}`}
              onClick={() => { setAuthTab('register'); setErrorMessage(''); }}
            >
              Register Account
            </button>
          </div>

          {errorMessage && (
            <div style={{ background: '#291010', border: '1px solid #4a1c1c', color: '#f87171', padding: '8px 12px', borderRadius: '6px', fontSize: '0.8rem', marginBottom: '14px' }}>
              {errorMessage}
            </div>
          )}

          {authTab === 'login' ? (
            <form onSubmit={handleLogin}>
              <div className="auth-input-group">
                <label className="auth-label">Email Address</label>
                <input 
                  type="email" 
                  className="auth-input" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder="name@law.com" 
                  required 
                />
              </div>

              <div className="auth-input-group">
                <label className="auth-label">Password</label>
                <input 
                  type="password" 
                  className="auth-input" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="••••••••" 
                  required 
                />
              </div>

              <button type="submit" className="auth-submit-btn">
                Enter Assistant →
              </button>

              <div className="auth-demo-badge">
                <div>
                  <div style={{ fontWeight: 600, color: '#ffffff' }}>Demo Account Ready</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>advocate@law.com</div>
                </div>
                <button 
                  type="button" 
                  onClick={handleQuickDemo}
                  style={{ background: '#222', border: '1px solid #444', color: '#ffffff', padding: '4px 10px', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
                >
                  ⚡ 1-Click Login
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister}>
              <div className="auth-input-group">
                <label className="auth-label">Full Name</label>
                <input 
                  type="text" 
                  className="auth-input" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="Advocate Rajesh Sharma" 
                  required 
                />
              </div>

              <div className="auth-input-group">
                <label className="auth-label">Email Address</label>
                <input 
                  type="email" 
                  className="auth-input" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder="name@law.com" 
                  required 
                />
              </div>

              <div className="auth-input-group">
                <label className="auth-label">Role / Practice Area</label>
                <input 
                  type="text" 
                  className="auth-input" 
                  value={role} 
                  onChange={(e) => setRole(e.target.value)} 
                  placeholder="Civil & Commercial Advocate" 
                />
              </div>

              <div className="auth-input-group">
                <label className="auth-label">Create Password</label>
                <input 
                  type="password" 
                  className="auth-input" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="••••••••" 
                  required 
                />
              </div>

              <button type="submit" className="auth-submit-btn">
                Create Account & Enter →
              </button>
            </form>
          )}

        </div>
      </div>
    );
  }

  const filteredSessions = searchQuery.trim()
    ? chatSessions.filter(s => (s.title || 'Legal Consultation').toLowerCase().includes(searchQuery.toLowerCase()))
    : chatSessions;

  // If user is authenticated, render the app layout
  return (
    <div className="app-container">
      <aside
        className="sidebar"
        style={{
          width: isSidebarOpen ? '260px' : '52px',
          minWidth: isSidebarOpen ? '260px' : '52px',
          transition: 'width 0.28s cubic-bezier(0.16, 1, 0.3, 1), min-width 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          background: '#000000',
          borderRight: '1px solid #1a1a1a',
          overflow: 'hidden',
          position: 'relative',
          userSelect: 'none',
        }}
      >
        {isSidebarOpen ? (
          /* ================= EXPANDED SIDEBAR ================= */
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '260px' }}>
            {/* Header: Title + Search & Close Sidebar buttons */}
            <div style={{ flexShrink: 0, padding: '16px 12px 6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px 12px' }}>
                <span style={{ fontSize: '0.95rem', fontWeight: 700, letterSpacing: '-0.3px', color: '#fff' }}>
                  AI Legal Assistant
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {/* Search Icon */}
                  <button
                    onClick={() => setIsSearchOpen(prev => !prev)}
                    title="Search chats"
                    style={{
                      background: isSearchOpen ? 'rgba(255,255,255,0.12)' : 'transparent',
                      border: 'none',
                      borderRadius: '6px',
                      color: isSearchOpen ? '#fff' : '#888',
                      cursor: 'pointer',
                      padding: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseOver={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
                    onMouseOut={e => {
                      if (!isSearchOpen) {
                        e.currentTarget.style.color = '#888';
                        e.currentTarget.style.background = 'transparent';
                      }
                    }}
                  >
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  </button>

                  {/* Close Sidebar Icon */}
                  <button
                    onClick={() => setIsSidebarOpen(false)}
                    title="Close sidebar"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      borderRadius: '6px',
                      color: '#888',
                      cursor: 'pointer',
                      padding: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseOver={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
                    onMouseOut={e => { e.currentTarget.style.color = '#888'; e.currentTarget.style.background = 'transparent' }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="3"/><line x1="9" y1="3" x2="9" y2="21"/></svg>
                  </button>
                </div>
              </div>

              {/* Collapsible Search Input */}
              {isSearchOpen && (
                <div style={{ marginBottom: '10px', padding: '0 4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', background: '#161616', border: '1px solid #333', borderRadius: '6px', padding: '4px 8px', gap: '6px' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    <input
                      type="text"
                      placeholder="Search chats..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      autoFocus
                      style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '0.82rem', outline: 'none', width: '100%' }}
                    />
                    {searchQuery && (
                      <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: '0.75rem', padding: '0 2px' }}>✕</button>
                    )}
                  </div>
                </div>
              )}

              {/* Sticky New Chat button */}
              <button
                onClick={handleNewChat}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid #2a2a2a',
                  color: '#e8e8e8',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  width: '100%',
                  transition: 'all 0.18s ease',
                }}
                onMouseOver={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.13)';
                  e.currentTarget.style.borderColor = '#444';
                  e.currentTarget.style.boxShadow = '0 0 14px rgba(255,255,255,0.06)';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
                  e.currentTarget.style.borderColor = '#2a2a2a';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                New Chat
              </button>
            </div>

            {/* Sticky nav links */}
            <div style={{ flexShrink: 0, padding: '4px 12px 6px' }}>
              <Link href="/case-studies" className="nav-link">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                Case Studies
              </Link>
              <Link href="/hearings" className="nav-link">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                Court Hearings (Tarikh)
              </Link>
              <Link href="/drafts-evidence" className="nav-link">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
                Drafts & Evidence
              </Link>
              <Link href="/settings" className="nav-link">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                Settings
              </Link>
            </div>

            {/* Scrollable Chat History */}
            <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '6px 12px 0', scrollbarWidth: 'thin', scrollbarColor: '#222 transparent' }}>
              {filteredSessions.length > 0 ? (
                <>
                  <div style={{ fontSize: '0.68rem', color: '#555', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '6px', paddingLeft: '4px', paddingTop: '4px' }}>
                    Chat History
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                    {filteredSessions.map(s => (
                      <div
                        key={s.id}
                        onClick={() => handleSelectSession(s.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '7px 8px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          background: activeSessionId === s.id ? '#1c1c1c' : 'transparent',
                          transition: 'background 0.12s ease',
                        }}
                        onMouseOver={e => { if (activeSessionId !== s.id) e.currentTarget.style.background = '#111' }}
                        onMouseOut={e => { if (activeSessionId !== s.id) e.currentTarget.style.background = 'transparent' }}
                      >
                        <span style={{ fontSize: '0.82rem', color: activeSessionId === s.id ? '#f0f0f0' : '#999', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', flex: 1, lineHeight: '1.3' }}>
                          {s.title || 'Legal Consultation'}
                        </span>
                        <button
                          onClick={(e) => handleDeleteSession(e, s.id)}
                          title="Delete"
                          style={{ background: 'none', border: 'none', color: 'transparent', cursor: 'pointer', padding: '2px 4px', flexShrink: 0, fontSize: '0.7rem' }}
                          onMouseOver={e => { e.currentTarget.style.color = '#f87171' }}
                          onMouseOut={e => { e.currentTarget.style.color = 'transparent' }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              ) : searchQuery ? (
                <div style={{ padding: '16px 8px', color: '#555', fontSize: '0.78rem', textAlign: 'center' }}>
                  No matching chats found
                </div>
              ) : null}
            </div>

            {/* Sticky profile footer */}
            <div className="sidebar-footer" style={{ flexShrink: 0, padding: '14px 16px' }}>
              <div className="profile-section" style={{ justifyContent: 'space-between', width: '100%', marginTop: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div className="profile-avatar">⚖️</div>
                  <div className="profile-info">
                    <span className="profile-name" style={{ maxWidth: '120px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {user.name}
                    </span>
                    <span className="profile-tier">{user.email}</span>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  title="Sign Out"
                  style={{ background: 'none', border: 'none', color: '#777', cursor: 'pointer', padding: '6px', display: 'flex', alignItems: 'center' }}
                  onMouseOver={(e) => e.currentTarget.style.color = '#f87171'}
                  onMouseOut={(e) => e.currentTarget.style.color = '#777'}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ================= COLLAPSED STRIP (ChatGPT Style) ================= */
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', width: '52px', padding: '14px 0', justifyContent: 'space-between' }}>
            {/* Top Icons */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', width: '100%' }}>
              {/* Logo / Open Sidebar Swap Button */}
              <button
                onClick={() => setIsSidebarOpen(true)}
                onMouseEnter={() => setIsLogoHovered(true)}
                onMouseLeave={() => setIsLogoHovered(false)}
                title="Open sidebar"
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: isLogoHovered ? 'rgba(255,255,255,0.12)' : 'transparent',
                  border: 'none',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                  fontSize: '1.2rem',
                }}
              >
                {isLogoHovered ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="3"/><line x1="9" y1="3" x2="9" y2="21"/><polyline points="13 9 16 12 13 15"/></svg>
                ) : (
                  <span style={{ fontSize: '1.15rem' }}>⚖️</span>
                )}
              </button>

              {/* New Chat Icon Button */}
              <button
                onClick={handleNewChat}
                title="New chat"
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'transparent',
                  border: 'none',
                  color: '#999',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseOver={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
                onMouseOut={e => { e.currentTarget.style.color = '#999'; e.currentTarget.style.background = 'transparent' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>

              {/* Search Icon Button */}
              <button
                onClick={() => {
                  setIsSidebarOpen(true);
                  setIsSearchOpen(true);
                }}
                title="Search chats"
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'transparent',
                  border: 'none',
                  color: '#999',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseOver={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
                onMouseOut={e => { e.currentTarget.style.color = '#999'; e.currentTarget.style.background = 'transparent' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              </button>

              {/* Chat History Quick Open Button */}
              <button
                onClick={() => setIsSidebarOpen(true)}
                title="Chat history"
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'transparent',
                  border: 'none',
                  color: '#999',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseOver={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
                onMouseOut={e => { e.currentTarget.style.color = '#999'; e.currentTarget.style.background = 'transparent' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              </button>
            </div>

            {/* Bottom Profile Avatar Button */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <div
                title={`${user.name} (${user.email})`}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: '#222',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  border: '1px solid #333',
                }}
                onClick={() => setIsSidebarOpen(true)}
              >
                ⚖️
              </div>
            </div>
          </div>
        )}
      </aside>

      <SessionContext.Provider value={{ activeSessionId, setActiveSessionId, fetchSessions, isSidebarOpen, setIsSidebarOpen }}>
        <main className="main-content" style={{ transition: 'margin 0.28s ease, width 0.28s ease' }}>
          {children}
        </main>
      </SessionContext.Provider>
    </div>
  );
}

