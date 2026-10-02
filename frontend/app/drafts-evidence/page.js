"use client";

import { useState, useEffect } from 'react';

export default function DraftsAndEvidencePage() {
  const [activeTab, setActiveTab] = useState('drafts'); // 'drafts' | 'evidence'

  // --- DRAFTS STATE ---
  const [drafts, setDrafts] = useState([]);
  const [draftCategory, setDraftCategory] = useState('All');
  const [draftSearch, setDraftSearch] = useState('');
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [editingDraft, setEditingDraft] = useState(null);
  const [previewDraft, setPreviewDraft] = useState(null);
  const [copiedDraft, setCopiedDraft] = useState(false);

  const [draftTitle, setDraftTitle] = useState('');
  const [draftCat, setDraftCat] = useState('Legal Demand Notice');
  const [draftRecipient, setDraftRecipient] = useState('');
  const [draftContent, setDraftContent] = useState('');

  // --- EVIDENCE STATE ---
  const [evidenceList, setEvidenceList] = useState([]);
  const [evidenceTypeFilter, setEvidenceTypeFilter] = useState('All');
  const [evidenceSearch, setEvidenceSearch] = useState('');
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [editingEvidence, setEditingEvidence] = useState(null);

  const [evCaseTitle, setEvCaseTitle] = useState('');
  const [evTitle, setEvTitle] = useState('');
  const [evType, setEvType] = useState('Documentary');
  const [evDesc, setEvDesc] = useState('');
  const [evDate, setEvDate] = useState('');
  const [evStatus, setEvStatus] = useState('Verified');

  const [isLoading, setIsLoading] = useState(true);

  // --- FETCH DRAFTS ---
  const fetchDrafts = async () => {
    try {
      const params = new URLSearchParams();
      if (draftCategory !== 'All') params.append('category', draftCategory);
      if (draftSearch) params.append('search', draftSearch);

      const res = await fetch(`/api/drafts?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setDrafts(data);
      }
    } catch (err) {
      console.error('Failed to load drafts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // --- FETCH EVIDENCE ---
  const fetchEvidence = async () => {
    try {
      const params = new URLSearchParams();
      if (evidenceTypeFilter !== 'All') params.append('evidence_type', evidenceTypeFilter);
      if (evidenceSearch) params.append('search', evidenceSearch);

      const res = await fetch(`/api/evidence?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setEvidenceList(data);
      }
    } catch (err) {
      console.error('Failed to load evidence:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'drafts') fetchDrafts();
    else fetchEvidence();
  }, [activeTab, draftCategory, draftSearch, evidenceTypeFilter, evidenceSearch]);

  // --- DRAFTS HANDLERS ---
  const handleOpenAddDraft = () => {
    setEditingDraft(null);
    setDraftTitle('');
    setDraftCat('Legal Demand Notice');
    setDraftRecipient('');
    setDraftContent('LEGAL NOTICE / AGREEMENT DRAFT\n\n1. Parties:\n2. Background & Terms:\n3. Legal Provisions:\n4. Demands / Obligations:');
    setShowDraftModal(true);
  };

  const handleOpenEditDraft = (d) => {
    setEditingDraft(d);
    setDraftTitle(d.title);
    setDraftCat(d.category);
    setDraftRecipient(d.recipient || '');
    setDraftContent(d.content);
    setShowDraftModal(true);
  };

  const handleSaveDraft = async (e) => {
    e.preventDefault();
    if (!draftTitle.trim() || !draftContent.trim()) return;

    const payload = {
      title: draftTitle,
      category: draftCat,
      recipient: draftRecipient,
      content: draftContent
    };

    try {
      if (editingDraft) {
        const res = await fetch(`/api/drafts/${editingDraft.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          setShowDraftModal(false);
          fetchDrafts();
        }
      } else {
        const res = await fetch('/api/drafts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          setShowDraftModal(false);
          fetchDrafts();
        }
      }
    } catch (err) {
      console.error('Error saving draft:', err);
    }
  };

  const handleDeleteDraft = async (id) => {
    if (!confirm('Are you sure you want to delete this legal draft?')) return;
    try {
      const res = await fetch(`/api/drafts/${id}`, { method: 'DELETE' });
      if (res.ok) {
        if (previewDraft && previewDraft.id === id) setPreviewDraft(null);
        fetchDrafts();
      }
    } catch (err) {
      console.error('Failed to delete draft:', err);
    }
  };

  // --- EVIDENCE HANDLERS ---
  const handleOpenAddEvidence = () => {
    setEditingEvidence(null);
    setEvCaseTitle('');
    setEvTitle('');
    setEvType('Documentary');
    setEvDesc('');
    setEvDate(new Date().toISOString().split('T')[0]);
    setEvStatus('Verified');
    setShowEvidenceModal(true);
  };

  const handleOpenEditEvidence = (item) => {
    setEditingEvidence(item);
    setEvCaseTitle(item.case_title);
    setEvTitle(item.title);
    setEvType(item.evidence_type);
    setEvDesc(item.description);
    setEvDate(item.collected_date || '');
    setEvStatus(item.status);
    setShowEvidenceModal(true);
  };

  const handleSaveEvidence = async (e) => {
    e.preventDefault();
    if (!evCaseTitle.trim() || !evTitle.trim()) return;

    const payload = {
      case_title: evCaseTitle,
      title: evTitle,
      evidence_type: evType,
      description: evDesc,
      collected_date: evDate,
      status: evStatus
    };

    try {
      if (editingEvidence) {
        const res = await fetch(`/api/evidence/${editingEvidence.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          setShowEvidenceModal(false);
          fetchEvidence();
        }
      } else {
        const res = await fetch('/api/evidence', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          setShowEvidenceModal(false);
          fetchEvidence();
        }
      }
    } catch (err) {
      console.error('Error saving evidence:', err);
    }
  };

  const handleDeleteEvidence = async (id) => {
    if (!confirm('Are you sure you want to delete this evidence item?')) return;
    try {
      const res = await fetch(`/api/evidence/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchEvidence();
      }
    } catch (err) {
      console.error('Failed to delete evidence:', err);
    }
  };

  return (
    <div style={{ padding: '36px 40px', maxWidth: '1100px', margin: '0 auto', width: '100%' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, margin: '0 0 6px 0', color: '#ffffff' }}>Legal Drafts & Evidence Registry</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.95rem' }}>
            Author, edit, and organize legal notice templates, contracts, and case evidence items in SQLite.
          </p>
        </div>

        <button 
          onClick={activeTab === 'drafts' ? handleOpenAddDraft : handleOpenAddEvidence}
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
          {activeTab === 'drafts' ? '+ New Legal Draft' : '+ Add Evidence Item'}
        </button>
      </div>

      {/* Tab Switcher */}
      <div className="case-nav-tabs">
        <button 
          className={`case-nav-tab ${activeTab === 'drafts' ? 'active' : ''}`}
          onClick={() => setActiveTab('drafts')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
          Legal Drafts & Notices ({drafts.length})
        </button>

        <button 
          className={`case-nav-tab ${activeTab === 'evidence' ? 'active' : ''}`}
          onClick={() => setActiveTab('evidence')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
          Evidence & Record Log ({evidenceList.length})
        </button>
      </div>

      {/* --- TAB 1: DRAFTS --- */}
      {activeTab === 'drafts' && (
        <>
          <div style={{ background: '#080808', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px 20px', marginBottom: '24px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <input 
              type="text"
              placeholder="Search drafts by title, recipient, or keywords..."
              value={draftSearch}
              onChange={(e) => setDraftSearch(e.target.value)}
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
              value={draftCategory}
              onChange={(e) => setDraftCategory(e.target.value)}
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
              <option value="Demand Notice">Legal Demand Notice</option>
              <option value="Agreement">Commercial Agreement</option>
              <option value="Power of Attorney">Power of Attorney</option>
            </select>
          </div>

          {drafts.length === 0 ? (
            <div className="empty-state" style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '50px 20px' }}>
              <div className="empty-state-icon">📝</div>
              <h2 className="empty-state-title">No Legal Drafts Saved</h2>
              <p className="empty-state-desc">Create notice templates, contracts, and power of attorney drafts.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '18px' }}>
              {drafts.map((d) => (
                <div 
                  key={d.id}
                  style={{
                    background: '#070707',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    transition: 'border-color 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.borderColor = '#444'}
                  onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', background: '#161616', border: '1px solid #282828', padding: '3px 8px', borderRadius: '4px', color: '#aaa', fontWeight: 600 }}>
                      {d.category}
                    </span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {new Date(d.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div>
                    <h3 style={{ margin: '0 0 4px 0', fontSize: '1.05rem', color: '#ffffff', fontWeight: 600 }}>{d.title}</h3>
                    {d.recipient && (
                      <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>To: {d.recipient}</p>
                    )}
                  </div>

                  <p style={{
                    margin: 0,
                    fontSize: '0.85rem',
                    color: '#999',
                    lineHeight: 1.5,
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {d.content}
                  </p>

                  <div style={{ borderTop: '1px solid #1a1a1a', paddingTop: '12px', marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button 
                      onClick={() => { setPreviewDraft(d); setCopiedDraft(false); }}
                      style={{ background: 'none', border: 'none', color: '#ffffff', fontSize: '0.82rem', fontWeight: 500, cursor: 'pointer', padding: 0 }}
                    >
                      Preview Full Draft →
                    </button>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        onClick={() => handleOpenEditDraft(d)}
                        style={{ background: '#1a1a1a', border: '1px solid #333', color: '#fff', padding: '4px 10px', borderRadius: '4px', fontSize: '0.78rem', cursor: 'pointer' }}
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteDraft(d.id)}
                        style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: '0.9rem', padding: '4px' }}
                        onMouseOver={(e) => e.currentTarget.style.color = '#f87171'}
                        onMouseOut={(e) => e.currentTarget.style.color = '#666'}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* --- TAB 2: EVIDENCE REGISTRY --- */}
      {activeTab === 'evidence' && (
        <>
          <div style={{ background: '#080808', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px 20px', marginBottom: '24px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <input 
              type="text"
              placeholder="Search evidence by case title, document name, or remarks..."
              value={evidenceSearch}
              onChange={(e) => setEvidenceSearch(e.target.value)}
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
              value={evidenceTypeFilter}
              onChange={(e) => setEvidenceTypeFilter(e.target.value)}
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
              <option value="All">All Types</option>
              <option value="Documentary">Documentary</option>
              <option value="Digital Record">Digital Record</option>
              <option value="Financial Statement">Financial Statement</option>
              <option value="Witness Statement">Witness Statement</option>
            </select>
          </div>

          {evidenceList.length === 0 ? (
            <div className="empty-state" style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '50px 20px' }}>
              <div className="empty-state-icon">📁</div>
              <h2 className="empty-state-title">No Evidence Items Logged</h2>
              <p className="empty-state-desc">Click '+ Add Evidence Item' to record signed contracts, bank receipts, or digital logs.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {evidenceList.map((item) => (
                <div 
                  key={item.id}
                  style={{
                    background: '#070707',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '18px 24px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '20px'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: item.status === 'Verified' ? '#0d200d' : item.status === 'Submitted in Court' ? '#142033' : '#222',
                        color: item.status === 'Verified' ? '#63d168' : item.status === 'Submitted in Court' ? '#79a8f2' : '#aaa',
                        border: '1px solid #333'
                      }}>
                        {item.status}
                      </span>

                      <span style={{ fontSize: '0.8rem', background: '#141414', border: '1px solid #222', padding: '2px 8px', borderRadius: '4px', color: '#ccc' }}>
                        🏷️ {item.evidence_type}
                      </span>

                      {item.collected_date && (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          Collected: {item.collected_date}
                        </span>
                      )}
                    </div>

                    <h3 style={{ margin: '0 0 4px 0', fontSize: '1.05rem', color: '#ffffff', fontWeight: 600 }}>{item.title}</h3>
                    <p style={{ margin: '0 0 4px 0', fontSize: '0.85rem', color: '#888' }}>Case: <strong>{item.case_title}</strong></p>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#aaa', lineHeight: 1.5 }}>{item.description}</p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button 
                      onClick={() => handleOpenEditEvidence(item)}
                      style={{ background: '#1a1a1a', border: '1px solid #333', color: '#fff', padding: '6px 12px', borderRadius: '4px', fontSize: '0.8rem', cursor: 'pointer' }}
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDeleteEvidence(item.id)}
                      style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: '1rem', padding: '4px' }}
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
        </>
      )}

      {/* --- PREVIEW DRAFT MODAL --- */}
      {previewDraft && (
        <div className="modal-overlay" onClick={() => setPreviewDraft(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '750px' }}>
            <div className="modal-header">
              <div>
                <span style={{ fontSize: '0.75rem', background: '#161616', padding: '3px 8px', borderRadius: '4px', border: '1px solid #282828', color: '#aaa' }}>
                  {previewDraft.category}
                </span>
                <h2 style={{ margin: '8px 0 4px 0', fontSize: '1.3rem', color: '#ffffff' }}>{previewDraft.title}</h2>
                {previewDraft.recipient && (
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Recipient: {previewDraft.recipient}</p>
                )}
              </div>
              <button className="modal-close-btn" onClick={() => setPreviewDraft(null)}>✕</button>
            </div>

            <div className="modal-body">
              <div style={{ background: '#111', border: '1px solid #282828', borderRadius: '8px', padding: '24px', fontFamily: 'monospace', fontSize: '0.9rem', lineHeight: 1.7, color: '#e0e0e0', whiteSpace: 'pre-wrap' }}>
                {previewDraft.content}
              </div>
            </div>

            <div className="modal-footer">
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(previewDraft.content);
                  setCopiedDraft(true);
                  setTimeout(() => setCopiedDraft(false), 2000);
                }}
                style={{ background: '#222', border: '1px solid #444', color: '#fff', padding: '8px 16px', borderRadius: '6px', fontSize: '0.85rem', cursor: 'pointer' }}
              >
                {copiedDraft ? '✓ Draft Copied!' : '📋 Copy Draft Text'}
              </button>

              <button 
                onClick={() => {
                  window.print();
                }}
                style={{ background: '#fff', color: '#000', border: 'none', padding: '8px 18px', borderRadius: '6px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}
              >
                Print / Export Draft
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- ADD / EDIT DRAFT MODAL --- */}
      {showDraftModal && (
        <div className="modal-overlay" onClick={() => setShowDraftModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '650px' }}>
            <div className="modal-header">
              <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#ffffff' }}>
                {editingDraft ? 'Edit Legal Draft' : 'Create New Legal Draft'}
              </h2>
              <button className="modal-close-btn" onClick={() => setShowDraftModal(false)}>✕</button>
            </div>

            <form onSubmit={handleSaveDraft}>
              <div className="modal-body" style={{ gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '6px' }}>Draft Title *</label>
                  <input 
                    type="text" 
                    className="filter-search-input" 
                    style={{ width: '100%' }}
                    placeholder="e.g. 15-Day Demand Notice for Payment Default" 
                    value={draftTitle} 
                    onChange={(e) => setDraftTitle(e.target.value)} 
                    required 
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '6px' }}>Category</label>
                    <select 
                      className="filter-select" 
                      style={{ width: '100%' }}
                      value={draftCat} 
                      onChange={(e) => setDraftCat(e.target.value)}
                    >
                      <option value="Legal Demand Notice">Legal Demand Notice</option>
                      <option value="Commercial Agreement">Commercial Agreement</option>
                      <option value="Power of Attorney">Power of Attorney</option>
                      <option value="Tenancy Agreement">Tenancy Agreement</option>
                      <option value="Bail Application">Bail Application</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '6px' }}>Recipient Party</label>
                    <input 
                      type="text" 
                      className="filter-search-input" 
                      style={{ width: '100%' }}
                      placeholder="e.g. Apex Suppliers Pvt. Ltd." 
                      value={draftRecipient} 
                      onChange={(e) => setDraftRecipient(e.target.value)} 
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '6px' }}>Draft Body / Legal Clauses *</label>
                  <textarea 
                    rows={8} 
                    className="filter-search-input" 
                    style={{ width: '100%', resize: 'vertical', lineHeight: 1.6, fontFamily: 'monospace' }}
                    value={draftContent} 
                    onChange={(e) => setDraftContent(e.target.value)} 
                    required 
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  onClick={() => setShowDraftModal(false)}
                  style={{ background: 'none', border: '1px solid #333', color: '#fff', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  style={{ background: '#fff', color: '#000', border: 'none', padding: '8px 20px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
                >
                  {editingDraft ? 'Update Draft' : 'Save Legal Draft'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- ADD / EDIT EVIDENCE MODAL --- */}
      {showEvidenceModal && (
        <div className="modal-overlay" onClick={() => setShowEvidenceModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#ffffff' }}>
                {editingEvidence ? 'Edit Evidence Record' : 'Add New Evidence Item'}
              </h2>
              <button className="modal-close-btn" onClick={() => setShowEvidenceModal(false)}>✕</button>
            </div>

            <form onSubmit={handleSaveEvidence}>
              <div className="modal-body" style={{ gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '6px' }}>Associated Case Title *</label>
                  <input 
                    type="text" 
                    className="filter-search-input" 
                    style={{ width: '100%' }}
                    placeholder="e.g. Horizon Trading v. Apex Logistics" 
                    value={evCaseTitle} 
                    onChange={(e) => setEvCaseTitle(e.target.value)} 
                    required 
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '6px' }}>Evidence Document / Item Title *</label>
                  <input 
                    type="text" 
                    className="filter-search-input" 
                    style={{ width: '100%' }}
                    placeholder="e.g. Bank Advance Voucher (NPR 1.5M)" 
                    value={evTitle} 
                    onChange={(e) => setEvTitle(e.target.value)} 
                    required 
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '6px' }}>Evidence Type</label>
                    <select 
                      className="filter-select" 
                      style={{ width: '100%' }}
                      value={evType} 
                      onChange={(e) => setEvType(e.target.value)}
                    >
                      <option value="Documentary">Documentary</option>
                      <option value="Digital Record">Digital Record</option>
                      <option value="Financial Statement">Financial Statement</option>
                      <option value="Witness Statement">Witness Statement</option>
                      <option value="Physical / Forensic">Physical / Forensic</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '6px' }}>Date Collected</label>
                    <input 
                      type="date" 
                      className="filter-search-input" 
                      style={{ width: '100%', colorScheme: 'dark' }}
                      value={evDate} 
                      onChange={(e) => setEvDate(e.target.value)} 
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '6px' }}>Status</label>
                    <select 
                      className="filter-select" 
                      style={{ width: '100%' }}
                      value={evStatus} 
                      onChange={(e) => setEvStatus(e.target.value)}
                    >
                      <option value="Verified">Verified</option>
                      <option value="Pending Review">Pending Review</option>
                      <option value="Submitted in Court">Submitted in Court</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '6px' }}>Description / Chain of Custody Remarks</label>
                  <textarea 
                    rows={3} 
                    className="filter-search-input" 
                    style={{ width: '100%', resize: 'vertical' }}
                    placeholder="Document registration stamp, hash values, witness details..." 
                    value={evDesc} 
                    onChange={(e) => setEvDesc(e.target.value)} 
                    required 
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  onClick={() => setShowEvidenceModal(false)}
                  style={{ background: 'none', border: '1px solid #333', color: '#fff', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  style={{ background: '#fff', color: '#000', border: 'none', padding: '8px 20px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
                >
                  {editingEvidence ? 'Update Evidence' : 'Save Evidence Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
