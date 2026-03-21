import { useState, useEffect } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../App'
import { LayoutDashboard, Users, UserCog, LogOut, Bell, Menu, X } from 'lucide-react'

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  // Close sidebar on window resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) setOpen(false)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const links = [
    { to: '/', icon: <LayoutDashboard />, label: 'Dashboard' },
    { to: '/customers', icon: <Users />, label: 'Customers' },
  ]

  if (user?.role === 'owner') {
    links.push({ to: '/staff', icon: <UserCog />, label: 'Staff' })
    links.push({ to: '/reminders', icon: <Bell />, label: 'Reminders' })
  }

  return (
    <>
      {/* Mobile hamburger button */}
      <button className="mobile-menu-toggle" onClick={() => setOpen(!open)} aria-label="Toggle menu">
        {open ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* Overlay for mobile */}
      <div className={`sidebar-overlay ${open ? 'open' : ''}`} onClick={() => setOpen(false)} />

      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <h1>CreditBook Pro</h1>
          <span>Digital Udhaar Manager</span>
        </div>

        <nav className="sidebar-nav">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              {link.icon}
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">
              {user?.first_name?.[0] || user?.username?.[0] || 'U'}
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user?.first_name || user?.username}</div>
              <div className="sidebar-user-role">{user?.role}</div>
            </div>
            <button className="btn-logout" onClick={handleLogout} title="Logout">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
