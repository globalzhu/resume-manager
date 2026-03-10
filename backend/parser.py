import re
import os
import json
import hashlib
import anthropic
import fitz  # PyMuPDF


RESUME_FOLDER = "/home/admin/Downloads"


def compute_file_hash(filepath: str) -> str:
    h = hashlib.md5()
    with open(filepath, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            h.update(chunk)
    return h.hexdigest()


def parse_filename(filename: str) -> dict:
    """Extract info from pattern: 【position_city_salary】name_years.pdf"""
    info = {"name": "", "city": "", "salary_range": "", "expected_positions": [], "years_experience": 0}
    m = re.match(r"【(.+?)】(.+?)\.(?:pdf|docx?)$", filename, re.IGNORECASE)
    if m:
        bracket_part = m.group(1)
        name_part = m.group(2)
        parts = bracket_part.split("_")
        if len(parts) >= 1:
            info["expected_positions"] = [parts[0]]
            info["current_title"] = parts[0]
        if len(parts) >= 2:
            info["city"] = parts[1]
        if len(parts) >= 3:
            info["salary_range"] = parts[2]
        name_parts = name_part.split("_")
        if name_parts:
            info["name"] = name_parts[0]
        if len(name_parts) >= 2:
            years_str = name_parts[-1].replace("年", "")
            try:
                info["years_experience"] = float(years_str)
            except ValueError:
                pass
    return info


def extract_pdf_text(filepath: str) -> str:
    """Extract text from PDF using PyMuPDF."""
    try:
        doc = fitz.open(filepath)
        text = ""
        for page in doc:
            text += page.get_text()
        doc.close()
        return text[:15000]  # Limit to avoid token overflow
    except Exception as e:
        return f"[Error extracting PDF: {e}]"


def scan_resume_folder() -> list[dict]:
    """Scan the resume folder for PDF/DOC/DOCX files."""
    files = []
    if not os.path.exists(RESUME_FOLDER):
        return files
    for f in os.listdir(RESUME_FOLDER):
        if f.lower().endswith((".pdf", ".doc", ".docx")):
            filepath = os.path.join(RESUME_FOLDER, f)
            files.append({"filename": f, "filepath": filepath})
    return files


def _get_api_key() -> str:
    """Load Anthropic API key from OpenClaw auth profiles or environment."""
    import os
    # 1. Environment variable
    key = os.environ.get("ANTHROPIC_API_KEY", "")
    if key:
        return key
    # 2. OpenClaw auth profiles
    profiles_path = os.path.expanduser("~/.openclaw/agents/main/agent/auth-profiles.json")
    try:
        with open(profiles_path) as f:
            data = json.load(f)
        for profile in data.get("profiles", {}).values():
            if profile.get("provider") == "anthropic" and profile.get("key"):
                return profile["key"]
    except Exception:
        pass
    return ""


async def parse_resume_with_llm(text: str, filename_info: dict) -> dict:
    """Use Claude API to extract structured resume data."""
    api_key = _get_api_key()
    if not api_key:
        raise RuntimeError("Anthropic API key not found")
    client = anthropic.Anthropic(api_key=api_key)

    prompt = f"""Extract structured information from this resume. Return ONLY valid JSON with these fields:
- name (string): candidate's full name
- phone (string): phone number
- email (string): email address
- education (string): highest education level (e.g., "本科", "硕士", "博士", "大专", "Bachelor", "Master", "PhD")
- years_experience (number): total years of experience
- current_title (string): most recent job title
- expected_positions (array of strings): positions they're looking for
- skills (array of strings): technical skills, max 20
- work_history (array of objects with: company, title, period, description)
- education_history (array of objects with: school, degree, major, period)
- summary (string): 2-3 sentence professional summary
- suggested_tags (array of strings): category tags like "frontend", "backend", "devops", "fullstack", "product", "data", "mobile", "qa", "security", "ai/ml", max 5

Pre-extracted info from filename: {json.dumps(filename_info, ensure_ascii=False)}

Resume text:
{text}"""

    try:
        message = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=2000,
            messages=[{"role": "user", "content": prompt}],
        )
        response_text = message.content[0].text
        # Extract JSON from response
        json_match = re.search(r"\{[\s\S]*\}", response_text)
        if json_match:
            return json.loads(json_match.group())
        return {}
    except Exception as e:
        print(f"LLM parse error: {e}")
        return {}
