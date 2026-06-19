import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { logoutUser } from '../firebase/services'
import { initials } from '../utils/helpers'

const ADMIN_NAV = [
  { to: '/admin',            icon: 'layout-dashboard', label: 'Dashboard',        end: true },
  { to: '/admin/new',        icon: 'clipboard-plus',   label: 'New Observation' },
  { to: '/admin/observations', icon: 'list-details',  label: 'All Observations' },
  { to: '/admin/reports',    icon: 'sparkles',         label: 'Generate Report' },
  { to: '/admin/export',     icon: 'file-export',      label: 'Export' },
  { to: '/admin/teachers',   icon: 'users',            label: 'Teachers' },
  { to: '/admin/classes',    icon: 'school',           label: 'Classes' },
]

const TEACHER_NAV = [
  { to: '/teacher',          icon: 'message-2',        label: 'My Feedback', end: true },
  { to: '/teacher/progress', icon: 'chart-bar',        label: 'My Progress' },
  { to: '/teacher/reports',  icon: 'file-text',        label: 'My Reports' },
]

export default function Layout({ role }) {
  const { profile } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const navItems = role === 'admin' ? ADMIN_NAV : TEACHER_NAV

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
          <div className="sidebar-section">
            <div className="sidebar-section-label">{role === 'admin' ? 'Admin Portal' : 'Teacher Portal'}</div>
            {navItems.map(item => (
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
        </div>

        <div className="content">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
