from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import database
from app.models import models
from app.schemas import schemas
from app.services import vector_service

router = APIRouter()

# Initial seed data helper
def seed_hearings_if_empty(db: Session):
    count = db.query(models.CourtHearing).count()
    if count == 0:
        samples = [
            models.CourtHearing(
                case_title="Sunrise Trading v. Metro Logistics (Contract Breach)",
                court_name="Patan High Court (Commercial Bench)",
                hearing_date="2026-10-15",
                hearing_type="Evidence Examination",
                bench="Division Bench",
                status="Scheduled",
                notes="Cross-examination of the principal accountant regarding invoice receipts."
            ),
            models.CourtHearing(
                case_title="Sharma Land Partition & Title Claim",
                court_name="Kathmandu District Court",
                hearing_date="2026-10-22",
                hearing_type="Preliminary Hearing",
                bench="Single Bench",
                status="Scheduled",
                notes="Submission of Cadastral Map and Land Revenue Office registration certificate."
            ),
            models.CourtHearing(
                case_title="State v. Cyber Fraud Syndicate",
                court_name="Kathmandu District Court (Criminal Division)",
                hearing_date="2026-09-28",
                hearing_type="Bail Hearing",
                bench="Single Bench",
                status="Completed",
                notes="Bail granted with surety bond of NPR 500,000."
            ),
        ]
        for s in samples:
            db.add(s)
        db.commit()

@router.get("", response_model=List[schemas.CourtHearingResponse])
def get_hearings(
    status: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(database.get_db)
):
    seed_hearings_if_empty(db)
    query = db.query(models.CourtHearing)
    if status and status.lower() != "all":
        query = query.filter(models.CourtHearing.status.ilike(f"%{status}%"))
    if search:
        s = f"%{search}%"
        query = query.filter(
            models.CourtHearing.case_title.ilike(s) |
            models.CourtHearing.court_name.ilike(s) |
            models.CourtHearing.notes.ilike(s)
        )
    return query.order_by(models.CourtHearing.hearing_date.asc()).all()

@router.post("", response_model=schemas.CourtHearingResponse)
def create_hearing(hearing: schemas.CourtHearingCreate, db: Session = Depends(database.get_db)):
    db_item = models.CourtHearing(**hearing.model_dump())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    text = f"[COURT HEARING] {db_item.case_title}\nCourt: {db_item.court_name} | Date: {db_item.hearing_date} | Type: {db_item.hearing_type}\nStatus: {db_item.status}" + (f"\nNotes: {db_item.notes}" if db_item.notes else "")
    vector_service.upsert_document("hearing", db_item.id, text, {"case_title": db_item.case_title})
    return db_item

@router.get("/{hearing_id}", response_model=schemas.CourtHearingResponse)
def get_hearing(hearing_id: int, db: Session = Depends(database.get_db)):
    item = db.query(models.CourtHearing).filter(models.CourtHearing.id == hearing_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Hearing not found")
    return item

@router.put("/{hearing_id}", response_model=schemas.CourtHearingResponse)
def update_hearing(hearing_id: int, update_data: schemas.CourtHearingUpdate, db: Session = Depends(database.get_db)):
    item = db.query(models.CourtHearing).filter(models.CourtHearing.id == hearing_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Hearing not found")
    for key, val in update_data.model_dump(exclude_unset=True).items():
        setattr(item, key, val)
    db.commit()
    db.refresh(item)
    text = f"[COURT HEARING] {item.case_title}\nCourt: {item.court_name} | Date: {item.hearing_date} | Type: {item.hearing_type}\nStatus: {item.status}" + (f"\nNotes: {item.notes}" if item.notes else "")
    vector_service.upsert_document("hearing", item.id, text, {"case_title": item.case_title})
    return item

@router.delete("/{hearing_id}")
def delete_hearing(hearing_id: int, db: Session = Depends(database.get_db)):
    item = db.query(models.CourtHearing).filter(models.CourtHearing.id == hearing_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Hearing not found")
    vector_service.delete_document("hearing", hearing_id)
    db.delete(item)
    db.commit()
    return {"message": "Court hearing deleted successfully"}
