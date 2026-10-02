"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CaseStudiesPage() {
  const router = useRouter();
  const [cases, setCases] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCase, setSelectedCase] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [caseToDelete, setCaseToDelete] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // New Case Study Form State
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Contract & Commercial Law');
  const [newCourt, setNewCourt] = useState('High Court (Commercial Division)');
  const [newYear, setNewYear] = useState(2024);
  const [newSummary, setNewSummary] = useState('');
  const [newIssue, setNewIssue] = useState('');
  const [newVerdict, setNewVerdict] = useState('');
  const [newPrinciple, setNewPrinciple] = useState('');

  const fetchCases = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== 'All') params.append('category', selectedCategory);
      if (searchQuery) params.append('search', searchQuery);

      const res = await fetch(`/api/case-studies?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setCases(data);
      }
    } catch (err) {
      console.error('Error fetching case studies:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, [selectedCategory, searchQuery]);

  const handleCreateCase = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      const res = await fetch('/api/case-studies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          category: newCategory,
          court: newCourt,
          year: parseInt(newYear) || 2024,
          summary: newSummary,
          legal_issue: newIssue,
          verdict: newVerdict,
          key_principle: newPrinciple
        })
      });

      if (res.ok) {
        setShowAddModal(false);
        setNewTitle('');
        setNewSummary('');
        setNewIssue('');
        setNewVerdict('');
        setNewPrinciple('');
        fetchCases();
      }
    } catch (err) {
      console.error('Failed to create case study:', err);
    }
  };

  const confirmDelete = async () => {
    if (!caseToDelete) return;
    try {
      const res = await fetch(`/api/case-studies/${caseToDelete.id}`, { method: 'DELETE' });
      if (res.ok) {
        if (selectedCase && selectedCase.id === caseToDelete.id) setSelectedCase(null);
        setCaseToDelete(null);
        fetchCases();
      }
    } catch (err) {
      console.error('Failed to delete case study:', err);
    }
  };

  const handleAskAI = (caseItem, e) => {
    if (e) e.stopPropagation();
    const prompt = `Can you explain the legal principles in the case "${caseItem.title}" regarding "${caseItem.legal_issue}" and how it applies to practical litigation?`;
    sessionStorage.setItem('pending_legal_query', prompt);
    router.push('/');
  };

  return (
    <div style={{ padding: '36px 40px', maxWidth: '1100px', margin: '0 auto', width: '100%' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, margin: '0 0 6px 0', color: '#ffffff' }}>Legal Case Studies</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.95rem' }}>
            A curated repository of practical legal case studies, court rulings, and core legal precedents.
          </p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          style={{
            backgroundColor: '#ffffff',
            color: '#000000',
            padding: '10px 18px',
            borderRadius: '6px',
            fontWeight: 600,
            fontSize: '0.9rem',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          + Add Case Study
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ background: '#080808', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px 20px', marginBottom: '24px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <input 
          type="text"
          placeholder="Search by case title, legal issues, or key principle..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            flex: 1,
            minWidth: '260px',
            background: '#111',
            border: '1px solid #222',
            borderRadius: '6px',
            padding: '10px 14px',
            color: '#fff',
            fontSize: '0.9rem',
            outline: 'none'
          }}
        />

        <select 
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          style={{
            background: '#111',
            border: '1px solid #222',
            borderRadius: '6px',
            padding: '10px 14px',
            color: '#fff',
            fontSize: '0.9rem',
            outline: 'none',
            cursor: 'pointer'
          }}
        >
          <option value="All">All Categories</option>
          <option value="Contract & Commercial">Contract & Commercial</option>
          <option value="Property & Real Estate">Property & Real Estate</option>
          <option value="Cyber & Criminal">Cyber & Criminal</option>
          <option value="Labour & Employment">Labour & Employment</option>
          <option value="Banking & Financial">Banking & Financial</option>
          <option value="Intellectual Property">Intellectual Property</option>
        </select>
      </div>

      {/* Case Studies Grid */}
      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <div className="typing-indicator">
            <div className="typing-dot"></div><div className="typing-dot"></div><div className="typing-dot"></div>
          </div>
        </div>
      ) : cases.length === 0 ? (
        <div className="empty-state" style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '60px 20px' }}>
          <div className="empty-state-icon">⚖️</div>
          <h2 className="empty-state-title">No Case Studies Found</h2>
          <p className="empty-state-desc">Try clearing your search filter or add a new case study above.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '18px' }}>
          {cases.map((c) => (
            <div 
              key={c.id} 
              onClick={() => setSelectedCase(c)}
              style={{
                background: '#070707',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                position: 'relative'
              }}
              onMouseOver={(e) => e.currentTarget.style.borderColor = '#444'}
              onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', background: '#161616', border: '1px solid #282828', padding: '3px 8px', borderRadius: '4px', color: '#aaa', fontWeight: 600 }}>
                  {c.category}
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{c.year}</span>
              </div>

              <div>
                <h3 style={{ margin: '0 0 6px 0', fontSize: '1.05rem', fontWeight: 600, color: '#ffffff' }}>{c.title}</h3>
                <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>{c.court}</p>
              </div>

              <div style={{ background: '#111', borderLeft: '3px solid #666', padding: '10px 12px', fontSize: '0.85rem', color: '#ccc', lineHeight: 1.5, borderRadius: '0 4px 4px 0' }}>
                <strong>Key Issue: </strong>{c.legal_issue}
              </div>

              <div style={{ borderTop: '1px solid #1a1a1a', paddingTop: '12px', marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button 
                  onClick={(e) => handleAskAI(c, e)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '0.82rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    padding: 0
                  }}
                >
                  Ask AI in Chat →
                </button>

                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setCaseToDelete(c);
                  }}
                  title="Delete Case Study"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#666',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    padding: '4px'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.color = '#f87171'}
                  onMouseOut={(e) => e.currentTarget.style.color = '#666'}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Case Details Modal */}
      {selectedCase && (
        <div className="modal-overlay" onClick={() => setSelectedCase(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '750px' }}>
            <div className="modal-header">
              <div>
                <span style={{ fontSize: '0.75rem', background: '#161616', padding: '3px 8px', borderRadius: '4px', border: '1px solid #282828', color: '#aaa' }}>
                  {selectedCase.category} &bull; {selectedCase.year}
                </span>
                <h2 style={{ margin: '8px 0 4px 0', fontSize: '1.3rem', color: '#ffffff' }}>{selectedCase.title}</h2>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>{selectedCase.court}</p>
              </div>
              <button className="modal-close-btn" onClick={() => setSelectedCase(null)}>✕</button>
            </div>

            <div className="modal-body" style={{ gap: '16px' }}>
              <div className="section-box">
                <h4 className="section-box-title">📋 Summary of Facts</h4>
                <p style={{ margin: 0, lineHeight: 1.6, color: '#ccc', fontSize: '0.92rem' }}>{selectedCase.summary}</p>
              </div>

              <div className="section-box">
                <h4 className="section-box-title">❓ Question of Law / Legal Issue</h4>
                <p style={{ margin: 0, lineHeight: 1.6, color: '#ffffff', fontSize: '0.92rem' }}>{selectedCase.legal_issue}</p>
              </div>

              <div className="section-box">
                <h4 className="section-box-title">⚖️ Court Ruling & Verdict</h4>
                <p style={{ margin: 0, lineHeight: 1.6, color: '#63d168', fontSize: '0.92rem' }}>{selectedCase.verdict}</p>
              </div>

              <div className="section-box">
                <h4 className="section-box-title">💡 Ratio Decidendi & Legal Principle</h4>
                <p style={{ margin: 0, lineHeight: 1.6, color: '#d8d8d8', fontSize: '0.92rem' }}>{selectedCase.key_principle}</p>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                onClick={() => setCaseToDelete(selectedCase)}
                style={{
                  background: 'none',
                  border: '1px solid #331111',
                  color: '#f87171',
                  padding: '8px 14px',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                Delete Case Study
              </button>

              <button 
                onClick={() => handleAskAI(selectedCase)}
                style={{
                  background: '#ffffff',
                  color: '#000000',
                  border: 'none',
                  padding: '8px 18px',
                  borderRadius: '6px',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                Discuss with AI Assistant →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Case Study Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '650px' }}>
            <div className="modal-header">
              <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#ffffff' }}>Add New Legal Case Study</h2>
              <button className="modal-close-btn" onClick={() => setShowAddModal(false)}>✕</button>
            </div>

            <form onSubmit={handleCreateCase}>
              <div className="modal-body" style={{ gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '6px' }}>Case Title *</label>
                  <input 
                    type="text" 
                    className="filter-search-input" 
                    style={{ width: '100%' }}
                    placeholder="e.g. Apex Traders v. Horizon Logistics" 
                    value={newTitle} 
                    onChange={(e) => setNewTitle(e.target.value)} 
                    required 
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '6px' }}>Category</label>
                    <select 
                      className="filter-select" 
                      style={{ width: '100%' }}
                      value={newCategory} 
                      onChange={(e) => setNewCategory(e.target.value)}
                    >
                      <option value="Contract & Commercial Law">Contract & Commercial Law</option>
                      <option value="Property & Real Estate Law">Property & Real Estate Law</option>
                      <option value="Cyber & Criminal Law">Cyber & Criminal Law</option>
                      <option value="Labour & Employment Law">Labour & Employment Law</option>
                      <option value="Banking & Financial Law">Banking & Financial Law</option>
                      <option value="Intellectual Property">Intellectual Property</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '6px' }}>Court & Year</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input 
                        type="text" 
                        className="filter-search-input" 
                        style={{ flex: 2 }}
                        placeholder="Court name" 
                        value={newCourt} 
                        onChange={(e) => setNewCourt(e.target.value)} 
                      />
                      <input 
                        type="number" 
                        className="filter-search-input" 
                        style={{ flex: 1 }}
                        placeholder="Year" 
                        value={newYear} 
                        onChange={(e) => setNewYear(e.target.value)} 
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '6px' }}>Case Summary / Facts</label>
                  <textarea 
                    rows={3} 
                    className="filter-search-input" 
                    style={{ width: '100%', resize: 'vertical' }}
                    placeholder="Brief background of the dispute and parties involved..." 
                    value={newSummary} 
                    onChange={(e) => setNewSummary(e.target.value)} 
                    required 
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '6px' }}>Core Legal Issue</label>
                  <input 
                    type="text" 
                    className="filter-search-input" 
                    style={{ width: '100%' }}
                    placeholder="e.g. Can contractual liquidated damages be claimed without proof of actual loss?" 
                    value={newIssue} 
                    onChange={(e) => setNewIssue(e.target.value)} 
                    required 
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '6px' }}>Court Verdict & Ruling</label>
                  <input 
                    type="text" 
                    className="filter-search-input" 
                    style={{ width: '100%' }}
                    placeholder="Ruling in favor of Plaintiff/Defendant, orders passed..." 
                    value={newVerdict} 
                    onChange={(e) => setNewVerdict(e.target.value)} 
                    required 
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '6px' }}>Key Principle (Ratio Decidendi)</label>
                  <input 
                    type="text" 
                    className="filter-search-input" 
                    style={{ width: '100%' }}
                    placeholder="Core legal rule or precedent established..." 
                    value={newPrinciple} 
                    onChange={(e) => setNewPrinciple(e.target.value)} 
                    required 
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  style={{ background: 'none', border: '1px solid #333', color: '#fff', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  style={{ background: '#fff', color: '#000', border: 'none', padding: '8px 20px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Save Case Study
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Centered Delete Confirmation Modal */}
      {caseToDelete && (
        <div className="confirm-modal-overlay" onClick={() => setCaseToDelete(null)}>
          <div className="confirm-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-icon-box">🗑️</div>
            <h3 className="confirm-title">Delete Case Study?</h3>
            <p className="confirm-desc">
              Are you sure you want to delete <strong>"{caseToDelete.title}"</strong>? This will permanently remove the record from SQLite database.
            </p>
            <div className="confirm-actions">
              <button 
                type="button" 
                className="confirm-cancel-btn"
                onClick={() => setCaseToDelete(null)}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="confirm-delete-btn"
                onClick={confirmDelete}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
