import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Send, StopCircle, Brain, User, Loader2, ChevronRight, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../utils/api'

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 msg-enter">
      <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center flex-shrink-0">
        <Brain size={14} className="text-white" />
      </div>
      <div className="bg-gray-800 rounded-2xl rounded-bl-sm px-4 py-3">
        <div className="flex gap-1 items-center h-4">
          <div className="dot w-1.5 h-1.5 bg-gray-400 rounded-full" />
          <div className="dot w-1.5 h-1.5 bg-gray-400 rounded-full" />
          <div className="dot w-1.5 h-1.5 bg-gray-400 rounded-full" />
        </div>
      </div>
    </div>
  )
}

function ChatMessage({ msg, isNew }) {
  const isInterviewer = msg.role === 'interviewer'
  return (
    <div className={`flex items-end gap-2 ${isInterviewer ? '' : 'flex-row-reverse'} ${isNew ? 'msg-enter' : ''}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isInterviewer ? 'bg-brand-600' : 'bg-gray-700'}`}>
        {isInterviewer ? <Brain size={14} className="text-white" /> : <User size={14} className="text-gray-300" />}
      </div>
      <div className={`max-w-[75%] ${isInterviewer ? '' : 'items-end flex flex-col'}`}>
        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
          isInterviewer
            ? 'bg-gray-800 text-gray-100 rounded-bl-sm'
            : 'bg-brand-600 text-white rounded-br-sm'
        }`}>
          {msg.content}
        </div>
        {msg.answer_score != null && (
          <div className="mt-1.5 px-3 py-1.5 bg-gray-900 border border-gray-800 rounded-xl text-xs">
            <div className="flex items-center gap-2">
              <span className={`font-bold ${msg.answer_score >= 7 ? 'text-green-400' : msg.answer_score >= 5 ? 'text-yellow-400' : 'text-red-400'}`}>
                Score: {msg.answer_score?.toFixed(1)}/10
              </span>
              {msg.answer_feedback && (
                <span className="text-gray-500">· {msg.answer_feedback}</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function SessionPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [session, setSession] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isAITyping, setIsAITyping] = useState(false)
  const [isEnding, setIsEnding] = useState(false)
  const [questionCount, setQuestionCount] = useState(0)
  const [shouldEnd, setShouldEnd] = useState(false)
  const [newMsgIds, setNewMsgIds] = useState(new Set())
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    api.get(`/sessions/${id}`).then((res) => {
      setSession(res.data)
      if (res.data.status === 'completed') {
        navigate(`/results/${id}`)
        return
      }
      const msgs = res.data.messages || []
      setMessages(msgs)
    }).catch(() => toast.error('Session not found'))
  }, [id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isAITyping])

  const handleSend = async () => {
    if (!input.trim() || isAITyping) return
    const text = input.trim()
    setInput('')

    // Optimistically add candidate message
    const tempId = Date.now()
    const candidateMsg = { id: tempId, role: 'candidate', content: text, is_question: false, created_at: new Date().toISOString() }
    setMessages((prev) => [...prev, candidateMsg])
    setNewMsgIds((prev) => new Set([...prev, tempId]))
    setIsAITyping(true)

    try {
      const res = await api.post(`/sessions/${id}/message`, { content: text })
      const { interviewer_message, answer_score, answer_feedback, should_end, questions_asked } = res.data

      setMessages((prev) => {
        // Update candidate msg with score
        const updated = prev.map((m) =>
          m.id === tempId ? { ...m, answer_score, answer_feedback } : m
        )
        const aiMsg = {
          id: Date.now() + 1,
          role: 'interviewer',
          content: interviewer_message,
          is_question: !should_end,
          created_at: new Date().toISOString(),
        }
        setNewMsgIds((p) => new Set([...p, aiMsg.id]))
        return [...updated, aiMsg]
      })

      setQuestionCount(questions_asked)
      if (should_end) setShouldEnd(true)
    } catch (err) {
      toast.error('Failed to send message. Check your Groq API key.')
      setMessages((prev) => prev.filter((m) => m.id !== tempId))
    } finally {
      setIsAITyping(false)
      inputRef.current?.focus()
    }
  }

  const handleEnd = async () => {
    setIsEnding(true)
    try {
      await api.post(`/sessions/${id}/complete`)
      toast.success('Session completed! Viewing results...')
      navigate(`/results/${id}`)
    } catch {
      toast.error('Failed to end session')
      setIsEnding(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const typeLabel = session?.interview_type?.replace(/_/g, ' ')

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center">
            <Brain size={18} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white capitalize">{typeLabel} Interview</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <p className="text-xs text-gray-400">AI Interviewer Active · {questionCount}/7 questions</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {shouldEnd ? (
            <button onClick={handleEnd} disabled={isEnding} className="btn-primary flex items-center gap-2 text-sm">
              {isEnding ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />}
              View Results
            </button>
          ) : (
            <button onClick={handleEnd} disabled={isEnding} className="flex items-center gap-2 text-sm text-gray-400 hover:text-red-400 transition-colors px-3 py-2 rounded-xl hover:bg-gray-800">
              <StopCircle size={15} />
              End Session
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-gray-800 flex-shrink-0">
        <div
          className="h-full bg-brand-600 transition-all duration-500"
          style={{ width: `${Math.min((questionCount / 7) * 100, 100)}%` }}
        />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} msg={msg} isNew={newMsgIds.has(msg.id)} />
        ))}
        {isAITyping && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* End suggestion banner */}
      {shouldEnd && (
        <div className="mx-6 mb-3 p-3 bg-brand-600/10 border border-brand-600/30 rounded-xl flex items-center justify-between">
          <p className="text-sm text-brand-300">Interview complete! Click "View Results" to see your detailed analysis.</p>
          <button onClick={handleEnd} className="text-brand-400 hover:text-brand-300 flex items-center gap-1 text-sm font-medium">
            Results <ChevronRight size={14} />
          </button>
        </div>
      )}

      {/* Input */}
      <div className="bg-gray-900 border-t border-gray-800 p-4 flex-shrink-0">
        <div className="flex gap-3 max-w-4xl mx-auto">
          <textarea
            ref={inputRef}
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isAITyping || shouldEnd}
            placeholder={shouldEnd ? 'Interview ended. Click "View Results" above.' : 'Type your answer... (Enter to send, Shift+Enter for new line)'}
            className="input flex-1 resize-none text-sm"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isAITyping || shouldEnd}
            className="btn-primary px-4 self-end"
          >
            {isAITyping ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
      </div>
    </div>
  )
}
