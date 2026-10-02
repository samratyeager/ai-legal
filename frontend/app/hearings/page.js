"use client";

import { useState, useEffect } from 'react';

export default function CourtHearingsPage() {
  const [hearings, setHearings] = useState([]);
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingHearing, setEditingHearing] = useState(null);
  const [hearingToDelete, setHearingToDelete] = useState(null);

  // Form State
  const [caseTitle, setCaseTitle] = useState('');
  const [courtName, setCourtName] = useState('');
  const [hearingDate, setHearingDate] = useState('');
  const [hearingType, setHearingType] = useState('Preliminary Hearing');
  const [bench, setBench] = useState('Single Bench');
  const [status, setStatus] = useState('Scheduled');
  const [notes, setNotes] = useState('');

  const fetchHearings = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'All') params.append('status', statusFilter);
      if (searchQuery) params.append('search', searchQuery);

      const res = await fetch(`/api/hearings?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setHearings(data);
      }
    } catch (err) {
      console.error('Failed to fetch court hearings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHearings();
  }, [statusFilter, searchQuery]);

  const handleOpenAdd = () => {
    setEditingHearing(null);
    setCaseTitle('');
    setCourtName('Kathmandu District Court');
    setHearingDate(new Date().toISOString().split('T')[0]);
    setHearingType('Preliminary Hearing');
    setBench('Single Bench');
    setStatus('Scheduled');
    setNotes('');
    setShowModal(true);
  };

  const handleOpenEdit = (h) => {
    setEditingHearing(h);
    setCaseTitle(h.case_title);
    setCourtName(h.court_name);
    setHearingDate(h.hearing_date);
    setHearingType(h.hearing_type);
    setBench(h.bench || 'Single Bench');
    setStatus(h.status);
    setNotes(h.notes || '');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!caseTitle.trim() || !hearingDate) return;

    const payload = {
      case_title: caseTitle,
      court_name: courtName,
      hearing_date: hearingDate,
      hearing_type: hearingType,
      bench: bench,
      status: status,
      notes: notes
    };

    try {
      if (editingHearing) {
        // Update (PUT)
        const res = await fetch(`/api/hearings/${editingHearing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          setShowModal(false);
          fetchHearings();
        }
      } else {
        // Create (POST)
        const res = await fetch('/api/hearings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          setShowModal(false);
          fetchHearings();
        }
      }
    } catch (err) {
      console.error('Error saving hearing:', err);
    }
  };

  const confirmDeleteHearing = async () => {
    if (!hearingToDelete) return;
    try {
      const res = await fetch(`/api/hearings/${hearingToDelete.id}`, { method: 'DELETE' });
      if (res.ok) {
        setHearingToDelete(null);
        fetchHearings();
      }
    } catch (err) {
      console.error('Failed to delete hearing:', err);
    }
  };

  const handleQuickStatus = async (hearing, newStatus) => {
    try {
      const res = await fetch(`/api/hearings/${hearing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchHearings();
      }
    } catch (err) {
      console.error('Failed to update hearing status:', err);
    }
  };

  return (
    <div style={{ padding: '36px 40px', maxWidth: '1100px', margin: '0 auto', width: '100%' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, margin: '0 0 6px 0', color: '#ffffff' }}>Court Hearings & Tarikh Tracker</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.95rem' }}>
            Manage scheduled trial dates, court appearances, bench details, and Tarikh reminders in SQLite.
          </p>
        </div>

        <button 
          onClick={handleOpenAdd}
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
          + Schedule Hearing (Tarikh)
        </button>
      </div>

      {/* Control / Filter Bar */}
      <div style={{ background: '#080808', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px 20px', marginBottom: '24px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <input 
          type="text"
          placeholder="Search by case title, court name, or agenda notes..."
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
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
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
          <option value="All">All Statuses</option>
          <option value="Scheduled">Scheduled (आगामी तारेख)</option>
          <option value="Completed">Completed (सम्पन्न)</option>
          <option value="Adjourned">Adjourned (सरेको / स्थगित)</option>
        </select>
      </div>

      {/* Hearings Table */}
      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <div className="typing-indicator">
            <div className="typing-dot"></div><div className="typing-dot"></div><div className="typing-dot"></div>
          </div>
        </div>
      ) : hearings.length === 0 ? (
        <div className="empty-state" style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '60px 20px' }}>
          <div className="empty-state-icon">📅</div>
          <h2 className="empty-state-title">No Court Hearings Scheduled</h2>
          <p className="empty-state-desc">Click '+ Schedule Hearing' to log your first court date or Tarikh.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {hearings.map((h) => (
            <div 
              key={h.id}
              style={{
                background: '#070707',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '18px 24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '20px',
                transition: 'border-color 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.borderColor = '#383838'}
              onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    border: '1px solid',
                    backgroundColor: h.status === 'Completed' ? '#0d200d' : h.status === 'Adjourned' ? '#291818' : '#142033',
                    color: h.status === 'Completed' ? '#63d168' : h.status === 'Adjourned' ? '#f87171' : '#79a8f2',
                    borderColor: h.status === 'Completed' ? '#1f421f' : h.status === 'Adjourned' ? '#4d2020' : '#22385a'
                  }}>
                    {h.status}
                  </span>

                  <span style={{ fontSize: '0.82rem', fontFamily: 'monospace', color: '#ccc', background: '#141414', padding: '2px 8px', borderRadius: '4px' }}>
                    📅 {h.hearing_date}
                  </span>

                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {h.hearing_type} &bull; {h.bench}
                  </span>
                </div>

                <h3 style={{ margin: '0 0 6px 0', fontSize: '1.05rem', color: '#ffffff', fontWeight: 600 }}>{h.case_title}</h3>
                <p style={{ margin: '0 0 6px 0', fontSize: '0.85rem', color: '#888' }}>🏛️ {h.court_name}</p>
                {h.notes && (
                  <p style={{ margin: 0, fontSize: '0.82rem', color: '#aaa', fontStyle: 'italic' }}>
                    Note: {h.notes}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {h.status !== 'Completed' && (
                  <button 
                    onClick={() => handleQuickStatus(h, 'Completed')}
                    title="Mark Completed"
                    style={{ background: '#121f12', border: '1px solid #234223', color: '#63d168', padding: '6px 12px', borderRadius: '4px', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 500 }}
                  >
                    ✓ Done
                  </button>
                )}

                {h.status !== 'Adjourned' && (
                  <button 
                    onClick={() => handleQuickStatus(h, 'Adjourned')}
                    title="Mark Adjourned / Postponed"
                    style={{ background: '#1f1414', border: '1px solid #422323', color: '#f87171', padding: '6px 12px', borderRadius: '4px', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 500 }}
                  >
                    Postpone
                  </button>
                )}

                <button 
                  onClick={() => handleOpenEdit(h)}
                  style={{ background: '#1a1a1a', border: '1px solid #333', color: '#fff', padding: '6px 12px', borderRadius: '4px', fontSize: '0.8rem', cursor: 'pointer' }}
                >
                  Edit
                </button>

                <button 
                  onClick={() => handleDelete(h.id)}
                  title="Delete Hearing Schedule"
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

      {/* Add / Edit Hearing Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#ffffff' }}>
                {editingHearing ? 'Edit Court Hearing (Tarikh)' : 'Schedule New Hearing (Tarikh)'}
              </h2>
              <button className="modal-close-btn" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '6px' }}>Case Title / Ref *</label>
                  <input 
                    type="text" 
                    className="filter-search-input" 
                    style={{ width: '100%' }}
                    placeholder="e.g. Horizon Trading v. Apex Logistics" 
                    value={caseTitle} 
                    onChange={(e) => setCaseTitle(e.target.value)} 
                    required 
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '6px' }}>Court Name</label>
                    <input 
                      type="text" 
                      className="filter-search-input" 
                      style={{ width: '100%' }}
                      placeholder="e.g. Kathmandu District Court" 
                      value={courtName} 
                      onChange={(e) => setCourtName(e.target.value)} 
                      required 
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '6px' }}>Hearing Date (Tarikh) *</label>
                    <input 
                      type="date" 
                      className="filter-search-input" 
                      style={{ width: '100%', colorScheme: 'dark' }}
                      value={hearingDate} 
                      onChange={(e) => setHearingDate(e.target.value)} 
                      required 
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '6px' }}>Hearing Type</label>
                    <select 
                      className="filter-select" 
                      style={{ width: '100%' }}
                      value={hearingType} 
                      onChange={(e) => setHearingType(e.target.value)}
                    >
                      <option value="Preliminary Hearing">Preliminary Hearing</option>
                      <option value="Evidence Submission">Evidence Submission</option>
                      <option value="Witness Examination">Witness Examination</option>
                      <option value="Final Arguments">Final Arguments</option>
                      <option value="Verdict Pronouncement">Verdict Pronouncement</option>
                      <option value="Bail Hearing">Bail Hearing</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '6px' }}>Bench</label>
                    <select 
                      className="filter-select" 
                      style={{ width: '100%' }}
                      value={bench} 
                      onChange={(e) => setBench(e.target.value)}
                    >
                      <option value="Single Bench">Single Bench</option>
                      <option value="Division Bench">Division Bench</option>
                      <option value="Full Bench">Full Bench</option>
                      <option value="Constitutional Bench">Constitutional Bench</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '6px' }}>Status</label>
                    <select 
                      className="filter-select" 
                      style={{ width: '100%' }}
                      value={status} 
                      onChange={(e) => setStatus(e.target.value)}
                    >
                      <option value="Scheduled">Scheduled</option>
                      <option value="Completed">Completed</option>
                      <option value="Adjourned">Adjourned</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '6px' }}>Preparation Notes / Agenda</label>
                  <textarea 
                    rows={3} 
                    className="filter-search-input" 
                    style={{ width: '100%', resize: 'vertical' }}
                    placeholder="Documents to bring, witness names, points to argue..." 
                    value={notes} 
                    onChange={(e) => setNotes(e.target.value)} 
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  style={{ background: 'none', border: '1px solid #333', color: '#fff', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  style={{ background: '#fff', color: '#000', border: 'none', padding: '8px 20px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
                >
                  {editingHearing ? 'Update Hearing' : 'Save Hearing Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
