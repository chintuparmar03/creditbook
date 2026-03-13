import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../App'
import API from '../api/axios'

export default function Register() {
  const [form, setForm] = useState({
    shop_name: '',
    owner_name: '',
    phone: '',
    username: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await API.post('register/', form)
      login(res.data.user, res.data.tokens)
      navigate('/')
    } catch (err) {
      const data = err.response?.data
      if (data) {
        const msg = typeof data === 'string' ? data : Object.values(data).flat().join(' ')
        setError(msg)
      } else {
        setError('Registration failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <h1>CreditBook Pro</h1>
          <p>Register your shop and go digital</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Shop Name</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Sharma General Store"
              value={form.shop_name}
              onChange={update('shop_name')}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Owner Name</label>
              <input
                type="text"
                className="form-control"
                placeholder="Your full name"
                value={form.owner_name}
                onChange={update('owner_name')}
                required
              />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input
                type="tel"
                className="form-control"
                placeholder="10-digit number"
                value={form.phone}
                onChange={update('phone')}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                className="form-control"
                placeholder="Choose a username"
                value={form.username}
                onChange={update('username')}
                required
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                className="form-control"
                placeholder="Min 6 characters"
                value={form.password}
                onChange={update('password')}
                required
                minLength={6}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Creating shop...' : 'Register Shop'}
          </button>
        </form>

        <div className="auth-footer">
          Already registered? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  )
}
