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

        -- Positions table (招聘岗位)
        CREATE TABLE IF NOT EXISTS positions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL DEFAULT '',
            department TEXT DEFAULT '',
            location TEXT DEFAULT '',
            salary_min REAL DEFAULT 0,
            salary_max REAL DEFAULT 0,
            experience_min REAL DEFAULT 0,
            experience_max REAL DEFAULT 0,
            education_requirement TEXT DEFAULT '',
            description TEXT DEFAULT '',
            requirements TEXT DEFAULT '[]',
            skills_required TEXT DEFAULT '[]',
            status TEXT DEFAULT 'open',
            headcount INTEGER DEFAULT 1,
            created_at TEXT DEFAULT (datetime('now')),
            updated_at TEXT DEFAULT (datetime('now'))
        );

        -- Candidate profiles table (候选人画像)
        CREATE TABLE IF NOT EXISTS candidate_profiles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL DEFAULT '',
            description TEXT DEFAULT '',
            education_requirement TEXT DEFAULT '',
            experience_min REAL DEFAULT 0,
            experience_max REAL DEFAULT 0,
            skills_required TEXT DEFAULT '[]',
            skills_preferred TEXT DEFAULT '[]',
            personality_traits TEXT DEFAULT '[]',
            certifications TEXT DEFAULT '[]',
            notes TEXT DEFAULT '',
            created_at TEXT DEFAULT (datetime('now')),
            updated_at TEXT DEFAULT (datetime('now'))
        );

        -- Position-Profile association table
        CREATE TABLE IF NOT EXISTS position_profiles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            position_id INTEGER NOT NULL,
            profile_id INTEGER NOT NULL,
            created_at TEXT DEFAULT (datetime('now')),
            FOREIGN KEY (position_id) REFERENCES positions(id) ON DELETE CASCADE,
            FOREIGN KEY (profile_id) REFERENCES candidate_profiles(id) ON DELETE CASCADE,
            UNIQUE(position_id, profile_id)
        );
    """)
    conn.close()


def dict_from_row(row):
    if row is None:
        return None
    d = dict(row)
    json_keys = (
        "expected_positions", "skills", "work_history", "education_history", "tags",
        "requirements", "skills_required", "skills_preferred",
        "personality_traits", "certifications",
    )
    for key in json_keys:
        if key in d and isinstance(d[key], str):
            try:
                d[key] = json.loads(d[key])
            except (json.JSONDecodeError, TypeError):
                d[key] = []
    return d
