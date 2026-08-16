import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabaseAdmin as supabase } from '../lib/supabaseAdminClient.js'
import { formatPrice } from '../wizard/config/catalog.js'

const STATUS_TONE = { paid: 'success', confirmed: 'success', pending_payment: 'warning' }

function StatusBadge({ status }) {
  const tone = STATUS_TONE[status] || 'neutral'
  return <span className={`admin-badge admin-badge--${tone}`}>{status}</span>
}

export default function AdminOrdersList() {
  const [orders, setOrders] = useState(null)
  const [contentByOrder, setContentByOrder] = useState({})
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    async function load() {
      const { data: orderRows } = await supabase.from('orders').select('*').order('created_at', { ascending: false })
      const { data: contentRows } = await supabase.from('order_content').select('order_id, submitted')
      setOrders(orderRows || [])
      const map = {}
      ;(contentRows || []).forEach((c) => {
        map[c.order_id] = c.submitted
      })
      setContentByOrder(map)
    }
    load()
  }, [])

  if (!orders) return <p className="admin-loading">Loading…</p>

  const filtered = statusFilter === 'all' ? orders : orders.filter((o) => o.status === statusFilter)

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <h1>Orders</h1>
        <select className="text-input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ width: 'auto' }}>
          <option value="all">All statuses</option>
          <option value="pending_payment">Pending payment</option>
          <option value="paid">Paid</option>
          <option value="confirmed">Confirmed</option>
        </select>
      </div>

      <table className="admin-table admin-table--rows">
        <thead>
          <tr>
            <th>Date</th>
            <th>Site type</th>
            <th>Tier</th>
            <th>Payment</th>
            <th>Total</th>
            <th>Contact</th>
            <th>Content</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((o) => (
            <tr key={o.id}>
              <td>
                <Link to={`/admin/orders/${o.id}`} className="admin-table__row-link">
                  {new Date(o.created_at).toLocaleDateString()}
                </Link>
              </td>
              <td>{o.site_type}</td>
              <td>{o.template?.tier}</td>
              <td>
                <StatusBadge status={o.status} />
              </td>
              <td>{formatPrice(o.total_amount || 0, o.currency)}</td>
              <td>{o.contact?.email}</td>
              <td>
                {contentByOrder[o.id] ? (
                  <span className="admin-badge admin-badge--success">Submitted</span>
                ) : (
                  <span className="admin-badge admin-badge--neutral">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
