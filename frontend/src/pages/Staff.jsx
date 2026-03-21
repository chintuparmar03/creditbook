import { useState, useEffect } from 'react'
import API from '../api/axios'
import { Plus, Trash2, X, UserCog } from 'lucide-react'

export default function Staff() {
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ username: '', first_name: '', last_name: '', phone: '', role: 'staff', password: '' })
  const [saving, setSaving] = useState(false)

  const fetchStaff = () => {
    API.get('staff/')
      .then((res) => setStaff(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchStaff() }, [])

  const handleAdd = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await API.post('staff/', form)
      setForm({ username: '', first_name: '', last_name: '', phone: '', role: 'staff', password: '' })
      setShowModal(false)
      fetchStaff()
    } catch (err) {
      alert('Failed to add staff member')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id, name) => {
    if (!confirm(`Remove staff member "${name}"?`)) return
    try {
      await API.delete(`staff/${id}/`)
      fetchStaff()
    } catch (err) {
      alert('Failed to remove staff member')
    }
  }

  if (loading) return <div className="spinner" />

  return (
    <>
      <div className="page-header">
        <h2>Staff Management</h2>
        <p>Manage your shop team members and their access</p>
      </div>

      <div className="toolbar">
        <div />
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Add Staff
        </button>
      </div>

      {staff.length === 0 ? (
        <div className="glass-card empty-state">
          <UserCog size={48} />
          <h3>No staff members</h3>
          <p>Add staff to help manage your shop</p>
        </div>
      ) : (
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Username</th>
                <th>Phone</th>
                <th>Role</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {staff.map((s) => (
                <tr key={s.id}>
                  <td style={{ fontWeight: 600 }}>{s.first_name} {s.last_name}</td>
                  <td style={{ color: '#94a3b8' }}>{s.username}</td>
                  <td style={{ color: '#94a3b8' }}>{s.phone || '—'}</td>
                  <td>
                    <span className={`risk-badge ${s.role === 'cashier' ? 'medium' : 'low'}`}>
                      {s.role}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(s.id, s.username)}>
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* Add Staff Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Staff Member</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleAdd}>
              <div className="form-row">
                <div className="form-group">
                  <label>First Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="First name"
                    value={form.first_name}
                    onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                    required
                    autoFocus
                  />
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Last name"
                    value={form.last_name}
                    onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Username *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Login username"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Password *</label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Min 6 characters"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                    minLength={6}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    className="form-control"
                    placeholder="Phone number"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Role</label>
                  <select
                    className="form-control"
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                  >
                    <option value="staff">Staff</option>
                    <option value="cashier">Cashier</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={saving}>
                {saving ? 'Adding...' : 'Add Staff Member'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
