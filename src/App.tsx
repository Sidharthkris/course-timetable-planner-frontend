import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { Layout } from './components/Layout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { LoginPage } from './pages/LoginPage'
import { SchedulePage } from './pages/SchedulePage'
import { DepartmentsPage } from './pages/DepartmentsPage'
import { InstructorsPage } from './pages/InstructorsPage'
import { RoomsPage } from './pages/RoomsPage'
import { CoursesPage } from './pages/CoursesPage'

export function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<Navigate to="/schedule" replace />} />
            <Route path="/schedule" element={<SchedulePage />} />
            <Route path="/departments" element={<DepartmentsPage />} />
            <Route path="/instructors" element={<InstructorsPage />} />
            <Route path="/rooms" element={<RoomsPage />} />
            <Route path="/courses" element={<CoursesPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/schedule" replace />} />
      </Routes>
    </AuthProvider>
  )
}
