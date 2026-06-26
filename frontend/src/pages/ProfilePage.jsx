import { useState, useEffect } from 'react'
import { User, Save, Loader2, Building2, Target, GraduationCap, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'
import useAuthStore from '../store/authStore'

const roles = ['Software Developer', 'Backend Engineer', 'Frontend Engineer', 'Full Stack Developer', 'Data Analyst', 'Data Scientist', 'DevOps Engineer', 'System Engineer', 'Mobile Developer', 'ML Engineer']
const levels = ['Fresher', '1-2 Years', '3-5 Years', '5+ Years']
const companies = ['Google', 'Microsoft', 'Amazon', 'Meta', 'Apple', 'Flipkart', 'Swiggy', 'Zomato', 'Paytm', 'Infosys', 'TCS', 'Wipro', 'Accenture', 'Capgemini', 'Cognizant']

export default function ProfilePage() {
  const { user, updateProfile } = useAuthStore()
  const [form, setForm] = useState({
    name: '',
    target_role: '',
    experience_level: '',
    target_companies: [],
    placement_deadline: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        target_role: user.target_role || '',
        experience_level: user.experience_level || '',
        target_companies: user.target_companies || [],
        placement_deadline: user.placement_deadline || '',
      })
    }
  }, [user])

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const toggleCompany = (c) => {
    const curr = form.target_companies
    set('target_companies', curr.includes(c) ? curr.filter((x) => x !== c) : [...curr, c])
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateProfile(form)
      toast.success('Profile updated!')
    } catch { toast.error('Failed to save') }
    finally { setSaving(false) }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Profile Settings</h1>
        <p className="text-gray-400 text-sm mt-1">Your profile helps InterviewMind personalize your roadmap and questions.</p>
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-2xl bg-brand-600 flex items-center justify-center text-2xl font-bold text-white">
          {user?.name?.charAt(0)?.toUpperCase()}
        </div>
        <div>
          <p className="font-semibold text-white">{user?.name}</p>
          <p className="text-sm text-gray-400">{user?.email}</p>
          <p className="text-xs text-brand-400 mt-0.5">Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : ''}</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Basic info */}
        <div className="card p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
            <User size={15} className="text-brand-400" /> Basic Info
          </h2>
          <div>
            <label className="label">Full Name</label>
            <input className="input" value={form.name} onChange={(e) => set('name', e.target.value)} />
          </div>
        </div>

        {/* Career goals */}
        <div className="card p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
            <Target size={15} className="text-brand-400" /> Career Goals
          </h2>
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
          <div>
            <label className="label flex items-center gap-1.5">
              <Calendar size={12} /> Placement Deadline
            </label>
            <input type="month" className="input" value={form.placement_deadline} onChange={(e) => set('placement_deadline', e.target.value)} />
          </div>
        </div>

        {/* Target companies */}
        <div className="card p-6">
          <h2 className="text-sm font-semibold text-gray-300 flex items-center gap-2 mb-4">
            <Building2 size={15} className="text-brand-400" /> Target Companies
          </h2>
          <p className="text-xs text-gray-500 mb-3">Select companies you're targeting (used to tailor questions)</p>
          <div className="flex flex-wrap gap-2">
            {companies.map((c) => (
              <button
                key={c}
                onClick={() => toggleCompany(c)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all border ${
                  form.target_companies.includes(c)
                    ? 'border-brand-500 bg-brand-500/20 text-brand-300'
                    : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Save Changes
        </button>
      </div>
    </div>
  )
}
