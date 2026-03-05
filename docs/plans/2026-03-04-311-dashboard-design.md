# Boston 311 Dashboard - Design Document

## Overview

Interactive React application to visualize Boston 311 service request data from a CSV file (~2,500 rows). Combines a geographic map view with trend charts and category breakdowns.

## Tech Stack

- **React 18 + Vite** - Fast development, modern tooling
- **react-leaflet + Leaflet** - Interactive map with OpenStreetMap tiles
- **react-leaflet-cluster** - Marker clustering for performance
- **Recharts** - Bar, line, and pie charts
- **PapaParse** - CSV parsing

## Layout

```
┌─────────────────────────────────────────────────────┐
│  Header: "Boston 311 Dashboard"                     │
├─────────────────────────────────────────────────────┤
│  Filters: Date range | Neighborhood | Type | Status │
├──────────────────────────┬──────────────────────────┤
│                          │   Summary Stats          │
│      Interactive Map     │   (total, open, on-time) │
│      (left, ~60%)        ├──────────────────────────┤
│                          │   Requests Over Time     │
│                          │   (line chart)           │
├──────────────────────────┴──────────────────────────┤
│  By Type (bar)  │  By Neighborhood (bar)  │ By Source│
└─────────────────────────────────────────────────────┘
```

## Components

### App.jsx
- Main layout container
- Holds filter state and raw data
- Computes filtered data via useMemo
- Passes filtered data to child components

### FilterBar.jsx
- **Date Range**: Start/end date inputs (default: full data range)
- **Neighborhood**: Dropdown populated from data
- **Request Type**: Dropdown populated from data
- **Status**: All / Open / Closed

### MapView.jsx
- Leaflet map centered on Boston (42.36, -71.06), zoom 12
- OpenStreetMap tiles (free, no API key)
- Clustered markers via react-leaflet-cluster
- Marker colors: green (Closed), orange (Open)
- Click marker → popup with case details
- Excludes rows without valid lat/long (~50 rows)

### StatsCards.jsx
- Total Requests count
- Open vs Closed (count + percentage)
- On-Time Rate (ONTIME vs OVERDUE percentage)
- Average Response Time (for closed cases)

### TimeChart.jsx
- Recharts LineChart
- X-axis: dates (grouped by day)
- Y-axis: request count
- Tooltip on hover

### CategoryCharts.jsx
- **By Request Type**: Horizontal bar chart, top 10 types
- **By Neighborhood**: Horizontal bar chart, top 10 neighborhoods
- **By Source**: Pie/donut chart (Citizens Connect App, Employee Generated, Constituent Call)

## Data Handling

### CSV Parsing (utils/dataLoader.js)
- Use PapaParse with header: true
- Handle BOM character at file start
- Convert date strings to JS Date objects
- Return array of request objects

### Data Fields Used
- `case_enquiry_id` - unique identifier
- `open_dt`, `closed_dt` - timestamps
- `case_status` - Open/Closed
- `on_time` - ONTIME/OVERDUE
- `case_title`, `type` - request categorization
- `neighborhood` - geographic grouping
- `source` - how request was submitted
- `latitude`, `longitude` - map coordinates
- `location` - address string

### State Management
- Plain React useState for filters and data
- useMemo for filtered data computation
- No external state library needed at this scale

## File Structure

```
311-app/
├── index.html
├── package.json
├── vite.config.js
├── 2026-311-data.csv
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── App.css
│   ├── components/
│   │   ├── FilterBar.jsx
│   │   ├── MapView.jsx
│   │   ├── StatsCards.jsx
│   │   ├── TimeChart.jsx
│   │   └── CategoryCharts.jsx
│   └── utils/
│       └── dataLoader.js
```

## Dependencies

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "leaflet": "^1.9.4",
    "react-leaflet": "^4.2.1",
    "react-leaflet-cluster": "^2.1.0",
    "recharts": "^2.12.0",
    "papaparse": "^5.4.1"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "@vitejs/plugin-react": "^4.2.0"
  }
}
```

## Out of Scope

- TypeScript
- Testing setup
- Backend/API
- Data export functionality
- Mobile-responsive design (desktop-first)
