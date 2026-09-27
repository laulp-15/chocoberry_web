// src/shared/components/DataTable.jsx
import React, { useMemo, useState } from "react";
import { OutlinedInput } from "@mui/material";
import "./DataTable.css";

function getPageNumbers(current, total) {
  const pages = new Set([1, total, current - 1, current, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);

  const result = [];
  let prev = null;
  for (const p of sorted) {
    if (prev !== null && p - prev > 1) result.push("...");
    result.push(p);
    prev = p;
  }
  return result;
}

export default function DataTable({
  title,
  description,
  createLabel,
  onCreate,
  onFiltersClick,
  extraFilter,
  columns,
  data,
  searchPlaceholder = "Buscar...",
  pageSize = 8,
  emptyMessage = "No hay registros para mostrar.",
}) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    if (!query.trim()) return data;
    const q = query.trim().toLowerCase();
    return data.filter((row) =>
      columns.some((col) => String(row[col.key] ?? "").toLowerCase().includes(q))
    );
  }, [data, query, columns]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const pageNumbers = getPageNumbers(currentPage, totalPages);

  const handleSearchChange = (value) => {
    setQuery(value);
    setPage(1);
  };

  return (
    <div className="data-table-wrap">
      {(title || description) && (
        <div className="data-table-header">
          {title && <h1 className="data-table-title" style={{ color: 'var(--texto)' }}>{title}</h1>}
          {description && <p className="data-table-description" style={{ color: 'var(--texto-muted)' }}>{description}</p>}
        </div>
      )}

      <div className="data-table-toolbar">
        {createLabel && (
          <button type="button" className="btn-create" onClick={onCreate}>
            <i className="fa-solid fa-plus" />
            {createLabel}
          </button>
        )}

        <div className="data-table-search">
          <OutlinedInput
            className="data-table-search-input"
            placeholder={searchPlaceholder}
            value={query}
            onChange={(e) => handleSearchChange(e.target.value)}
            endAdornment={<i className="fa-solid fa-magnifying-glass" />}
          />
        </div>

        {extraFilter}
      </div>

      {/* Tarjeta con variables de color para modo claro y oscuro */}
      <div 
        className="data-table-card" 
        style={{ 
          backgroundColor: 'var(--bg-card)', 
          border: '1px solid var(--borde)', 
          borderRadius: '16px', 
          boxShadow: 'none',
          color: 'var(--texto)'
        }}
      >
        <div className="data-table-scroll">
          <table className="data-table" style={{ width: '100%', tableLayout: 'auto', color: 'var(--texto)' }}>
            <thead>
              <tr>
                {columns.map((col) => (
                  <th key={col.key} style={{ color: 'var(--texto-muted)', borderBottom: '1px solid var(--borde)', ...(col.style || {}) }}>
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr>
                  <td className="data-table-empty" colSpan={columns.length} style={{ color: 'var(--texto-muted)' }}>
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                pageRows.map((row, i) => (
                  <tr key={row.id ?? i} style={{ borderBottom: '1px solid var(--borde)' }}>
                    {columns.map((col) => (
                      <td key={col.key} style={{ color: 'var(--texto)', ...(col.style || {}) }}>
                        {col.render ? col.render(row) : row[col.key]}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="data-table-pagination" style={{ borderTop: '1px solid var(--borde)' }}>
          <span className="data-table-page-info" style={{ color: 'var(--texto-muted)' }}>
            Página {currentPage} de {totalPages}
          </span>

          <div className="data-table-page-controls">
            <button
              type="button"
              className="page-nav"
              disabled={currentPage === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <i className="fa-solid fa-arrow-left-long" />
              Anterior
            </button>

            {pageNumbers.map((p, i) =>
              p === "..." ? (
                <span key={`ellipsis-${i}`} className="page-ellipsis" style={{ color: 'var(--texto-muted)' }}>
                  ...
                </span>
              ) : (
                <button
                  key={p}
                  type="button"
                  className={`page-number ${p === currentPage ? "active" : ""}`}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              )
            )}

            <button
              type="button"
              className="page-nav"
              disabled={currentPage === totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Siguiente
              <i className="fa-solid fa-arrow-right-long" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}