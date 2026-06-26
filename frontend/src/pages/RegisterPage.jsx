import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Brain } from 'lucide-react'
import toast from 'react-hot-toast'
import useAuthStore from '../store/authStore'

const roles = ['Software Developer', 'Backend Engineer', 'Frontend Engineer', 'Full Stack Developer', 'Data Analyst', 'Data Scientist', 'DevOps Engineer', 'System Engineer']
const levels = ['Fresher', '1-2 Years', '3-5 Years', '5+ Years']

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', target_role: 'Software Developer', experience_level: 'Fresher' })
  const [loading, setLoading] = useState(false)
  const { register } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await register(form)
      toast.success('Account created! Welcome to InterviewMind.')
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Brain size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Get Started</h1>
          <p className="text-gray-400 text-sm mt-1">Create your InterviewMind account</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Full Name</label>
              <input className="input" placeholder="Rithik Kumar" value={form.name} onChange={(e) => set('name', e.target.value)} required />
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" className="input" placeholder="you@example.com" value={form.email} onChange={(e) => set('email', e.target.value)} required />
            </div>
            <div>
              <label className="label">Password</label>
              <input type="password" className="input" placeholder="Min 8 characters" value={form.password} onChange={(e) => set('password', e.target.value)} required minLength={8} />
            </div>
            <div>
              <label className="label">Target Role</label>
              <select className="input" value={form.target_role} onChange={(e) => set('target_role', e.target.value)}>
                {roles.map((r) => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Experience Level</label>
              <select className="input" value={form.experience_level} onChange={(e) => set('experience_level', e.target.value)}>
                {levels.map((l) => <option key={l}>{l}</option>)}
              </select>
            </div>
            <button type="submit" className="btn-primary w-full mt-2" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-400 hover:text-brand-300 font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
