from pydantic import BaseModel
from typing import Optional


class ResumeUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None
    tags: Optional[list[str]] = None
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    education: Optional[str] = None
    years_experience: Optional[float] = None
    current_title: Optional[str] = None
    expected_positions: Optional[list[str]] = None
    skills: Optional[list[str]] = None
    summary: Optional[str] = None


class TagAdd(BaseModel):
    tag: str


class BulkAction(BaseModel):
    ids: list[int]
    action: str  # "delete", "update_status"
    value: Optional[str] = None


# ── Position models ──────────────────────────────────────────

class PositionCreate(BaseModel):
    title: str
    department: Optional[str] = ""
    location: Optional[str] = ""
    salary_min: Optional[float] = 0
    salary_max: Optional[float] = 0
    experience_min: Optional[float] = 0
    experience_max: Optional[float] = 0
    education_requirement: Optional[str] = ""
    description: Optional[str] = ""
    requirements: Optional[list[str]] = []
    skills_required: Optional[list[str]] = []
    status: Optional[str] = "open"
    headcount: Optional[int] = 1


class PositionUpdate(BaseModel):
    title: Optional[str] = None
    department: Optional[str] = None
    location: Optional[str] = None
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    experience_min: Optional[float] = None
    experience_max: Optional[float] = None
    education_requirement: Optional[str] = None
    description: Optional[str] = None
    requirements: Optional[list[str]] = None
    skills_required: Optional[list[str]] = None
    status: Optional[str] = None
    headcount: Optional[int] = None


# ── Candidate Profile models ────────────────────────────────

class ProfileCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    education_requirement: Optional[str] = ""
    experience_min: Optional[float] = 0
    experience_max: Optional[float] = 0
    skills_required: Optional[list[str]] = []
    skills_preferred: Optional[list[str]] = []
    personality_traits: Optional[list[str]] = []
    certifications: Optional[list[str]] = []
    notes: Optional[str] = ""


class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    education_requirement: Optional[str] = None
    experience_min: Optional[float] = None
    experience_max: Optional[float] = None
    skills_required: Optional[list[str]] = None
    skills_preferred: Optional[list[str]] = None
    personality_traits: Optional[list[str]] = None
    certifications: Optional[list[str]] = None
    notes: Optional[str] = None


class PositionProfileLink(BaseModel):
    profile_id: int
