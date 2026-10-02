from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import database
from app.models import models
from app.schemas import schemas
from app.services import vector_service

router = APIRouter()

SIMPLE_CASE_STUDIES = [
    {
        "id": "case-1",
        "title": "Breach of Commercial Supply Agreement",
        "category": "Contract & Commercial Law",
        "court": "High Court (Commercial Division)",
        "year": 2023,
        "summary": "Buyer paid a 40% advance for industrial equipment. Supplier failed to deliver within the contractual timeframe citing transportation delays.",
        "legal_issue": "Does supply chain delay excuse contractual non-performance without a verified Force Majeure notice?",
        "verdict": "Ruled in favor of the Buyer. Supplier ordered to refund advance payment with 10% annual interest and compensation for commercial downtime.",
        "key_principle": "Reciprocal contractual obligations must be performed strictly as agreed unless formal notice of impossibility is communicated within statutory limits."
    },
    {
        "id": "case-2",
        "title": "Adverse Possession vs. Registered Land Title",
        "category": "Property & Real Estate Law",
        "court": "Supreme Court (Civil Division)",
        "year": 2022,
        "summary": "Occupant claimed title over an adjacent parcel of land based on 30 years of continuous possession, while the purchaser held valid government registration deeds.",
        "legal_issue": "Can long-term possession override registered statutory landownership without official cadastral deed mutation?",
        "verdict": "Ruled in favor of the Registered Owner. Occupant ordered to vacate the encroached parcel.",
        "key_principle": "Registered government title deeds (Lalpurja) hold paramount legal presumption over unrecorded permissive possession."
    },
    {
        "id": "case-3",
        "title": "Digital Evidence Admissibility in Cyber Banking Fraud",
        "category": "Cyber & Criminal Law",
        "court": "Supreme Court (Criminal Bench)",
        "year": 2023,
        "summary": "Unauthorized funds transfer orchestrated via SIM swap and OTP interception. Accused contested the admissibility of server IP logs.",
        "legal_issue": "What chain of custody and hash integrity is required for electronic records under the Evidence Act?",
        "verdict": "Conviction upheld. Cryptographic hash-matched digital forensic reports were admitted as primary evidence.",
        "key_principle": "Digital records are fully admissible when preserved with continuous timestamped cryptographic hash logs and certified forensic examination."
    },
    {
        "id": "case-4",
        "title": "Unfair Employee Termination Without Statutory Notice",
        "category": "Labour & Employment Law",
        "court": "Labour Court",
        "year": 2024,
        "summary": "Permanent employee was terminated via email without a formal 30-day notice, inquiry committee hearing, or gratuity settlement.",
        "legal_issue": "Is economic restructuring a valid ground for unilateral termination without labour department approval?",
        "verdict": "Termination quashed. Employer ordered to pay full back wages or a severance package of 2 months' salary per year of service.",
        "key_principle": "Statutory disciplinary procedures and notice requirements under the Labour Act are mandatory before terminating permanent staff."
    },
    {
        "id": "case-5",
        "title": "Cheque Dishonor & Financial Liability",
        "category": "Banking & Financial Law",
        "court": "High Court (Commercial Bench)",
        "year": 2023,
        "summary": "Debtor issued an account payee cheque of NPR 2,500,000 which bounced twice with remarks 'Insufficient Funds'.",
        "legal_issue": "Can the creditor pursue both criminal penalty and civil debt recovery for a bounced cheque?",
        "verdict": "Debtor ordered to pay the full cheque amount plus a fine equal to the amount under Banking Offenses regulations.",
        "key_principle": "Issuing a cheque with knowledge of insufficient funds is a statutory financial offense carrying both restitution and punitive fines."
    },
    {
        "id": "case-6",
        "title": "Software Copyright & Trade Secret Infringement",
        "category": "Intellectual Property",
        "court": "District Court (Commercial Division)",
        "year": 2024,
        "summary": "Former developer copied proprietary database schema and backend logic to launch a competing fintech application.",
        "legal_issue": "Does employee-created software belong exclusively to the employer under work-for-hire provisions?",
        "verdict": "Permanent injunction granted prohibiting the release of the copied software, plus damages awarded.",
        "key_principle": "Source code and architecture created within the scope of employment remain the exclusive intellectual property of the enterprise."
    }
]

def seed_db_case_studies(db: Session):
    count = db.query(models.CaseStudyItem).count()
    if count == 0:
        for c in SIMPLE_CASE_STUDIES:
            item = models.CaseStudyItem(
                title=c["title"],
                category=c["category"],
                court=c["court"],
                year=c["year"],
                summary=c["summary"],
                legal_issue=c["legal_issue"],
                verdict=c["verdict"],
                key_principle=c["key_principle"]
            )
            db.add(item)
        db.commit()
        # Index seeded data into ChromaDB
        for item in db.query(models.CaseStudyItem).all():
            text = f"[CASE STUDY] {item.title} ({item.year})\nCategory: {item.category} | Court: {item.court}\nLegal Issue: {item.legal_issue}\nVerdict: {item.verdict}\nKey Principle: {item.key_principle}"
            vector_service.upsert_document("case_study", item.id, text, {"title": item.title})

@router.get("", response_model=List[schemas.CaseStudyResponse])
def get_case_studies(
    category: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(database.get_db)
):
    seed_db_case_studies(db)
    query = db.query(models.CaseStudyItem)
    if category and category.lower() != "all":
        query = query.filter(models.CaseStudyItem.category.ilike(f"%{category}%"))
    if search:
        s = f"%{search}%"
        query = query.filter(
            models.CaseStudyItem.title.ilike(s) |
            models.CaseStudyItem.summary.ilike(s) |
            models.CaseStudyItem.legal_issue.ilike(s) |
            models.CaseStudyItem.key_principle.ilike(s)
        )
    return query.order_by(models.CaseStudyItem.id.asc()).all()

@router.post("", response_model=schemas.CaseStudyResponse)
def create_case_study(item: schemas.CaseStudyCreate, db: Session = Depends(database.get_db)):
    db_item = models.CaseStudyItem(**item.model_dump())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    # Index into ChromaDB for semantic search
    text = f"[CASE STUDY] {db_item.title} ({db_item.year})\nCategory: {db_item.category} | Court: {db_item.court}\nLegal Issue: {db_item.legal_issue}\nVerdict: {db_item.verdict}\nKey Principle: {db_item.key_principle}"
    vector_service.upsert_document("case_study", db_item.id, text, {"title": db_item.title})
    return db_item

@router.delete("/{case_id}")
def delete_case_study(case_id: int, db: Session = Depends(database.get_db)):
    item = db.query(models.CaseStudyItem).filter(models.CaseStudyItem.id == case_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Case study not found")
    vector_service.delete_document("case_study", case_id)
    db.delete(item)
    db.commit()
    return {"message": "Case study deleted successfully"}
