from groq import Groq
from app.core.config import settings
from typing import List, Dict, Optional
import json
import re

client = Groq(api_key=settings.GROQ_API_KEY)

INTERVIEW_SYSTEM_PROMPTS = {
    "technical": """You are Alex, a senior software engineer conducting a technical interview at a top tech company.
Your role is to assess the candidate's DSA knowledge, problem solving skills, and coding ability.
Interview style:
- Start with a warm greeting and introduce yourself
- Ask one question at a time
- After candidate answers, probe deeper with follow-up questions
- If answer is vague or wrong, push back professionally: "Can you elaborate on that?" or "That's partially correct, but what about..."
- Cover topics: Arrays, LinkedLists, Trees, Graphs, Sorting, DP, Recursion, Time/Space complexity
- Ask exactly 6-8 questions total per session
- Be realistic and professional, not overly friendly
- After all questions, give a brief closing remark""",

    "cs_fundamentals": """You are Priya, a technical interviewer evaluating CS fundamentals.
Your role is to assess Operating Systems, DBMS, Computer Networks, and OOP concepts.
Interview style:
- Start with a warm introduction
- Ask one focused question at a time  
- Dig deeper when answers are shallow
- Cover: OS (processes, threads, scheduling, memory management), DBMS (normalization, SQL, indexing, transactions), CN (TCP/IP, HTTP, DNS, OSI), OOP (SOLID, design patterns, inheritance)
- Ask exactly 6-8 questions total
- Challenge vague answers: "Can you give a concrete example?" or "How would that work internally?"
- Be professional and realistic""",

    "behavioral": """You are Sarah, an HR manager and behavioral interviewer at a Fortune 500 company.
Your role is to assess soft skills, leadership, teamwork, and problem-solving approach using STAR method.
Interview style:
- Start warmly, make candidate comfortable
- Use situational and behavioral questions: "Tell me about a time when...", "Give me an example of..."
- Probe for STAR elements: Situation, Task, Action, Result
- If answer lacks specifics, ask: "What specifically did YOU do?" or "What was the measurable outcome?"
- Topics: teamwork, conflict resolution, leadership, failure & learning, time management, communication
- Ask 5-7 questions total
- Evaluate: clarity, self-awareness, ownership, impact""",

    "system_design": """You are Marcus, a staff engineer conducting a system design interview.
Your role is to evaluate architectural thinking and design skills.
Interview style:
- Introduce yourself and set context
- Give ONE system design problem (e.g., Design Twitter, Design URL Shortener, Design Netflix)
- Guide through: requirements clarification, capacity estimation, API design, database schema, high-level architecture, deep dives
- Ask clarifying follow-ups: "How would you handle scale?", "What if this component fails?"
- Probe on: scalability, reliability, caching, load balancing, databases
- Run the full design as one extended conversation (5-8 exchanges)
- Be collaborative but challenging"""
}

SCORING_PROMPT = """You are an expert interview evaluator. Analyze this interview Q&A and provide a detailed score.

Question: {question}
Candidate's Answer: {answer}
Topic: {topic}

Return ONLY a valid JSON object (no markdown, no backticks) with this exact structure:
{{
  "correctness": <0-10 float>,
  "depth": <0-10 float>,
  "clarity": <0-10 float>,
  "overall": <0-10 float>,
  "feedback": "<2-3 sentence specific feedback>",
  "topics_covered": ["<topic1>", "<topic2>"],
  "weakness_detected": "<specific weak area or null>",
  "strength_detected": "<specific strong area or null>"
}}

Scoring criteria:
- correctness: Is the core technical answer accurate?
- depth: Did they explain WHY, not just WHAT? Examples given?
- clarity: Was it well-structured and easy to follow?
- overall: Weighted average leaning toward correctness"""

SESSION_ANALYSIS_PROMPT = """You are an expert interview coach. Analyze this complete interview session and provide overall feedback.

Interview Type: {interview_type}
Questions and Answers:
{qa_pairs}

Individual question scores: {scores}

Return ONLY valid JSON (no markdown, no backticks):
{{
  "overall_score": <0-10 float>,
  "correctness_score": <0-10 float>,
  "depth_score": <0-10 float>,
  "clarity_score": <0-10 float>,
  "overall_feedback": "<3-4 sentences of comprehensive honest feedback>",
  "weak_topics": ["<topic1>", "<topic2>"],
  "strong_topics": ["<topic1>", "<topic2>"],
  "key_improvement_areas": ["<area1>", "<area2>", "<area3>"]
}}"""

ROADMAP_PROMPT = """You are a placement preparation expert. Generate a personalized study roadmap.

Student Profile:
- Target Role: {target_role}
- Experience Level: {experience_level}
- Weak Topics (from interview analysis): {weak_topics}
- Strong Topics: {strong_topics}
- Weeks Available: {weeks_available}

Return ONLY valid JSON array (no markdown, no backticks):
[
  {{
    "week_number": 1,
    "topic": "<topic name>",
    "description": "<what to study and why>",
    "priority": "high|medium|low",
    "resources": [
      {{"title": "<resource name>", "url": "<free url>", "type": "video|article|practice"}}
    ]
  }}
]

Rules:
- Prioritize weak topics first
- Include DSA, CS fundamentals, and behavioral prep
- Only free resources (YouTube, GeeksForGeeks, LeetCode free, NeetCode, CS50, etc.)
- Make it realistic for a student
- Generate {weeks_available} weeks of content"""

def get_ai_response(messages: List[Dict], interview_type: str) -> str:
    system_prompt = INTERVIEW_SYSTEM_PROMPTS.get(interview_type, INTERVIEW_SYSTEM_PROMPTS["cs_fundamentals"])
    
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "system", "content": system_prompt}] + messages,
        max_tokens=600,
        temperature=0.7,
    )
    return response.choices[0].message.content

def score_answer(question: str, answer: str, topic: str) -> Dict:
    prompt = SCORING_PROMPT.format(question=question, answer=answer, topic=topic or "General")
    
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=400,
        temperature=0.1,
    )
    
    content = response.choices[0].message.content.strip()
    # Strip markdown if present
    content = re.sub(r'```json\s*|\s*```', '', content).strip()
    
    try:
        return json.loads(content)
    except json.JSONDecodeError:
        return {
            "correctness": 5.0, "depth": 5.0, "clarity": 5.0, "overall": 5.0,
            "feedback": "Answer recorded. Keep practicing for better scores.",
            "topics_covered": [], "weakness_detected": None, "strength_detected": None
        }

def analyze_session(interview_type: str, qa_pairs: str, scores: List[float]) -> Dict:
    prompt = SESSION_ANALYSIS_PROMPT.format(
        interview_type=interview_type,
        qa_pairs=qa_pairs,
        scores=str(scores)
    )
    
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=600,
        temperature=0.1,
    )
    
    content = response.choices[0].message.content.strip()
    content = re.sub(r'```json\s*|\s*```', '', content).strip()
    
    try:
        return json.loads(content)
    except json.JSONDecodeError:
        avg = sum(scores) / len(scores) if scores else 5.0
        return {
            "overall_score": avg, "correctness_score": avg,
            "depth_score": avg, "clarity_score": avg,
            "overall_feedback": "Session completed. Review your answers and keep practicing.",
            "weak_topics": [], "strong_topics": [], "key_improvement_areas": []
        }

def generate_roadmap(target_role: str, experience_level: str, weak_topics: List[str], 
                     strong_topics: List[str], weeks_available: int = 8) -> List[Dict]:
    prompt = ROADMAP_PROMPT.format(
        target_role=target_role,
        experience_level=experience_level,
        weak_topics=", ".join(weak_topics) if weak_topics else "Not assessed yet",
        strong_topics=", ".join(strong_topics) if strong_topics else "Not assessed yet",
        weeks_available=weeks_available
    )
    
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=2000,
        temperature=0.3,
    )
    
    content = response.choices[0].message.content.strip()
    content = re.sub(r'```json\s*|\s*```', '', content).strip()
    
    try:
        return json.loads(content)
    except json.JSONDecodeError:
        return []
