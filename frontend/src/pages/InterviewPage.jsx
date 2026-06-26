import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Code2, BookOpen, Users, Server, ChevronRight, Clock, Brain } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../utils/api'

const TYPES = [
  {
    id: 'technical',
    title: 'Technical (DSA)',
    description: 'Arrays, LinkedLists, Trees, Graphs, DP, Sorting, and complexity analysis. Just like a real FAANG interview.',
    icon: Code2,
    color: 'from-blue-600 to-blue-700',
    iconBg: 'bg-blue-500/20 text-blue-400',
    topics: ['Data Structures', 'Algorithms', 'Time Complexity', 'Problem Solving'],
    duration: '25–35 min',
  },
  {
    id: 'cs_fundamentals',
    title: 'CS Fundamentals',
    description: 'OS, DBMS, Computer Networks, and OOP — the core subjects every engineer must know.',
    icon: BookOpen,
    color: 'from-purple-600 to-purple-700',
    iconBg: 'bg-purple-500/20 text-purple-400',
    topics: ['Operating Systems', 'DBMS', 'Computer Networks', 'OOP'],
    duration: '20–30 min',
  },
  {
    id: 'behavioral',
    title: 'Behavioral / HR',
    description: 'STAR-method questions on teamwork, leadership, conflict, and career goals.',
    icon: Users,
    color: 'from-green-600 to-green-700',
    iconBg: 'bg-green-500/20 text-green-400',
    topics: ['Teamwork', 'Leadership', 'Conflict Resolution', 'Communication'],
    duration: '15–25 min',
  },
  {
    id: 'system_design',
    title: 'System Design',
    description: 'Design scalable systems like Twitter, Netflix, or URL shorteners with the guidance of a staff engineer.',
    icon: Server,
    color: 'from-orange-600 to-orange-700',
    iconBg: 'bg-orange-500/20 text-orange-400',
    topics: ['Scalability', 'Databases', 'Caching', 'Architecture'],
    duration: '30–45 min',
  },
]

const DIFFICULTIES = [
  { id: 'easy', label: 'Easy', desc: 'Great for beginners and warmup', color: 'border-green-500/50 bg-green-500/10 text-green-300' },
  { id: 'medium', label: 'Medium', desc: 'Standard placement level', color: 'border-yellow-500/50 bg-yellow-500/10 text-yellow-300' },
  { id: 'hard', label: 'Hard', desc: 'FAANG/product company level', color: 'border-red-500/50 bg-red-500/10 text-red-300' },
]

export default function InterviewPage() {
  const [selectedType, setSelectedType] = useState(null)
  const [difficulty, setDifficulty] = useState('medium')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleStart = async () => {
    if (!selectedType) { toast.error('Please select an interview type'); return }
    setLoading(true)
    try {
      const res = await api.post('/sessions', { interview_type: selectedType, difficulty })
      navigate(`/session/${res.data.id}`)
    } catch (err) {
      toast.error('Failed to start session. Check your API key.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Start a Mock Interview</h1>
        <p className="text-gray-400 text-sm mt-1">Choose your interview type and difficulty. The AI will adapt to your answers.</p>
      </div>

      {/* Interview type selection */}
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Select Interview Type</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {TYPES.map((t) => {
          const Icon = t.icon
          const isSelected = selectedType === t.id
          return (
            <button
              key={t.id}
              onClick={() => setSelectedType(t.id)}
              className={`card p-5 text-left transition-all duration-200 hover:border-gray-600 ${isSelected ? 'border-brand-500 bg-brand-600/5' : ''}`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-2.5 rounded-xl ${t.iconBg} flex-shrink-0`}>
                  <Icon size={22} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-white text-sm">{t.title}</h3>
                    {isSelected && <div className="w-2 h-2 rounded-full bg-brand-400" />}
                  </div>
                  <p className="text-gray-400 text-xs mt-1 leading-relaxed">{t.description}</p>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {t.topics.map((topic) => (
                      <span key={topic} className="badge bg-gray-800 text-gray-400">{topic}</span>
                    ))}
                  </div>
                  <p className="text-xs text-gray-600 mt-2 flex items-center gap-1">
                    <Clock size={11} /> {t.duration}
                  </p>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Difficulty */}
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Select Difficulty</h2>
      <div className="grid grid-cols-3 gap-3 mb-8">
        {DIFFICULTIES.map((d) => (
          <button
            key={d.id}
            onClick={() => setDifficulty(d.id)}
            className={`p-4 rounded-xl border text-left transition-all ${difficulty === d.id ? d.color + ' border-2' : 'border-gray-800 bg-gray-900 hover:border-gray-700'}`}
          >
            <p className="font-semibold text-sm">{d.label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{d.desc}</p>
          </button>
        ))}
      </div>

      {/* Tips */}
      <div className="card p-5 mb-8 border-brand-500/20 bg-brand-500/5">
        <div className="flex items-start gap-3">
          <Brain size={18} className="text-brand-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-brand-300 mb-1">Interview Tips</p>
            <ul className="text-xs text-gray-400 space-y-1">
              <li>• Type your answers as you would speak them — full sentences, not bullet points</li>
              <li>• The AI will ask follow-up questions, so elaborate on your answers</li>
              <li>• Don't rush — take time to think before answering</li>
              <li>• After 7 questions, the session will wrap up automatically</li>
            </ul>
          </div>
        </div>
      </div>

      <button
        onClick={handleStart}
        disabled={!selectedType || loading}
        className="btn-primary flex items-center gap-2 text-base px-8 py-3"
      >
        {loading ? (
          <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Starting...</>
        ) : (
          <><Brain size={18} />Start Interview <ChevronRight size={16} /></>
        )}
      </button>
    </div>
  )
}
