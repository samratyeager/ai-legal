from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.database import database
from app.models import models
from app.schemas import schemas
from app.services import vector_service

router = APIRouter()

def seed_drafts_if_empty(db: Session):
    count = db.query(models.LegalDraft).count()
    if count == 0:
        samples = [
            models.LegalDraft(
                title="15-Day Legal Demand Notice (Breach of Supply Agreement)",
                category="Legal Demand Notice",
                recipient="Apex Suppliers Pvt. Ltd., Kathmandu",
                content=(
                    "LEGAL DEMAND NOTICE\n\n"
                    "Date: 2026-09-30\n"
                    "To: The Managing Director, Apex Suppliers Pvt. Ltd., Kathmandu, Nepal\n\n"
                    "Subject: 15-Day Final Notice for Delivery of Goods and Liquidated Damages\n\n"
                    "Dear Sir/Madam,\n\n"
                    "Under instructions from our client, M/S Horizon Trading Co., we hereby issue this formal Legal Notice:\n"
                    "1. That our client entered into a supply agreement dated 2026-06-15 with your company for the delivery of commercial industrial equipment.\n"
                    "2. That our client paid an advance amount of NPR 1,500,000 via bank transfer.\n"
                    "3. That despite the agreed delivery deadline of 2026-08-30, your company has failed to perform its contractual obligations under Section 520 of the Muluki Civil Code 2074.\n\n"
                    "TAKE NOTICE that you are hereby called upon to deliver the goods or refund the advance with 10% statutory interest within FIFTEEN (15) DAYS from the receipt of this notice, failing which our client shall initiate civil and commercial proceedings at the competent High Court without further notice."
                )
            ),
            models.LegalDraft(
                title="Mutual Non-Disclosure Agreement (NDA)",
                category="Commercial Agreement",
                recipient="Tech Innovations Nepal",
                content=(
                    "STANDARD NON-DISCLOSURE AGREEMENT (NDA)\n\n"
                    "This Agreement is entered into on 2026-10-01 by and between:\n"
                    "Party A: Disclosing Legal Entity\n"
                    "Party B: Receiving Legal Entity\n\n"
                    "1. Confidential Information: All proprietary business formulas, source code, client records, and commercial strategies.\n"
                    "2. Term: The non-disclosure obligations shall remain in force for a period of two (2) years from the effective date.\n"
                    "3. Remedies: Injunctive relief and actual damages as governed by the laws of Nepal."
                )
            ),
            models.LegalDraft(
                title="Special Power of Attorney (अधिकृत वारिसनामा)",
                category="Power of Attorney",
                recipient="Advocate Legal Representative",
                content=(
                    "SPECIAL POWER OF ATTORNEY\n\n"
                    "I/We hereby appoint and authorize Advocate [Name], License No. [Number], to represent, plead, submit documents, sign plaint forms, and attend all hearing dates (Tarikh) before the competent District and High Courts on our behalf."
                )
            ),
        ]
        for s in samples:
            db.add(s)
        db.commit()

@router.get("", response_model=List[schemas.LegalDraftResponse])
def get_drafts(
    category: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(database.get_db)
):
    seed_drafts_if_empty(db)
    query = db.query(models.LegalDraft)
    if category and category.lower() != "all":
        query = query.filter(models.LegalDraft.category.ilike(f"%{category}%"))
    if search:
        s = f"%{search}%"
        query = query.filter(
            models.LegalDraft.title.ilike(s) |
            models.LegalDraft.content.ilike(s) |
            models.LegalDraft.recipient.ilike(s)
        )
    return query.order_by(models.LegalDraft.created_at.desc()).all()

@router.post("", response_model=schemas.LegalDraftResponse)
def create_draft(draft: schemas.LegalDraftCreate, db: Session = Depends(database.get_db)):
    db_item = models.LegalDraft(**draft.model_dump())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    excerpt = (db_item.content[:600] + "...") if len(db_item.content) > 600 else db_item.content
    text = f"[LEGAL DRAFT] {db_item.title}\nCategory: {db_item.category}" + (f" | Recipient: {db_item.recipient}" if db_item.recipient else "") + f"\nContent: {excerpt}"
    vector_service.upsert_document("draft", db_item.id, text, {"title": db_item.title})
    return db_item

@router.get("/{draft_id}", response_model=schemas.LegalDraftResponse)
def get_draft(draft_id: int, db: Session = Depends(database.get_db)):
    item = db.query(models.LegalDraft).filter(models.LegalDraft.id == draft_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Draft not found")
    return item

@router.put("/{draft_id}", response_model=schemas.LegalDraftResponse)
def update_draft(draft_id: int, update_data: schemas.LegalDraftUpdate, db: Session = Depends(database.get_db)):
    item = db.query(models.LegalDraft).filter(models.LegalDraft.id == draft_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Draft not found")
    for key, val in update_data.model_dump(exclude_unset=True).items():
        setattr(item, key, val)
    item.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(item)
    excerpt = (item.content[:600] + "...") if len(item.content) > 600 else item.content
    text = f"[LEGAL DRAFT] {item.title}\nCategory: {item.category}" + (f" | Recipient: {item.recipient}" if item.recipient else "") + f"\nContent: {excerpt}"
    vector_service.upsert_document("draft", item.id, text, {"title": item.title})
    return item

@router.delete("/{draft_id}")
def delete_draft(draft_id: int, db: Session = Depends(database.get_db)):
    item = db.query(models.LegalDraft).filter(models.LegalDraft.id == draft_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Draft not found")
    vector_service.delete_document("draft", draft_id)
    db.delete(item)
    db.commit()
    return {"message": "Legal draft deleted successfully"}
