// All requests go through the Vite dev proxy (/api → http://localhost:8000/api).
// In production, point BASE_URL at the deployed backend.
const BASE_URL = '/api'

function buildParams(filters) {
  const params = new URLSearchParams()
  if (filters.startDate)    params.set('start_date',   filters.startDate)
  if (filters.endDate)      params.set('end_date',     filters.endDate)
  if (filters.neighborhood) params.set('neighborhood', filters.neighborhood)
  if (filters.type)         params.set('type',         filters.type)
  if (filters.status)       params.set('status',       filters.status)
  return params.toString()
}

async function get(path) {
  const res = await fetch(BASE_URL + path)
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`)
  return res.json()
}

/** Available filter options and overall date range. */
export function fetchMeta() {
  return get('/meta')
}

/**
 * Filtered service request records.
 * Returns an array of record objects (all fields needed by every component).
 */
export function fetchRequests(filters = {}) {
  const qs = buildParams(filters)
  return get('/requests' + (qs ? '?' + qs : ''))
}

/** Aggregate statistics for the filtered dataset. */
export function fetchStats(filters = {}) {
  const qs = buildParams(filters)
  return get('/stats' + (qs ? '?' + qs : ''))
}

/** Daily request counts for the filtered dataset. */
export function fetchTimeSeries(filters = {}) {
  const qs = buildParams(filters)
  return get('/time-series' + (qs ? '?' + qs : ''))
}

/** Top-10 breakdowns by type, neighborhood, and source. */
export function fetchCategories(filters = {}) {
  const qs = buildParams(filters)
  return get('/categories' + (qs ? '?' + qs : ''))
}
