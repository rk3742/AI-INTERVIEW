import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { Brain, LayoutDashboard, Play, Map, User, LogOut, Flame, ChevronRight } from 'lucide-react'
import useAuthStore from '../../store/authStore'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/interview', label: 'Start Interview', icon: Play },
  { to: '/roadmap', label: 'My Roadmap', icon: Map },
  { to: '/profile', label: 'Profile', icon: User },
]

export default function Layout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-gray-900 border-r border-gray-800 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center">
              <Brain size={20} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-white text-sm">InterviewMind</p>
              <p className="text-xs text-gray-500">AI Trainer</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ to, label, icon: Icon, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-brand-600/20 text-brand-400 border border-brand-600/30'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-gray-800">
          {user && (
            <div className="mb-3 px-3 py-2 bg-gray-800/50 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-white truncate">{user.name}</p>
                  <p className="text-xs text-gray-500 truncate">{user.target_role}</p>
                </div>
                <div className="flex items-center gap-1 text-orange-400">
                  <Flame size={14} />
                  <span className="text-xs font-bold">{user.streak}</span>
                </div>
              </div>
            </div>
          )}
          <button onClick={handleLogout} className="flex items-center gap-2 text-gray-500 hover:text-red-400 text-sm w-full px-3 py-2 rounded-xl hover:bg-gray-800 transition-all">
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto bg-gray-950">
        <Outlet />
      </main>
    </div>
  )
}
