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
