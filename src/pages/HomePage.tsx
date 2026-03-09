import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, serverTimestamp, setDoc, updateDoc, writeBatch } from 'firebase/firestore'
import { auth, db } from '../firebase'
import InicioPage from './home/InicioPage'
import PerfilPage from './home/PerfilPage'
import ExamenesPage from './home/ExamenesPage'
import DashboardAdminPage from './home/DashboardAdminPage'

type HomeSection = 'inicio' | 'lista-examenes' | 'perfil' | 'dashboard'
type UserRole = 'admin' | 'usuario'
type ColorTheme = 'azul' | 'morado' | 'emerald' | 'negro' | 'blanco'

type ExamenPregunta = {
  texto: string
  respuestas: [string, string, string, string]
  correctaIndex: number
}

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

type ExamenListado = {
  id: string
  titulo: string
  descripcion: string
  totalPreguntas: number
}

export default function HomePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [currentUid, setCurrentUid] = useState('')
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
  const [examenTitulo, setExamenTitulo] = useState('')
  const [examenDescripcion, setExamenDescripcion] = useState('')
  const [preguntas, setPreguntas] = useState<ExamenPregunta[]>([
    { texto: '', respuestas: ['', '', '', ''], correctaIndex: 0 },
  ])
  const [savingExamen, setSavingExamen] = useState(false)
  const [examenMessage, setExamenMessage] = useState('')
  const [editingExamId, setEditingExamId] = useState<string | null>(null)
  const [showExamForm, setShowExamForm] = useState(false)
  const [deletingExamId, setDeletingExamId] = useState<string | null>(null)
  const [examenes, setExamenes] = useState<ExamenListado[]>([])
  const [examenesLoading, setExamenesLoading] = useState(false)
  const [examenesMessage, setExamenesMessage] = useState('')

  const themeStyles: Record<
    ColorTheme,
    { main: string; surface: string; accent: string; menuActive: string; actionPrimary: string; actionDanger: string }
  > = {
    azul: {
      main: 'bg-gradient-to-b from-blue-300 via-blue-500 to-indigo-900',
      surface: 'bg-white',
      accent: 'Azul',
      menuActive: 'bg-blue-600 text-white',
      actionPrimary: 'bg-blue-600 text-white hover:bg-blue-700',
      actionDanger: 'bg-indigo-600 text-white hover:bg-indigo-700',
    },
    morado: {
      main: 'bg-gradient-to-b from-violet-300 via-purple-500 to-fuchsia-900',
      surface: 'bg-violet-50',
      accent: 'Morado',
      menuActive: 'bg-violet-600 text-white',
      actionPrimary: 'bg-violet-600 text-white hover:bg-violet-700',
      actionDanger: 'bg-fuchsia-600 text-white hover:bg-fuchsia-700',
    },
    emerald: {
      main: 'bg-gradient-to-b from-emerald-200 via-teal-500 to-cyan-900',
      surface: 'bg-emerald-50',
      accent: 'Verde',
      menuActive: 'bg-emerald-600 text-white',
      actionPrimary: 'bg-emerald-600 text-white hover:bg-emerald-700',
      actionDanger: 'bg-teal-600 text-white hover:bg-teal-700',
    },
    negro: {
      main: 'bg-gradient-to-b from-slate-600 via-slate-800 to-black',
      surface: 'bg-slate-100',
      accent: 'Negro',
      menuActive: 'bg-slate-900 text-white',
      actionPrimary: 'bg-slate-900 text-white hover:bg-black',
      actionDanger: 'bg-slate-700 text-white hover:bg-slate-800',
    },
    blanco: {
      main: 'bg-gradient-to-b from-white via-slate-100 to-slate-300',
      surface: 'bg-white',
      accent: 'Blanco',
      menuActive: 'bg-slate-200 text-slate-900',
      actionPrimary: 'bg-slate-200 text-slate-900 hover:bg-slate-300',
      actionDanger: 'bg-slate-500 text-white hover:bg-slate-600',
    },
  }

  const colorOptions: Array<{ key: ColorTheme; label: string; bgClass: string }> = [
    { key: 'azul', label: 'Azul', bgClass: 'bg-blue-500' },
    { key: 'morado', label: 'Morado', bgClass: 'bg-violet-500' },
    { key: 'emerald', label: 'Verde', bgClass: 'bg-emerald-500' },
    { key: 'negro', label: 'Negro', bgClass: 'bg-slate-900' },
    { key: 'blanco', label: 'Blanco', bgClass: 'bg-white' },
  ]

  useEffect(() => {
    const savedTheme = localStorage.getItem('home-color-theme') as ColorTheme | null
    if (
      savedTheme &&
      (savedTheme === 'azul' ||
        savedTheme === 'morado' ||
        savedTheme === 'emerald' ||
        savedTheme === 'negro' ||
        savedTheme === 'blanco')
    ) {
      setColorTheme(savedTheme)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('home-color-theme', colorTheme)
  }, [colorTheme])

  const addQuestion = () => {
    setPreguntas((prev) => [...prev, { texto: '', respuestas: ['', '', '', ''], correctaIndex: 0 }])
  }

  const removeQuestion = (index: number) => {
    setPreguntas((prev) => prev.filter((_, questionIndex) => questionIndex !== index))
  }

  const updateQuestionText = (index: number, value: string) => {
    setPreguntas((prev) =>
      prev.map((question, questionIndex) => (questionIndex === index ? { ...question, texto: value } : question)),
    )
  }

  const updateAnswer = (questionIndex: number, answerIndex: number, value: string) => {
    setPreguntas((prev) =>
      prev.map((question, idx) => {
        if (idx !== questionIndex) {
          return question
        }

        const nextAnswers = [...question.respuestas] as [string, string, string, string]
        nextAnswers[answerIndex] = value

        return {
          ...question,
          respuestas: nextAnswers,
        }
      }),
    )
  }

  const updateCorrectAnswer = (questionIndex: number, correctIndex: number) => {
    setPreguntas((prev) =>
      prev.map((question, idx) => (idx === questionIndex ? { ...question, correctaIndex: correctIndex } : question)),
    )
  }

  const resetExamForm = () => {
    setExamenTitulo('')
    setExamenDescripcion('')
    setPreguntas([{ texto: '', respuestas: ['', '', '', ''], correctaIndex: 0 }])
    setEditingExamId(null)
  }

  const handleStartAddExam = () => {
    resetExamForm()
    setExamenMessage('')
    setShowExamForm(true)
  }

  const currentSection: HomeSection =
    location.pathname === '/perfil'
      ? 'perfil'
      : location.pathname === '/examenes'
        ? 'lista-examenes'
        : location.pathname === '/dashboard'
          ? 'dashboard'
          : 'inicio'

  useEffect(() => {
    const validPaths = ['/inicio', '/perfil', '/examenes', '/dashboard']
    if (!validPaths.includes(location.pathname)) {
      navigate('/inicio', { replace: true })
    }
  }, [location.pathname, navigate])

  const fetchExamenes = async () => {
    try {
      setExamenesLoading(true)
      setExamenesMessage('')

      const snapshot = await getDocs(collection(db, 'examenes'))
      const list = snapshot.docs
        .map((docItem) => {
          const data = docItem.data() as Partial<ExamenListado> & { isSeed?: boolean }
          return {
            id: docItem.id,
            titulo: data.titulo ?? 'Sin título',
            descripcion: data.descripcion ?? '',
            totalPreguntas: typeof data.totalPreguntas === 'number' ? data.totalPreguntas : 0,
            isSeed: data.isSeed === true,
          }
        })
        .filter((item) => !item.isSeed)
        .map(({ isSeed: _, ...item }) => item)

      setExamenes(list)
    } catch {
      setExamenesMessage('No se pudieron cargar los exámenes.')
    } finally {
      setExamenesLoading(false)
    }
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
      if (!perfil || perfil.rol !== 'admin' || currentSection !== 'dashboard') {
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
  }, [perfil, currentSection])

  useEffect(() => {
    if (!perfil || currentSection !== 'lista-examenes') {
      return
    }

    void fetchExamenes()
  }, [perfil, currentSection])

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

  const handleSaveExam = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setExamenMessage('')

    if (!perfil || !currentUid) {
      return
    }

    if (!examenTitulo.trim()) {
      setExamenMessage('Debes ingresar un título para el examen.')
      return
    }

    if (preguntas.length === 0) {
      setExamenMessage('Debes agregar al menos una pregunta.')
      return
    }

    const hasInvalidQuestion = preguntas.some(
      (question) => !question.texto.trim() || question.respuestas.some((answer) => !answer.trim()),
    )

    if (hasInvalidQuestion) {
      setExamenMessage('Completa el texto y las 4 respuestas de todas las preguntas.')
      return
    }

    try {
      setSavingExamen(true)

      const examId = editingExamId
        ? editingExamId
        : (
            await addDoc(collection(db, 'examenes'), {
              titulo: examenTitulo.trim(),
              descripcion: examenDescripcion.trim(),
              creadoPorUid: currentUid,
              creadoPorNombre: perfil.nombre || perfil.email,
              creadoPorEmail: perfil.email,
              totalPreguntas: preguntas.length,
              activo: true,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            })
          ).id

      if (editingExamId) {
        await updateDoc(doc(db, 'examenes', examId), {
          titulo: examenTitulo.trim(),
          descripcion: examenDescripcion.trim(),
          totalPreguntas: preguntas.length,
          updatedAt: serverTimestamp(),
        })
      }

      const questionCollectionRef = collection(db, 'examenes', examId, 'preguntas')
      const existingQuestions = await getDocs(questionCollectionRef)
      const batch = writeBatch(db)

      existingQuestions.forEach((questionDoc) => {
        batch.delete(questionDoc.ref)
      })

      preguntas.forEach((question, index) => {
        const questionRef = doc(questionCollectionRef)
        batch.set(questionRef, {
          texto: question.texto.trim(),
          respuestas: question.respuestas.map((answer) => answer.trim()),
          correctaIndex: question.correctaIndex,
          orden: index + 1,
          createdAt: serverTimestamp(),
        })
      })

      await batch.commit()
      setExamenMessage(editingExamId ? 'Examen actualizado correctamente.' : 'Examen guardado correctamente.')
      resetExamForm()
      setShowExamForm(false)
      navigate('/examenes')
      await fetchExamenes()
    } catch (error) {
      const firebaseError = error as { code?: string; message?: string }
      const errorCode = firebaseError.code ?? 'unknown-error'
      setExamenMessage(`No se pudo guardar el examen (${errorCode}).`)
    } finally {
      setSavingExamen(false)
    }
  }

  const handleEditExam = async (examId: string) => {
    try {
      setExamenesMessage('')
      const examDoc = await getDoc(doc(db, 'examenes', examId))
      if (!examDoc.exists()) {
        setExamenesMessage('El examen no existe.')
        return
      }

      const examData = examDoc.data() as Partial<ExamenListado>
      const questionsSnapshot = await getDocs(collection(db, 'examenes', examId, 'preguntas'))

      const questions = questionsSnapshot.docs
        .map((questionDoc) => {
          const data = questionDoc.data() as Partial<ExamenPregunta> & { orden?: number }
          const answers = Array.isArray(data.respuestas) ? data.respuestas : []
          return {
            texto: data.texto ?? '',
            respuestas: [
              answers[0] ?? '',
              answers[1] ?? '',
              answers[2] ?? '',
              answers[3] ?? '',
            ] as [string, string, string, string],
            correctaIndex: typeof data.correctaIndex === 'number' ? data.correctaIndex : 0,
            orden: typeof data.orden === 'number' ? data.orden : 0,
          }
        })
        .sort((a, b) => a.orden - b.orden)
        .map(({ orden: _, ...item }) => item)

      setExamenTitulo(examData.titulo ?? '')
      setExamenDescripcion(examData.descripcion ?? '')
      setPreguntas(questions.length > 0 ? questions : [{ texto: '', respuestas: ['', '', '', ''], correctaIndex: 0 }])
      setEditingExamId(examId)
      setExamenMessage('')
      setShowExamForm(true)
      navigate('/examenes')
    } catch {
      setExamenesMessage('No se pudo cargar el examen para edición.')
    }
  }

  const handleDeleteExam = async (examId: string) => {
    try {
      setDeletingExamId(examId)
      setExamenesMessage('')

      const questionsSnapshot = await getDocs(collection(db, 'examenes', examId, 'preguntas'))
      const batch = writeBatch(db)

      questionsSnapshot.forEach((questionDoc) => {
        batch.delete(questionDoc.ref)
      })

      await batch.commit()
      await deleteDoc(doc(db, 'examenes', examId))

      setExamenes((prev) => prev.filter((item) => item.id !== examId))
      setExamenesMessage('Examen eliminado correctamente.')
    } catch {
      setExamenesMessage('No se pudo eliminar el examen.')
    } finally {
      setDeletingExamId(null)
    }
  }


  const totalUsers = adminUsers.length
  const activeUsers = adminUsers.filter((item) => item.activo).length
  const inactiveUsers = totalUsers - activeUsers
  const adminCount = adminUsers.filter((item) => item.rol === 'admin').length
  const activeRate = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0
  const inactiveRate = totalUsers > 0 ? Math.round((inactiveUsers / totalUsers) * 100) : 0
  const currentTheme = themeStyles[colorTheme]
  const viewTitle =
    currentSection === 'inicio'
      ? 'Inicio'
      : currentSection === 'lista-examenes'
          ? 'Ver exámenes'
        : currentSection === 'perfil'
          ? 'Editar datos del perfil'
          : 'Dashboard admin'

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
    <main data-theme={colorTheme} className={`min-h-screen p-4 md:p-6 ${currentTheme.main}`}>
      <section className={`w-full rounded-2xl p-4 shadow-2xl md:p-6 ${currentTheme.surface}`}>
        <div className="grid items-start gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="h-fit rounded-2xl border border-slate-200 bg-white/80 p-4">
            <h1 className="text-xl font-bold text-slate-900">Panel</h1>
            <p className="mt-1 text-xs text-slate-500">Bienvenido, {perfil.nombre || perfil.email}</p>

            <nav className="mt-5 grid gap-2">
              <button
                type="button"
                onClick={() => navigate('/inicio')}
                className={`w-full rounded-lg px-4 py-2 text-left text-sm font-semibold transition ${
                  currentSection === 'inicio' ? currentTheme.menuActive : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Inicio
              </button>
              <button
                type="button"
                onClick={() => navigate('/examenes')}
                className={`w-full rounded-lg px-4 py-2 text-left text-sm font-semibold transition ${
                  currentSection === 'lista-examenes'
                    ? currentTheme.menuActive
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Ver exámenes
              </button>
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className={`w-full rounded-lg px-4 py-2 text-left text-sm font-semibold transition ${
                  currentSection === 'dashboard'
                    ? currentTheme.menuActive
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Dashboard admin
              </button>
            </nav>
          </aside>

          <section className="min-w-0 rounded-2xl border border-slate-200 bg-white/80 p-4 md:p-5">
            <header className="mb-5 border-b border-slate-200 pb-3">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <h2 className="text-2xl font-bold text-slate-900">{viewTitle}</h2>

                <details className="group relative ml-auto w-full lg:w-auto">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 lg:min-w-[180px]">
                    <span>Mi cuenta</span>
                    <span className="text-xs text-slate-500 group-open:hidden" aria-hidden="true">
                      ▾
                    </span>
                    <span className="hidden text-xs text-slate-500 group-open:block" aria-hidden="true">
                      ▴
                    </span>
                  </summary>

                  <div className="pointer-events-none invisible absolute right-0 top-full z-30 mt-2 grid w-[min(92vw,340px)] gap-2 rounded-xl border border-slate-200 bg-white p-3 opacity-0 shadow-xl transition group-open:pointer-events-auto group-open:visible group-open:opacity-100">
                    <button
                      type="button"
                      onClick={() => navigate('/perfil')}
                      className={`inline-flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-semibold transition ${currentTheme.actionPrimary}`}
                    >
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="h-4 w-4"
                      >
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
                      </svg>
                      <span>Editar datos del perfil</span>
                    </button>

                    <div className="rounded-lg border border-slate-300 bg-white px-3 py-2">
                      <p className="text-xs font-semibold text-slate-600">Color del tema ({currentTheme.accent})</p>
                      <div className="mt-2 flex items-center gap-2">
                        {colorOptions.map((option) => {
                          const isActive = colorTheme === option.key
                          return (
                            <div key={option.key} className="group relative">
                              <button
                                type="button"
                                onClick={() => setColorTheme(option.key)}
                                aria-label={`Seleccionar tema ${option.label}`}
                                className={`h-7 w-7 rounded-full border-2 transition ${
                                  isActive
                                    ? 'border-slate-900 ring-2 ring-slate-300'
                                    : 'border-slate-300 hover:border-slate-500'
                                } ${option.key === 'blanco' ? 'shadow-inner' : ''} ${option.bgClass}`}
                              />
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleLogout}
                      className={`inline-flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-semibold transition ${currentTheme.actionDanger}`}
                    >
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="h-4 w-4"
                      >
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <path d="M16 17l5-5-5-5" />
                        <path d="M21 12H9" />
                      </svg>
                      <span>Cerrar sesión</span>
                    </button>
                  </div>
                </details>
              </div>
            </header>

            {currentSection === 'inicio' && <InicioPage />}

            {currentSection === 'perfil' && (
              <PerfilPage
                nombre={nombre}
                email={perfil.email}
                editing={editing}
                saving={saving}
                statusMessage={statusMessage}
                onNombreChange={setNombre}
                onStartEdit={() => {
                  setEditing(true)
                  setStatusMessage('')
                }}
                onSubmit={handleSaveProfile}
              />
            )}

            {currentSection === 'dashboard' && (
              <DashboardAdminPage
                perfil={perfil}
                totalUsers={totalUsers}
                activeUsers={activeUsers}
                inactiveUsers={inactiveUsers}
                adminCount={adminCount}
                activeRate={activeRate}
                inactiveRate={inactiveRate}
                adminUsers={adminUsers}
                adminLoading={adminLoading}
                adminMessage={adminMessage}
                currentUid={currentUid}
                onToggleActivo={handleToggleActivo}
                onToggleRol={handleToggleRol}
              />
            )}

            {currentSection === 'lista-examenes' && (
              <ExamenesPage
                showExamForm={showExamForm}
                editingExamId={editingExamId}
                examenTitulo={examenTitulo}
                examenDescripcion={examenDescripcion}
                preguntas={preguntas}
                savingExamen={savingExamen}
                examenMessage={examenMessage}
                examenes={examenes}
                examenesLoading={examenesLoading}
                examenesMessage={examenesMessage}
                deletingExamId={deletingExamId}
                onShowAdd={handleStartAddExam}
                onExamTitleChange={setExamenTitulo}
                onExamDescriptionChange={setExamenDescripcion}
                onAddQuestion={addQuestion}
                onRemoveQuestion={removeQuestion}
                onQuestionTextChange={updateQuestionText}
                onAnswerChange={updateAnswer}
                onCorrectAnswerChange={updateCorrectAnswer}
                onCancel={() => {
                  resetExamForm()
                  setShowExamForm(false)
                  setExamenMessage('')
                }}
                onSubmit={handleSaveExam}
                onEditExam={handleEditExam}
                onDeleteExam={handleDeleteExam}
              />
            )}
          </section>
        </div>
      </section>
    </main>
  )
}
