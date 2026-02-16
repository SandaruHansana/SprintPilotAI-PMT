from pydantic import BaseModel, Field
from typing import Any, Dict, List, Optional

class GoalIn(BaseModel):
    goal_text: str = Field(..., min_length=3)

class DictIn(BaseModel):
    data: Dict[str, Any]

class FR03In(BaseModel):
    fr02: Dict[str, Any]
    sprint_length_days: int = 14
    velocity_days_per_sprint: int = 14
    enrich_with_llm: bool = True

class FR04In(BaseModel):
    goal: str
    existing_task_titles: List[str]
    action: str
    current_title: str = ""
    current_est: int = 0
    current_deps: Optional[List[str]] = None

class FR05In(BaseModel):
    task_type: str
    assignee_role: str
    experience_years: int
    team_size: int
    sprint_length_days: int
    story_points: int
    estimated_hours: int
    dependencies_count: int
    blockers_count: int
    priority_moscow: str
    requirement_changes: int
    communication_volume: int
    sentiment_score: float
    ai_suggestion_used: int
    ai_acceptance_rate: float
