from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
import io
import os

from app.database import database
from app.models import models
from app.schemas import schemas
from app.services.ai_service import AIService

router = APIRouter()
ai_service = AIService()

@router.post("/sessions", response_model=schemas.ChatSessionResponse)
def create_session(session_data: schemas.ChatSessionCreate, db: Session = Depends(database.get_db)):
    db_session = models.ChatSession(title=session_data.title or "New Conversation")
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    return db_session

@router.get("/sessions", response_model=List[schemas.ChatSessionResponse])
def get_sessions(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    sessions = db.query(models.ChatSession).order_by(models.ChatSession.created_at.desc()).offset(skip).limit(limit).all()
    return sessions

@router.get("/sessions/{session_id}", response_model=schemas.ChatSessionResponse)
def get_session(session_id: int, db: Session = Depends(database.get_db)):
    db_session = db.query(models.ChatSession).filter(models.ChatSession.id == session_id).first()
    if db_session is None:
        raise HTTPException(status_code=404, detail="Session not found")
    return db_session

@router.delete("/sessions/{session_id}")
def delete_session(session_id: int, db: Session = Depends(database.get_db)):
    db_session = db.query(models.ChatSession).filter(models.ChatSession.id == session_id).first()
    if db_session is None:
        raise HTTPException(status_code=404, detail="Session not found")
    db.delete(db_session)
    db.commit()
    return {"message": "Session deleted"}

@router.put("/sessions/{session_id}/rename")
def rename_session(session_id: int, payload: dict, db: Session = Depends(database.get_db)):
    db_session = db.query(models.ChatSession).filter(models.ChatSession.id == session_id).first()
    if db_session is None:
        raise HTTPException(status_code=404, detail="Session not found")
    db_session.title = payload.get("title", db_session.title)
    db.commit()
    return {"message": "Session renamed", "title": db_session.title}

@router.post("/upload-document")
async def upload_document(file: UploadFile = File(...)):
    """
    Extracts complete text from uploaded PDF, DOCX, TXT, or image files (with EasyOCR) for legal analysis.
    """
    filename = file.filename or "uploaded_document"
    ext = os.path.splitext(filename)[1].lower()
    contents = await file.read()
    
    extracted_text = ""
    file_type = "Document"

    try:
        if ext == ".pdf":
            file_type = "PDF Legal Document"
            try:
                import pdfplumber
                with pdfplumber.open(io.BytesIO(contents)) as pdf:
                    pages_text = []
                    for i, page in enumerate(pdf.pages):
                        text = page.extract_text()
                        if text and text.strip():
                            pages_text.append(f"--- [Page {i+1}] ---\n{text.strip()}")
                    extracted_text = "\n\n".join(pages_text)
            except Exception as pe:
                print(f"[PDF Extract Error] {pe}")
                from pypdf import PdfReader
                pdf_reader = PdfReader(io.BytesIO(contents))
                pages_text = [p.extract_text().strip() for p in pdf_reader.pages if p.extract_text()]
                extracted_text = "\n\n".join(pages_text)

            # If digital text was empty, run OCR on the PDF pages
            if not extracted_text.strip():
                try:
                    import easyocr
                    import numpy as np
                    import pdfplumber
                    reader = easyocr.Reader(['en'], gpu=False)
                    with pdfplumber.open(io.BytesIO(contents)) as pdf:
                        ocr_pages = []
                        for i, page in enumerate(pdf.pages[:10]):
                            img = page.to_image(resolution=150).original
                            lines = reader.readtext(np.array(img), detail=0)
                            if lines:
                                ocr_pages.append(f"--- [Page {i+1} OCR] ---\n" + "\n".join(lines))
                        extracted_text = "\n\n".join(ocr_pages)
                except Exception as ocr_e:
                    print(f"[PDF OCR Error] {ocr_e}")

        elif ext in [".docx", ".doc"]:
            file_type = "Word Document (DOCX)"
            import docx
            doc = docx.Document(io.BytesIO(contents))
            paragraphs = [p.text.strip() for p in doc.paragraphs if p.text.strip()]
            tables_text = []
            for table in doc.tables:
                for row in table.rows:
                    row_cells = [cell.text.strip() for cell in row.cells if cell.text.strip()]
                    if row_cells:
                        tables_text.append(" | ".join(row_cells))
            extracted_text = "\n".join(paragraphs + tables_text)

        elif ext in [".png", ".jpg", ".jpeg", ".webp", ".bmp", ".tiff"]:
            file_type = "Legal Document Image / Scan"
            try:
                import easyocr
                from PIL import Image
                import numpy as np
                img = Image.open(io.BytesIO(contents)).convert('RGB')
                reader = easyocr.Reader(['en'], gpu=False)
                lines = reader.readtext(np.array(img), detail=0)
                if lines:
                    extracted_text = "\n".join(lines)
                else:
                    extracted_text = f"[Image: {filename}] (Image dimensions: {img.size[0]}x{img.size[1]} px). No text detected."
            except Exception as img_ocr_err:
                print(f"[Image OCR Error] {img_ocr_err}")
                extracted_text = f"[Image Document: {filename}]"

        elif ext in [".txt", ".md", ".csv", ".json"]:
            file_type = "Text File"
            extracted_text = contents.decode("utf-8", errors="ignore")

        else:
            extracted_text = contents.decode("utf-8", errors="ignore")

    except Exception as e:
        extracted_text = f"Document uploaded ({filename}). Note: {str(e)}"

    if not extracted_text.strip():
        extracted_text = f"[Document {filename} loaded successfully]"

    return {
        "filename": filename,
        "file_type": file_type,
        "size_bytes": len(contents),
        "extracted_text": extracted_text[:20000]
    }

def generate_title_from_prompt(prompt: str) -> str:
    import re
    cleaned = prompt.strip()
    if cleaned.startswith("[Uploaded Document:"):
        doc_part = cleaned.split("]")[0].replace("[Uploaded Document:", "").strip()
        doc_name = doc_part.split("(")[0].strip()
        return f"Doc: {doc_name}"[:32]
    
    # Strip common conversational openers
    cleaned = re.sub(r'^(please\s+|can you\s+|could you\s+|tell me about\s+|what is\s+|what are\s+|how do i\s+|i want to know\s+|explain\s+|help me with\s+|check\s+)', '', cleaned, flags=re.IGNORECASE)
    cleaned = cleaned.strip()
    if not cleaned:
        cleaned = prompt.strip()
    
    words = cleaned.split()
    title = " ".join(words[:5])
    title = title.rstrip('?,.:;!')
    if len(title) > 32:
        title = title[:30] + "..."
    return title.title() if title else "Legal Consultation"

@router.post("/message", response_model=schemas.ChatMessageResponse)
def send_message(request: schemas.SendMessageRequest, db: Session = Depends(database.get_db)):
    session_id = request.session_id
    if not session_id:
        chat_title = generate_title_from_prompt(request.message)
        db_session = models.ChatSession(title=chat_title)
        db.add(db_session)
        db.commit()
        db.refresh(db_session)
        session_id = db_session.id
    
    # Save user message
    user_msg = models.ChatMessage(session_id=session_id, role="user", content=request.message)
    db.add(user_msg)
    db.commit()
    
    # Get history for AI
    history = db.query(models.ChatMessage).filter(models.ChatMessage.session_id == session_id).order_by(models.ChatMessage.created_at).all()
    history_dicts = [{"role": msg.role, "content": msg.content} for msg in history]
    
    # Generate AI response (RAG-aware: db passed for context retrieval)
    ai_content = ai_service.generate_response(request.message, history_dicts, db=db)
    
    # Save AI message
    ai_msg = models.ChatMessage(session_id=session_id, role="ai", content=ai_content)
    db.add(ai_msg)
    db.commit()
    db.refresh(ai_msg)
    
    return ai_msg
