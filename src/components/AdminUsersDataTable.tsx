import { useMemo, useState } from 'react'

type UserRole = 'admin' | 'usuario'
type StatusFilter = 'todos' | 'activos' | 'inactivos'
type SortKey = 'nombre' | 'email' | 'rol' | 'activo'
type SortDir = 'asc' | 'desc'

type UsuarioAdmin = {
  uid: string
  nombre: string
  email: string
  activo: boolean
  rol: UserRole
}

type Props = {
  users: UsuarioAdmin[]
  loading: boolean
  message: string
  currentUid: string
  onToggleActivo: (userId: string, nextValue: boolean) => Promise<void>
  onToggleRol: (userId: string, nextValue: UserRole) => Promise<void>
}

const pageSize = 8
const sanitizeCsvCell = (value: string) => {
  const text = String(value)
  return /^[=+\-@]/.test(text) ? `'${text}` : text
}

export default function AdminUsersDataTable({
  users,
  loading,
  message,
  currentUid,
  onToggleActivo,
  onToggleRol,
}: Props) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('todos')
  const [roleFilter, setRoleFilter] = useState<UserRole | 'todos'>('todos')
  const [sortKey, setSortKey] = useState<SortKey>('nombre')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [page, setPage] = useState(1)

  const processedUsers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    const filtered = users.filter((item) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        item.nombre.toLowerCase().includes(normalizedSearch) ||
        item.email.toLowerCase().includes(normalizedSearch)

      const matchesStatus =
        statusFilter === 'todos' ||
        (statusFilter === 'activos' && item.activo) ||
        (statusFilter === 'inactivos' && !item.activo)

      const matchesRole = roleFilter === 'todos' || item.rol === roleFilter

      return matchesSearch && matchesStatus && matchesRole
    })

    const sorted = [...filtered].sort((a, b) => {
      const direction = sortDir === 'asc' ? 1 : -1

      if (sortKey === 'activo') {
        return (Number(a.activo) - Number(b.activo)) * direction
      }

      const aValue = a[sortKey].toString().toLowerCase()
      const bValue = b[sortKey].toString().toLowerCase()
      return aValue.localeCompare(bValue) * direction
    })

    return sorted
  }, [users, search, statusFilter, roleFilter, sortKey, sortDir])

  const totalPages = Math.max(1, Math.ceil(processedUsers.length / pageSize))

  const pagedUsers = useMemo(() => {
    const safePage = Math.min(page, totalPages)
    const start = (safePage - 1) * pageSize
    return processedUsers.slice(start, start + pageSize)
  }, [processedUsers, page, totalPages])

  const handleSort = (nextKey: SortKey) => {
    setPage(1)
    if (sortKey === nextKey) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))
      return
    }
    setSortKey(nextKey)
    setSortDir('asc')
  }

  const goToPage = (nextPage: number) => {
    if (nextPage < 1 || nextPage > totalPages) {
      return
    }
    setPage(nextPage)
  }

  const activeCount = users.filter((item) => item.activo).length
  const inactiveCount = users.length - activeCount
  const adminCount = users.filter((item) => item.rol === 'admin').length

  const handleExportCsv = () => {
    const headers = ['uid', 'nombre', 'email', 'rol', 'activo']
    const rows = users.map((item) => [
      sanitizeCsvCell(item.uid),
      sanitizeCsvCell(item.nombre),
      sanitizeCsvCell(item.email),
      sanitizeCsvCell(item.rol),
      sanitizeCsvCell(item.activo ? 'true' : 'false'),
    ])
    const csvContent = [headers, ...rows]
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'usuarios-dashboard.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <section className="min-w-0 grid gap-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <article className="rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-semibold uppercase text-slate-500">Total usuarios</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{users.length}</p>
        </article>
        <article className="rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-semibold uppercase text-slate-500">Activos</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">{activeCount}</p>
        </article>
        <article className="rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-semibold uppercase text-slate-500">Inactivos</p>
          <p className="mt-1 text-2xl font-bold text-rose-600">{inactiveCount}</p>
        </article>
        <article className="rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-semibold uppercase text-slate-500">Admins</p>
          <p className="mt-1 text-2xl font-bold text-indigo-600">{adminCount}</p>
        </article>
      </div>

      <div className="min-w-0 rounded-xl border border-slate-200 p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Project List / User Management</h2>
            <p className="text-xs text-slate-500">DataTable con acciones administrativas y trazabilidad de usuarios</p>
          </div>
          <button
            type="button"
            onClick={handleExportCsv}
            className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 sm:w-auto"
          >
            Exportar CSV
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <div className="relative">
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
              placeholder="Buscar por nombre o correo"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setPage(1)
              }}
              className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value as StatusFilter)
              setPage(1)
            }}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          >
            <option value="todos">Todos los estados</option>
            <option value="activos">Activos</option>
            <option value="inactivos">Inactivos</option>
          </select>

          <select
            value={roleFilter}
            onChange={(event) => {
              setRoleFilter(event.target.value as UserRole | 'todos')
              setPage(1)
            }}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          >
            <option value="todos">Todos los roles</option>
            <option value="admin">Admin</option>
            <option value="usuario">Usuario</option>
          </select>

          <select
            value={`${sortKey}:${sortDir}`}
            onChange={(event) => {
              const [nextKey, nextDir] = event.target.value.split(':') as [SortKey, SortDir]
              setSortKey(nextKey)
              setSortDir(nextDir)
            }}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          >
            <option value="nombre:asc">Nombre A-Z</option>
            <option value="nombre:desc">Nombre Z-A</option>
            <option value="email:asc">Correo A-Z</option>
            <option value="email:desc">Correo Z-A</option>
            <option value="rol:asc">Rol A-Z</option>
            <option value="activo:desc">Estado (activos primero)</option>
          </select>
        </div>

        <p className="mt-4 mb-2 text-[11px] font-semibold text-slate-500 sm:hidden">← Desliza para ver más columnas →</p>
        <div className="table-scroll-area w-full overflow-x-auto overflow-y-auto rounded-lg border border-slate-100 max-h-[26rem]">
          <table className="min-w-[860px] w-full text-left text-sm">
            <thead>
              <tr className="themed-table-head border-b border-slate-200">
                  <th className="px-2 py-2 font-bold">
                  <button type="button" onClick={() => handleSort('nombre')} className="hover:text-slate-900">
                    Nombre
                  </button>
                </th>
                  <th className="px-2 py-2 font-bold">
                  <button type="button" onClick={() => handleSort('email')} className="hover:text-slate-900">
                    Correo
                  </button>
                </th>
                  <th className="px-2 py-2 font-bold">
                  <button type="button" onClick={() => handleSort('rol')} className="hover:text-slate-900">
                    Rol
                  </button>
                </th>
                  <th className="px-2 py-2 font-bold">
                  <button type="button" onClick={() => handleSort('activo')} className="hover:text-slate-900">
                    Estado
                  </button>
                </th>
                  <th className="px-2 py-2 font-bold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-2 py-4 text-slate-600">
                    Cargando usuarios...
                  </td>
                </tr>
              ) : pagedUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-2 py-4 text-slate-600">
                    No hay usuarios para mostrar con los filtros actuales.
                  </td>
                </tr>
              ) : (
                pagedUsers.map((item) => (
                  <tr key={item.uid} className="border-b border-slate-100">
                    <td className="px-2 py-2 text-slate-800">{item.nombre || '-'}</td>
                    <td className="px-2 py-2 text-slate-700">{item.email}</td>
                    <td className="px-2 py-2 text-slate-700">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          item.rol === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {item.rol}
                      </span>
                    </td>
                    <td className="px-2 py-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          item.activo ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {item.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => void onToggleActivo(item.uid, !item.activo)}
                          className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800"
                        >
                          {item.activo ? 'Desactivar' : 'Activar'}
                        </button>
                        <button
                          type="button"
                          onClick={() => void onToggleRol(item.uid, item.rol === 'admin' ? 'usuario' : 'admin')}
                          disabled={item.uid === currentUid}
                          className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {item.rol === 'admin' ? 'Quitar admin' : 'Hacer admin'}
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
            Mostrando {pagedUsers.length} de {processedUsers.length} registros filtrados
          </p>
          <div className="flex flex-nowrap items-center gap-1 overflow-x-auto text-[11px] sm:gap-2 sm:text-xs">
            <button
              type="button"
              onClick={() => goToPage(page - 1)}
              disabled={page <= 1}
              className="rounded-lg border border-slate-300 px-2 py-1 font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 sm:px-3 sm:py-1.5"
            >
              Anterior
            </button>
            <span className="whitespace-nowrap font-semibold text-slate-700">
              Página {Math.min(page, totalPages)}/{totalPages}
            </span>
            <button
              type="button"
              onClick={() => goToPage(page + 1)}
              disabled={page >= totalPages}
              className="rounded-lg border border-slate-300 px-2 py-1 font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 sm:px-3 sm:py-1.5"
            >
              Siguiente
            </button>
          </div>
        </div>

        {message && <p className="mt-3 text-sm text-slate-600">{message}</p>}
      </div>
    </section>
  )
}
