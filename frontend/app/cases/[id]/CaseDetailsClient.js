"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function CaseDetailsClient({ caseId }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [caseData, setCaseData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!caseId) return;
    const fetchCaseDetails = async () => {
      try {
        const response = await fetch(`/api/chat/sessions/${caseId}`);
        if (response.ok) {
          const data = await response.json();
          setCaseData(data);
        }
      } catch (error) {
        console.error('Failed to fetch case details:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCaseDetails();
  }, [caseId]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <div className="typing-indicator">
          <div className="typing-dot"></div><div className="typing-dot"></div><div className="typing-dot"></div>
        </div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">⚠️</div>
        <h1 className="empty-state-title">Case Not Found</h1>
        <p className="empty-state-desc">The requested case workspace does not exist or has been deleted.</p>
        <Link href="/cases" style={{ marginTop: '20px', display: 'inline-block', color: 'var(--foreground)', fontWeight: 500 }}>← Back to My Cases</Link>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'history', label: 'Conversation History' },
    { id: 'analysis', label: 'AI Analysis & Points' },
    { id: 'timeline', label: 'Case Timeline' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '30px 30px 0', borderBottom: '1px solid var(--border)' }}>
        <div style={{ marginBottom: '12px' }}>
          <Link href="/cases" style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textDecoration: 'none' }}>
            ← Back to Cases
          </Link>
        </div>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 600, margin: '0 0 8px 0' }}>{caseData.title}</h1>
        <p style={{ color: 'var(--text-muted)', margin: '0 0 20px 0', fontSize: '0.9rem' }}>
          Workspace #{caseData.id} &bull; Created {new Date(caseData.created_at).toLocaleString()}
        </p>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '20px' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '10px 4px',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid var(--accent)' : '2px solid transparent',
                color: activeTab === tab.id ? 'var(--foreground)' : 'var(--text-muted)',
                fontWeight: activeTab === tab.id ? 600 : 400,
                cursor: 'pointer',
                fontSize: '0.95rem',
                transition: 'all 0.2s'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '30px', backgroundColor: 'var(--sidebar-bg)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>

          {activeTab === 'overview' && (
            <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: '1fr 1fr' }}>
              <div style={{ backgroundColor: 'var(--background)', padding: '24px', borderRadius: '8px', border: '1px solid var(--border)', gridColumn: '1 / -1' }}>
                <h3 style={{ margin: '0 0 12px 0' }}>Workspace Status</h3>
                <p style={{ color: 'var(--text-muted)', lineHeight: 1.7, margin: 0 }}>
                  This workspace contains <strong>{caseData.messages.length} interactions</strong>. Upload legal documents (PDF, DOCX) to automatically generate timelines and extract strong/weak points.
                </p>
                <button style={{ backgroundColor: 'var(--accent)', color: 'var(--background)', border: 'none', padding: '10px 20px', borderRadius: '6px', fontWeight: 500, marginTop: '16px', cursor: 'pointer' }}>
                  Upload Document
                </button>
              </div>

              <div style={{ backgroundColor: 'var(--background)', padding: '24px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <h3 style={{ margin: '0 0 12px 0' }}>Uploaded Documents</h3>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', padding: '20px 0', textAlign: 'center' }}>No documents uploaded yet</div>
              </div>

              <div style={{ backgroundColor: 'var(--background)', padding: '24px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <h3 style={{ margin: '0 0 12px 0' }}>AI Provider</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>⚖️</div>
                  <div>
                    <div style={{ fontWeight: 600 }}>Nepal Legal Assistant</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Powered by Groq</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div style={{ backgroundColor: 'var(--background)', borderRadius: '8px', border: '1px solid var(--border)', overflow: 'hidden' }}>
              <div style={{ padding: '20px', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--sidebar-bg)' }}>
                <h3 style={{ margin: 0 }}>Conversation Transcript</h3>
              </div>
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {caseData.messages.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>No messages in this session.</p>
                ) : (
                  caseData.messages.map((msg, idx) => (
                    <div key={idx} style={{
                      padding: '16px',
                      backgroundColor: msg.role === 'user' ? 'var(--message-user-bg)' : 'var(--message-ai-bg)',
                      border: msg.role === 'ai' ? '1px solid var(--border)' : 'none',
                      borderRadius: '6px'
                    }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>
                        {msg.role === 'user' ? 'You' : 'AI Assistant'}
                      </div>
                      <div style={{ lineHeight: 1.6, fontSize: '0.95rem', whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'analysis' && (
            <div style={{ display: 'grid', gap: '20px' }}>
              <div style={{ backgroundColor: 'var(--background)', padding: '8px 20px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                ⓘ Full AI analysis will be automatically generated when documents are uploaded. The examples below are illustrative.
              </div>
              <div style={{ backgroundColor: 'var(--background)', padding: '24px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <span style={{ color: '#2e7d32', fontWeight: 700, fontSize: '1.1rem' }}>✓</span>
                  <h3 style={{ margin: 0 }}>Strong Points</h3>
                </div>
                <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: 1.8 }}>
                  <li>Evidence clearly establishes a timeline consistent with claims under the Muluki Civil Code.</li>
                  <li>Witness testimony corroborates the central argument regarding intent.</li>
                </ul>
              </div>
              <div style={{ backgroundColor: 'var(--background)', padding: '24px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <span style={{ color: '#c62828', fontWeight: 700, fontSize: '1.1rem' }}>✗</span>
                  <h3 style={{ margin: 0 }}>Weak Points / Risks</h3>
                </div>
                <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: 1.8 }}>
                  <li>Missing documentation for specific date ranges weakens continuous possession claims.</li>
                  <li>Jurisdiction may be challenged based on the property's secondary location.</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'timeline' && (
            <div style={{ backgroundColor: 'var(--background)', padding: '30px', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ margin: 0 }}>Case Timeline</h3>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Auto-generated from documents</div>
              </div>
              <div style={{ position: 'relative', paddingLeft: '36px' }}>
                <div style={{ position: 'absolute', left: '7px', top: '10px', bottom: '10px', width: '2px', backgroundColor: 'var(--border)' }}></div>
                {[
                  { date: 'Jan 15, 2026', title: 'Initial Contract Signing', desc: 'The primary agreement was executed by both parties in Kathmandu.' },
                  { date: 'Mar 10, 2026', title: 'Notice of Breach', desc: 'A formal legal notice was dispatched regarding failure to deliver goods.' },
                  { date: 'Apr 02, 2026', title: 'Mediation Attempt', desc: 'Parties met for mediation per Section 14 of the agreement; failed to reach resolution.' }
                ].map((event, idx) => (
                  <div key={idx} style={{ position: 'relative', marginBottom: '28px' }}>
                    <div style={{ position: 'absolute', left: '-36px', top: '4px', width: '16px', height: '16px', borderRadius: '50%', backgroundColor: 'var(--accent)', border: '3px solid var(--background)', boxShadow: '0 0 0 1px var(--border)' }}></div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{event.date}</div>
                    <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '6px' }}>{event.title}</div>
                    <div style={{ fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--text-muted)' }}>{event.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
