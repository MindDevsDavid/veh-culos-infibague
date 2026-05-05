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
  pageSize?: number
  loading?: boolean
  emptyMessage?: string
}

export default function DataTable<T>({
  columns, data, keyField, searchable, searchPlaceholder = 'Buscar...',
  searchFilter, actions, pageSize = 20, loading, emptyMessage = 'Sin resultados',
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
    <div className="flex flex-col gap-3">
      {searchable && (
        <div className="relative w-64">
          <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={e => handleSearch(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              {columns.map(col => (
                <th key={col.key} className={`px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide ${col.className ?? ''}`}>
                  {col.header}
                </th>
              ))}
              {actions && <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={columns.length + (actions ? 1 : 0)} className="px-4 py-8 text-center text-slate-400">Cargando...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={columns.length + (actions ? 1 : 0)} className="px-4 py-8 text-center text-slate-400">{emptyMessage}</td></tr>
            ) : rows.map(row => (
              <tr key={String(row[keyField])} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                {columns.map(col => (
                  <td key={col.key} className={`px-4 py-3 text-slate-700 ${col.className ?? ''}`}>
                    {col.render ? col.render(row) : String((row as any)[col.key] ?? '')}
                  </td>
                ))}
                {actions && <td className="px-4 py-3 text-right">{actions(row)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>{filtered.length} registros</span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
              className="p-1 rounded disabled:opacity-30 hover:bg-slate-100">
              <ChevronLeft size={16} />
            </button>
            <span>{page + 1} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}
              className="p-1 rounded disabled:opacity-30 hover:bg-slate-100">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
