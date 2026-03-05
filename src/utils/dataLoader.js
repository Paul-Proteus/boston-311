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
