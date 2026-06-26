from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.database import Base, engine
from app.api import auth, sessions, dashboard
import app.models.models  # ensure models are registered

# Create all tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="InterviewMind AI", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(sessions.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")

@app.get("/")
def root():
    return {"message": "InterviewMind AI API is running", "version": "1.0.0"}

@app.get("/health")
def health():
    return {"status": "ok"}
