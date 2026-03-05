import { useState, useEffect } from 'react'
import { fetchMeta, fetchRequests } from './utils/api'
import FilterBar from './components/FilterBar'
import StatsCards from './components/StatsCards'
import TimeChart from './components/TimeChart'
import MapView from './components/MapView'
import CategoryCharts from './components/CategoryCharts'

function App() {
  const [meta, setMeta] = useState({
    neighborhoods: [],
    types: [],
    dateRange: { min: '', max: '' },
  })
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    neighborhood: '',
    type: '',
    status: '',
  })
  const [filteredData, setFilteredData] = useState([])
  const [metaLoaded, setMetaLoaded] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)

  // 1. Load metadata once on mount; use the date range to seed initial filters.
  useEffect(() => {
    fetchMeta()
      .then((m) => {
        setMeta(m)
        setFilters((f) => ({
          ...f,
          startDate: m.dateRange.min || '',
          endDate: m.dateRange.max || '',
        }))
        setMetaLoaded(true)
      })
      .catch((err) => {
        setLoadError(err.message || 'Failed to load metadata')
        setLoading(false)
      })
  }, [])

  // 2. Fetch (filtered) records from the backend whenever filters change.
  //    Wait until meta has resolved so we have sensible initial filters.
  useEffect(() => {
    if (!metaLoaded) return

    setLoading(true)
    setLoadError(null)

    fetchRequests(filters)
      .then((records) => {
        // Parse ISO date strings back into Date objects so existing components
        // can do arithmetic (closedDate - openDate, .toISOString(), etc.)
        const parsed = records.map((r) => ({
          ...r,
          openDate: r.openDate ? new Date(r.openDate) : null,
          closedDate: r.closedDate ? new Date(r.closedDate) : null,
        }))
        setFilteredData(parsed)
      })
      .catch((err) => setLoadError(err.message || 'Failed to load data'))
      .finally(() => setLoading(false))
  }, [filters, metaLoaded])

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
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

  if (loading && filteredData.length === 0) {
    return (
      <div className="app">
        <header className="header">
          <h1>Boston 311 Dashboard</h1>
        </header>
        <main className="main">
          <p>Loading data…</p>
        </main>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="header">
        <h1>Boston 311 Dashboard</h1>
        {loading && <span className="header-loading">Updating…</span>}
      </header>
      <main className="main">
        <FilterBar
          filters={filters}
          onFilterChange={handleFilterChange}
          neighborhoods={meta.neighborhoods}
          types={meta.types}
          dateRange={meta.dateRange}
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
