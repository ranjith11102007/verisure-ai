import { Outlet, NavLink } from 'react-router-dom'
import { useState } from 'react'

const navItems = [
  { path: '/dashboard', icon: 'dashboard', label: 'Executive Dashboard' },
  { path: '/applications', icon: 'folder_open', label: 'Application Registry' },
  { path: '/upload', icon: 'upload_file', label: 'Document Upload' },
  { path: '/document-intelligence', icon: 'document_scanner', label: 'Document Intelligence' },
  { path: '/document-auth', icon: 'verified_user', label: 'Document Authentication' },
  { path: '/compliance', icon: 'fact_check', label: 'Compliance Findings' },
  { path: '/rules', icon: 'rule', label: 'Rules Engine' },
  { path: '/evidence', icon: 'mark_email_unread', label: 'Evidence Requests' },
  { path: '/audit', icon: 'history_toggle_off', label: 'Audit History' },
  { path: '/reports', icon: 'analytics', label: 'Reports & Analytics' },
  { path: '/profile', icon: 'person', label: 'Profile' },
  { path: '/settings', icon: 'settings', label: 'Settings' },
]

export function AppShell() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="min-h-screen bg-surface">
      <aside className={`${collapsed ? 'w-16' : 'w-60'} fixed left-0 top-0 h-full bg-[#0F172A] text-white flex flex-col transition-all duration-200 z-50`}>
        <div className="h-14 flex items-center px-3 border-b border-[#334155]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">shield</span>
            </div>
            {!collapsed && <span className="font-headline text-sm font-semibold tracking-tight">VeriSure AI</span>}
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto py-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 mx-2 rounded transition-colors ${
                  isActive ? 'bg-[#2563EB] text-white' : 'text-[#CBD5E1] hover:bg-[#1E293B] hover:text-white'
                }`
              }
            >
              <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
              {!collapsed && <span className="text-[13px]">{item.label}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-[#334155] p-2">
          <button onClick={() => setCollapsed(!collapsed)} className="w-full flex items-center justify-center py-1.5 text-[#CBD5E1] hover:text-white hover:bg-[#1E293B] rounded">
            <span className="material-symbols-outlined text-[18px]">{collapsed ? 'chevron_right' : 'chevron_left'}</span>
          </button>
        </div>
      </aside>
      <div className={`${collapsed ? 'ml-16' : 'ml-60'} transition-all duration-200`}>
        <header className="h-14 bg-surface-container-lowest border-b border-outline-variant/30 flex items-center justify-between px-6">
          <div className="flex items-center gap-2 text-on-surface-variant text-sm">
            <span>VeriSure AI</span>
            <span>/</span>
            <span className="text-on-surface">Regulatory Compliance Platform</span>
          </div>
          <div className="flex items-center gap-3">
            <NavLink to="/notifications" className="relative p-1.5 hover:bg-surface-container rounded">
              <span className="material-symbols-outlined text-[20px] text-on-surface-variant">notifications</span>
            </NavLink>
            <NavLink to="/profile" className="flex items-center gap-2 px-2 py-1 hover:bg-surface-container rounded">
              <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-on-primary text-xs font-semibold">U</div>
              <span className="text-sm text-on-surface">User</span>
            </NavLink>
          </div>
        </header>
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
