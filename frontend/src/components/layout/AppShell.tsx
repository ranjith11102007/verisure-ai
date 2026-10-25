import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { authApi, usersApi } from '../../lib/api'

const navItems = [
  { path: '/dashboard', icon: 'dashboard', label: 'Executive Dashboard' },
  { path: '/applications', icon: 'folder_open', label: 'Application Registry' },
  { path: '/upload', icon: 'upload_file', label: 'Document Upload' },
  { path: '/document-intelligence', icon: 'document_scanner', label: 'Document Intelligence' },
  { path: '/document-auth', icon: 'verified_user', label: 'Document Authentication' },
  { path: '/compliance', icon: 'fact_check', label: 'Compliance Findings' },
  { path: '/rules', icon: 'rule', label: 'Rules Engine' },
  { path: '/evidence', icon: 'mark_email_unread', label: 'Evidence Requests' },
  { path: '/notifications', icon: 'notifications', label: 'Notifications' },
  { path: '/audit', icon: 'history_toggle_off', label: 'Audit History' },
  { path: '/reports', icon: 'analytics', label: 'Reports & Analytics' },
  { path: '/profile', icon: 'person', label: 'Profile' },
  { path: '/settings', icon: 'settings', label: 'Settings' },
]

export function AppShell() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    usersApi
      .me()
      .then((res) => setUser(res.data))
      .catch(() => {
        authApi
          .me()
          .then((res) => setUser(res.data))
          .catch(() => setUser(null))
      })
  }, [])

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  const handleLogout = async () => {
    try {
      await authApi.logout()
    } catch {
      // logout is best-effort; the client token is cleared regardless
    }
    localStorage.removeItem('token')
    navigate('/login')
  }

  const initials = (user?.full_name || user?.email || 'U')
    .split(' ')
    .map((s: string) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const sidebar = (
    <aside
      className={`${collapsed ? 'w-16' : 'w-60'} h-full bg-[#0F172A] text-white flex flex-col transition-all duration-200 z-50`}
    >
      <div className="h-14 flex items-center px-3 border-b border-[#334155] shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded bg-primary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[18px]">shield</span>
          </div>
          {!collapsed && (
            <span className="font-headline text-sm font-semibold tracking-tight truncate">VeriSure AI</span>
          )}
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto py-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            title={item.label}
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-2 mx-2 rounded transition-colors ${
                isActive ? 'bg-[#2563EB] text-white' : 'text-[#CBD5E1] hover:bg-[#1E293B] hover:text-white'
              }`
            }
          >
            <span className="material-symbols-outlined text-[18px] shrink-0">{item.icon}</span>
            {!collapsed && <span className="text-[13px] truncate">{item.label}</span>}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-[#334155] p-2 space-y-1 shrink-0">
        {!collapsed && user && (
          <div className="px-3 py-1.5 text-[11px] text-[#94A3B8] truncate">
            {user.email}
            <div className="capitalize text-[#64748B]">{user.role}</div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-1.5 text-[#CBD5E1] hover:text-white hover:bg-[#1E293B] rounded"
        >
          <span className="material-symbols-outlined text-[18px]">logout</span>
          {!collapsed && <span className="text-[13px]">Logout</span>}
        </button>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full hidden md:flex items-center justify-center py-1.5 text-[#CBD5E1] hover:text-white hover:bg-[#1E293B] rounded"
        >
          <span className="material-symbols-outlined text-[18px]">
            {collapsed ? 'chevron_right' : 'chevron_left'}
          </span>
        </button>
      </div>
    </aside>
  )

  return (
    <div className="min-h-screen bg-surface">
      {/* Desktop sidebar */}
      <div className={`hidden md:block fixed left-0 top-0 h-full ${collapsed ? 'w-16' : 'w-60'}`}>{sidebar}</div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="w-60 h-full">{sidebar}</div>
          <div className="flex-1 bg-black/40" onClick={() => setMobileOpen(false)}></div>
        </div>
      )}

      <div className={`${collapsed ? 'md:ml-16' : 'md:ml-60'} transition-all duration-200`}>
        <header className="h-14 bg-surface-container-lowest border-b border-outline-variant/30 flex items-center justify-between px-4 md:px-6 sticky top-0 z-30">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-1.5 -ml-1.5 hover:bg-surface-container rounded"
            >
              <span className="material-symbols-outlined text-[22px] text-on-surface-variant">menu</span>
            </button>
            <div className="hidden sm:flex items-center gap-2 text-on-surface-variant text-sm truncate">
              <span>VeriSure AI</span>
              <span>/</span>
              <span className="text-on-surface truncate">Regulatory Compliance Platform</span>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <NavLink
              to="/notifications"
              title="Notifications"
              className="relative p-1.5 hover:bg-surface-container rounded"
            >
              <span className="material-symbols-outlined text-[20px] text-on-surface-variant">notifications</span>
            </NavLink>
            <NavLink
              to="/profile"
              className="flex items-center gap-2 px-2 py-1 hover:bg-surface-container rounded"
            >
              <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-on-primary text-xs font-semibold shrink-0">
                {initials}
              </div>
              <span className="text-sm text-on-surface hidden sm:inline max-w-[140px] truncate">
                {user?.full_name || user?.email || 'User'}
              </span>
            </NavLink>
          </div>
        </header>
        <main className="p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
