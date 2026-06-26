from pydantic import BaseModel, EmailStr
from typing import Optional, List, Any
from datetime import datetime
from app.models.models import InterviewType, DifficultyLevel

# Auth
class UserCreate(BaseModel):
    email: EmailStr
    name: str
    password: str
    target_role: Optional[str] = "Software Developer"
    experience_level: Optional[str] = "Fresher"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    target_role: Optional[str] = None
    target_companies: Optional[List[str]] = None
    experience_level: Optional[str] = None
    placement_deadline: Optional[str] = None

class UserOut(BaseModel):
    id: int
    email: str
    name: str
    target_role: str
    target_companies: List[str]
    experience_level: str
    placement_deadline: Optional[str]
    streak: int
    created_at: datetime
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserOut

# Sessions
class SessionCreate(BaseModel):
    interview_type: InterviewType
    difficulty: Optional[DifficultyLevel] = DifficultyLevel.medium

class MessageOut(BaseModel):
    id: int
    role: str
    content: str
    question_topic: Optional[str]
    answer_score: Optional[float]
    answer_feedback: Optional[str]
    is_question: bool
    created_at: datetime
    class Config:
        from_attributes = True

class SessionOut(BaseModel):
    id: int
    interview_type: str
    difficulty: str
    status: str
    overall_score: Optional[float]
    correctness_score: Optional[float]
    depth_score: Optional[float]
    clarity_score: Optional[float]
    ai_feedback: Optional[str]
    weak_topics_detected: List[str]
    strong_topics_detected: List[str]
    duration_minutes: Optional[int]
    started_at: datetime
    completed_at: Optional[datetime]
    messages: List[MessageOut] = []
    class Config:
        from_attributes = True

class SendMessage(BaseModel):
    content: str

class TopicScoreOut(BaseModel):
    id: int
    topic: str
    category: str
    total_questions: int
    avg_score: float
    last_practiced: Optional[datetime]
    class Config:
        from_attributes = True

class RoadmapItemOut(BaseModel):
    id: int
    week_number: int
    topic: str
    description: Optional[str]
    resources: List[Any]
    is_completed: bool
    priority: str
    class Config:
        from_attributes = True

class DashboardStats(BaseModel):
    total_sessions: int
    avg_score: float
    streak: int
    readiness_score: float
    sessions_this_week: int
    improvement_rate: float
    strongest_topic: Optional[str]
    weakest_topic: Optional[str]
