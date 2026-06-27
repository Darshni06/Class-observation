import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { logoutUser } from '../firebase/services'
import { initials } from '../utils/helpers'

const ADMIN_NAV_GROUPS = [
  {
    label: 'Admin Portal',
    items: [
      { to: '/admin',            icon: 'layout-dashboard', label: 'Dashboard',        end: true },
      { to: '/admin/new',        icon: 'clipboard-plus',   label: 'New Observation' },
      { to: '/admin/observations', icon: 'list-details',  label: 'All Observations' },
      { to: '/admin/reports',    icon: 'sparkles',         label: 'Generate Report' },
      { to: '/admin/export',     icon: 'file-export',      label: 'Export' },
      { to: '/admin/teacher-observations', icon: 'users-group', label: 'Teacher Observations' },
      { to: '/admin/teachers',   icon: 'users',            label: 'Teachers' },
      { to: '/admin/classes',    icon: 'school',           label: 'Classes' },
    ],
  },
]

const TEACHER_NAV_GROUPS = [
  {
    label: 'Record & Report',
    items: [
      { to: '/teacher/new',            icon: 'clipboard-plus', label: 'New Observation' },
      { to: '/teacher/observations',   icon: 'list-details',   label: 'All Observations' },
      { to: '/teacher/generate-report', icon: 'sparkles',      label: 'Generate Report' },
      { to: '/teacher/export',         icon: 'file-export',    label: 'Export' },
    ],
  },
  {
    label: 'My Overview',
    items: [
      { to: '/teacher',          icon: 'message-2', label: 'My Feedback', end: true },
      { to: '/teacher/progress', icon: 'chart-bar',  label: 'My Progress' },
      { to: '/teacher/reports',  icon: 'file-text',  label: 'My Reports' },
    ],
  },
]

export default function Layout({ role }) {
  const { profile } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const navGroups = role === 'admin' ? ADMIN_NAV_GROUPS : TEACHER_NAV_GROUPS

  const handleLogout = async () => {
    try {
      await logoutUser()
      toast.success('Signed out successfully')
      navigate('/login')
    } catch (e) {
      toast.error('Could not sign out: ' + e.message)
    }
  }

  return (
    <div className="app-shell">
      <div className="topnav">
        <button className="btn-icon hamburger" onClick={() => setSidebarOpen(v => !v)}>
          <i className="ti ti-menu-2" />
        </button>
        <a className="nav-brand" href="#" onClick={(e) => e.preventDefault()}>
          <span className="nav-brand-icon"><img src="/assets/logo/logo.png" alt="Kamala Niketan logo" /></span>
          <span>Kamala Niketan</span>
        </a>
        <span className={`nav-role-badge ${role === 'admin' ? 'badge-admin' : 'badge-teacher'}`}>
          <i className={`ti ti-${role === 'admin' ? 'shield-check' : 'user-check'}`} />
          {role === 'admin' ? 'Admin' : 'Teacher'}
        </span>
        <div className="nav-spacer" />
        <div className="nav-user">
          <span className="nav-avatar">{initials(profile?.name)}</span>
          <span>{profile?.name}</span>
        </div>
        <button className="btn-logout" title="Sign out" onClick={handleLogout}>
          <i className="ti ti-logout-2" />
          <span>Sign out</span>
        </button>
      </div>

      <div className="app-body">
        <div className={`mobile-overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} />
        <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
          {navGroups.map(group => (
            <div className="sidebar-section" key={group.label}>
              <div className="sidebar-section-label">{group.label}</div>
              {group.items.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <i className={`ti ti-${item.icon}`} />
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </div>

        <div className="content">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
