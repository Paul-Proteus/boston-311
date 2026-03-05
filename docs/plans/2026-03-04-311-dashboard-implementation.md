# Boston 311 Dashboard Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build an interactive React dashboard to visualize Boston 311 service request data with a map, charts, and filters.

**Architecture:** Single-page React app using Vite. CSV loaded at startup, parsed with PapaParse, stored in state. Filters in App.jsx compute filtered data via useMemo, passed to visualization components.

**Tech Stack:** React 18, Vite, react-leaflet, Recharts, PapaParse

---

### Task 1: Initialize Vite + React Project

**Files:**
- Create: `package.json`
- Create: `vite.config.js`
- Create: `index.html`
- Create: `src/main.jsx`
- Create: `src/App.jsx`
- Create: `src/App.css`

**Step 1: Initialize package.json**

```bash
cd /Users/dylanb/codebase/311-app
npm init -y
```

**Step 2: Install dependencies**

```bash
npm install react@18 react-dom@18 leaflet react-leaflet react-leaflet-cluster recharts papaparse
npm install -D vite @vitejs/plugin-react
```

**Step 3: Create vite.config.js**

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})
```

**Step 4: Create index.html**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Boston 311 Dashboard</title>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

**Step 5: Create src/main.jsx**

```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './App.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

**Step 6: Create src/App.jsx (skeleton)**

```jsx
function App() {
  return (
    <div className="app">
      <header className="header">
        <h1>Boston 311 Dashboard</h1>
      </header>
      <main className="main">
        <p>Loading...</p>
      </main>
    </div>
  )
}

export default App
```

**Step 7: Create src/App.css (basic styles)**

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #f5f5f5;
}

.app {
  min-height: 100vh;
}

.header {
  background: #1a365d;
  color: white;
  padding: 1rem 2rem;
}

.header h1 {
  font-size: 1.5rem;
  font-weight: 600;
}

.main {
  padding: 1rem;
}
```

**Step 8: Add scripts to package.json**

Add to package.json:
```json
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview"
}
```

**Step 9: Test the dev server**

```bash
npm run dev
```

Expected: Server starts, browser shows "Boston 311 Dashboard" header.

**Step 10: Commit**

```bash
git init
echo "node_modules" > .gitignore
git add .
git commit -m "feat: initialize Vite + React project"
```

---

### Task 2: CSV Data Loader

**Files:**
- Create: `src/utils/dataLoader.js`

**Step 1: Create dataLoader.js**

```js
import Papa from 'papaparse'

export async function loadData(csvPath) {
  const response = await fetch(csvPath)
  const csvText = await response.text()

  const result = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.replace(/^\uFEFF/, ''), // Remove BOM
  })

  return result.data.map(row => ({
    id: row._id,
    caseId: row.case_enquiry_id,
    openDate: row.open_dt ? new Date(row.open_dt) : null,
    closedDate: row.closed_dt ? new Date(row.closed_dt) : null,
    status: row.case_status,
    onTime: row.on_time,
    title: row.case_title,
    type: row.type,
    reason: row.reason,
    department: row.department,
    neighborhood: row.neighborhood,
    source: row.source,
    location: row.location,
    latitude: row.latitude ? parseFloat(row.latitude) : null,
    longitude: row.longitude ? parseFloat(row.longitude) : null,
  }))
}
```

**Step 2: Commit**

```bash
git add src/utils/dataLoader.js
git commit -m "feat: add CSV data loader with PapaParse"
```

---

### Task 3: Load Data in App

**Files:**
- Modify: `src/App.jsx`

**Step 1: Update App.jsx to load and display data**

```jsx
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
```

**Step 2: Test data loading**

```bash
npm run dev
```

Expected: Shows "Loaded 2500+ requests" (exact number from CSV).

**Step 3: Commit**

```bash
git add src/App.jsx
git commit -m "feat: load CSV data on app startup"
```

---

### Task 4: Filter Bar Component

**Files:**
- Create: `src/components/FilterBar.jsx`
- Modify: `src/App.jsx`
- Modify: `src/App.css`

**Step 1: Create FilterBar.jsx**

```jsx
function FilterBar({
  filters,
  onFilterChange,
  neighborhoods,
  types,
  dateRange
}) {
  return (
    <div className="filter-bar">
      <div className="filter-group">
        <label>From</label>
        <input
          type="date"
          value={filters.startDate}
          min={dateRange.min}
          max={dateRange.max}
          onChange={(e) => onFilterChange('startDate', e.target.value)}
        />
      </div>

      <div className="filter-group">
        <label>To</label>
        <input
          type="date"
          value={filters.endDate}
          min={dateRange.min}
          max={dateRange.max}
          onChange={(e) => onFilterChange('endDate', e.target.value)}
        />
      </div>

      <div className="filter-group">
        <label>Neighborhood</label>
        <select
          value={filters.neighborhood}
          onChange={(e) => onFilterChange('neighborhood', e.target.value)}
        >
          <option value="">All Neighborhoods</option>
          {neighborhoods.map(n => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label>Type</label>
        <select
          value={filters.type}
          onChange={(e) => onFilterChange('type', e.target.value)}
        >
          <option value="">All Types</option>
          {types.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label>Status</label>
        <select
          value={filters.status}
          onChange={(e) => onFilterChange('status', e.target.value)}
        >
          <option value="">All</option>
          <option value="Open">Open</option>
          <option value="Closed">Closed</option>
        </select>
      </div>
    </div>
  )
}

export default FilterBar
```

**Step 2: Add filter bar styles to App.css**

```css
.filter-bar {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: white;
  border-radius: 8px;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.filter-group label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
}

.filter-group input,
.filter-group select {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.875rem;
}

.filter-group select {
  min-width: 150px;
}
```

**Step 3: Integrate FilterBar into App.jsx**

```jsx
import { useState, useEffect, useMemo } from 'react'
import { loadData } from './utils/dataLoader'
import FilterBar from './components/FilterBar'

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
        <p>Showing {filteredData.length} of {data.length} requests</p>
      </main>
    </div>
  )
}

export default App
```

**Step 4: Test filters**

```bash
npm run dev
```

Expected: Filter controls appear, changing them updates the count.

**Step 5: Commit**

```bash
git add src/components/FilterBar.jsx src/App.jsx src/App.css
git commit -m "feat: add filter bar with date, neighborhood, type, status filters"
```

---

### Task 5: Stats Cards Component

**Files:**
- Create: `src/components/StatsCards.jsx`
- Modify: `src/App.jsx`
- Modify: `src/App.css`

**Step 1: Create StatsCards.jsx**

```jsx
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
```

**Step 2: Add stats card styles to App.css**

```css
.stats-cards {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.stat-card {
  background: white;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  text-align: center;
  min-width: 120px;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1a365d;
}

.stat-label {
  font-size: 0.75rem;
  color: #666;
  text-transform: uppercase;
  margin-top: 0.25rem;
}
```

**Step 3: Add StatsCards to App.jsx**

Add import:
```jsx
import StatsCards from './components/StatsCards'
```

Add after FilterBar in JSX:
```jsx
<StatsCards data={filteredData} />
```

**Step 4: Test stats**

```bash
npm run dev
```

Expected: Stats cards show counts and percentages.

**Step 5: Commit**

```bash
git add src/components/StatsCards.jsx src/App.jsx src/App.css
git commit -m "feat: add stats cards showing totals, on-time rate, avg response"
```

---

### Task 6: Map View Component

**Files:**
- Create: `src/components/MapView.jsx`
- Modify: `src/App.jsx`
- Modify: `src/App.css`

**Step 1: Create MapView.jsx**

```jsx
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import L from 'leaflet'

// Fix default marker icons
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const openIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
})

const closedIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
})

function MapView({ data }) {
  const validData = data.filter(d => d.latitude && d.longitude)

  return (
    <MapContainer
      center={[42.36, -71.06]}
      zoom={12}
      className="map-container"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MarkerClusterGroup chunkedLoading>
        {validData.map(request => (
          <Marker
            key={request.id}
            position={[request.latitude, request.longitude]}
            icon={request.status === 'Closed' ? closedIcon : openIcon}
          >
            <Popup>
              <strong>{request.title || request.type}</strong>
              <br />
              Status: {request.status} ({request.onTime})
              <br />
              {request.neighborhood}
              <br />
              {request.openDate?.toLocaleDateString()}
              <br />
              <small>{request.location}</small>
            </Popup>
          </Marker>
        ))}
      </MarkerClusterGroup>
    </MapContainer>
  )
}

export default MapView
```

**Step 2: Add map styles to App.css**

```css
.map-container {
  height: 400px;
  border-radius: 8px;
  z-index: 1;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
}

.dashboard-left {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.dashboard-right {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
```

**Step 3: Add MapView to App.jsx**

Add import:
```jsx
import MapView from './components/MapView'
```

Replace the `<p>Showing...</p>` with:
```jsx
<div className="dashboard-grid">
  <div className="dashboard-left">
    <MapView data={filteredData} />
  </div>
  <div className="dashboard-right">
    <StatsCards data={filteredData} />
  </div>
</div>
```

**Step 4: Test map**

```bash
npm run dev
```

Expected: Map shows Boston with clustered markers.

**Step 5: Commit**

```bash
git add src/components/MapView.jsx src/App.jsx src/App.css
git commit -m "feat: add interactive map with clustered markers"
```

---

### Task 7: Time Chart Component

**Files:**
- Create: `src/components/TimeChart.jsx`
- Modify: `src/App.jsx`
- Modify: `src/App.css`

**Step 1: Create TimeChart.jsx**

```jsx
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
```

**Step 2: Add chart card styles to App.css**

```css
.chart-card {
  background: white;
  padding: 1rem;
  border-radius: 8px;
}

.chart-card h3 {
  font-size: 0.875rem;
  color: #333;
  margin-bottom: 0.5rem;
}
```

**Step 3: Add TimeChart to App.jsx**

Add import:
```jsx
import TimeChart from './components/TimeChart'
```

Add after StatsCards in dashboard-right:
```jsx
<TimeChart data={filteredData} />
```

**Step 4: Test time chart**

```bash
npm run dev
```

Expected: Line chart shows request volume over time.

**Step 5: Commit**

```bash
git add src/components/TimeChart.jsx src/App.jsx src/App.css
git commit -m "feat: add time series line chart"
```

---

### Task 8: Category Charts Component

**Files:**
- Create: `src/components/CategoryCharts.jsx`
- Modify: `src/App.jsx`
- Modify: `src/App.css`

**Step 1: Create CategoryCharts.jsx**

```jsx
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
```

**Step 2: Add category charts styles to App.css**

```css
.category-charts {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}
```

**Step 3: Add CategoryCharts to App.jsx**

Add import:
```jsx
import CategoryCharts from './components/CategoryCharts'
```

Add after the dashboard-grid div:
```jsx
<CategoryCharts data={filteredData} />
```

**Step 4: Test category charts**

```bash
npm run dev
```

Expected: Three charts showing top types, neighborhoods, and sources.

**Step 5: Commit**

```bash
git add src/components/CategoryCharts.jsx src/App.jsx src/App.css
git commit -m "feat: add category breakdown charts (type, neighborhood, source)"
```

---

### Task 9: Final Polish

**Files:**
- Modify: `src/App.css`

**Step 1: Add responsive improvements and final styling**

Add to App.css:
```css
@media (max-width: 1200px) {
  .category-charts {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 800px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }

  .filter-bar {
    flex-direction: column;
  }
}

.main {
  max-width: 1400px;
  margin: 0 auto;
}
```

**Step 2: Test responsive layout**

```bash
npm run dev
```

Expected: Layout adjusts gracefully on smaller screens.

**Step 3: Final commit**

```bash
git add src/App.css
git commit -m "feat: add responsive layout improvements"
```

---

## Summary

After completing all tasks, you will have:
- React + Vite app with hot reloading
- CSV data loading with PapaParse
- Interactive filters (date, neighborhood, type, status)
- Stats cards (total, open/closed, on-time rate, avg response)
- Leaflet map with clustered color-coded markers
- Line chart showing requests over time
- Bar charts for top types and neighborhoods
- Pie chart for request sources
- Responsive layout
