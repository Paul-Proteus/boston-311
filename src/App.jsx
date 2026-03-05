import { useState, useEffect, useMemo } from 'react'
import { loadData } from './utils/dataLoader'
import FilterBar from './components/FilterBar'
import StatsCards from './components/StatsCards'
import TimeChart from './components/TimeChart'
import MapView from './components/MapView'
import CategoryCharts from './components/CategoryCharts'

function App() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    neighborhood: '',
    type: '',
    status: '',
  })

  const toLocalDateString = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

  useEffect(() => {
    setLoadError(null)
    loadData()
      .then((rows) => {
        setData(rows)
        const withDates = rows.filter(r => r.openDate)
        if (withDates.length > 0) {
          const minD = withDates.reduce((m, r) => (!m || r.openDate < m ? r.openDate : m), null)
          const maxD = withDates.reduce((m, r) => (!m || r.openDate > m ? r.openDate : m), null)
          if (minD && maxD) {
            setFilters(f => ({
              ...f,
              startDate: toLocalDateString(minD),
              endDate: toLocalDateString(maxD),
            }))
          }
        }
      })
      .catch((err) => setLoadError(err.message || 'Failed to load data'))
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
    const startOfStart = filters.startDate ? new Date(filters.startDate + 'T00:00:00') : null
    const endOfEnd = filters.endDate ? new Date(filters.endDate + 'T23:59:59.999') : null
    return data.filter(row => {
      if (startOfStart && row.openDate) {
        if (row.openDate < startOfStart) return false
      }
      if (endOfEnd && row.openDate) {
        if (row.openDate > endOfEnd) return false
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

  if (loadError) {
    return (
      <div className="app">
        <header className="header">
          <h1>Boston 311 Dashboard</h1>
        </header>
        <main className="main">
          <p className="load-error">{loadError}</p>
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
        <CategoryCharts data={filteredData} />
      </main>
    </div>
  )
}

export default App
