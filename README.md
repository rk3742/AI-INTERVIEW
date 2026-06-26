# 🧠 InterviewMind AI — Adaptive Interview Trainer

An AI-powered mock interview platform that conducts real interviews, scores your answers, detects weak topics, and generates a personalized study roadmap. Built with FastAPI + React + Groq (Llama 3.3 70B).

---

## ✅ Prerequisites

- Python 3.10+
- Node.js 18+
- PostgreSQL (local or free cloud like Supabase/Neon)
- Groq API Key (free at https://console.groq.com)

---

## 🚀 Quick Setup

### Step 1 — Clone / Open in VS Code

Open the `interviewmind/` folder in VS Code.

---

### Step 2 — Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate it
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy env file and fill in values
cp .env.example .env
```

Edit `.env`:
```
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/interviewmind
SECRET_KEY=any-random-string-here
GROQ_API_KEY=your_groq_api_key_here
```

**Create the database:**
```bash
# In PostgreSQL (psql or pgAdmin):
CREATE DATABASE interviewmind;
```

**Run the backend:**
```bash
uvicorn main:app --reload --port 8000
```

Visit http://localhost:8000 — you should see `{"message": "InterviewMind AI API is running"}`

---

### Step 3 — Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run the frontend
npm run dev
```

Visit http://localhost:5173

---

## 🗄️ Using Supabase (Free Cloud DB — No Local PostgreSQL Needed)

1. Go to https://supabase.com and create a free project
2. Go to Settings → Database → Connection string → URI
3. Copy the URI and paste it in `backend/.env` as `DATABASE_URL`
4. The app will create all tables automatically on first run

---

## 🎯 Features

| Feature | Description |
|---|---|
| 🤖 AI Interviewer | Groq Llama 3.3 70B conducts real interviews with follow-up questions |
| 📊 Answer Scoring | Every answer scored on Correctness, Depth, and Clarity (0–10) |
| 🔥 Topic Heatmap | Visual map of your strong and weak topics |
| 🗺️ Personalized Roadmap | AI-generated week-by-week study plan based on your weaknesses |
| 📈 Progress Tracking | Score history charts, streaks, readiness score |
| 4 Interview Types | Technical DSA, CS Fundamentals, Behavioral/HR, System Design |

---

## 🌐 Deployment

### Backend (Railway)
1. Push `backend/` to a GitHub repo
2. Connect to https://railway.app
3. Add environment variables in Railway dashboard
4. Deploy

### Frontend (Vercel)
1. Push `frontend/` to GitHub
2. Import in https://vercel.com
3. Add `VITE_API_URL=https://your-railway-url.railway.app/api` as env variable
4. Deploy

---

## 📁 Project Structure

```
interviewmind/
├── backend/
│   ├── app/
│   │   ├── api/          # Route handlers
│   │   ├── core/         # Config, security
│   │   ├── db/           # Database setup
│   │   ├── models/       # SQLAlchemy models
│   │   ├── schemas/      # Pydantic schemas
│   │   └── services/     # Groq AI service
│   ├── main.py           # FastAPI entry point
│   └── requirements.txt
└── frontend/
    └── src/
        ├── pages/         # All pages
        ├── components/    # Reusable UI
        ├── store/         # Zustand state
        └── utils/         # API client
```

---

## 🔑 Getting a Groq API Key (Free)

1. Go to https://console.groq.com
2. Sign up (free)
3. Click "API Keys" → Create API Key
4. Copy and paste into `backend/.env`

Free tier: 14,400 requests/day — more than enough!

---

## 💡 Tech Stack

- **Backend**: Python, FastAPI, SQLAlchemy, PostgreSQL
- **AI**: Groq API (Llama 3.3 70B) — 100% free tier
- **Frontend**: React 19, Vite, Tailwind CSS, Zustand, Recharts
- **Auth**: JWT tokens (python-jose + bcrypt)
- **Hosting**: Railway (backend) + Vercel (frontend)
