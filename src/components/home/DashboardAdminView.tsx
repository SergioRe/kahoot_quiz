import AdminUsersDataTable from '../AdminUsersDataTable'

type UserRole = 'admin' | 'usuario'

type UsuarioPerfil = {
  rol: UserRole
}

type EstadoSolicitudPermiso = 'pendiente' | 'aprobada' | 'rechazada'
type EstadoRevisionExamen = 'pendiente' | 'aprobado' | 'rechazado'

type UsuarioAdmin = {
  uid: string
  nombre: string
  email: string
  activo: boolean
  rol: UserRole
}

type SolicitudPermisoExamen = {
  id: string
  uid: string
  nombre: string
  email: string
  estado: EstadoSolicitudPermiso
  revisadoPorUid?: string
}

type SolicitudAprobacionExamen = {
  id: string
  titulo: string
  creadoPorUid: string
  creadoPorNombre: string
  estadoRevision: EstadoRevisionExamen
}

type Props = {
  perfil: UsuarioPerfil
  totalUsers: number
  activeUsers: number
  inactiveUsers: number
  adminCount: number
  activeRate: number
  inactiveRate: number
  adminUsers: UsuarioAdmin[]
  adminLoading: boolean
  adminMessage: string
  currentUid: string
  examAccessRequests: SolicitudPermisoExamen[]
  examAccessRequestsLoading: boolean
  examApprovalRequests: SolicitudAprobacionExamen[]
  examApprovalRequestsLoading: boolean
  onToggleActivo: (userId: string, nextValue: boolean) => Promise<void>
  onToggleRol: (userId: string, nextValue: UserRole) => Promise<void>
  onApproveExamAccess: (requestId: string, userId: string) => Promise<void>
  onRejectExamAccess: (requestId: string, userId: string) => Promise<void>
  onApproveExam: (examId: string) => Promise<void>
  onRejectExam: (examId: string) => Promise<void>
}

export default function DashboardAdminView({
  perfil,
  totalUsers,
  activeUsers,
  inactiveUsers,
  adminCount,
  activeRate,
  inactiveRate,
  adminUsers,
  adminLoading,
  adminMessage,
  currentUid,
  examAccessRequests,
  examAccessRequestsLoading,
  examApprovalRequests,
  examApprovalRequestsLoading,
  onToggleActivo,
  onToggleRol,
  onApproveExamAccess,
  onRejectExamAccess,
  onApproveExam,
  onRejectExam,
}: Props) {
  return (
    <section className="grid gap-4">
      {perfil.rol !== 'admin' ? (
        <div className="rounded-xl border border-slate-200 p-4">
          <p className="text-sm text-slate-700">No tienes permisos de administrador para acceder al dashboard.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase text-slate-500">Total usuarios</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{totalUsers}</p>
              <p className="mt-1 text-xs text-slate-500">Base general del sistema</p>
            </article>

            <article className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase text-slate-500">Activos</p>
              <p className="mt-2 text-3xl font-bold text-emerald-600">{activeUsers}</p>
              <p className="mt-1 text-xs text-slate-500">{activeRate}% de usuarios activos</p>
            </article>

            <article className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase text-slate-500">Inactivos</p>
              <p className="mt-2 text-3xl font-bold text-rose-600">{inactiveUsers}</p>
              <p className="mt-1 text-xs text-slate-500">{inactiveRate}% de usuarios inactivos</p>
            </article>

            <article className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase text-slate-500">Administradores</p>
              <p className="mt-2 text-3xl font-bold text-indigo-600">{adminCount}</p>
              <p className="mt-1 text-xs text-slate-500">Con permisos de gestión</p>
            </article>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <section className="rounded-xl border border-slate-200 bg-white p-4 xl:col-span-2">
              <h2 className="text-sm font-semibold text-slate-900">Project Statistics</h2>
              <p className="mt-1 text-xs text-slate-500">Resumen operativo de cuentas y estado del sistema</p>

              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="rounded-lg border border-slate-200 p-3">
                  <p className="text-xs font-semibold uppercase text-slate-500">Usuarios activos</p>
                  <p className="mt-1 text-xl font-bold text-slate-900">{activeUsers}</p>
                  <div className="mt-3 h-2 rounded-full bg-slate-100">
                    <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${activeRate}%` }} />
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 p-3">
                  <p className="text-xs font-semibold uppercase text-slate-500">Usuarios inactivos</p>
                  <p className="mt-1 text-xl font-bold text-slate-900">{inactiveUsers}</p>
                  <div className="mt-3 h-2 rounded-full bg-slate-100">
                    <div className="h-2 rounded-full bg-rose-500" style={{ width: `${inactiveRate}%` }} />
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-6 items-end gap-2">
                {[32, 44, 40, 56, 52, 68].map((value, index) => (
                  <div key={index} className="flex flex-col items-center gap-1">
                    <div className="w-full rounded bg-indigo-100" style={{ height: `${value}px` }} />
                    <span className="text-[10px] font-semibold text-slate-500">M{index + 1}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-4">
              <h2 className="text-sm font-semibold text-slate-900">Projects Monthly</h2>
              <p className="mt-1 text-xs text-slate-500">Distribución por estado</p>

              <div className="mt-4 space-y-3">
                <div>
                  <div className="mb-1 flex items-center justify-between text-xs text-slate-600">
                    <span>Activos</span>
                    <span>{activeUsers}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${activeRate}%` }} />
                  </div>
                </div>

                <div>
                  <div className="mb-1 flex items-center justify-between text-xs text-slate-600">
                    <span>Inactivos</span>
                    <span>{inactiveUsers}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div className="h-2 rounded-full bg-rose-500" style={{ width: `${inactiveRate}%` }} />
                  </div>
                </div>

                <div>
                  <div className="mb-1 flex items-center justify-between text-xs text-slate-600">
                    <span>Admins</span>
                    <span>{adminCount}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-indigo-500"
                      style={{ width: `${totalUsers > 0 ? Math.round((adminCount / totalUsers) * 100) : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </section>
          </div>

          <AdminUsersDataTable
            users={adminUsers}
            loading={adminLoading}
            message={adminMessage}
            currentUid={currentUid}
            onToggleActivo={onToggleActivo}
            onToggleRol={onToggleRol}
          />

          <section className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="text-sm font-semibold text-slate-900">Solicitudes de permisos de exámenes</h2>
            <p className="mt-1 text-xs text-slate-500">Aprueba o rechaza solicitudes para agregar, editar y eliminar exámenes.</p>

            {examAccessRequestsLoading ? (
              <p className="mt-3 text-sm text-slate-600">Cargando solicitudes...</p>
            ) : examAccessRequests.length === 0 ? (
              <p className="mt-3 text-sm text-slate-600">No hay solicitudes registradas.</p>
            ) : (
              <div className="mt-3 table-scroll-area w-full overflow-x-auto rounded-lg border border-slate-100">
                <table className="min-w-[760px] w-full text-left text-sm">
                  <thead className="themed-table-head border-b border-slate-200">
                    <tr>
                      <th className="px-2 py-2 font-bold">Usuario</th>
                      <th className="px-2 py-2 font-bold">Correo</th>
                      <th className="px-2 py-2 font-bold">Estado</th>
                      <th className="px-2 py-2 font-bold">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {examAccessRequests.map((request) => (
                      <tr key={request.id} className="border-b border-slate-100">
                        <td className="px-2 py-2 text-slate-800">{request.nombre || '-'}</td>
                        <td className="px-2 py-2 text-slate-700">{request.email}</td>
                        <td className="px-2 py-2">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                              request.estado === 'pendiente'
                                ? 'bg-amber-100 text-amber-700'
                                : request.estado === 'aprobada'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-rose-100 text-rose-700'
                            }`}
                          >
                            {request.estado}
                          </span>
                        </td>
                        <td className="px-2 py-2">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => void onApproveExamAccess(request.id, request.uid)}
                              disabled={request.estado !== 'pendiente'}
                              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              Aprobar
                            </button>
                            <button
                              type="button"
                              onClick={() => void onRejectExamAccess(request.id, request.uid)}
                              disabled={request.estado !== 'pendiente'}
                              className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              Rechazar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="text-sm font-semibold text-slate-900">Aprobación de exámenes</h2>
            <p className="mt-1 text-xs text-slate-500">Solo los exámenes aprobados aparecen para los demás usuarios.</p>

            {examApprovalRequestsLoading ? (
              <p className="mt-3 text-sm text-slate-600">Cargando exámenes pendientes...</p>
            ) : examApprovalRequests.length === 0 ? (
              <p className="mt-3 text-sm text-slate-600">No hay exámenes pendientes de aprobación.</p>
            ) : (
              <div className="mt-3 table-scroll-area w-full overflow-x-auto rounded-lg border border-slate-100">
                <table className="min-w-[760px] w-full text-left text-sm">
                  <thead className="themed-table-head border-b border-slate-200">
                    <tr>
                      <th className="px-2 py-2 font-bold">Examen</th>
                      <th className="px-2 py-2 font-bold">Creado por</th>
                      <th className="px-2 py-2 font-bold">Estado</th>
                      <th className="px-2 py-2 font-bold">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {examApprovalRequests.map((request) => (
                      <tr key={request.id} className="border-b border-slate-100">
                        <td className="px-2 py-2 text-slate-800">{request.titulo}</td>
                        <td className="px-2 py-2 text-slate-700">{request.creadoPorNombre}</td>
                        <td className="px-2 py-2">
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                            {request.estadoRevision}
                          </span>
                        </td>
                        <td className="px-2 py-2">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => void onApproveExam(request.id)}
                              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700"
                            >
                              Aprobar examen
                            </button>
                            <button
                              type="button"
                              onClick={() => void onRejectExam(request.id)}
                              className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-rose-700"
                            >
                              Rechazar examen
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </section>
  )
}
