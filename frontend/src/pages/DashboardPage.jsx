import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Trophy, Flame, Target, TrendingUp, Play, Map, AlertTriangle, Star, BookOpen, Clock } from 'lucide-react'
import api from '../utils/api'
import useAuthStore from '../store/authStore'
import { format } from 'date-fns'

function StatCard({ icon: Icon, label, value, sub, color = 'brand' }) {
  const colors = {
    brand: 'text-brand-400 bg-brand-500/10',
    orange: 'text-orange-400 bg-orange-500/10',
    green: 'text-green-400 bg-green-500/10',
    purple: 'text-purple-400 bg-purple-500/10',
  }
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
          <p className="text-3xl font-bold text-white mt-1">{value}</p>
          {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
        </div>
        <div className={`p-2.5 rounded-xl ${colors[color]}`}>
          <Icon size={20} className={colors[color].split(' ')[0]} />
        </div>
      </div>
    </div>
  )
}

function ScoreBar({ topic, score, category }) {
  const pct = Math.round((score / 10) * 100)
  const color = pct >= 70 ? 'bg-green-500' : pct >= 45 ? 'bg-yellow-500' : 'bg-red-500'
  return (
    <div className="py-2">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-300 font-medium truncate">{topic}</span>
        <span className={`font-semibold ${pct >= 70 ? 'text-green-400' : pct >= 45 ? 'text-yellow-400' : 'text-red-400'}`}>{score.toFixed(1)}/10</span>
      </div>
      <div className="w-full bg-gray-800 rounded-full h-2">
        <div className={`${color} h-2 rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm">
        <p className="text-gray-400 text-xs">{label}</p>
        <p className="text-white font-bold">{payload[0].value?.toFixed(1)} / 10</p>
      </div>
    )
  }
  return null
}

export default function DashboardPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [history, setHistory] = useState([])
  const [heatmap, setHeatmap] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/dashboard/stats'),
      api.get('/dashboard/session-history'),
      api.get('/dashboard/topic-heatmap'),
    ]).then(([s, h, hm]) => {
      setStats(s.data)
      setHistory(h.data)
      setHeatmap(hm.data)
    }).finally(() => setLoading(false))
  }, [])

  const chartData = history.slice(-10).map((s) => ({
    date: s.date ? format(new Date(s.date), 'MMM d') : '',
    score: s.score,
    type: s.type,
  }))

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Welcome back, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {stats?.total_sessions === 0
              ? 'Start your first interview to begin tracking your progress'
              : `You're ${stats?.readiness_score?.toFixed(0)}% placement-ready`}
          </p>
        </div>
        <button onClick={() => navigate('/interview')} className="btn-primary flex items-center gap-2">
          <Play size={16} />
          Start Interview
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Trophy} label="Avg Score" value={stats?.avg_score ? `${stats.avg_score}/10` : '—'} sub={`${stats?.total_sessions || 0} sessions`} color="brand" />
        <StatCard icon={Flame} label="Streak" value={`${stats?.streak || 0} days`} sub="Keep it going!" color="orange" />
        <StatCard icon={Target} label="Readiness" value={`${stats?.readiness_score?.toFixed(0) || 0}%`} sub="Placement score" color="green" />
        <StatCard icon={TrendingUp} label="Improvement" value={`${stats?.improvement_rate > 0 ? '+' : ''}${stats?.improvement_rate?.toFixed(1) || 0}%`} sub="Last 3 sessions" color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Score chart */}
        <div className="card p-6 lg:col-span-2">
          <h2 className="text-sm font-semibold text-gray-300 mb-4">Score History</h2>
          {chartData.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-gray-600 text-sm">
              Complete interviews to see your score trend
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 10]} tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2} fill="url(#scoreGrad)" dot={{ fill: '#6366f1', r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Quick insights */}
        <div className="card p-6">
          <h2 className="text-sm font-semibold text-gray-300 mb-4">Quick Insights</h2>
          <div className="space-y-4">
            {stats?.strongest_topic && (
              <div className="flex items-start gap-3 p-3 bg-green-500/10 border border-green-500/20 rounded-xl">
                <Star size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-green-300">Strongest Topic</p>
                  <p className="text-sm text-white">{stats.strongest_topic}</p>
                </div>
              </div>
            )}
            {stats?.weakest_topic && (
              <div className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                <AlertTriangle size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-red-300">Needs Work</p>
                  <p className="text-sm text-white">{stats.weakest_topic}</p>
                </div>
              </div>
            )}
            <div className="flex items-start gap-3 p-3 bg-brand-500/10 border border-brand-500/20 rounded-xl">
              <BookOpen size={16} className="text-brand-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-brand-300">This Week</p>
                <p className="text-sm text-white">{stats?.sessions_this_week || 0} sessions completed</p>
              </div>
            </div>
            <button onClick={() => navigate('/roadmap')} className="w-full btn-secondary flex items-center justify-center gap-2 text-sm">
              <Map size={15} />
              View My Roadmap
            </button>
          </div>
        </div>
      </div>

      {/* Topic Heatmap */}
      {heatmap.length > 0 && (
        <div className="card p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-300 mb-4">Topic Heatmap</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
            {heatmap.map((t) => (
              <ScoreBar key={t.id} topic={t.topic} score={t.avg_score} category={t.category} />
            ))}
          </div>
        </div>
      )}

      {/* Recent sessions */}
      {history.length > 0 && (
        <div className="card p-6">
          <h2 className="text-sm font-semibold text-gray-300 mb-4">Recent Sessions</h2>
          <div className="space-y-2">
            {history.slice(-5).reverse().map((s) => (
              <div
                key={s.id}
                onClick={() => navigate(`/results/${s.id}`)}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-800 cursor-pointer transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-brand-500/20 flex items-center justify-center">
                    <Play size={14} className="text-brand-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white capitalize">{s.type?.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock size={11} />
                      {s.date ? format(new Date(s.date), 'MMM d, yyyy') : ''}
                      {s.duration && ` · ${s.duration} min`}
                    </p>
                  </div>
                </div>
                <span className={`text-sm font-bold ${s.score >= 7 ? 'text-green-400' : s.score >= 5 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {s.score?.toFixed(1)}/10
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {stats?.total_sessions === 0 && (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 bg-brand-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Play size={28} className="text-brand-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Ready to start?</h3>
          <p className="text-gray-400 text-sm mb-6 max-w-sm mx-auto">
            Take your first AI-powered mock interview and get instant feedback on your performance.
          </p>
          <button onClick={() => navigate('/interview')} className="btn-primary">
            Start Your First Interview
          </button>
        </div>
      )}
    </div>
  )
}
