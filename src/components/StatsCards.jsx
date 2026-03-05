function StatsCards({ data }) {
  const total = data.length
  const open = data.filter(d => d.status === 'Open').length
  const closed = data.filter(d => d.status === 'Closed').length
  const onTime = data.filter(d => d.onTime === 'ONTIME').length
  const overdue = data.filter(d => d.onTime === 'OVERDUE').length

  const onTimeRate = onTime + overdue > 0
    ? Math.round((onTime / (onTime + overdue)) * 100)
    : 0

  // Calculate average response time for closed cases
  const closedWithDates = data.filter(d => d.closedDate && d.openDate)
  const avgResponseMs = closedWithDates.length > 0
    ? closedWithDates.reduce((sum, d) => sum + (d.closedDate - d.openDate), 0) / closedWithDates.length
    : 0
  const avgResponseHours = Math.round(avgResponseMs / (1000 * 60 * 60))

  return (
    <div className="stats-cards">
      <div className="stat-card">
        <div className="stat-value">{total.toLocaleString()}</div>
        <div className="stat-label">Total Requests</div>
      </div>
      <div className="stat-card">
        <div className="stat-value">{open.toLocaleString()}</div>
        <div className="stat-label">Open</div>
      </div>
      <div className="stat-card">
        <div className="stat-value">{closed.toLocaleString()}</div>
        <div className="stat-label">Closed</div>
      </div>
      <div className="stat-card">
        <div className="stat-value">{onTimeRate}%</div>
        <div className="stat-label">On-Time Rate</div>
      </div>
      <div className="stat-card">
        <div className="stat-value">{avgResponseHours}h</div>
        <div className="stat-label">Avg Response</div>
      </div>
    </div>
  )
}

export default StatsCards
