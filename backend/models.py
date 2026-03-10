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
