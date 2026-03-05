import { useState, useEffect, useMemo } from 'react'
import { loadData } from './utils/dataLoader'
import FilterBar from './components/FilterBar'
import StatsCards from './components/StatsCards'
import TimeChart from './components/TimeChart'
import MapView from './components/MapView'

function App() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    neighborhood: '',
    type: '',
    status: '',
  })

  useEffect(() => {
    loadData('/2026-311-data.csv')
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  const { neighborhoods, types, dateRange } = useMemo(() => {
    const neighborhoodSet = new Set()
    const typeSet = new Set()
    let minDate = null
    let maxDate = null

    data.forEach(row => {
      if (row.neighborhood) neighborhoodSet.add(row.neighborhood)
      if (row.type) typeSet.add(row.type)
      if (row.openDate) {
        if (!minDate || row.openDate < minDate) minDate = row.openDate
        if (!maxDate || row.openDate > maxDate) maxDate = row.openDate
      }
    })

    return {
      neighborhoods: [...neighborhoodSet].sort(),
      types: [...typeSet].sort(),
      dateRange: {
        min: minDate ? minDate.toISOString().split('T')[0] : '',
        max: maxDate ? maxDate.toISOString().split('T')[0] : '',
      },
    }
  }, [data])

  const filteredData = useMemo(() => {
    return data.filter(row => {
      if (filters.startDate && row.openDate) {
        if (row.openDate < new Date(filters.startDate)) return false
      }
      if (filters.endDate && row.openDate) {
        if (row.openDate > new Date(filters.endDate + 'T23:59:59')) return false
      }
      if (filters.neighborhood && row.neighborhood !== filters.neighborhood) return false
      if (filters.type && row.type !== filters.type) return false
      if (filters.status && row.status !== filters.status) return false
      return true
    })
  }, [data, filters])

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  if (loading) {
    return (
      <div className="app">
        <header className="header">
          <h1>Boston 311 Dashboard</h1>
        </header>
        <main className="main">
          <p>Loading data...</p>
        </main>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="header">
        <h1>Boston 311 Dashboard</h1>
      </header>
      <main className="main">
        <FilterBar
          filters={filters}
          onFilterChange={handleFilterChange}
          neighborhoods={neighborhoods}
          types={types}
          dateRange={dateRange}
        />
        <div className="dashboard-grid">
          <div className="dashboard-left">
            <MapView data={filteredData} />
          </div>
          <div className="dashboard-right">
            <StatsCards data={filteredData} />
            <TimeChart data={filteredData} />
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
