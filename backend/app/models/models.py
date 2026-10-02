from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.database import Base

class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, default="New Conversation")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    messages = relationship("ChatMessage", back_populates="session", cascade="all, delete-orphan")

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("chat_sessions.id"))
    role = Column(String)  # 'user' or 'ai'
    content = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("ChatSession", back_populates="messages")

class CourtHearing(Base):
    __tablename__ = "court_hearings"

    id = Column(Integer, primary_key=True, index=True)
    case_title = Column(String, index=True)
    court_name = Column(String)
    hearing_date = Column(String) # e.g. "2026-10-15" or "2083-07-01"
    hearing_type = Column(String, default="Preliminary Hearing")
    bench = Column(String, default="Single Bench")
    status = Column(String, default="Scheduled") # Scheduled, Completed, Adjourned
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class LegalDraft(Base):
    __tablename__ = "legal_drafts"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    category = Column(String, default="Legal Notice") # Legal Notice, NDA, Agreement, Power of Attorney
    recipient = Column(String, nullable=True)
    content = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class EvidenceItem(Base):
    __tablename__ = "evidence_items"

    id = Column(Integer, primary_key=True, index=True)
    case_title = Column(String, index=True)
    title = Column(String)
    evidence_type = Column(String, default="Documentary") # Documentary, Digital Record, Witness Statement, Financial Statement
    description = Column(Text)
    collected_date = Column(String, default="")
    status = Column(String, default="Verified") # Verified, Pending Review, Submitted in Court
    created_at = Column(DateTime, default=datetime.utcnow)

class CaseStudyItem(Base):
    __tablename__ = "case_studies_db"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    category = Column(String)
    court = Column(String)
    year = Column(Integer)
    summary = Column(Text)
    legal_issue = Column(Text)
    verdict = Column(Text)
    key_principle = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
