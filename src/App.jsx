import { useState, useEffect } from 'react'
import { loadData } from './utils/dataLoader'

function App() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData('/2026-311-data.csv')
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

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
        <p>Loaded {data.length} requests</p>
      </main>
    </div>
  )
}

export default App
