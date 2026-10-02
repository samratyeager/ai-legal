from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional

# --- Chat Schemas ---
class ChatMessageBase(BaseModel):
    role: str
    content: str

class ChatMessageCreate(ChatMessageBase):
    pass

class ChatMessageResponse(ChatMessageBase):
    id: int
    session_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class ChatSessionBase(BaseModel):
    title: Optional[str] = None

class ChatSessionCreate(ChatSessionBase):
    pass

class ChatSessionResponse(ChatSessionBase):
    id: int
    created_at: datetime
    updated_at: datetime
    messages: List[ChatMessageResponse] = []

    class Config:
        from_attributes = True

class SendMessageRequest(BaseModel):
    message: str
    session_id: Optional[int] = None

# --- Court Hearing (Tarikh) Schemas ---
class CourtHearingBase(BaseModel):
    case_title: str
    court_name: str
    hearing_date: str
    hearing_type: Optional[str] = "Preliminary Hearing"
    bench: Optional[str] = "Single Bench"
    status: Optional[str] = "Scheduled"
    notes: Optional[str] = None

class CourtHearingCreate(CourtHearingBase):
    pass

class CourtHearingUpdate(BaseModel):
    case_title: Optional[str] = None
    court_name: Optional[str] = None
    hearing_date: Optional[str] = None
    hearing_type: Optional[str] = None
    bench: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None

class CourtHearingResponse(CourtHearingBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# --- Legal Draft Schemas ---
class LegalDraftBase(BaseModel):
    title: str
    category: Optional[str] = "Legal Notice"
    recipient: Optional[str] = None
    content: str

class LegalDraftCreate(LegalDraftBase):
    pass

class LegalDraftUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    recipient: Optional[str] = None
    content: Optional[str] = None

class LegalDraftResponse(LegalDraftBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# --- Evidence Item Schemas ---
class EvidenceItemBase(BaseModel):
    case_title: str
    title: str
    evidence_type: Optional[str] = "Documentary"
    description: str
    collected_date: Optional[str] = ""
    status: Optional[str] = "Verified"

class EvidenceItemCreate(EvidenceItemBase):
    pass

class EvidenceItemUpdate(BaseModel):
    case_title: Optional[str] = None
    title: Optional[str] = None
    evidence_type: Optional[str] = None
    description: Optional[str] = None
    collected_date: Optional[str] = None
    status: Optional[str] = None

class EvidenceItemResponse(EvidenceItemBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# --- Case Study DB Schemas ---
class CaseStudyCreate(BaseModel):
    title: str
    category: str
    court: str
    year: int
    summary: str
    legal_issue: str
    verdict: str
    key_principle: str

class CaseStudyResponse(CaseStudyCreate):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
