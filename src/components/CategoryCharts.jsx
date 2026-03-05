import { useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'

const COLORS = ['#1a365d', '#2c5282', '#3182ce', '#4299e1', '#63b3ed']

function CategoryCharts({ data }) {
  const { typeData, neighborhoodData, sourceData } = useMemo(() => {
    const typeCounts = {}
    const neighborhoodCounts = {}
    const sourceCounts = {}

    data.forEach(row => {
      if (row.type) {
        typeCounts[row.type] = (typeCounts[row.type] || 0) + 1
      }
      if (row.neighborhood) {
        neighborhoodCounts[row.neighborhood] = (neighborhoodCounts[row.neighborhood] || 0) + 1
      }
      if (row.source) {
        sourceCounts[row.source] = (sourceCounts[row.source] || 0) + 1
      }
    })

    const toSortedArray = (obj) =>
      Object.entries(obj)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)

    return {
      typeData: toSortedArray(typeCounts).slice(0, 10),
      neighborhoodData: toSortedArray(neighborhoodCounts).slice(0, 10),
      sourceData: toSortedArray(sourceCounts),
    }
  }, [data])

  return (
    <div className="category-charts">
      <div className="chart-card">
        <h3>Top Request Types</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={typeData} layout="vertical" margin={{ left: 120 }}>
            <XAxis type="number" tick={{ fontSize: 10 }} />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 10 }}
              width={120}
            />
            <Tooltip />
            <Bar dataKey="value" fill="#1a365d" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-card">
        <h3>Top Neighborhoods</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={neighborhoodData} layout="vertical" margin={{ left: 120 }}>
            <XAxis type="number" tick={{ fontSize: 10 }} />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 10 }}
              width={120}
            />
            <Tooltip />
            <Bar dataKey="value" fill="#2c5282" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-card">
        <h3>By Source</h3>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={sourceData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
              labelLine={false}
            >
              {sourceData.map((_, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default CategoryCharts
