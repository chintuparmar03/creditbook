import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import API from '../api/axios'
import { ArrowLeft, Plus, Camera, X, ShieldAlert } from 'lucide-react'

export default function CustomerLedger() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [customer, setCustomer] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [risk, setRisk] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ amount: '', type: 'credit', description: '' })
  const [image, setImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef()
  const chatEndRef = useRef()

  const fetchData = async () => {
    try {
      const [custRes, ledgerRes, riskRes] = await Promise.all([
        API.get(`customers/${id}/`),
        API.get(`customers/${id}/ledger/`),
        API.get(`customer-risk/${id}/`),
      ])
      setCustomer(custRes.data)
      setTransactions(ledgerRes.data)
      setRisk(riskRes.data.risk)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [id])
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [transactions])

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImage(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('customer', id)
      fd.append('amount', form.amount)
      fd.append('type', form.type)
      fd.append('description', form.description)
      if (image) fd.append('image', image)

      await API.post('transactions/', fd)
      setForm({ amount: '', type: 'credit', description: '' })
      setImage(null)
      setImagePreview(null)
      setShowForm(false)
      fetchData()
    } catch (err) {
      alert('Failed to add transaction')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="spinner" />
  if (!customer) return <div className="empty-state"><h3>Customer not found</h3></div>

  return (
    <>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/customers')}>
          <ArrowLeft size={16} /> Back
        </button>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{customer.name}</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{customer.phone || 'No phone'}</p>
        </div>
        {risk && (
          <div className={`risk-badge ${risk.level}`}>
            <ShieldAlert size={14} />
            {risk.level} risk
          </div>
        )}
      </div>

      {/* Balance Bar */}
      <div className="balance-bar">
        <div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
            Outstanding Balance
          </div>
          <div className={`balance-amount ${Number(customer.balance) > 0 ? 'positive' : 'zero'}`}>
            ₹{Number(customer.balance).toLocaleString('en-IN')}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 24 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ef4444' }}>₹{Number(customer.total_credit).toLocaleString('en-IN')}</div>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>CREDIT</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#10b981' }}>₹{Number(customer.total_payment).toLocaleString('en-IN')}</div>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>PAID</div>
          </div>
        </div>
      </div>

      {/* Add Transaction Button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          <Plus size={16} /> Add Transaction
        </button>
      </div>

      {/* Chat Ledger */}
      <div className="glass-card">
        {transactions.length === 0 ? (
          <div className="empty-state">
            <h3>No transactions yet</h3>
            <p>Record credit or payment to see the ledger</p>
          </div>
        ) : (
          <div className="chat-ledger">
            {transactions.map((t) => (
              <div key={t.id} className={`chat-bubble ${t.type}`}>
                <div className="chat-bubble-amount">
                  {t.type === 'credit' ? '−' : '+'} ₹{Number(t.amount).toLocaleString('en-IN')}
                </div>
                {t.description && <div className="chat-bubble-desc">{t.description}</div>}
                {t.image_url && (
                  <img
                    src={t.image_url}
                    alt="Transaction proof"
                    className="chat-bubble-image"
                    onClick={() => window.open(t.image_url, '_blank')}
                  />
                )}
                <div className="chat-bubble-meta">
                  <span>{t.type === 'credit' ? '🔴 Credit Given' : '🟢 Payment Received'}</span>
                  <span>•</span>
                  <span>{t.created_by_name}</span>
                  <span>•</span>
                  <span>{new Date(t.date).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
        )}
      </div>

      {/* Add Transaction Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>New Transaction</h3>
              <button className="modal-close" onClick={() => setShowForm(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Transaction Type</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    type="button"
                    className={`btn ${form.type === 'credit' ? 'btn-danger' : 'btn-secondary'}`}
                    style={{ flex: 1, justifyContent: 'center' }}
                    onClick={() => setForm({ ...form, type: 'credit' })}
                  >
                    🔴 Credit (Gave)
                  </button>
                  <button
                    type="button"
                    className={`btn ${form.type === 'payment' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ flex: 1, justifyContent: 'center' }}
                    onClick={() => setForm({ ...form, type: 'payment' })}
                  >
                    🟢 Payment (Got)
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>Amount (₹) *</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="Enter amount"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  required
                  min="1"
                  step="0.01"
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  className="form-control"
                  placeholder="e.g. 2kg rice, 1L oil"
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Photo Proof</label>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  ref={fileRef}
                  style={{ display: 'none' }}
                  onChange={handleImageChange}
                />
                {imagePreview ? (
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <img src={imagePreview} alt="Preview" className="image-preview" />
                    <button
                      type="button"
                      className="modal-close"
                      style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.6)', borderRadius: '50%' }}
                      onClick={() => { setImage(null); setImagePreview(null) }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="image-upload-area" onClick={() => fileRef.current?.click()}>
                    <Camera size={36} />
                    <p>Click to capture or upload photo</p>
                  </div>
                )}
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={saving}>
                {saving ? 'Saving...' : `Record ${form.type === 'credit' ? 'Credit' : 'Payment'}`}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
