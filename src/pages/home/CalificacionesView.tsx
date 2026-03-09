type CalificacionItem = {
  id: string
  examenTitulo: string
  totalPreguntas: number
  correctas: number
  incorrectas: number
  porcentaje: number
  fechaLabel: string
}

type Props = {
  calificaciones: CalificacionItem[]
  loading: boolean
  message: string
}

export default function CalificacionesView({ calificaciones, loading, message }: Props) {
  return (
    <div className="grid gap-4">
      {loading && <p className="text-sm text-slate-600">Cargando calificaciones...</p>}

      {!loading && calificaciones.length === 0 && !message && (
        <div className="rounded-xl border border-slate-200 p-4">
          <p className="text-sm text-slate-700">Aún no tienes calificaciones registradas.</p>
        </div>
      )}

      {!loading && calificaciones.length > 0 && (
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
              </tr>
            </thead>
            <tbody>
              {calificaciones.map((item) => (
                <tr key={item.id} className="border-t border-slate-200">
                  <td className="px-3 py-2 text-slate-800">{item.examenTitulo}</td>
                  <td className="px-3 py-2 text-slate-700">{item.fechaLabel}</td>
                  <td className="px-3 py-2 text-slate-700">{item.totalPreguntas}</td>
                  <td className="px-3 py-2 text-emerald-700 font-semibold">{item.correctas}</td>
                  <td className="px-3 py-2 text-rose-700 font-semibold">{item.incorrectas}</td>
                  <td className="px-3 py-2 text-indigo-700 font-semibold">{item.porcentaje}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {message && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-sm text-slate-700">{message}</p>
        </div>
      )}
    </div>
  )
}
