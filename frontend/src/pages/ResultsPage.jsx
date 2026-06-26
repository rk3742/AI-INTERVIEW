import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts'
import { Trophy, AlertTriangle, CheckCircle, ArrowRight, Brain, Clock, Play } from 'lucide-react'
import api from '../utils/api'

function ScoreRing({ score, size = 120 }) {
  const pct = (score / 10) * 100
  const r = 45
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  const color = score >= 7 ? '#22c55e' : score >= 5 ? '#eab308' : '#ef4444'
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <circle cx="50" cy="50" r={r} fill="none" stroke="#1f2937" strokeWidth="10" />
      <circle
        cx="50" cy="50" r={r} fill="none"
        stroke={color} strokeWidth="10"
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeLinecap="round"
        transform="rotate(-90 50 50)"
        style={{ transition: 'stroke-dasharray 1s ease' }}
      />
      <text x="50" y="46" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold">{score?.toFixed(1)}</text>
      <text x="50" y="60" textAnchor="middle" fill="#6b7280" fontSize="9">/10</text>
    </svg>
  )
}

export default function ResultsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        let res = await api.get(`/sessions/${id}`)
        if (res.data.status !== 'completed') {
          await api.post(`/sessions/${id}/complete`)
          res = await api.get(`/sessions/${id}`)
        }
        setSession(res.data)
      } catch { navigate('/') }
      finally { setLoading(false) }
    }
    load()
  }, [id])

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <Brain size={32} className="text-brand-400 mx-auto mb-3 animate-pulse" />
        <p className="text-gray-400 text-sm">Analyzing your performance...</p>
      </div>
    </div>
  )

  if (!session) return null

  const radarData = [
    { axis: 'Correctness', value: (session.correctness_score || 0) * 10 },
    { axis: 'Depth', value: (session.depth_score || 0) * 10 },
    { axis: 'Clarity', value: (session.clarity_score || 0) * 10 },
  ]

  const qas = session.messages?.reduce((acc, msg, i, arr) => {
    if (msg.role === 'interviewer' && msg.is_question && msg.question_topic !== 'Introduction') {
      const nextCandidate = arr.slice(i + 1).find((m) => m.role === 'candidate')
      if (nextCandidate) acc.push({ question: msg.content, answer: nextCandidate })
    }
    return acc
  }, []) || []

  const grade = session.overall_score >= 8 ? 'Excellent' : session.overall_score >= 6.5 ? 'Good' : session.overall_score >= 5 ? 'Average' : 'Needs Work'
  const gradeColor = session.overall_score >= 8 ? 'text-green-400' : session.overall_score >= 6.5 ? 'text-brand-400' : session.overall_score >= 5 ? 'text-yellow-400' : 'text-red-400'

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Interview Results</h1>
          <p className="text-gray-400 text-sm mt-1 capitalize">{session.interview_type?.replace(/_/g, ' ')} · {session.duration_minutes} min · {session.difficulty}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => navigate('/roadmap')} className="btn-secondary flex items-center gap-2 text-sm">
            Update Roadmap <ArrowRight size={14} />
          </button>
          <button onClick={() => navigate('/interview')} className="btn-primary flex items-center gap-2 text-sm">
            <Play size={14} /> New Interview
          </button>
        </div>
      </div>

      {/* Score overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Overall */}
        <div className="card p-6 flex flex-col items-center text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">Overall Score</p>
          <ScoreRing score={session.overall_score || 0} size={130} />
          <p className={`text-lg font-bold mt-3 ${gradeColor}`}>{grade}</p>
        </div>

        {/* Radar */}
        <div className="card p-6">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-3 text-center">Performance Breakdown</p>
          <ResponsiveContainer width="100%" height={160}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#374151" />
              <PolarAngleAxis dataKey="axis" tick={{ fill: '#9ca3af', fontSize: 11 }} />
              <Radar dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Scores breakdown */}
        <div className="card p-6 space-y-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Score Details</p>
          {[
            { label: 'Correctness', val: session.correctness_score },
            { label: 'Depth', val: session.depth_score },
            { label: 'Clarity', val: session.clarity_score },
          ].map(({ label, val }) => (
            <div key={label}>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-gray-400">{label}</span>
                <span className="text-white font-semibold">{val?.toFixed(1)}/10</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div
                  className="bg-brand-500 h-2 rounded-full"
                  style={{ width: `${((val || 0) / 10) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Feedback */}
      {session.ai_feedback && (
        <div className="card p-6 mb-6 border-brand-500/20">
          <div className="flex items-start gap-3">
            <Brain size={18} className="text-brand-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-brand-300 mb-1">AI Coach Feedback</p>
              <p className="text-sm text-gray-300 leading-relaxed">{session.ai_feedback}</p>
            </div>
          </div>
        </div>
      )}

      {/* Weak / Strong topics */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {session.weak_topics_detected?.length > 0 && (
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={15} className="text-red-400" />
              <p className="text-sm font-semibold text-red-300">Weak Topics</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {session.weak_topics_detected.map((t) => (
                <span key={t} className="badge bg-red-500/10 text-red-400 border border-red-500/20">{t}</span>
              ))}
            </div>
          </div>
        )}
        {session.strong_topics_detected?.length > 0 && (
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle size={15} className="text-green-400" />
              <p className="text-sm font-semibold text-green-300">Strong Topics</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {session.strong_topics_detected.map((t) => (
                <span key={t} className="badge bg-green-500/10 text-green-400 border border-green-500/20">{t}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Q&A Review */}
      {qas.length > 0 && (
        <div className="card p-6">
          <h2 className="text-sm font-semibold text-gray-300 mb-4">Q&A Review</h2>
          <div className="space-y-5">
            {qas.map((qa, i) => (
              <div key={i} className="border-b border-gray-800 last:border-0 pb-5 last:pb-0">
                <p className="text-xs font-semibold text-gray-500 mb-1">Q{i + 1}</p>
                <p className="text-sm text-gray-200 mb-2">{qa.question}</p>
                <div className="bg-gray-800/60 rounded-xl p-3">
                  <p className="text-xs text-gray-500 mb-1">Your answer</p>
                  <p className="text-sm text-gray-300">{qa.answer.content}</p>
                  {qa.answer.answer_score != null && (
                    <div className="flex items-center gap-3 mt-2 pt-2 border-t border-gray-700">
                      <span className={`text-xs font-bold ${qa.answer.answer_score >= 7 ? 'text-green-400' : qa.answer.answer_score >= 5 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {qa.answer.answer_score?.toFixed(1)}/10
                      </span>
                      {qa.answer.answer_feedback && (
                        <span className="text-xs text-gray-500">{qa.answer.answer_feedback}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
