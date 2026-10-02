from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import database
from app.models import models
from app.schemas import schemas
from app.services import vector_service

router = APIRouter()

def seed_evidence_if_empty(db: Session):
    count = db.query(models.EvidenceItem).count()
    if count == 0:
        samples = [
            models.EvidenceItem(
                case_title="Sunrise Trading v. Metro Logistics",
                title="Original Commercial Supply Contract",
                evidence_type="Documentary",
                description="Signed agreement with revenue stamp specifying delivery date and penalty clauses.",
                collected_date="2026-06-15",
                status="Verified"
            ),
            models.EvidenceItem(
                case_title="Sunrise Trading v. Metro Logistics",
                title="Bank Advance Payment Voucher (NPR 1.5M)",
                evidence_type="Financial Statement",
                description="Stamped SWIFT transaction advice confirming advance funds credit to defendant.",
                collected_date="2026-06-16",
                status="Submitted in Court"
            ),
            models.EvidenceItem(
                case_title="State v. Cyber Fraud Syndicate",
                title="Forensic SHA-256 Server Hash Log",
                evidence_type="Digital Record",
                description="Digital Forensic Lab report confirming timestamp and origin IP trace of malicious requests.",
                collected_date="2026-09-10",
                status="Verified"
            ),
            models.EvidenceItem(
                case_title="Sharma Land Partition Claim",
                title="Certified Land Revenue Deed (Lalpurja)",
                evidence_type="Documentary",
                description="Official mutation record from Land Revenue Office Lalitpur showing plot survey #412.",
                collected_date="2026-08-20",
                status="Verified"
            ),
        ]
        for s in samples:
            db.add(s)
        db.commit()

@router.get("", response_model=List[schemas.EvidenceItemResponse])
def get_evidence_list(
    evidence_type: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(database.get_db)
):
    seed_evidence_if_empty(db)
    query = db.query(models.EvidenceItem)
    if evidence_type and evidence_type.lower() != "all":
        query = query.filter(models.EvidenceItem.evidence_type.ilike(f"%{evidence_type}%"))
    if status and status.lower() != "all":
        query = query.filter(models.EvidenceItem.status.ilike(f"%{status}%"))
    if search:
        s = f"%{search}%"
        query = query.filter(
            models.EvidenceItem.case_title.ilike(s) |
            models.EvidenceItem.title.ilike(s) |
            models.EvidenceItem.description.ilike(s)
        )
    return query.order_by(models.EvidenceItem.created_at.desc()).all()

@router.post("", response_model=schemas.EvidenceItemResponse)
def create_evidence_item(evidence: schemas.EvidenceItemCreate, db: Session = Depends(database.get_db)):
    db_item = models.EvidenceItem(**evidence.model_dump())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    text = f"[EVIDENCE] {db_item.title} (Case: {db_item.case_title})\nType: {db_item.evidence_type} | Status: {db_item.status}\nDescription: {db_item.description}"
    vector_service.upsert_document("evidence", db_item.id, text, {"case_title": db_item.case_title})
    return db_item

@router.get("/{evidence_id}", response_model=schemas.EvidenceItemResponse)
def get_evidence_item(evidence_id: int, db: Session = Depends(database.get_db)):
    item = db.query(models.EvidenceItem).filter(models.EvidenceItem.id == evidence_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Evidence item not found")
    return item

@router.put("/{evidence_id}", response_model=schemas.EvidenceItemResponse)
def update_evidence_item(evidence_id: int, update_data: schemas.EvidenceItemUpdate, db: Session = Depends(database.get_db)):
    item = db.query(models.EvidenceItem).filter(models.EvidenceItem.id == evidence_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Evidence item not found")
    for key, val in update_data.model_dump(exclude_unset=True).items():
        setattr(item, key, val)
    db.commit()
    db.refresh(item)
    text = f"[EVIDENCE] {item.title} (Case: {item.case_title})\nType: {item.evidence_type} | Status: {item.status}\nDescription: {item.description}"
    vector_service.upsert_document("evidence", item.id, text, {"case_title": item.case_title})
    return item

@router.delete("/{evidence_id}")
def delete_evidence_item(evidence_id: int, db: Session = Depends(database.get_db)):
    item = db.query(models.EvidenceItem).filter(models.EvidenceItem.id == evidence_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Evidence item not found")
    vector_service.delete_document("evidence", evidence_id)
    db.delete(item)
    db.commit()
    return {"message": "Evidence item deleted successfully"}
