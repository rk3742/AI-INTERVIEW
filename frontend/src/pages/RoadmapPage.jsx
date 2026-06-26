import { useEffect, useState } from 'react'
import { Map, RefreshCw, CheckCircle, Circle, ExternalLink, Loader2, Youtube, FileText, Code } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../utils/api'

const priorityColor = {
  high: 'border-red-500/40 bg-red-500/5',
  medium: 'border-yellow-500/40 bg-yellow-500/5',
  low: 'border-gray-700 bg-gray-900',
}
const priorityBadge = {
  high: 'bg-red-500/20 text-red-400',
  medium: 'bg-yellow-500/20 text-yellow-400',
  low: 'bg-gray-700 text-gray-400',
}

const resourceIcon = (type) => {
  if (type === 'video') return <Youtube size={12} className="text-red-400" />
  if (type === 'practice') return <Code size={12} className="text-green-400" />
  return <FileText size={12} className="text-blue-400" />
}

export default function RoadmapPage() {
  const [roadmap, setRoadmap] = useState([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [weeks, setWeeks] = useState(8)

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.get('/dashboard/roadmap')
      setRoadmap(res.data)
    } catch { toast.error('Failed to load roadmap') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const generate = async () => {
    setGenerating(true)
    try {
      await api.post(`/dashboard/roadmap/generate?weeks=${weeks}`)
      toast.success('Roadmap generated!')
      await load()
    } catch { toast.error('Failed to generate roadmap. Check your API key.') }
    finally { setGenerating(false) }
  }

  const toggle = async (itemId) => {
    await api.patch(`/dashboard/roadmap/${itemId}/toggle`)
    setRoadmap((prev) => prev.map((r) => r.id === itemId ? { ...r, is_completed: !r.is_completed } : r))
  }

  const byWeek = roadmap.reduce((acc, item) => {
    const w = item.week_number
    if (!acc[w]) acc[w] = []
    acc[w].push(item)
    return acc
  }, {})

  const completed = roadmap.filter((r) => r.is_completed).length
  const total = roadmap.length

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Map size={22} className="text-brand-400" />
            My Study Roadmap
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Personalized based on your interview performance and weak topics.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={weeks}
            onChange={(e) => setWeeks(Number(e.target.value))}
            className="input !py-2 !px-3 text-sm w-28"
          >
            {[4, 6, 8, 10, 12].map((w) => <option key={w} value={w}>{w} weeks</option>)}
          </select>
          <button onClick={generate} disabled={generating} className="btn-primary flex items-center gap-2 text-sm">
            {generating ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
            {roadmap.length === 0 ? 'Generate' : 'Regenerate'}
          </button>
        </div>
      </div>

      {/* Progress */}
      {total > 0 && (
        <div className="card p-5 mb-8">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-300">Overall Progress</p>
            <p className="text-sm font-bold text-white">{completed}/{total} topics</p>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-3">
            <div
              className="bg-brand-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${total > 0 ? (completed / total) * 100 : 0}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">{Math.round((completed / total) * 100)}% complete</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Empty state */}
      {!loading && roadmap.length === 0 && (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 bg-brand-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Map size={28} className="text-brand-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No roadmap yet</h3>
          <p className="text-gray-400 text-sm mb-6 max-w-sm mx-auto">
            Complete at least one interview session, then generate your personalized roadmap based on your weak topics.
          </p>
          <button onClick={generate} disabled={generating} className="btn-primary flex items-center gap-2 mx-auto">
            {generating ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
            Generate My Roadmap
          </button>
        </div>
      )}

      {/* Weeks */}
      {!loading && Object.keys(byWeek).map((week) => (
        <div key={week} className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-xs font-bold text-white">{week}</div>
            <h2 className="text-sm font-semibold text-gray-300">Week {week}</h2>
            <div className="flex-1 h-px bg-gray-800" />
          </div>
          <div className="space-y-3">
            {byWeek[week].map((item) => (
              <div key={item.id} className={`card p-5 border ${priorityColor[item.priority]} transition-all`}>
                <div className="flex items-start gap-3">
                  <button onClick={() => toggle(item.id)} className="mt-0.5 flex-shrink-0 text-gray-500 hover:text-brand-400 transition-colors">
                    {item.is_completed
                      ? <CheckCircle size={20} className="text-green-400" />
                      : <Circle size={20} />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className={`font-semibold text-sm ${item.is_completed ? 'line-through text-gray-500' : 'text-white'}`}>
                        {item.topic}
                      </h3>
                      <span className={`badge ${priorityBadge[item.priority]}`}>{item.priority} priority</span>
                    </div>
                    {item.description && (
                      <p className="text-xs text-gray-400 mt-1 leading-relaxed">{item.description}</p>
                    )}
                    {item.resources?.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {item.resources.map((r, i) => (
                          <a
                            key={i}
                            href={r.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-800 hover:bg-gray-700 rounded-lg text-xs text-gray-300 hover:text-white transition-colors"
                          >
                            {resourceIcon(r.type)}
                            {r.title}
                            <ExternalLink size={10} className="text-gray-600" />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
