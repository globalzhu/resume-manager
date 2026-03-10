# Resume Manager - Build Specification

## Project Overview
Build a full-stack resume management web application. Resumes are already downloaded to `/home/admin/Downloads/` (PDF files named like `【职位_城市_薪资】姓名_年限.pdf`).

## Tech Stack
- **Backend**: Python FastAPI + SQLite (with FTS5 full-text search)
- **Frontend**: React 18 + Vite + Tailwind CSS + shadcn/ui components
- **Resume Parsing**: Use Claude API (anthropic SDK) to extract structured info
- **File Storage**: Serve files from `/home/admin/Downloads/` directly

## Features to Build

### Core
1. **Resume Import**: Auto-scan `/home/admin/Downloads/` for PDF/DOC/DOCX files + manual upload endpoint
2. **Structured Parsing**: Use LLM to extract: name, phone, email, education, years_experience, current_title, expected_position, skills[], work_history[], education_history[], summary
3. **Resume Management**: List/card view, status workflow (pending → reviewed → interview → hired/rejected), bulk operations, notes
4. **Search & Filter**: Full-text search (SQLite FTS5), filter by education/years/skills/status/date

### Enhanced
5. **Smart Tags**: AI auto-generates position category tags (frontend/backend/devops/product/etc.), custom tags
6. **Duplicate Detection**: Detect duplicates by name+phone, show merge option, display all versions
7. **Resume Preview**: Split view - original PDF viewer on right, structured data on left
8. **Stats Dashboard**: Total count, today's new, status distribution chart, skills wordcloud, education/experience distribution

## Homepage (Make it IMPRESSIVE!)
Dark theme, glassmorphism cards, animated gradient background, smooth transitions.
Show: animated counter stats, recent activity feed, quick action buttons.
Think: modern SaaS dashboard vibes, like Linear or Vercel's dashboard.

## API Design (FastAPI)
- `GET /api/resumes` - list with pagination, search, filters
- `POST /api/resumes/import` - trigger folder scan import
- `POST /api/resumes/upload` - manual file upload
- `GET /api/resumes/{id}` - single resume detail
- `PUT /api/resumes/{id}` - update status/notes/tags
- `DELETE /api/resumes/{id}` - delete
- `GET /api/resumes/{id}/file` - serve original file
- `POST /api/resumes/{id}/parse` - (re)parse with LLM
- `GET /api/stats` - dashboard statistics
- `GET /api/tags` - all tags
- `POST /api/resumes/{id}/tags` - add tag

## Database Schema (SQLite)
```sql
resumes: id, filename, filepath, file_hash, name, phone, email, education, years_experience, current_title, expected_positions(json), skills(json), work_history(json), education_history(json), summary, status, notes, tags(json), parse_status, created_at, updated_at
resume_fts: virtual FTS5 table for full-text search
```

## File Structure
```
resume-manager/
  backend/
    main.py          # FastAPI app
    models.py        # Pydantic models
    database.py      # SQLite setup
    parser.py        # LLM resume parser
    requirements.txt
  frontend/
    src/
      pages/
        Dashboard.jsx   # cool homepage
        Resumes.jsx     # list/management
        ResumeDetail.jsx # preview + detail
      components/
        Sidebar.jsx
        ResumeCard.jsx
        StatsCard.jsx
        ...
    package.json
    vite.config.js
  start.sh           # starts both backend + frontend
  README.md
```

## Network Access
- Backend: bind to `0.0.0.0:8000`
- Frontend dev server: bind to `0.0.0.0:3000`
- Or better: backend serves built frontend static files on port 8000

## Environment
- Backend: Python 3.11+, install deps with pip
- Frontend: Node.js, use npm
- Anthropic API key: read from env var `ANTHROPIC_API_KEY` (already set in system)
- Resume folder: `/home/admin/Downloads/`

## Important Notes
- Parse resume filenames to pre-fill name/position/salary/years from the pattern `【position_city_salary】name_years.pdf`
- Handle both Chinese and English resumes
- Make the UI beautiful and modern - this is important!
- The app should work immediately after `./start.sh`
- Use `0.0.0.0` binding so it's accessible from other machines on the LAN

When completely finished, run:
openclaw system event --text "Done: Resume manager app built and ready at http://localhost:3000" --mode now
