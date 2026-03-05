/**
 * Unit tests for src/utils/api.js
 *
 * fetch is mocked via vi.stubGlobal so no real network calls are made.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  fetchCategories,
  fetchMeta,
  fetchRequests,
  fetchStats,
  fetchTimeSeries,
} from './api.js'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mockFetch(payload, ok = true, status = 200) {
  const response = {
    ok,
    status,
    json: vi.fn().mockResolvedValue(payload),
  }
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response))
}

function lastFetchUrl() {
  return globalThis.fetch.mock.calls[0][0]
}

afterEach(() => {
  vi.unstubAllGlobals()
})

// ---------------------------------------------------------------------------
// fetchMeta
// ---------------------------------------------------------------------------

describe('fetchMeta', () => {
  it('calls /api/meta', async () => {
    mockFetch({ neighborhoods: [], types: [], dateRange: {} })
    await fetchMeta()
    expect(lastFetchUrl()).toBe('/api/meta')
  })

  it('returns the parsed JSON body', async () => {
    const payload = {
      neighborhoods: ['Back Bay', 'Dorchester'],
      types: ['Pothole'],
      dateRange: { min: '2026-01-01', max: '2026-01-31' },
    }
    mockFetch(payload)
    const result = await fetchMeta()
    expect(result).toEqual(payload)
  })

  it('throws on a non-ok response', async () => {
    mockFetch({}, false, 500)
    await expect(fetchMeta()).rejects.toThrow('API error 500')
  })
})

// ---------------------------------------------------------------------------
// fetchRequests
// ---------------------------------------------------------------------------

describe('fetchRequests', () => {
  it('calls /api/requests with no query string when filters are empty', async () => {
    mockFetch([])
    await fetchRequests({})
    expect(lastFetchUrl()).toBe('/api/requests')
  })

  it('appends status filter to the URL', async () => {
    mockFetch([])
    await fetchRequests({ status: 'Open' })
    expect(lastFetchUrl()).toBe('/api/requests?status=Open')
  })

  it('appends neighborhood filter to the URL', async () => {
    mockFetch([])
    await fetchRequests({ neighborhood: 'Dorchester' })
    expect(lastFetchUrl()).toBe('/api/requests?neighborhood=Dorchester')
  })

  it('appends multiple filters to the URL', async () => {
    mockFetch([])
    await fetchRequests({ status: 'Open', neighborhood: 'Back Bay' })
    const url = lastFetchUrl()
    expect(url).toContain('status=Open')
    expect(url).toContain('neighborhood=Back+Bay')
  })

  it('appends date filters to the URL', async () => {
    mockFetch([])
    await fetchRequests({ startDate: '2026-01-01', endDate: '2026-01-31' })
    const url = lastFetchUrl()
    expect(url).toContain('start_date=2026-01-01')
    expect(url).toContain('end_date=2026-01-31')
  })

  it('ignores falsy filter values', async () => {
    mockFetch([])
    await fetchRequests({ status: '', neighborhood: null })
    expect(lastFetchUrl()).toBe('/api/requests')
  })

  it('returns parsed JSON array', async () => {
    const payload = [{ id: '1', status: 'Open' }]
    mockFetch(payload)
    const result = await fetchRequests()
    expect(result).toEqual(payload)
  })

  it('throws on non-ok response', async () => {
    mockFetch([], false, 404)
    await expect(fetchRequests()).rejects.toThrow('API error 404')
  })
})

// ---------------------------------------------------------------------------
// fetchStats
// ---------------------------------------------------------------------------

describe('fetchStats', () => {
  it('calls /api/stats', async () => {
    mockFetch({ total: 0, open: 0, closed: 0, onTimeRate: 0, avgResponseTimeHours: 0 })
    await fetchStats()
    expect(lastFetchUrl()).toBe('/api/stats')
  })

  it('passes filters as query params', async () => {
    mockFetch({})
    await fetchStats({ status: 'Closed' })
    expect(lastFetchUrl()).toBe('/api/stats?status=Closed')
  })

  it('returns parsed JSON', async () => {
    const payload = { total: 100, open: 40, closed: 60, onTimeRate: 75.0, avgResponseTimeHours: 48.5 }
    mockFetch(payload)
    expect(await fetchStats()).toEqual(payload)
  })
})

// ---------------------------------------------------------------------------
// fetchTimeSeries
// ---------------------------------------------------------------------------

describe('fetchTimeSeries', () => {
  it('calls /api/time-series', async () => {
    mockFetch([])
    await fetchTimeSeries()
    expect(lastFetchUrl()).toBe('/api/time-series')
  })

  it('passes filters as query params', async () => {
    mockFetch([])
    await fetchTimeSeries({ neighborhood: 'South End' })
    expect(lastFetchUrl()).toBe('/api/time-series?neighborhood=South+End')
  })

  it('returns parsed JSON array', async () => {
    const payload = [{ date: '2026-01-01', count: 10 }]
    mockFetch(payload)
    expect(await fetchTimeSeries()).toEqual(payload)
  })
})

// ---------------------------------------------------------------------------
// fetchCategories
// ---------------------------------------------------------------------------

describe('fetchCategories', () => {
  it('calls /api/categories', async () => {
    mockFetch({ byType: [], byNeighborhood: [], bySource: [] })
    await fetchCategories()
    expect(lastFetchUrl()).toBe('/api/categories')
  })

  it('passes type filter as query param', async () => {
    mockFetch({})
    await fetchCategories({ type: 'Pothole' })
    expect(lastFetchUrl()).toBe('/api/categories?type=Pothole')
  })

  it('returns parsed JSON', async () => {
    const payload = {
      byType: [{ name: 'Pothole', count: 5 }],
      byNeighborhood: [],
      bySource: [],
    }
    mockFetch(payload)
    expect(await fetchCategories()).toEqual(payload)
  })
})
