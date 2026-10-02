'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from './AuthWrapper'

// Structured Legal Response Renderer
function FormattedLegalMessage({ content }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Helper to format inline bold, italics, citations
  const formatInlineText = (text) => {
    if (!text) return '';
    const parts = text.split(/(\*\*.*?\*\*|\*[^*]+?\*|`[^`]+?`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} style={{ color: '#ffffff', fontWeight: 650 }}>
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return (
          <em key={i} style={{ color: '#cccccc', fontStyle: 'italic' }}>
            {part.slice(1, -1)}
          </em>
        );
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={i} style={{ background: '#1c1c1c', border: '1px solid #333', padding: '1px 6px', borderRadius: '4px', fontSize: '0.86rem', color: '#e5e5e5' }}>
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  // Parse lines into structured blocks
  const renderFormattedBlocks = (text) => {
    if (!text) return null;

    const cleanedText = text
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/\|---+\|---+\|?/g, '')
      .trim();

    const lines = cleanedText.split('\n');
    const elements = [];
    let currentList = [];
    let listType = null;

    const flushList = () => {
      if (currentList.length > 0) {
        if (listType === 'numbered') {
          elements.push(
            <ol key={`ol-${elements.length}`} style={{ margin: '8px 0 14px', paddingLeft: '22px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {currentList.map((item, idx) => (
                <li key={idx} style={{ color: '#dcdcdc', fontSize: '0.94rem', lineHeight: '1.65' }}>
                  {formatInlineText(item)}
                </li>
              ))}
            </ol>
          );
        } else {
          elements.push(
            <ul key={`ul-${elements.length}`} style={{ margin: '8px 0 14px', paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {currentList.map((item, idx) => (
                <li key={idx} style={{ color: '#dcdcdc', fontSize: '0.94rem', lineHeight: '1.65' }}>
                  {formatInlineText(item)}
                </li>
              ))}
            </ul>
          );
        }
        currentList = [];
        listType = null;
      }
    };

    lines.forEach((line, index) => {
      const trimmed = line.trim();

      if (!trimmed) {
        flushList();
        return;
      }

      // Headers (### or ## or #)
      if (trimmed.startsWith('#')) {
        flushList();
        const headerLevel = trimmed.match(/^#+/)[0].length;
        const headerText = trimmed.replace(/^#+\s*/, '');
        elements.push(
          <div
            key={`h-${index}`}
            style={{
              fontSize: headerLevel <= 2 ? '1.02rem' : '0.95rem',
              fontWeight: 700,
              color: '#ffffff',
              margin: '18px 0 8px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              letterSpacing: '-0.01em',
            }}
          >
            <span style={{ display: 'inline-block', width: '3px', height: '14px', background: '#999', borderRadius: '2px' }} />
            {formatInlineText(headerText)}
          </div>
        );
        return;
      }

      // Bullet lists (- or *)
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        if (listType === 'numbered') flushList();
        listType = 'bullet';
        currentList.push(trimmed.substring(2));
        return;
      }

      // Numbered lists (1. or 2.)
      const numMatch = trimmed.match(/^\d+[\.\)]\s+(.*)/);
      if (numMatch) {
        if (listType === 'bullet') flushList();
        listType = 'numbered';
        currentList.push(numMatch[1]);
        return;
      }

      // Table row fallback
      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        flushList();
        const cells = trimmed.split('|').map(c => c.trim()).filter(Boolean);
        if (cells.length > 0 && !trimmed.includes('---')) {
          elements.push(
            <div key={`tbl-${index}`} style={{ display: 'flex', gap: '12px', padding: '6px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', margin: '4px 0', fontSize: '0.9rem' }}>
              {cells.map((cell, cIdx) => (
                <div key={cIdx} style={{ flex: 1, color: '#d0d0d0' }}>{formatInlineText(cell)}</div>
              ))}
            </div>
          );
        }
        return;
      }

      // Regular Paragraph
      flushList();
      elements.push(
        <p key={`p-${index}`} style={{ margin: '6px 0 10px', color: '#e0e0e0', fontSize: '0.95rem', lineHeight: '1.68' }}>
          {formatInlineText(trimmed)}
        </p>
      );
    });

    flushList();
    return elements;
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <div style={{ paddingRight: '40px' }}>
        {renderFormattedBlocks(content)}
      </div>
      <button
        onClick={handleCopy}
        title="Copy Legal Opinion"
        style={{
          position: 'absolute',
          top: '-2px',
          right: '0',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid #2a2a2a',
          borderRadius: '6px',
          color: copied ? '#4ade80' : '#888',
          fontSize: '0.75rem',
          padding: '4px 8px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          transition: 'all 0.2s ease',
        }}
        onMouseOver={e => {
          e.currentTarget.style.borderColor = '#555';
          e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
          e.currentTarget.style.boxShadow = '0 0 12px rgba(255,255,255,0.08)';
        }}
        onMouseOut={e => {
          e.currentTarget.style.borderColor = '#2a2a2a';
          e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        {copied ? (
          <>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            Copied
          </>
        ) : (
          <>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            Copy
          </>
        )}
      </button>
    </div>
  );
}

export default function Dashboard() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState(null)
  const [uploadStatus, setUploadStatus] = useState(null)
  
  const fileInputRef = useRef(null)
  const lastQuestionRef = useRef(null)
  
  const sessionContext = useSession()
  const activeSessionId = sessionContext?.activeSessionId
  const setActiveSessionId = sessionContext?.setActiveSessionId
  const fetchSessions = sessionContext?.fetchSessions
  const isSidebarOpen = sessionContext?.isSidebarOpen !== undefined ? sessionContext.isSidebarOpen : true

  useEffect(() => {
    if (activeSessionId) {
      setSessionId(activeSessionId)
      fetch(`/api/chat/sessions/${activeSessionId}`)
        .then(res => {
          if (res.ok) return res.json()
          throw new Error('Failed to load session')
        })
        .then(data => {
          if (data && data.messages) {
            setMessages(data.messages.map(m => ({ role: m.role, content: m.content })))
          }
        })
        .catch(err => console.error('Session load error:', err))
    } else if (activeSessionId === null && sessionId !== null) {
      setSessionId(null)
      setMessages([])
      setInput('')
    }
  }, [activeSessionId])

  useEffect(() => {
    if (messages.length > 0 && messages[messages.length - 1].role === 'user') {
      setTimeout(() => {
        lastQuestionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 50)
    }
  }, [messages.length])

  useEffect(() => {
    try {
      const pending = sessionStorage.getItem('pending_legal_query')
      if (pending) {
        setInput(pending)
        sessionStorage.removeItem('pending_legal_query')
      }
    } catch (e) {
      console.error(e)
    }
  }, [])

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadStatus('uploading')
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/chat/upload-document', { method: 'POST', body: formData })
      if (!res.ok) throw new Error('Upload failed')
      const data = await res.json()
      const contextPrefix = `[Uploaded Document: ${data.filename} (${data.file_type})]\n\n${data.extracted_text}\n\n---\n`
      setInput(prev => contextPrefix + (prev ? prev : 'Please analyze this document.'))
      setUploadStatus('done')
    } catch (err) {
      console.error(err)
      setUploadStatus('error')
    }
    e.target.value = ''
  }

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput('')
    setUploadStatus(null)
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setIsLoading(true)

    try {
      const currentSessionId = sessionId || activeSessionId
      const response = await fetch('/api/chat/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          session_id: currentSessionId
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      const data = await response.json()
      setMessages(prev => [...prev, { role: 'ai', content: data.content }])
      
      if (!currentSessionId && data.session_id) {
        setSessionId(data.session_id)
        if (setActiveSessionId) setActiveSessionId(data.session_id)
      }

      if (fetchSessions) {
        fetchSessions()
      }
    } catch (error) {
      console.error('Error:', error)
      setMessages(prev => [...prev, { role: 'ai', content: 'Sorry, I encountered an error connecting to the AI provider. Please try again later.' }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="dashboard-container" style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: messages.length === 0 ? 'center' : 'space-between',
      alignItems: 'center',
      minHeight: '100%',
      width: '100%',
      maxWidth: '850px',
      margin: '0 auto',
      padding: messages.length === 0 ? '0 20px' : '0',
      position: 'relative'
    }}>
      {messages.length === 0 ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          textAlign: 'center',
          marginBottom: '28px',
          userSelect: 'none'
        }}>
          <h1 style={{
            fontSize: '1.85rem',
            fontWeight: 600,
            letterSpacing: '-0.02em',
            color: '#ececec',
            margin: '0 0 10px 0'
          }}>
            Where should we begin?
          </h1>
        </div>
      ) : (
        <div className="chat-messages" style={{ width: '100%', padding: '40px 20px', paddingBottom: '140px' }}>
          {messages.map((msg, idx) => {
            const isLastUser = msg.role === 'user' && (idx === messages.length - 1 || (idx === messages.length - 2 && messages[messages.length - 1].role === 'ai'))
            return (
              <div 
                key={idx} 
                ref={isLastUser ? lastQuestionRef : null}
                className={`message-row ${msg.role}`}
              >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '100%', width: '100%' }}>
                  <div className="message-avatar">
                    {msg.role === 'user' ? 'You' : 'Senior Legal Counsel (AI)'}
                  </div>
                  <div className="message-bubble" style={{ width: '100%', maxWidth: msg.role === 'user' ? '80%' : '100%' }}>
                    {msg.role === 'ai' ? (
                      <FormattedLegalMessage content={msg.content} />
                    ) : (
                      <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{msg.content}</div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
          {isLoading && (
            <div className="message-row ai">
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <div className="message-avatar">Senior Legal Counsel (AI)</div>
                <div className="message-bubble">
                  <div className="typing-indicator">
                    <div className="typing-dot"></div>
                    <div className="typing-dot"></div>
                    <div className="typing-dot"></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className={messages.length > 0 ? "chat-input-container" : "floating-input-container"} style={messages.length > 0 ? { position: 'fixed', bottom: 0, width: isSidebarOpen ? 'calc(100% - 260px)' : 'calc(100% - 52px)', maxWidth: '900px', background: 'var(--background)', padding: '20px 40px 40px', transition: 'width 0.28s cubic-bezier(0.16, 1, 0.3, 1)' } : {}}>
        
        {/* Upload status banner */}
        {uploadStatus && (
          <div style={{
            marginBottom: '10px',
            padding: '8px 14px',
            borderRadius: '8px',
            fontSize: '0.82rem',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: uploadStatus === 'done' ? 'rgba(34,197,94,0.12)' : uploadStatus === 'error' ? 'rgba(239,68,68,0.12)' : 'rgba(99,102,241,0.12)',
            color: uploadStatus === 'done' ? '#4ade80' : uploadStatus === 'error' ? '#f87171' : '#a5b4fc',
            border: `1px solid ${uploadStatus === 'done' ? 'rgba(34,197,94,0.25)' : uploadStatus === 'error' ? 'rgba(239,68,68,0.25)' : 'rgba(99,102,241,0.25)'}`,
          }}>
            {uploadStatus === 'uploading' && <span style={{ display: 'inline-block', width: 12, height: 12, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />}
            {uploadStatus === 'done' && '✓'}
            {uploadStatus === 'error' && '✕'}
            {uploadStatus === 'uploading' ? 'Extracting document text...' : uploadStatus === 'done' ? 'Document loaded — review the text in the input and send.' : 'Upload failed. Try a different file.'}
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.doc,.txt,.md,.csv,.json,.png,.jpg,.jpeg,.webp,.bmp"
          style={{ display: 'none' }}
          onChange={handleFileUpload}
        />

        <form className={messages.length > 0 ? "chat-form" : "floating-input"} onSubmit={handleSubmit} style={messages.length === 0 ? { margin: '0 auto', maxWidth: '800px' } : {}}>
          <button type="button" className="icon-button" title="Upload Document (PDF, DOCX, Image…)" onClick={() => fileInputRef.current?.click()} disabled={uploadStatus === 'uploading'}>
            {uploadStatus === 'uploading' ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeDasharray="40" strokeDashoffset="20"><animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.8s" repeatCount="indefinite"/></circle></svg>
            ) : uploadStatus === 'done' ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
            )}
          </button>
          <input 
            type="text" 
            className={messages.length > 0 ? "chat-input" : ""}
            placeholder="Ask a legal question or describe your case..." 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            style={messages.length === 0 ? { flex: 1, background: 'transparent', border: 'none', color: 'var(--foreground)', fontSize: '0.95rem', outline: 'none', padding: '8px 0' } : {}}
          />
          <button type="submit" className="icon-button" disabled={!input.trim() || isLoading}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </form>
        <div className="input-footer">
          AI can make mistakes. Verify important information.
        </div>
      </div>
    </div>
  )
}
