import { useState, useEffect } from 'react'
import API from '../api/axios'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { TrendingUp, TrendingDown, AlertTriangle, Users, UserCog } from 'lucide-react'

const PIE_COLORS = ['#10b981', '#f59e0b', '#ef4444']

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    API.get('dashboard/')
      .then((res) => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="spinner" />
  if (!data) return <div className="empty-state"><h3>Could not load dashboard</h3></div>

  const riskData = [
    { name: 'Low', value: data.risk_distribution.low },
    { name: 'Medium', value: data.risk_distribution.medium },
    { name: 'High', value: data.risk_distribution.high },
  ].filter((d) => d.value > 0)

  return (
    <>
      <div className="page-header">
        <h2>Dashboard</h2>
        <p>Overview of your business performance</p>
      </div>

      {/* Stat Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-icon credit"><TrendingUp size={22} /></div>
          <div className="stat-card-value">₹{Number(data.total_credit).toLocaleString('en-IN')}</div>
          <div className="stat-card-label">Total Credit Given</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon payment"><TrendingDown size={22} /></div>
          <div className="stat-card-value">₹{Number(data.total_payment).toLocaleString('en-IN')}</div>
          <div className="stat-card-label">Payments Received</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon outstanding"><AlertTriangle size={22} /></div>
          <div className="stat-card-value">₹{Number(data.outstanding).toLocaleString('en-IN')}</div>
          <div className="stat-card-label">Outstanding Balance</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon customers"><Users size={22} /></div>
          <div className="stat-card-value">{data.total_customers}</div>
          <div className="stat-card-label">Customers</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon staff"><UserCog size={22} /></div>
          <div className="stat-card-value">{data.total_staff}</div>
          <div className="stat-card-label">Staff Members</div>
        </div>
      </div>

      {/* Charts */}
      <div className="charts-grid">
        <div className="chart-card">
          <h3>Monthly Credit vs Payment Trend</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.monthly_trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#f1f5f9' }}
              />
              <Bar dataKey="credit" fill="#ef4444" radius={[6, 6, 0, 0]} name="Credit" />
              <Bar dataKey="payment" fill="#10b981" radius={[6, 6, 0, 0]} name="Payment" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Customer Risk Distribution</h3>
          {riskData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={riskData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {riskData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i]} />
                  ))}
                </Pie>
                <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#f1f5f9' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state"><p>No customers to show risk data</p></div>
          )}
        </div>
      </div>

      {/* Top Debtors & Recent Activity */}
      <div className="charts-grid">
        <div className="chart-card">
          <h3>Top Debtors</h3>
          {data.top_debtors.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr><th>Customer</th><th style={{ textAlign: 'right' }}>Balance</th></tr>
              </thead>
              <tbody>
                {data.top_debtors.map((d) => (
                  <tr key={d.id}>
                    <td>{d.name}</td>
                    <td style={{ textAlign: 'right', color: '#ef4444', fontWeight: 600 }}>
                      ₹{Number(d.balance).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state"><p>No outstanding debts</p></div>
          )}
        </div>

        <div className="chart-card">
          <h3>Recent Activity</h3>
          {data.recent_activity.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {data.recent_activity.map((a, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ fontSize: '0.85rem' }}>{a.action}</span>
                  <span style={{ fontSize: '0.7rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                    {new Date(a.timestamp).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state"><p>No recent activity</p></div>
          )}
        </div>
      </div>
    </>
  )
}
