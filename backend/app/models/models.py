from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey, JSON, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.db.database import Base

class InterviewType(str, enum.Enum):
    technical = "technical"
    cs_fundamentals = "cs_fundamentals"
    behavioral = "behavioral"
    system_design = "system_design"

class DifficultyLevel(str, enum.Enum):
    easy = "easy"
    medium = "medium"
    hard = "hard"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    target_role = Column(String, default="Software Developer")
    target_companies = Column(JSON, default=list)
    experience_level = Column(String, default="Fresher")
    placement_deadline = Column(String, nullable=True)
    streak = Column(Integer, default=0)
    last_active = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    is_active = Column(Boolean, default=True)

    sessions = relationship("InterviewSession", back_populates="user")
    topic_scores = relationship("TopicScore", back_populates="user")
    roadmap_items = relationship("RoadmapItem", back_populates="user")

class InterviewSession(Base):
    __tablename__ = "interview_sessions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    interview_type = Column(Enum(InterviewType), nullable=False)
    difficulty = Column(Enum(DifficultyLevel), default=DifficultyLevel.medium)
    status = Column(String, default="in_progress")  # in_progress, completed
    overall_score = Column(Float, nullable=True)
    correctness_score = Column(Float, nullable=True)
    depth_score = Column(Float, nullable=True)
    clarity_score = Column(Float, nullable=True)
    ai_feedback = Column(Text, nullable=True)
    weak_topics_detected = Column(JSON, default=list)
    strong_topics_detected = Column(JSON, default=list)
    duration_minutes = Column(Integer, nullable=True)
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)

    user = relationship("User", back_populates="sessions")
    messages = relationship("SessionMessage", back_populates="session", order_by="SessionMessage.created_at")

class SessionMessage(Base):
    __tablename__ = "session_messages"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("interview_sessions.id"), nullable=False)
    role = Column(String, nullable=False)  # "interviewer" or "candidate"
    content = Column(Text, nullable=False)
    question_topic = Column(String, nullable=True)
    answer_score = Column(Float, nullable=True)
    answer_feedback = Column(Text, nullable=True)
    is_question = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    session = relationship("InterviewSession", back_populates="messages")

class TopicScore(Base):
    __tablename__ = "topic_scores"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    topic = Column(String, nullable=False)
    category = Column(String, nullable=False)
    total_questions = Column(Integer, default=0)
    correct_count = Column(Integer, default=0)
    avg_score = Column(Float, default=0.0)
    last_practiced = Column(DateTime(timezone=True), nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="topic_scores")

class RoadmapItem(Base):
    __tablename__ = "roadmap_items"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    week_number = Column(Integer, nullable=False)
    topic = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    resources = Column(JSON, default=list)
    is_completed = Column(Boolean, default=False)
    priority = Column(String, default="medium")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="roadmap_items")
