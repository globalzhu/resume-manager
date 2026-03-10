import os
import json
import asyncio
from datetime import datetime
from contextlib import asynccontextmanager

from fastapi import FastAPI, Query, UploadFile, File, HTTPException, BackgroundTasks, Request
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

from database import get_db, init_db, dict_from_row
from pydantic import BaseModel
from models import ResumeUpdate, TagAdd, BulkAction
from parser import (
    scan_resume_folder,
    parse_filename,
    compute_file_hash,
    extract_pdf_text,
    parse_resume_with_llm,
    RESUME_FOLDER,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(title="Resume Manager", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Resumes CRUD ──────────────────────────────────────────────


@app.get("/api/resumes")
def list_resumes(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str = "",
    status: str = "",
    education: str = "",
    min_years: float = 0,
    max_years: float = 100,
    tag: str = "",
    sort: str = "created_at",
    order: str = "desc",
):
    db = get_db()
    try:
        conditions = []
        params = []

        if search:
            # Use LIKE for broad search (works well with CJK characters)
            like_pattern = f"%{search}%"
            conditions.append(
                "(r.name LIKE ? OR r.phone LIKE ? OR r.email LIKE ? OR r.current_title LIKE ? OR r.skills LIKE ? OR r.summary LIKE ? OR r.filename LIKE ?)"
            )
            params.extend([like_pattern] * 7)

        if status:
            conditions.append("r.status = ?")
            params.append(status)

        if education:
            conditions.append("r.education LIKE ?")
            params.append(f"%{education}%")

        conditions.append("r.years_experience >= ?")
        params.append(min_years)
        conditions.append("r.years_experience <= ?")
        params.append(max_years)

        if tag:
            conditions.append("r.tags LIKE ?")
            params.append(f'%"{tag}"%')

        where = " AND ".join(conditions) if conditions else "1=1"

        allowed_sort = {
            "created_at", "updated_at", "name", "years_experience", "status"
        }
        sort_col = sort if sort in allowed_sort else "created_at"
        sort_order = "ASC" if order.lower() == "asc" else "DESC"

        count_row = db.execute(
            f"SELECT COUNT(*) as cnt FROM resumes r WHERE {where}", params
        ).fetchone()
        total = count_row["cnt"]

        offset = (page - 1) * page_size
        rows = db.execute(
            f"""SELECT r.* FROM resumes r
                WHERE {where}
                ORDER BY r.{sort_col} {sort_order}
                LIMIT ? OFFSET ?""",
            params + [page_size, offset],
        ).fetchall()

        return {
            "items": [dict_from_row(r) for r in rows],
            "total": total,
            "page": page,
            "page_size": page_size,
            "pages": max(1, (total + page_size - 1) // page_size),
        }
    finally:
        db.close()


@app.get("/api/resumes/{resume_id}")
def get_resume(resume_id: int):
    db = get_db()
    try:
        row = db.execute("SELECT * FROM resumes WHERE id = ?", (resume_id,)).fetchone()
        if not row:
            raise HTTPException(404, "Resume not found")
        return dict_from_row(row)
    finally:
        db.close()


@app.put("/api/resumes/{resume_id}")
def update_resume(resume_id: int, data: ResumeUpdate):
    db = get_db()
    try:
        updates = []
        params = []
        for field, value in data.model_dump(exclude_none=True).items():
            if isinstance(value, (list, dict)):
                value = json.dumps(value, ensure_ascii=False)
            updates.append(f"{field} = ?")
            params.append(value)

        if not updates:
            raise HTTPException(400, "No fields to update")

        updates.append("updated_at = ?")
        params.append(datetime.now().isoformat())
        params.append(resume_id)

        db.execute(
            f"UPDATE resumes SET {', '.join(updates)} WHERE id = ?", params
        )
        db.commit()
        row = db.execute("SELECT * FROM resumes WHERE id = ?", (resume_id,)).fetchone()
        return dict_from_row(row)
    finally:
        db.close()


@app.delete("/api/resumes/{resume_id}")
def delete_resume(resume_id: int):
    db = get_db()
    try:
        db.execute("DELETE FROM resumes WHERE id = ?", (resume_id,))
        db.commit()
        return {"ok": True}
    finally:
        db.close()


@app.post("/api/resumes/bulk")
def bulk_action(data: BulkAction):
    db = get_db()
    try:
        if data.action == "delete":
            placeholders = ",".join("?" for _ in data.ids)
            db.execute(f"DELETE FROM resumes WHERE id IN ({placeholders})", data.ids)
        elif data.action == "update_status" and data.value:
            placeholders = ",".join("?" for _ in data.ids)
            db.execute(
                f"UPDATE resumes SET status = ?, updated_at = ? WHERE id IN ({placeholders})",
                [data.value, datetime.now().isoformat()] + data.ids,
            )
        db.commit()
        return {"ok": True, "affected": len(data.ids)}
    finally:
        db.close()


# ── Import & Upload ───────────────────────────────────────────


@app.post("/api/resumes/import")
def import_resumes():
    """Scan folder and import new resumes."""
    db = get_db()
    try:
        files = scan_resume_folder()
        existing = {
            row["file_hash"]
            for row in db.execute("SELECT file_hash FROM resumes").fetchall()
            if row["file_hash"]
        }

        imported = 0
        for f in files:
            file_hash = compute_file_hash(f["filepath"])
            if file_hash in existing:
                continue

            info = parse_filename(f["filename"])
            db.execute(
                """INSERT INTO resumes
                   (filename, filepath, file_hash, name, phone, email, education,
                    years_experience, current_title, expected_positions, skills,
                    work_history, education_history, summary, status, notes, tags,
                    parse_status, city, salary_range)
                   VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                (
                    f["filename"],
                    f["filepath"],
                    file_hash,
                    info.get("name", ""),
                    "",
                    "",
                    "",
                    info.get("years_experience", 0),
                    info.get("current_title", ""),
                    json.dumps(info.get("expected_positions", []), ensure_ascii=False),
                    "[]",
                    "[]",
                    "[]",
                    "",
                    "pending",
                    "",
                    "[]",
                    "unparsed",
                    info.get("city", ""),
                    info.get("salary_range", ""),
                ),
            )
            imported += 1
            existing.add(file_hash)

        db.commit()
        total = db.execute("SELECT COUNT(*) as cnt FROM resumes").fetchone()["cnt"]
        return {"imported": imported, "total": total}
    finally:
        db.close()


@app.post("/api/resumes/upload")
async def upload_resume(file: UploadFile = File(...)):
    """Upload a resume file manually."""
    if not file.filename:
        raise HTTPException(400, "No filename")

    save_path = os.path.join(RESUME_FOLDER, file.filename)
    content = await file.read()
    with open(save_path, "wb") as f:
        f.write(content)

    file_hash = compute_file_hash(save_path)
    info = parse_filename(file.filename)

    db = get_db()
    try:
        existing = db.execute(
            "SELECT id FROM resumes WHERE file_hash = ?", (file_hash,)
        ).fetchone()
        if existing:
            return {"id": existing["id"], "duplicate": True}

        cursor = db.execute(
            """INSERT INTO resumes
               (filename, filepath, file_hash, name, years_experience,
                current_title, expected_positions, city, salary_range,
                skills, work_history, education_history, tags, parse_status)
               VALUES (?,?,?,?,?,?,?,?,?,'[]','[]','[]','[]','unparsed')""",
            (
                file.filename,
                save_path,
                file_hash,
                info.get("name", ""),
                info.get("years_experience", 0),
                info.get("current_title", ""),
                json.dumps(info.get("expected_positions", []), ensure_ascii=False),
                info.get("city", ""),
                info.get("salary_range", ""),
            ),
        )
        db.commit()
        return {"id": cursor.lastrowid, "duplicate": False}
    finally:
        db.close()


# ── File serving ──────────────────────────────────────────────


@app.get("/api/resumes/{resume_id}/file")
def serve_file(resume_id: int):
    db = get_db()
    try:
        row = db.execute(
            "SELECT filepath, filename FROM resumes WHERE id = ?", (resume_id,)
        ).fetchone()
        if not row:
            raise HTTPException(404, "Resume not found")
        if not os.path.exists(row["filepath"]):
            raise HTTPException(404, "File not found on disk")
        return FileResponse(
            row["filepath"],
            media_type="application/pdf",
            headers={"Content-Disposition": "inline"},
        )
    finally:
        db.close()


# ── LLM Parsing ──────────────────────────────────────────────


@app.post("/api/resumes/{resume_id}/parse")
async def parse_resume(resume_id: int, background_tasks: BackgroundTasks):
    db = get_db()
    try:
        row = db.execute(
            "SELECT * FROM resumes WHERE id = ?", (resume_id,)
        ).fetchone()
        if not row:
            raise HTTPException(404, "Resume not found")

        # Mark as parsing
        db.execute(
            "UPDATE resumes SET parse_status = 'parsing' WHERE id = ?", (resume_id,)
        )
        db.commit()
    finally:
        db.close()

    background_tasks.add_task(_do_parse, resume_id, dict(row))
    return {"ok": True, "parse_status": "parsing"}


def _do_parse(resume_id: int, row: dict):
    """Background task to parse a resume with LLM."""
    text = extract_pdf_text(row["filepath"])
    filename_info = parse_filename(row["filename"])

    loop = asyncio.new_event_loop()
    try:
        result = loop.run_until_complete(parse_resume_with_llm(text, filename_info))
    finally:
        loop.close()

    db = get_db()
    try:
        if not result:
            db.execute(
                "UPDATE resumes SET parse_status = 'failed', updated_at = ? WHERE id = ?",
                (datetime.now().isoformat(), resume_id),
            )
            db.commit()
            return

        tags = result.pop("suggested_tags", [])
        existing_tags = []
        try:
            existing_tags = json.loads(row.get("tags") or "[]")
        except Exception:
            pass
        merged_tags = list(set(existing_tags + tags))

        updates = {
            "name": result.get("name", row["name"]) or "",
            "phone": result.get("phone", "") or "",
            "email": result.get("email", "") or "",
            "education": result.get("education", "") or "",
            "years_experience": result.get("years_experience", row["years_experience"]) or 0,
            "current_title": result.get("current_title", row["current_title"]) or "",
            "expected_positions": json.dumps(
                result.get("expected_positions", []), ensure_ascii=False
            ),
            "skills": json.dumps(result.get("skills", []), ensure_ascii=False),
            "work_history": json.dumps(
                result.get("work_history", []), ensure_ascii=False
            ),
            "education_history": json.dumps(
                result.get("education_history", []), ensure_ascii=False
            ),
            "summary": result.get("summary", "") or "",
            "tags": json.dumps(merged_tags, ensure_ascii=False),
            "parse_status": "parsed",
            "updated_at": datetime.now().isoformat(),
        }

        set_clause = ", ".join(f"{k} = ?" for k in updates)
        db.execute(
            f"UPDATE resumes SET {set_clause} WHERE id = ?",
            list(updates.values()) + [resume_id],
        )
        db.commit()
    finally:
        db.close()


@app.post("/api/resumes/parse-batch")
async def parse_batch(background_tasks: BackgroundTasks, request: Request):
    """Parse multiple resumes. If ids is None/empty, parse all unparsed."""
    try:
        body = await request.json()
        ids = body.get("ids") if isinstance(body, dict) else None
    except Exception:
        ids = None
    db = get_db()
    try:
        if ids:
            placeholders = ",".join("?" for _ in ids)
            rows = db.execute(
                f"SELECT * FROM resumes WHERE id IN ({placeholders})", ids
            ).fetchall()
        else:
            rows = db.execute(
                "SELECT * FROM resumes WHERE parse_status = 'unparsed' LIMIT 20"
            ).fetchall()

        for row in rows:
            db.execute(
                "UPDATE resumes SET parse_status = 'parsing' WHERE id = ?", (row["id"],)
            )
            background_tasks.add_task(_do_parse, row["id"], dict(row))
        db.commit()
        return {"queued": len(rows)}
    finally:
        db.close()


# ── Stats ─────────────────────────────────────────────────────


@app.get("/api/stats")
def get_stats():
    db = get_db()
    try:
        total = db.execute("SELECT COUNT(*) as cnt FROM resumes").fetchone()["cnt"]
        today = datetime.now().strftime("%Y-%m-%d")
        today_new = db.execute(
            "SELECT COUNT(*) as cnt FROM resumes WHERE created_at >= ?", (today,)
        ).fetchone()["cnt"]

        status_rows = db.execute(
            "SELECT status, COUNT(*) as cnt FROM resumes GROUP BY status"
        ).fetchall()
        status_dist = {r["status"]: r["cnt"] for r in status_rows}

        parsed = db.execute(
            "SELECT COUNT(*) as cnt FROM resumes WHERE parse_status = 'parsed'"
        ).fetchone()["cnt"]

        # Education distribution
        edu_rows = db.execute(
            "SELECT education, COUNT(*) as cnt FROM resumes WHERE education != '' GROUP BY education ORDER BY cnt DESC LIMIT 10"
        ).fetchall()
        edu_dist = {r["education"]: r["cnt"] for r in edu_rows}

        # Experience distribution
        exp_ranges = [
            ("0-2年", 0, 2),
            ("3-5年", 3, 5),
            ("6-10年", 6, 10),
            ("10+年", 10, 100),
        ]
        exp_dist = {}
        for label, lo, hi in exp_ranges:
            cnt = db.execute(
                "SELECT COUNT(*) as cnt FROM resumes WHERE years_experience >= ? AND years_experience <= ?",
                (lo, hi),
            ).fetchone()["cnt"]
            exp_dist[label] = cnt

        # Top skills (from parsed resumes)
        skills_counter: dict[str, int] = {}
        skill_rows = db.execute(
            "SELECT skills FROM resumes WHERE skills != '[]'"
        ).fetchall()
        for r in skill_rows:
            try:
                for s in json.loads(r["skills"]):
                    skills_counter[s] = skills_counter.get(s, 0) + 1
            except Exception:
                pass
        top_skills = sorted(skills_counter.items(), key=lambda x: -x[1])[:30]

        # Top tags
        tags_counter: dict[str, int] = {}
        tag_rows = db.execute("SELECT tags FROM resumes WHERE tags != '[]'").fetchall()
        for r in tag_rows:
            try:
                for t in json.loads(r["tags"]):
                    tags_counter[t] = tags_counter.get(t, 0) + 1
            except Exception:
                pass
        top_tags = sorted(tags_counter.items(), key=lambda x: -x[1])[:20]

        # Recent activity
        recent = db.execute(
            "SELECT id, name, filename, status, created_at, parse_status FROM resumes ORDER BY updated_at DESC LIMIT 10"
        ).fetchall()

        return {
            "total": total,
            "today_new": today_new,
            "parsed": parsed,
            "status_distribution": status_dist,
            "education_distribution": edu_dist,
            "experience_distribution": exp_dist,
            "top_skills": top_skills,
            "top_tags": top_tags,
            "recent_activity": [dict(r) for r in recent],
        }
    finally:
        db.close()


# ── Tags ──────────────────────────────────────────────────────


@app.get("/api/tags")
def get_all_tags():
    db = get_db()
    try:
        rows = db.execute("SELECT tags FROM resumes WHERE tags != '[]'").fetchall()
        counter: dict[str, int] = {}
        for r in rows:
            try:
                for t in json.loads(r["tags"]):
                    counter[t] = counter.get(t, 0) + 1
            except Exception:
                pass
        return sorted(counter.items(), key=lambda x: -x[1])
    finally:
        db.close()


@app.post("/api/resumes/{resume_id}/tags")
def add_tag(resume_id: int, data: TagAdd):
    db = get_db()
    try:
        row = db.execute("SELECT tags FROM resumes WHERE id = ?", (resume_id,)).fetchone()
        if not row:
            raise HTTPException(404, "Resume not found")
        tags = json.loads(row["tags"] or "[]")
        if data.tag not in tags:
            tags.append(data.tag)
        db.execute(
            "UPDATE resumes SET tags = ?, updated_at = ? WHERE id = ?",
            (json.dumps(tags, ensure_ascii=False), datetime.now().isoformat(), resume_id),
        )
        db.commit()
        return {"tags": tags}
    finally:
        db.close()


# ── Duplicate detection ───────────────────────────────────────


@app.get("/api/duplicates")
def find_duplicates():
    db = get_db()
    try:
        rows = db.execute(
            """SELECT name, phone, COUNT(*) as cnt, GROUP_CONCAT(id) as ids
               FROM resumes
               WHERE name != ''
               GROUP BY name, phone
               HAVING cnt > 1
               ORDER BY cnt DESC"""
        ).fetchall()
        return [dict(r) for r in rows]
    finally:
        db.close()


# ── Serve frontend static files ──────────────────────────────

FRONTEND_DIR = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")

if os.path.isdir(FRONTEND_DIR):
    # Serve assets with caching
    app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_DIR, "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # Try to serve the exact file first
        file_path = os.path.join(FRONTEND_DIR, full_path)
        if full_path and os.path.isfile(file_path):
            return FileResponse(file_path)
        # Fall back to index.html for SPA routing
        return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
