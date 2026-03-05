import { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

function TimeChart({ data }) {
  const chartData = useMemo(() => {
    const countsByDate = {}

    data.forEach(row => {
      if (row.openDate) {
        const dateKey = row.openDate.toISOString().split('T')[0]
        countsByDate[dateKey] = (countsByDate[dateKey] || 0) + 1
      }
    })

    return Object.entries(countsByDate)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }, [data])

  return (
    <div className="chart-card">
      <h3>Requests Over Time</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10 }}
            tickFormatter={(d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip
            labelFormatter={(d) => new Date(d).toLocaleDateString()}
          />
          <Line
            type="monotone"
            dataKey="count"
            stroke="#1a365d"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default TimeChart
