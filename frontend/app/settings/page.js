"use client";

import { useState, useEffect } from 'react';

export default function Settings() {
  const [user, setUser] = useState({
    name: 'Advocate Legal Counsel',
    email: 'advocate@law.com',
    role: 'Elite Legal Counsel',
    joined: '2026-10-01'
  });
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('legal_user');
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleUpdate = (e) => {
    e.preventDefault();
    localStorage.setItem('legal_user', JSON.stringify(user));
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleLogout = () => {
    localStorage.removeItem('legal_user');
    window.location.reload();
  };

  return (
    <div style={{ padding: '36px 40px', maxWidth: '750px', margin: '0 auto', width: '100%' }}>
      <h1 style={{ fontSize: '1.8rem', fontWeight: 700, margin: '0 0 8px 0', color: '#ffffff' }}>Account & Profile Settings</h1>
      <p style={{ color: 'var(--text-muted)', margin: '0 0 30px 0', fontSize: '0.95rem' }}>
        Manage your user profile credentials and active session.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* User Profile Card */}
        <div style={{ background: '#080808', border: '1px solid var(--border)', borderRadius: '12px', padding: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', borderBottom: '1px solid #1a1a1a', paddingBottom: '20px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#181818', border: '1px solid #333', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem' }}>
              ⚖️
            </div>
            <div>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '1.2rem', color: '#ffffff' }}>{user.name}</h3>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{user.email} &bull; {user.role}</span>
            </div>
          </div>

          <form onSubmit={handleUpdate} style={{ display: 'grid', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: '#bbb', marginBottom: '6px' }}>Full Name</label>
              <input 
                type="text" 
                className="filter-search-input" 
                style={{ width: '100%' }}
                value={user.name} 
                onChange={(e) => setUser({ ...user, name: e.target.value })} 
                required 
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: '#bbb', marginBottom: '6px' }}>Email Address</label>
              <input 
                type="email" 
                className="filter-search-input" 
                style={{ width: '100%' }}
                value={user.email} 
                onChange={(e) => setUser({ ...user, email: e.target.value })} 
                required 
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: '#bbb', marginBottom: '6px' }}>Practice Designation / Role</label>
              <input 
                type="text" 
                className="filter-search-input" 
                style={{ width: '100%' }}
                value={user.role} 
                onChange={(e) => setUser({ ...user, role: e.target.value })} 
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '8px' }}>
              <button 
                type="submit"
                style={{
                  background: '#ffffff',
                  color: '#000000',
                  border: 'none',
                  padding: '10px 22px',
                  borderRadius: '6px',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  cursor: 'pointer'
                }}
              >
                Save Profile Changes
              </button>
              {isSaved && <span style={{ color: '#63d168', fontSize: '0.85rem', fontWeight: 500 }}>✓ Profile updated successfully</span>}
            </div>
          </form>
        </div>

        {/* System & Session Card */}
        <div style={{ background: '#080808', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', color: '#ffffff' }}>Account Session</h4>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Logged in as <strong style={{ color: '#fff' }}>{user.email}</strong>. Terminate your active session.
            </p>
          </div>

          <button 
            onClick={handleLogout}
            style={{
              background: '#201010',
              border: '1px solid #451a1a',
              color: '#f87171',
              padding: '10px 20px',
              borderRadius: '6px',
              fontWeight: 600,
              fontSize: '0.88rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span>🚪</span>
            <span>Sign Out / Logout</span>
          </button>
        </div>

      </div>
    </div>
  );
}
