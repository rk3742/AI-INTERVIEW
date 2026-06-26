from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.database import get_db
from app.models.models import User, InterviewSession, SessionMessage, TopicScore
from app.schemas.schemas import SessionCreate, SessionOut, SendMessage, MessageOut
from app.api.deps import get_current_user
from app.services import groq_service
from datetime import datetime
from typing import List
import json

router = APIRouter(prefix="/sessions", tags=["sessions"])

@router.post("", response_model=SessionOut)
def create_session(data: SessionCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    session = InterviewSession(
        user_id=current_user.id,
        interview_type=data.interview_type,
        difficulty=data.difficulty,
        status="in_progress",
        weak_topics_detected=[],
        strong_topics_detected=[]
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    # Get first AI message (greeting + first question)
    ai_response = groq_service.get_ai_response([], data.interview_type.value)
    
    msg = SessionMessage(
        session_id=session.id,
        role="interviewer",
        content=ai_response,
        is_question=True,
        question_topic="Introduction"
    )
    db.add(msg)
    db.commit()
    db.refresh(session)
    return session

@router.get("", response_model=List[SessionOut])
def list_sessions(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    sessions = db.query(InterviewSession).filter(
        InterviewSession.user_id == current_user.id
    ).order_by(InterviewSession.started_at.desc()).all()
    return sessions

@router.get("/{session_id}", response_model=SessionOut)
def get_session(session_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    session = db.query(InterviewSession).filter(
        InterviewSession.id == session_id,
        InterviewSession.user_id == current_user.id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session

@router.post("/{session_id}/message", response_model=dict)
def send_message(
    session_id: int,
    message: SendMessage,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    session = db.query(InterviewSession).filter(
        InterviewSession.id == session_id,
        InterviewSession.user_id == current_user.id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.status == "completed":
        raise HTTPException(status_code=400, detail="Session already completed")

    # Save candidate message
    candidate_msg = SessionMessage(
        session_id=session.id,
        role="candidate",
        content=message.content,
        is_question=False
    )
    db.add(candidate_msg)
    db.commit()

    # Build conversation history for Groq
    all_messages = db.query(SessionMessage).filter(
        SessionMessage.session_id == session_id
    ).order_by(SessionMessage.created_at).all()

    # Find the last question asked by interviewer
    last_question = None
    last_topic = "General"
    for m in reversed(all_messages):
        if m.role == "interviewer" and m.is_question:
            last_question = m.content
            last_topic = m.question_topic or "General"
            break

    # Score the candidate's answer
    score_data = None
    if last_question:
        score_data = groq_service.score_answer(last_question, message.content, last_topic)
        candidate_msg.answer_score = score_data.get("overall", 5.0)
        candidate_msg.answer_feedback = score_data.get("feedback", "")
        db.commit()

        # Update topic scores
        if score_data.get("topics_covered"):
            for topic in score_data["topics_covered"]:
                existing = db.query(TopicScore).filter(
                    TopicScore.user_id == current_user.id,
                    TopicScore.topic == topic
                ).first()
                if existing:
                    existing.total_questions += 1
                    existing.avg_score = (existing.avg_score * (existing.total_questions - 1) + score_data["overall"]) / existing.total_questions
                    existing.last_practiced = datetime.utcnow()
                else:
                    ts = TopicScore(
                        user_id=current_user.id,
                        topic=topic,
                        category=session.interview_type.value,
                        total_questions=1,
                        avg_score=score_data.get("overall", 5.0),
                        last_practiced=datetime.utcnow()
                    )
                    db.add(ts)
            db.commit()

    # Build messages for Groq context
    groq_messages = []
    for m in all_messages:
        groq_messages.append({
            "role": "assistant" if m.role == "interviewer" else "user",
            "content": m.content
        })

    # Count how many candidate answers we have
    candidate_answers = [m for m in all_messages if m.role == "candidate"]
    question_count = len(candidate_answers)

    # Decide: continue interview or wrap up
    should_end = question_count >= 7

    if should_end:
        groq_messages.append({
            "role": "user",
            "content": "[SYSTEM: This was the last answer. Wrap up the interview professionally with a brief closing statement. Don't ask any more questions.]"
        })

    ai_response = groq_service.get_ai_response(groq_messages, session.interview_type.value)

    # Determine if AI response contains a question
    is_question = not should_end and ("?" in ai_response)

    interviewer_msg = SessionMessage(
        session_id=session.id,
        role="interviewer",
        content=ai_response,
        is_question=is_question,
        question_topic="Follow-up" if not should_end else "Closing"
    )
    db.add(interviewer_msg)
    db.commit()

    return {
        "interviewer_message": ai_response,
        "answer_score": score_data.get("overall") if score_data else None,
        "answer_feedback": score_data.get("feedback") if score_data else None,
        "should_end": should_end,
        "questions_asked": question_count
    }

@router.post("/{session_id}/complete", response_model=SessionOut)
def complete_session(session_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    session = db.query(InterviewSession).filter(
        InterviewSession.id == session_id,
        InterviewSession.user_id == current_user.id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Build Q&A pairs for analysis
    messages = db.query(SessionMessage).filter(
        SessionMessage.session_id == session_id
    ).order_by(SessionMessage.created_at).all()

    qa_pairs = []
    scores = []
    weak_topics = []
    strong_topics = []

    interviewer_q = None
    for msg in messages:
        if msg.role == "interviewer" and msg.is_question and msg.question_topic != "Introduction":
            interviewer_q = msg.content
        elif msg.role == "candidate" and interviewer_q:
            qa_pairs.append(f"Q: {interviewer_q}\nA: {msg.content}")
            if msg.answer_score:
                scores.append(msg.answer_score)
            interviewer_q = None

    qa_text = "\n\n".join(qa_pairs) if qa_pairs else "No Q&A recorded"

    # Analyze with AI
    analysis = groq_service.analyze_session(session.interview_type.value, qa_text, scores)

    # Calculate duration
    duration = int((datetime.utcnow() - session.started_at).total_seconds() / 60)

    session.status = "completed"
    session.overall_score = analysis.get("overall_score", 5.0)
    session.correctness_score = analysis.get("correctness_score", 5.0)
    session.depth_score = analysis.get("depth_score", 5.0)
    session.clarity_score = analysis.get("clarity_score", 5.0)
    session.ai_feedback = analysis.get("overall_feedback", "")
    session.weak_topics_detected = analysis.get("weak_topics", [])
    session.strong_topics_detected = analysis.get("strong_topics", [])
    session.duration_minutes = duration
    session.completed_at = datetime.utcnow()

    db.commit()
    db.refresh(session)
    return session
