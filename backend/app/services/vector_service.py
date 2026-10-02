"""
VectorService — ChromaDB based semantic search engine.

All legal data (case studies, hearings, drafts, evidence) is embedded and
stored in a persistent local ChromaDB collection with HNSW cosine similarity.
At query time, vector similarity search retrieves the top-k most relevant
records for the AI system prompt.
"""

import os
import re
import numpy as np

_chroma_client = None
_collection = None


def _get_resources():
    global _chroma_client, _collection
    if _collection is not None:
        return _collection

    try:
        import chromadb
        from chromadb import EmbeddingFunction, Documents, Embeddings

        class LegalEmbeddingFunction(EmbeddingFunction[Documents]):
            def __init__(self, dim=384):
                self.dim = dim

            def __call__(self, input: Documents) -> Embeddings:
                vectors = []
                for text in input:
                    vec = np.zeros(self.dim, dtype=np.float32)
                    tokens = re.findall(r'\w+', (text or "").lower())
                    for token in tokens:
                        idx = abs(hash(token)) % self.dim
                        vec[idx] += 1.0
                        # Subword n-grams for legal terminology
                        for n in range(3, 6):
                            for i in range(len(token) - n + 1):
                                ngram_idx = abs(hash(token[i:i+n])) % self.dim
                                vec[ngram_idx] += 0.5
                    norm = np.linalg.norm(vec)
                    if norm > 0:
                        vec = vec / norm
                    vectors.append(vec.tolist())
                return vectors

            def name(self) -> str:
                return "legal_dense_embedding"

        db_path = os.path.join(os.path.dirname(__file__), "..", "..", "chroma_db")
        os.makedirs(db_path, exist_ok=True)

        _chroma_client = chromadb.PersistentClient(path=os.path.abspath(db_path))
        _collection = _chroma_client.get_or_create_collection(
            name="legal_knowledge_vectors",
            embedding_function=LegalEmbeddingFunction(),
            metadata={"hnsw:space": "cosine"}
        )
        print("[VectorService] ChromaDB collection 'legal_knowledge_vectors' initialized successfully.")
    except Exception as e:
        print(f"[VectorService] ChromaDB initialization failed: {e}")
        _collection = None

    return _collection


def _doc_id(entity_type: str, record_id: int) -> str:
    return f"{entity_type}_{record_id}"


def upsert_document(entity_type: str, record_id: int, text: str, metadata: dict = None):
    """
    Add or update a document in the ChromaDB vector store.
    entity_type: 'case_study' | 'hearing' | 'draft' | 'evidence'
    """
    collection = _get_resources()
    if collection is None:
        return

    try:
        doc_id = _doc_id(entity_type, record_id)
        meta = {"entity_type": entity_type, "record_id": str(record_id)}
        if metadata:
            meta.update({k: str(v) for k, v in metadata.items()})

        collection.upsert(
            ids=[doc_id],
            documents=[text],
            metadatas=[meta]
        )
    except Exception as e:
        print(f"[VectorService] upsert failed for {entity_type}:{record_id}: {e}")


def delete_document(entity_type: str, record_id: int):
    """Remove a document from the ChromaDB vector store when deleted from SQLite."""
    collection = _get_resources()
    if collection is None:
        return
    try:
        collection.delete(ids=[_doc_id(entity_type, record_id)])
    except Exception as e:
        print(f"[VectorService] delete failed for {entity_type}:{record_id}: {e}")


def semantic_search(query: str, n_results: int = 5) -> list[dict]:
    """
    Vector similarity search on ChromaDB.
    Returns list of dicts: {text, entity_type, record_id, distance}
    """
    collection = _get_resources()
    if collection is None:
        return []

    try:
        count = collection.count()
        if count == 0:
            return []

        results = collection.query(
            query_texts=[query],
            n_results=min(n_results, count),
            include=["documents", "metadatas", "distances"]
        )

        hits = []
        if results and "documents" in results and results["documents"]:
            for i, doc in enumerate(results["documents"][0]):
                hits.append({
                    "text": doc,
                    "entity_type": results["metadatas"][0][i].get("entity_type", "") if results.get("metadatas") else "",
                    "record_id": results["metadatas"][0][i].get("record_id", "") if results.get("metadatas") else "",
                    "distance": results["distances"][0][i] if results.get("distances") else 0.0,
                })
        return hits
    except Exception as e:
        print(f"[VectorService] semantic search failed: {e}")
        return []


def sync_all_from_db(db):
    """
    Sync all existing records from SQLite into ChromaDB.
    """
    try:
        from app.models import models

        # 1. Case Studies
        cases = db.query(models.CaseStudyItem).all()
        for c in cases:
            text = f"[CASE STUDY] {c.title} ({c.year})\nCategory: {c.category} | Court: {c.court}\nLegal Issue: {c.legal_issue}\nVerdict: {c.verdict}\nKey Principle: {c.key_principle}"
            upsert_document("case_study", c.id, text, {"title": c.title})

        # 2. Hearings
        hearings = db.query(models.CourtHearing).all()
        for h in hearings:
            text = f"[COURT HEARING TARIKH] Case: {h.case_title} | Court: {h.court_name} | Date: {h.hearing_date}\nType: {h.hearing_type} | Bench: {h.bench} | Status: {h.status}\nNotes: {h.notes or 'None'}"
            upsert_document("hearing", h.id, text, {"case_title": h.case_title})

        # 3. Drafts
        drafts = db.query(models.LegalDraft).all()
        for d in drafts:
            text = f"[LEGAL DRAFT] Title: {d.title} | Category: {d.category} | Recipient: {d.recipient or 'General'}\nContent:\n{d.content}"
            upsert_document("draft", d.id, text, {"title": d.title})

        # 4. Evidence
        evidences = db.query(models.EvidenceItem).all()
        for ev in evidences:
            text = f"[LEGAL EVIDENCE] Title: {ev.title} (Case: {ev.case_title})\nType: {ev.evidence_type} | Date: {ev.collected_date or 'N/A'} | Status: {ev.status}\nDescription: {ev.description}"
            upsert_document("evidence", ev.id, text, {"title": ev.title, "case_title": ev.case_title})

        print(f"[VectorService] Synced SQLite records to ChromaDB collection.")
    except Exception as e:
        print(f"[VectorService] Sync from DB error: {e}")
