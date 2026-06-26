from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.database import get_db
from app.models.models import User, InterviewSession, TopicScore, RoadmapItem
from app.schemas.schemas import DashboardStats, TopicScoreOut, RoadmapItemOut
from app.api.deps import get_current_user
from app.services import groq_service
from typing import List
from datetime import datetime, timedelta

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

@router.get("/stats", response_model=DashboardStats)
def get_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    sessions = db.query(InterviewSession).filter(
        InterviewSession.user_id == current_user.id,
        InterviewSession.status == "completed"
    ).all()

    total = len(sessions)
    avg_score = sum(s.overall_score for s in sessions if s.overall_score) / total if total else 0

    week_ago = datetime.utcnow() - timedelta(days=7)
    sessions_this_week = len([s for s in sessions if s.completed_at and s.completed_at >= week_ago])

    # Improvement rate: compare last 3 vs previous 3
    improvement = 0.0
    if len(sessions) >= 6:
        recent = [s.overall_score for s in sessions[-3:] if s.overall_score]
        earlier = [s.overall_score for s in sessions[-6:-3] if s.overall_score]
        if recent and earlier:
            improvement = ((sum(recent)/len(recent)) - (sum(earlier)/len(earlier))) / 10 * 100

    # Topic analysis
    topic_scores = db.query(TopicScore).filter(TopicScore.user_id == current_user.id).all()
    strongest = max(topic_scores, key=lambda t: t.avg_score).topic if topic_scores else None
    weakest = min(topic_scores, key=lambda t: t.avg_score).topic if topic_scores else None

    # Readiness: based on avg score, sessions count, topic coverage
    readiness = min(100, (avg_score / 10 * 60) + (min(total, 10) / 10 * 25) + (min(len(topic_scores), 5) / 5 * 15))

    return DashboardStats(
        total_sessions=total,
        avg_score=round(avg_score, 1),
        streak=current_user.streak or 0,
        readiness_score=round(readiness, 1),
        sessions_this_week=sessions_this_week,
        improvement_rate=round(improvement, 1),
        strongest_topic=strongest,
        weakest_topic=weakest
    )

@router.get("/topic-heatmap", response_model=List[TopicScoreOut])
def get_topic_heatmap(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(TopicScore).filter(TopicScore.user_id == current_user.id).order_by(TopicScore.avg_score).all()

@router.get("/session-history")
def get_session_history(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    sessions = db.query(InterviewSession).filter(
        InterviewSession.user_id == current_user.id,
        InterviewSession.status == "completed"
    ).order_by(InterviewSession.completed_at).all()

    return [
        {
            "id": s.id,
            "date": s.completed_at.isoformat() if s.completed_at else None,
            "type": s.interview_type.value,
            "score": s.overall_score,
            "duration": s.duration_minutes,
            "weak_topics": s.weak_topics_detected,
        }
        for s in sessions
    ]

@router.get("/roadmap", response_model=List[RoadmapItemOut])
def get_roadmap(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    items = db.query(RoadmapItem).filter(
        RoadmapItem.user_id == current_user.id
    ).order_by(RoadmapItem.week_number).all()
    return items

@router.post("/roadmap/generate")
def generate_roadmap(
    weeks: int = 8,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Gather weak and strong topics from sessions
    sessions = db.query(InterviewSession).filter(
        InterviewSession.user_id == current_user.id,
        InterviewSession.status == "completed"
    ).all()

    all_weak = []
    all_strong = []
    for s in sessions:
        all_weak.extend(s.weak_topics_detected or [])
        all_strong.extend(s.strong_topics_detected or [])

    # Unique and sorted by frequency
    weak_topics = list(set(all_weak))[:5]
    strong_topics = list(set(all_strong))[:3]

    roadmap_data = groq_service.generate_roadmap(
        target_role=current_user.target_role or "Software Developer",
        experience_level=current_user.experience_level or "Fresher",
        weak_topics=weak_topics,
        strong_topics=strong_topics,
        weeks_available=weeks
    )

    # Clear old roadmap and save new one
    db.query(RoadmapItem).filter(RoadmapItem.user_id == current_user.id).delete()

    for item in roadmap_data:
        ri = RoadmapItem(
            user_id=current_user.id,
            week_number=item.get("week_number", 1),
            topic=item.get("topic", ""),
            description=item.get("description", ""),
            resources=item.get("resources", []),
            priority=item.get("priority", "medium")
        )
        db.add(ri)
    db.commit()

    return {"message": "Roadmap generated", "weeks": len(roadmap_data)}

@router.patch("/roadmap/{item_id}/toggle")
def toggle_roadmap_item(item_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    item = db.query(RoadmapItem).filter(
        RoadmapItem.id == item_id,
        RoadmapItem.user_id == current_user.id
    ).first()
    if not item:
        return {"error": "Not found"}
    item.is_completed = not item.is_completed
    db.commit()
    return {"id": item_id, "is_completed": item.is_completed}
