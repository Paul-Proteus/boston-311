import Papa from 'papaparse'

export async function loadData() {
  const { default: csvText } = await import('../data/2026-311-data.csv?raw')
  const normalized = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

  const result = Papa.parse(normalized, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.replace(/^\uFEFF/, ''), // Remove BOM
  })

  if (!result.data.length) {
    throw new Error('CSV parsed but no valid rows.')
  }

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
