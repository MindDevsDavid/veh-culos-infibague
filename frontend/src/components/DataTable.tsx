import { ReactNode, useState } from 'react'
import { ChevronLeft, ChevronRight, Search } from 'lucide-react'

export interface Column<T> {
  key: string
  header: string
  render?: (row: T) => ReactNode
  className?: string
}

interface Props<T> {
  columns: Column<T>[]
  data: T[]
  keyField: keyof T
  searchable?: boolean
  searchPlaceholder?: string
  searchFilter?: (row: T, q: string) => boolean
  actions?: (row: T) => ReactNode
  onRowClick?: (row: T) => void
  pageSize?: number
  loading?: boolean
  emptyMessage?: string
}

export default function DataTable<T>({
  columns, data, keyField, searchable, searchPlaceholder = 'Buscar...',
  searchFilter, actions, onRowClick, pageSize = 20, loading, emptyMessage = 'Sin resultados',
}: Props<T>) {
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)

  const filtered = searchable && query
    ? data.filter(row => searchFilter ? searchFilter(row, query) : JSON.stringify(row).toLowerCase().includes(query.toLowerCase()))
    : data

  const totalPages = Math.ceil(filtered.length / pageSize)
  const rows = filtered.slice(page * pageSize, (page + 1) * pageSize)

  function handleSearch(q: string) {
    setQuery(q)
    setPage(0)
  }

  return (
    <div className="flex flex-col gap-4">
      {searchable && (
        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={e => handleSearch(e.target.value)}
            placeholder={searchPlaceholder}
            className="input pl-10"
          />
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                {columns.map(col => (
                  <th key={col.key} className={`px-5 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide ${col.className ?? ''}`}>
                    {col.header}
                  </th>
                ))}
                {actions && <th className="px-5 py-3.5 text-right text-xs font-semibold text-slate-600 uppercase tracking-wide">Acciones</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={columns.length + (actions ? 1 : 0)} className="px-5 py-12 text-center text-slate-400">Cargando...</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={columns.length + (actions ? 1 : 0)} className="px-5 py-12 text-center text-slate-400">{emptyMessage}</td></tr>
              ) : rows.map(row => (
                <tr key={String(row[keyField])} onClick={() => onRowClick?.(row)} className={`hover:bg-slate-50/70 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}>
                  {columns.map(col => (
                    <td key={col.key} className={`px-5 py-3.5 text-slate-700 ${col.className ?? ''}`}>
                      {col.render ? col.render(row) : String((row as any)[col.key] ?? '')}
                    </td>
                  ))}
                  {actions && <td className="px-5 py-3.5 text-right">{actions(row)}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-500 px-1">
          <span className="font-medium">{filtered.length} registros</span>
          <div className="flex items-center gap-1 bg-white rounded-lg border border-slate-200 px-2 py-1">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
              className="p-1 rounded disabled:opacity-30 hover:bg-slate-100 text-slate-600 transition-colors">
              <ChevronLeft size={16} />
            </button>
            <span className="px-3 text-slate-700 font-medium">Página {page + 1} de {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}
              className="p-1 rounded disabled:opacity-30 hover:bg-slate-100 text-slate-600 transition-colors">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
