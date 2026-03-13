import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../App'
import { LayoutDashboard, Users, UserCog, LogOut } from 'lucide-react'

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

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
  }

  return (
    <aside className="sidebar">
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
  )
}
