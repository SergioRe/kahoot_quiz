import { useMemo, useState } from 'react'

type CalificacionItem = {
  id: string
  examenTitulo: string
  totalPreguntas: number
  correctas: number
  incorrectas: number
  porcentaje: number
  tiempoTexto: string
  fechaLabel: string
}

type Props = {
  calificaciones: CalificacionItem[]
  loading: boolean
  message: string
}

const pageSize = 20

export default function CalificacionesView({ calificaciones, loading, message }: Props) {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return calificaciones
    return calificaciones.filter((item) => item.examenTitulo.toLowerCase().includes(q))
  }, [calificaciones, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)

  return (
    <div className="grid gap-4">
      {loading && <p className="text-sm text-slate-600">Cargando calificaciones...</p>}

      {!loading && calificaciones.length === 0 && !message && (
        <div className="rounded-xl border border-slate-200 p-4">
          <p className="text-sm text-slate-700">Aún no tienes calificaciones registradas.</p>
        </div>
      )}

      {!loading && calificaciones.length > 0 && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-3">
            <h3 className="text-sm font-semibold text-slate-900">Mis calificaciones</h3>
            <div className="relative w-full md:w-80">
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
                placeholder="Buscar por examen"
                className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              />
            </div>
          </div>

          <div className="table-scroll-area overflow-x-auto rounded-xl border border-slate-200">
          <table className="min-w-[760px] w-full text-sm">
            <thead className="themed-table-head bg-slate-100 text-slate-800">
              <tr>
                <th className="px-3 py-2 text-left font-bold">Examen</th>
                <th className="px-3 py-2 text-left font-bold">Fecha</th>
                <th className="px-3 py-2 text-left font-bold">Total</th>
                <th className="px-3 py-2 text-left font-bold">Correctas</th>
                <th className="px-3 py-2 text-left font-bold">Incorrectas</th>
                <th className="px-3 py-2 text-left font-bold">Porcentaje</th>
                <th className="px-3 py-2 text-left font-bold">Tiempo</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((item) => (
                <tr key={item.id} className="border-t border-slate-200">
                  <td className="px-3 py-2 text-slate-800">{item.examenTitulo}</td>
                  <td className="px-3 py-2 text-slate-700">{item.fechaLabel}</td>
                  <td className="px-3 py-2 text-slate-700">{item.totalPreguntas}</td>
                  <td className="px-3 py-2 text-emerald-700 font-semibold">{item.correctas}</td>
                  <td className="px-3 py-2 text-rose-700 font-semibold">{item.incorrectas}</td>
                  <td className="px-3 py-2 text-indigo-700 font-semibold">{item.porcentaje}%</td>
                  <td className="px-3 py-2 text-slate-700 font-semibold">{item.tiempoTexto}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>

          <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
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
        </>
      )}

      {message && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-sm text-slate-700">{message}</p>
        </div>
      )}
    </div>
  )
}
