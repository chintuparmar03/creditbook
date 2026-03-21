import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import API from '../api/axios'
import { Plus, Search, Users, Trash2, X } from 'lucide-react'

export default function Customers() {
  const [customers, setCustomers] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '' })
  const [saving, setSaving] = useState(false)
  const navigate = useNavigate()

  const fetchCustomers = () => {
    API.get('customers/')
      .then((res) => setCustomers(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchCustomers() }, [])

  const handleAdd = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await API.post('customers/', form)
      setForm({ name: '', phone: '', email: '', address: '' })
      setShowModal(false)
      fetchCustomers()
    } catch (err) {
      alert('Failed to add customer')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete customer "${name}"? This will also remove all their transactions.`)) return
    try {
      await API.delete(`customers/${id}/`)
      fetchCustomers()
    } catch (err) {
      alert('Failed to delete customer')
    }
  }

  const filtered = customers.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  )

  if (loading) return <div className="spinner" />

  return (
    <>
      <div className="page-header">
        <h2>Customers</h2>
        <p>Manage your customer credit accounts</p>
      </div>

      <div className="toolbar">
        <div className="search-input" style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
          <input
            type="text"
            className="form-control"
            style={{ paddingLeft: 40 }}
            placeholder="Search customers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Add Customer
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="glass-card empty-state">
          <Users size={48} />
          <h3>No customers yet</h3>
          <p>Add your first customer to start tracking credit</p>
        </div>
      ) : (
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th style={{ textAlign: 'right' }}>Credit</th>
                <th style={{ textAlign: 'right' }}>Paid</th>
                <th style={{ textAlign: 'right' }}>Balance</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="customer-row" onClick={() => navigate(`/customers/${c.id}/ledger`)}>
                  <td style={{ fontWeight: 600 }}>{c.name}</td>
                  <td style={{ color: '#94a3b8' }}>{c.phone || '—'}</td>
                  <td style={{ textAlign: 'right', color: '#ef4444' }}>₹{Number(c.total_credit).toLocaleString('en-IN')}</td>
                  <td style={{ textAlign: 'right', color: '#10b981' }}>₹{Number(c.total_payment).toLocaleString('en-IN')}</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: Number(c.balance) > 0 ? '#ef4444' : '#10b981' }}>
                    ₹{Number(c.balance).toLocaleString('en-IN')}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={(e) => { e.stopPropagation(); handleDelete(c.id, c.name) }}
                    >
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

      {/* Add Customer Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Customer</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleAdd}>
              <div className="form-group">
                <label>Customer Name *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Full name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  autoFocus
                />
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
                  <label>Email</label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="Email address"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Address</label>
                <textarea
                  className="form-control"
                  placeholder="Customer address"
                  rows={2}
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={saving}>
                {saving ? 'Adding...' : 'Add Customer'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
