import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export function Layout() {
  const { username, roles, logout } = useAuth()

  return (
    <div className="app-shell">
      <nav className="navbar">
        <div className="nav-brand">
          <span className="brand-mark" aria-hidden="true">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="4" width="18" height="17" rx="3" stroke="currentColor" strokeWidth="2" />
              <path d="M3 9H21" stroke="currentColor" strokeWidth="2" />
              <path d="M8 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M16 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <rect x="6.5" y="12" width="4" height="3.5" rx="0.75" fill="currentColor" />
            </svg>
          </span>
          Course Timetable Planner
        </div>
        <div className="nav-links">
          <NavLink to="/schedule">Schedule</NavLink>
          <NavLink to="/departments">Departments</NavLink>
          <NavLink to="/instructors">Instructors</NavLink>
          <NavLink to="/rooms">Rooms</NavLink>
          <NavLink to="/courses">Courses</NavLink>
        </div>
        <div className="nav-user">
          <span>
            {username} ({roles.map((r) => r.replace('ROLE_', '')).join(', ')})
          </span>
          <button type="button" className="link-button" onClick={logout}>
            Logout
          </button>
        </div>
      </nav>
      <main className="container">
        <Outlet />
      </main>
    </div>
  )
}
