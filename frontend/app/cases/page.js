"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Cases() {
  const [cases, setCases] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCases = async () => {
      try {
        const response = await fetch('/api/chat/sessions');
        if (response.ok) {
          const data = await response.json();
          setCases(data);
        }
      } catch (error) {
        console.error('Failed to fetch cases:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCases();
  }, []);

  return (
    <div style={{ padding: '30px', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 600, margin: '0 0 8px 0' }}>My Cases</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>Manage your active legal workspaces and document analyses.</p>
        </div>
        <Link href="/" style={{
          backgroundColor: '#ffffff',
          color: '#000000',
          padding: '10px 20px',
          borderRadius: '6px',
          fontWeight: 600,
          display: 'inline-block'
        }}>
          + New Case Workspace
        </Link>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <div className="typing-indicator">
            <div className="typing-dot"></div><div className="typing-dot"></div><div className="typing-dot"></div>
          </div>
        </div>
      ) : cases.length === 0 ? (
        <div className="empty-state" style={{ border: '1px solid var(--border)', borderRadius: '8px' }}>
          <div className="empty-state-icon">📁</div>
          <h2 className="empty-state-title">No Active Cases</h2>
          <p className="empty-state-desc">You haven't created any case workspaces yet. Start a new conversation to automatically generate a case workspace.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {cases.map((c) => (
            <Link href={`/cases/${c.id}`} key={c.id} style={{ 
              display: 'block',
              padding: '20px',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              backgroundColor: 'var(--background)',
              transition: 'border-color 0.2s',
              textDecoration: 'none',
              color: 'inherit'
            }}
            onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
            onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', fontWeight: 600 }}>{c.title}</h3>
                  <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    Created on {new Date(c.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div style={{ 
                  backgroundColor: 'var(--message-user-bg)', 
                  padding: '4px 8px', 
                  borderRadius: '4px', 
                  fontSize: '0.8rem',
                  color: 'var(--text-muted)'
                }}>
                  Workspace
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
