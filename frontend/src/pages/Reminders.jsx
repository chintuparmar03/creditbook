import { useState, useEffect } from 'react'
import API from '../api/axios'
import { Bell, Send, CheckCircle, XCircle, Clock, MessageSquare, Smartphone } from 'lucide-react'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default function Reminders() {
  const [config, setConfig] = useState(null)
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState(null)

  const fetchData = async () => {
    try {
      const [configRes, logsRes] = await Promise.all([
        API.get('reminders/config/'),
        API.get('reminders/logs/'),
      ])
      setConfig(configRes.data)
      setLogs(logsRes.data)
    } catch (err) {
      console.error('Failed to load reminder data', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)
    try {
      const res = await API.put('reminders/config/', config)
      setConfig(res.data)
      setMessage({ type: 'success', text: 'Settings saved successfully!' })
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to save settings' })
    } finally {
      setSaving(false)
    }
  }

  const handleSendNow = async () => {
    if (!confirm('Send reminders to all customers with outstanding balance now?')) return
    setSending(true)
    setMessage(null)
    try {
      const res = await API.post('reminders/trigger/')
      const { sent, failed, skipped } = res.data
      setMessage({
        type: 'success',
        text: `Reminders sent! ✅ ${sent} sent, ❌ ${failed} failed, ⏭️ ${skipped} skipped`,
      })
      fetchData()
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to send reminders' })
    } finally {
      setSending(false)
    }
  }

  if (loading) return <div className="spinner" />
  if (!config) return <div className="glass-card">Failed to load reminder settings</div>

  return (
    <>
      <div className="page-header">
        <h2>Weekly Reminders</h2>
        <p>Configure automated SMS or WhatsApp reminders for customers with outstanding balances</p>
      </div>

      {message && (
        <div className={`glass-card ${message.type === 'success' ? 'stat-card' : ''}`}
          style={{
            padding: '12px 16px',
            marginBottom: '16px',
            border: message.type === 'success' ? '1px solid rgba(52, 211, 153, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
            background: message.type === 'success' ? 'rgba(52, 211, 153, 0.08)' : 'rgba(239, 68, 68, 0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            borderRadius: '10px',
          }}
        >
          {message.type === 'success' ? <CheckCircle size={18} color="#34d399" /> : <XCircle size={18} color="#ef4444" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Config Section */}
      <div className="glass-card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
          <Bell size={22} />
          <h3 style={{ margin: 0 }}>Reminder Settings</h3>
        </div>

        {/* Enable Toggle */}
        <div className="form-group" style={{ marginBottom: '20px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
            <div
              role="switch"
              id="reminder-toggle"
              onClick={() => setConfig({ ...config, enabled: !config.enabled })}
              style={{
                width: '48px',
                height: '26px',
                borderRadius: '13px',
                background: config.enabled
                  ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                  : 'rgba(255, 255, 255, 0.1)',
                position: 'relative',
                cursor: 'pointer',
                transition: 'background 0.3s',
                border: config.enabled ? 'none' : '1px solid rgba(255,255,255,0.2)',
              }}
            >
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: 'white',
                  position: 'absolute',
                  top: '3px',
                  left: config.enabled ? '25px' : '3px',
                  transition: 'left 0.3s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                }}
              />
            </div>
            <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>
              {config.enabled ? 'Reminders Enabled' : 'Reminders Disabled'}
            </span>
          </label>
        </div>

        <div className="form-row">
          {/* Channel */}
          <div className="form-group">
            <label>
              {config.channel === 'whatsapp' ? <MessageSquare size={14} style={{ marginRight: '6px' }} /> : <Smartphone size={14} style={{ marginRight: '6px' }} />}
              Channel
            </label>
            <select
              id="reminder-channel"
              className="form-control"
              value={config.channel}
              onChange={(e) => setConfig({ ...config, channel: e.target.value })}
            >
              <option value="whatsapp">WhatsApp</option>
              <option value="sms">SMS</option>
            </select>
          </div>

          {/* Day of Week */}
          <div className="form-group">
            <label>
              <Clock size={14} style={{ marginRight: '6px' }} />
              Send on
            </label>
            <select
              id="reminder-day"
              className="form-control"
              value={config.day_of_week}
              onChange={(e) => setConfig({ ...config, day_of_week: parseInt(e.target.value) })}
            >
              {DAYS.map((day, i) => (
                <option key={i} value={i}>{day}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Message Template */}
        <div className="form-group" style={{ marginTop: '8px' }}>
          <label>Message Template</label>
          <textarea
            id="reminder-template"
            className="form-control"
            rows={4}
            value={config.message_template}
            onChange={(e) => setConfig({ ...config, message_template: e.target.value })}
            style={{ resize: 'vertical', fontFamily: 'inherit' }}
          />
          <small style={{ color: '#94a3b8', marginTop: '6px', display: 'block' }}>
            Available variables: {'{customer_name}'}, {'{shop_name}'}, {'{balance}'}, {'{total_credit}'}, {'{total_payment}'}
          </small>
        </div>

        {config.last_sent_at && (
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '12px' }}>
            Last sent: {new Date(config.last_sent_at).toLocaleString('en-IN')}
          </p>
        )}

        <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
          <button
            id="save-reminder-settings"
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
          <button
            id="send-reminders-now"
            className="btn btn-primary"
            onClick={handleSendNow}
            disabled={sending}
            style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
          >
            <Send size={16} />
            {sending ? 'Sending...' : 'Send Now'}
          </button>
        </div>
      </div>

      {/* Reminder Logs */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <h3 style={{ margin: 0 }}>Reminder History</h3>
        </div>
        {logs.length === 0 ? (
          <div className="empty-state" style={{ padding: '40px 20px' }}>
            <Bell size={48} />
            <h3>No reminders sent yet</h3>
            <p>Sent reminders will appear here</p>
          </div>
        ) : (
          <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Channel</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Sent At</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td style={{ fontWeight: 600 }}>{log.customer_name}</td>
                  <td>
                    <span className={`risk-badge ${log.channel === 'whatsapp' ? 'low' : 'medium'}`}>
                      {log.channel === 'whatsapp' ? '💬 WhatsApp' : '📱 SMS'}
                    </span>
                  </td>
                  <td style={{ color: '#94a3b8' }}>{log.phone}</td>
                  <td>
                    {log.status === 'sent' ? (
                      <span className="risk-badge low">✅ Sent</span>
                    ) : (
                      <span className="risk-badge high" title={log.error_message}>❌ Failed</span>
                    )}
                  </td>
                  <td style={{ color: '#94a3b8' }}>
                    {new Date(log.sent_at).toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </>
  )
}
