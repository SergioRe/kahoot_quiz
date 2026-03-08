import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { collection, doc, getDoc, getDocs, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'
import AdminUsersDataTable from '../components/AdminUsersDataTable'

type HomeView = 'inicio' | 'perfil' | 'dashboard'
type UserRole = 'admin' | 'usuario'
type ColorTheme = 'azul' | 'morado' | 'emerald'

type UsuarioPerfil = {
  nombre: string
  email: string
  activo: boolean
  rol: UserRole
}

type UsuarioAdmin = {
  uid: string
  nombre: string
  email: string
  activo: boolean
  rol: UserRole
}

export default function HomePage() {
  const navigate = useNavigate()
  const [currentUid, setCurrentUid] = useState('')
  const [view, setView] = useState<HomeView>('inicio')
  const [perfil, setPerfil] = useState<UsuarioPerfil | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [nombre, setNombre] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [adminUsers, setAdminUsers] = useState<UsuarioAdmin[]>([])
  const [adminLoading, setAdminLoading] = useState(false)
  const [adminMessage, setAdminMessage] = useState('')
  const [colorTheme, setColorTheme] = useState<ColorTheme>('azul')

  const themeStyles: Record<ColorTheme, { main: string; surface: string; accent: string }> = {
    azul: {
      main: 'bg-gradient-to-b from-blue-300 via-blue-500 to-indigo-900',
      surface: 'bg-white',
      accent: 'Azul',
    },
    morado: {
      main: 'bg-gradient-to-b from-violet-300 via-purple-500 to-fuchsia-900',
      surface: 'bg-violet-50',
      accent: 'Morado',
    },
    emerald: {
      main: 'bg-gradient-to-b from-emerald-200 via-teal-500 to-cyan-900',
      surface: 'bg-emerald-50',
      accent: 'Verde',
    },
  }

  useEffect(() => {
    const savedTheme = localStorage.getItem('home-color-theme') as ColorTheme | null
    if (savedTheme && (savedTheme === 'azul' || savedTheme === 'morado' || savedTheme === 'emerald')) {
      setColorTheme(savedTheme)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('home-color-theme', colorTheme)
  }, [colorTheme])

  const handleToggleTheme = () => {
    setColorTheme((prevTheme) => {
      if (prevTheme === 'azul') return 'morado'
      if (prevTheme === 'morado') return 'emerald'
      return 'azul'
    })
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate('/', { replace: true })
        return
      }

      setCurrentUid(user.uid)
      const userRef = doc(db, 'usuarios', user.uid)
      const userSnap = await getDoc(userRef)

      if (!userSnap.exists()) {
        const profileBase: UsuarioPerfil = {
          nombre: user.displayName ?? '',
          email: user.email ?? '',
          activo: true,
          rol: 'usuario',
        }

        await setDoc(userRef, {
          uid: user.uid,
          ...profileBase,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })

        setPerfil(profileBase)
        setNombre(profileBase.nombre)
        setLoading(false)
        return
      }

      const data = userSnap.data() as Partial<UsuarioPerfil>
      const activo = typeof data.activo === 'boolean' ? data.activo : true
      const rol: UserRole = data.rol === 'admin' ? 'admin' : 'usuario'

      if (typeof data.activo !== 'boolean' || typeof data.rol !== 'string') {
        await updateDoc(userRef, {
          activo,
          rol,
          updatedAt: serverTimestamp(),
        })
      }

      const profile: UsuarioPerfil = {
        nombre: data.nombre ?? '',
        email: data.email ?? user.email ?? '',
        activo,
        rol,
      }

      setPerfil(profile)
      setNombre(profile.nombre)
      setLoading(false)
    })

    return unsubscribe
  }, [navigate])

  useEffect(() => {
    const loadUsers = async () => {
      if (!perfil || perfil.rol !== 'admin' || view !== 'dashboard') {
        return
      }

      try {
        setAdminLoading(true)
        setAdminMessage('')
        const usersSnapshot = await getDocs(collection(db, 'usuarios'))
        const users = usersSnapshot.docs.map((docItem) => {
          const data = docItem.data() as Partial<UsuarioAdmin>
          const rol: UserRole = data.rol === 'admin' ? 'admin' : 'usuario'
          return {
            uid: docItem.id,
            nombre: data.nombre ?? '',
            email: data.email ?? '',
            activo: typeof data.activo === 'boolean' ? data.activo : true,
            rol,
          }
        })

        setAdminUsers(users)
      } catch {
        setAdminMessage('No se pudo cargar el dashboard administrativo.')
      } finally {
        setAdminLoading(false)
      }
    }

    void loadUsers()
  }, [perfil, view])

  const handleLogout = async () => {
    await signOut(auth)
    navigate('/', { replace: true })
  }

  const handleSaveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!currentUid || !perfil) {
      return
    }

    try {
      setSaving(true)
      setStatusMessage('')

      const userRef = doc(db, 'usuarios', currentUid)
      await updateDoc(userRef, {
        nombre,
        updatedAt: serverTimestamp(),
      })

      setPerfil((prev) => (prev ? { ...prev, nombre } : prev))
      setEditing(false)
      setStatusMessage('Perfil actualizado correctamente.')
    } catch {
      setStatusMessage('No se pudo actualizar el perfil. Inténtalo de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActivo = async (userId: string, nextValue: boolean) => {
    try {
      setAdminMessage('')
      await updateDoc(doc(db, 'usuarios', userId), {
        activo: nextValue,
        updatedAt: serverTimestamp(),
      })

      setAdminUsers((prev) => prev.map((item) => (item.uid === userId ? { ...item, activo: nextValue } : item)))
    } catch {
      setAdminMessage('No se pudo actualizar el estado del usuario.')
    }
  }

  const handleToggleRol = async (userId: string, nextValue: UserRole) => {
    if (userId === currentUid) {
      setAdminMessage('No puedes cambiar tu propio rol desde el dashboard.')
      return
    }

    try {
      setAdminMessage('')
      await updateDoc(doc(db, 'usuarios', userId), {
        rol: nextValue,
        updatedAt: serverTimestamp(),
      })

      setAdminUsers((prev) => prev.map((item) => (item.uid === userId ? { ...item, rol: nextValue } : item)))
    } catch {
      setAdminMessage('No se pudo actualizar el rol del usuario.')
    }
  }

  const totalUsers = adminUsers.length
  const activeUsers = adminUsers.filter((item) => item.activo).length
  const inactiveUsers = totalUsers - activeUsers
  const adminCount = adminUsers.filter((item) => item.rol === 'admin').length
  const activeRate = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0
  const inactiveRate = totalUsers > 0 ? Math.round((inactiveUsers / totalUsers) * 100) : 0
  const currentTheme = themeStyles[colorTheme]
  const viewTitle = view === 'inicio' ? 'Inicio' : view === 'perfil' ? 'Editar datos del perfil' : 'Dashboard admin'

  if (loading || !perfil) {
    return (
      <main className={`flex min-h-screen items-center justify-center p-6 ${currentTheme.main}`}>
        <section className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl">
          <p className="text-sm text-slate-600">Cargando perfil...</p>
        </section>
      </main>
    )
  }

  if (!perfil.activo) {
    return (
      <main className={`flex min-h-screen items-center justify-center p-6 ${currentTheme.main}`}>
        <section className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
          <h1 className="text-2xl font-bold text-slate-900">Usuario inactivo</h1>
          <p className="mt-2 text-sm text-slate-600">
            Tu cuenta está registrada, pero actualmente no está activa. Contacta al administrador.
          </p>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-6 w-full rounded-lg bg-gradient-to-r from-indigo-600 to-blue-500 px-4 py-2.5 text-sm font-bold text-white transition hover:brightness-105"
          >
            Cerrar sesión
          </button>
        </section>
      </main>
    )
  }

  return (
    <main className={`min-h-screen p-4 md:p-6 ${currentTheme.main}`}>
      <section className={`w-full rounded-2xl p-4 shadow-2xl md:p-6 ${currentTheme.surface}`}>
        <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
          <aside className="rounded-2xl border border-slate-200 bg-white/80 p-4">
            <h1 className="text-xl font-bold text-slate-900">Panel</h1>
            <p className="mt-1 text-xs text-slate-500">Bienvenido, {perfil.nombre || perfil.email}</p>

            <nav className="mt-5 grid gap-2">
              <button
                type="button"
                onClick={() => setView('inicio')}
                className={`rounded-lg px-4 py-2 text-left text-sm font-semibold transition ${
                  view === 'inicio' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Inicio
              </button>
              <button
                type="button"
                onClick={() => setView('perfil')}
                className={`rounded-lg px-4 py-2 text-left text-sm font-semibold transition ${
                  view === 'perfil' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Editar datos del perfil
              </button>
              <button
                type="button"
                onClick={() => setView('dashboard')}
                className={`rounded-lg px-4 py-2 text-left text-sm font-semibold transition ${
                  view === 'dashboard' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Dashboard admin
              </button>
            </nav>

            <div className="mt-6 grid gap-2">
              <button
                type="button"
                onClick={handleToggleTheme}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Cambiar color ({currentTheme.accent})
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg bg-gradient-to-r from-indigo-600 to-blue-500 px-4 py-2 text-sm font-semibold text-white transition hover:brightness-105"
              >
                Cerrar sesión
              </button>
            </div>
          </aside>

          <section className="rounded-2xl border border-slate-200 bg-white/80 p-4 md:p-5">
            <header className="mb-5 border-b border-slate-200 pb-3">
              <h2 className="text-2xl font-bold text-slate-900">{viewTitle}</h2>
            </header>

            {view === 'inicio' && (
              <div className="rounded-xl border border-slate-200 p-4">
                <p className="text-sm text-slate-700">Tu usuario está activo y puedes gestionar tus datos desde el menú.</p>
              </div>
            )}

            {view === 'perfil' && (
              <form className="grid gap-3 rounded-xl border border-slate-200 p-4" onSubmit={handleSaveProfile}>
                <label htmlFor="profileName" className="text-sm font-semibold text-slate-700">
                  Nombre
                </label>
                <input
                  id="profileName"
                  type="text"
                  value={nombre}
                  onChange={(event) => setNombre(event.target.value)}
                  disabled={!editing}
                  required
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:bg-slate-100"
                />

                <label htmlFor="profileEmail" className="text-sm font-semibold text-slate-700">
                  Correo electrónico
                </label>
                <input
                  id="profileEmail"
                  type="email"
                  value={perfil.email}
                  disabled
                  className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-900"
                />

                <div className="mt-2 flex gap-2">
                  {!editing ? (
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(true)
                        setStatusMessage('')
                      }}
                      className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                      Editar
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={saving}
                      className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {saving ? 'Guardando...' : 'Guardar'}
                    </button>
                  )}
                </div>

                {statusMessage && <p className="text-sm text-slate-600">{statusMessage}</p>}
              </form>
            )}

            {view === 'dashboard' && (
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
                  onToggleActivo={handleToggleActivo}
                  onToggleRol={handleToggleRol}
                />
                  </>
                )}
              </section>
            )}
          </section>
        </div>
      </section>
    </main>
  )
}
