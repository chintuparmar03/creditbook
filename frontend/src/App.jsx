import { useState, useEffect, createContext, useContext } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import API from './api/axios'
import Sidebar from './components/Sidebar'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Customers from './pages/Customers'
import CustomerLedger from './pages/CustomerLedger'
import Staff from './pages/Staff'
import './App.css'

const AuthContext = createContext(null)

export function useAuth() {
  return useContext(AuthContext)
}

function ProtectedRoute({ children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">{children}</main>
    </div>
  )
}

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    const storedUser = localStorage.getItem('user')
    if (token && storedUser) {
      setUser(JSON.parse(storedUser))
    }
    setLoading(false)
  }, [])

  const login = (userData, tokens) => {
    localStorage.setItem('access_token', tokens.access)
    localStorage.setItem('refresh_token', tokens.refresh)
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
    setUser(null)
  }

  if (loading) return <div className="spinner" style={{ height: '100vh' }} />

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
          <Route path="/register" element={user ? <Navigate to="/" replace /> : <Register />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/customers" element={<ProtectedRoute><Customers /></ProtectedRoute>} />
          <Route path="/customers/:id/ledger" element={<ProtectedRoute><CustomerLedger /></ProtectedRoute>} />
          <Route path="/staff" element={<ProtectedRoute><Staff /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
  )
}

export default App
