import { useMemo, useState } from 'react'

type ExamenListado = {
  id: string
  titulo: string
  descripcion: string
  totalPreguntas: number
  estadoRevision?: 'pendiente' | 'aprobado' | 'rechazado'
}

type Props = {
  examenes: ExamenListado[]
  loading: boolean
  message: string
  showActions?: boolean
  deletingExamId?: string
  onEdit: (examId: string) => void
  onDelete: (examId: string) => Promise<void>
}

const pageSize = 10

export default function ExamenesDataTable({
  examenes,
  loading,
  message,
  showActions = true,
  deletingExamId,
  onEdit,
  onDelete,
}: Props) {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return examenes
    return examenes.filter(
      (item) => item.titulo.toLowerCase().includes(q) || item.descripcion.toLowerCase().includes(q),
    )
  }, [examenes, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)

  return (
    <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-900">Lista de exámenes</h3>
        <div className="relative w-full md:w-72">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setPage(1)
            }}
            placeholder="Buscar examen"
            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          />
        </div>
      </div>

      <p className="mb-2 text-[11px] font-semibold text-slate-500 sm:hidden">← Desliza para ver más columnas →</p>
      <div className="table-scroll-area max-h-[26rem] w-full overflow-x-auto overflow-y-auto rounded-lg border border-slate-100">
        <table className="min-w-[760px] w-full text-left text-sm">
          <thead>
              <tr className="themed-table-head border-b border-slate-200">
              <th className="px-2 py-2 font-bold">Nombre de examen</th>
              <th className="px-2 py-2 font-bold">Descripción</th>
              <th className="px-2 py-2 font-bold">Cantidad de preguntas</th>
              <th className="px-2 py-2 font-bold">Estado</th>
              {showActions && <th className="px-2 py-2 font-bold">Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={showActions ? 5 : 4} className="px-2 py-4 text-slate-600">
                  Cargando exámenes...
                </td>
              </tr>
            ) : paged.length === 0 ? (
              <tr>
                <td colSpan={showActions ? 5 : 4} className="px-2 py-4 text-slate-600">
                  No hay exámenes para mostrar.
                </td>
              </tr>
            ) : (
              paged.map((item) => (
                <tr key={item.id} className="border-b border-slate-100">
                  <td className="px-2 py-2 text-slate-800">{item.titulo}</td>
                  <td className="px-2 py-2 text-slate-700">{item.descripcion || '-'}</td>
                  <td className="px-2 py-2 text-slate-700">{item.totalPreguntas}</td>
                  <td className="px-2 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        item.estadoRevision === 'aprobado'
                          ? 'bg-emerald-100 text-emerald-700'
                          : item.estadoRevision === 'rechazado'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {item.estadoRevision ?? 'pendiente'}
                    </span>
                  </td>
                  {showActions && (
                    <td className="px-2 py-2">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => onEdit(item.id)}
                          className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700"
                        >
                          <svg
                            aria-hidden="true"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            className="h-3.5 w-3.5"
                          >
                            <path d="M12 20h9" />
                            <path d="M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
                          </svg>
                          <span>Editar</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => void onDelete(item.id)}
                          disabled={deletingExamId === item.id}
                          className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <svg
                            aria-hidden="true"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            className="h-3.5 w-3.5"
                          >
                            <path d="M3 6h18" />
                            <path d="M8 6V4h8v2" />
                            <path d="M19 6l-1 14H6L5 6" />
                            <path d="M10 11v6" />
                            <path d="M14 11v6" />
                          </svg>
                          <span>{deletingExamId === item.id ? 'Eliminando...' : 'Eliminar'}</span>
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-600">
          Mostrando {paged.length} de {filtered.length}
        </p>
        <div className="flex flex-nowrap items-center gap-1 overflow-x-auto text-[11px] sm:gap-2 sm:text-xs">
          <button
            type="button"
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={safePage <= 1}
            className="rounded-lg border border-slate-300 px-2 py-1 font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 sm:px-3 sm:py-1.5"
          >
            Anterior
          </button>
          <span className="whitespace-nowrap font-semibold text-slate-700">
            Página {safePage}/{totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={safePage >= totalPages}
            className="rounded-lg border border-slate-300 px-2 py-1 font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 sm:px-3 sm:py-1.5"
          >
            Siguiente
          </button>
        </div>
      </div>

      {message && <p className="mt-3 text-sm text-slate-600">{message}</p>}
    </section>
  )
}
