import sqlite3
import os
import json
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), "resumes.db")


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_db():
    conn = get_db()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS resumes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filename TEXT NOT NULL,
            filepath TEXT NOT NULL,
            file_hash TEXT,
            name TEXT DEFAULT '',
            phone TEXT DEFAULT '',
            email TEXT DEFAULT '',
            education TEXT DEFAULT '',
            years_experience REAL DEFAULT 0,
            current_title TEXT DEFAULT '',
            expected_positions TEXT DEFAULT '[]',
            skills TEXT DEFAULT '[]',
            work_history TEXT DEFAULT '[]',
            education_history TEXT DEFAULT '[]',
            summary TEXT DEFAULT '',
            status TEXT DEFAULT 'pending',
            notes TEXT DEFAULT '',
            tags TEXT DEFAULT '[]',
            parse_status TEXT DEFAULT 'unparsed',
            city TEXT DEFAULT '',
            salary_range TEXT DEFAULT '',
            created_at TEXT DEFAULT (datetime('now')),
            updated_at TEXT DEFAULT (datetime('now'))
        );

        CREATE VIRTUAL TABLE IF NOT EXISTS resume_fts USING fts5(
            name, phone, email, education, current_title, skills, summary, notes,
            content='resumes',
            content_rowid='id'
        );

        CREATE TRIGGER IF NOT EXISTS resumes_ai AFTER INSERT ON resumes BEGIN
            INSERT INTO resume_fts(rowid, name, phone, email, education, current_title, skills, summary, notes)
            VALUES (new.id, new.name, new.phone, new.email, new.education, new.current_title, new.skills, new.summary, new.notes);
        END;

        CREATE TRIGGER IF NOT EXISTS resumes_ad AFTER DELETE ON resumes BEGIN
            INSERT INTO resume_fts(resume_fts, rowid, name, phone, email, education, current_title, skills, summary, notes)
            VALUES ('delete', old.id, old.name, old.phone, old.email, old.education, old.current_title, old.skills, old.summary, old.notes);
        END;

        CREATE TRIGGER IF NOT EXISTS resumes_au AFTER UPDATE ON resumes BEGIN
            INSERT INTO resume_fts(resume_fts, rowid, name, phone, email, education, current_title, skills, summary, notes)
            VALUES ('delete', old.id, old.name, old.phone, old.email, old.education, old.current_title, old.skills, old.summary, old.notes);
            INSERT INTO resume_fts(rowid, name, phone, email, education, current_title, skills, summary, notes)
            VALUES (new.id, new.name, new.phone, new.email, new.education, new.current_title, new.skills, new.summary, new.notes);
        END;
    """)
    conn.close()


def dict_from_row(row):
    if row is None:
        return None
    d = dict(row)
    for key in ("expected_positions", "skills", "work_history", "education_history", "tags"):
        if key in d and isinstance(d[key], str):
            try:
                d[key] = json.loads(d[key])
            except (json.JSONDecodeError, TypeError):
                d[key] = []
    return d
