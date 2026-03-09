import { useMemo, useState } from 'react'

type ExamenListado = {
  id: string
  titulo: string
  descripcion: string
  totalPreguntas: number
}

type Props = {
  examenes: ExamenListado[]
  loading: boolean
  message: string
  deletingExamId?: string
  onEdit: (examId: string) => void
  onDelete: (examId: string) => Promise<void>
}

const pageSize = 10

export default function ExamenesDataTable({
  examenes,
  loading,
  message,
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
        <input
          type="text"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value)
            setPage(1)
          }}
          placeholder="Buscar examen"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 md:w-72"
        />
      </div>

      <div className="max-h-[26rem] w-full overflow-x-auto overflow-y-auto rounded-lg border border-slate-100">
        <table className="min-w-[760px] w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-600 bg-white">
              <th className="px-2 py-2 font-bold">Nombre de examen</th>
              <th className="px-2 py-2 font-bold">Descripción</th>
              <th className="px-2 py-2 font-bold">Cantidad de preguntas</th>
              <th className="px-2 py-2 font-bold">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-2 py-4 text-slate-600">
                  Cargando exámenes...
                </td>
              </tr>
            ) : paged.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-2 py-4 text-slate-600">
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
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => onEdit(item.id)}
                        className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-700"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => void onDelete(item.id)}
                        disabled={deletingExamId === item.id}
                        className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {deletingExamId === item.id ? 'Eliminando...' : 'Eliminar'}
                      </button>
                    </div>
                  </td>
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
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={safePage <= 1}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Anterior
          </button>
          <span className="text-xs font-semibold text-slate-700">
            Página {safePage} de {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={safePage >= totalPages}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      </div>

      {message && <p className="mt-3 text-sm text-slate-600">{message}</p>}
    </section>
  )
}
