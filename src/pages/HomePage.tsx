import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, serverTimestamp, setDoc, updateDoc, writeBatch } from 'firebase/firestore'
import { auth, db } from '../firebase'
import AdminUsersDataTable from '../components/AdminUsersDataTable'
import ExamenesDataTable from '../components/ExamenesDataTable'

type HomeView = 'inicio' | 'examen' | 'lista-examenes' | 'perfil' | 'dashboard'
type UserRole = 'admin' | 'usuario'
type ColorTheme = 'azul' | 'morado' | 'emerald'

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
  const [examenTitulo, setExamenTitulo] = useState('')
  const [examenDescripcion, setExamenDescripcion] = useState('')
  const [preguntas, setPreguntas] = useState<ExamenPregunta[]>([
    { texto: '', respuestas: ['', '', '', ''], correctaIndex: 0 },
  ])
  const [savingExamen, setSavingExamen] = useState(false)
  const [examenMessage, setExamenMessage] = useState('')
  const [editingExamId, setEditingExamId] = useState<string | null>(null)
  const [deletingExamId, setDeletingExamId] = useState<string | null>(null)
  const [examenes, setExamenes] = useState<ExamenListado[]>([])
  const [examenesLoading, setExamenesLoading] = useState(false)
  const [examenesMessage, setExamenesMessage] = useState('')

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

  useEffect(() => {
    if (!perfil || view !== 'lista-examenes') {
      return
    }

    void fetchExamenes()
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
      setView('lista-examenes')
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
      setView('examen')
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
    view === 'inicio'
      ? 'Inicio'
      : view === 'examen'
        ? editingExamId
          ? 'Editar examen'
          : 'Registrar examen'
        : view === 'lista-examenes'
          ? 'Ver exámenes'
        : view === 'perfil'
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
                onClick={() => setView('examen')}
                className={`rounded-lg px-4 py-2 text-left text-sm font-semibold transition ${
                  view === 'examen' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Registrar examen
              </button>
              <button
                type="button"
                onClick={() => setView('lista-examenes')}
                className={`rounded-lg px-4 py-2 text-left text-sm font-semibold transition ${
                  view === 'lista-examenes' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Ver exámenes
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

            {view === 'examen' && (
              <form className="grid gap-4 rounded-xl border border-slate-200 p-4" onSubmit={handleSaveExam}>
                <div className="grid gap-2">
                  <label htmlFor="examTitle" className="text-sm font-semibold text-slate-700">
                    Título del examen
                  </label>
                  <input
                    id="examTitle"
                    type="text"
                    value={examenTitulo}
                    onChange={(event) => setExamenTitulo(event.target.value)}
                    placeholder="Ejemplo: Matemática básica"
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                  />
                </div>

                <div className="grid gap-2">
                  <label htmlFor="examDescription" className="text-sm font-semibold text-slate-700">
                    Descripción (opcional)
                  </label>
                  <textarea
                    id="examDescription"
                    value={examenDescripcion}
                    onChange={(event) => setExamenDescripcion(event.target.value)}
                    rows={3}
                    placeholder="Describe brevemente el examen"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                  />
                </div>

                <div className="grid gap-4">
                  {preguntas.map((question, questionIndex) => (
                    <article key={questionIndex} className="rounded-xl border border-slate-200 p-4">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <h3 className="text-sm font-bold text-slate-900">Pregunta {questionIndex + 1}</h3>
                        {preguntas.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeQuestion(questionIndex)}
                            className="rounded-lg border border-rose-300 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                          >
                            Eliminar
                          </button>
                        )}
                      </div>

                      <label className="text-xs font-semibold uppercase text-slate-500">Texto de la pregunta</label>
                      <input
                        type="text"
                        value={question.texto}
                        onChange={(event) => updateQuestionText(questionIndex, event.target.value)}
                        placeholder="Escribe la pregunta"
                        required
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                      />

                      <div className="mt-4 grid gap-2">
                        {question.respuestas.map((answer, answerIndex) => (
                          <div key={answerIndex} className="flex items-center gap-2">
                            <input
                              type="radio"
                              name={`correct-${questionIndex}`}
                              checked={question.correctaIndex === answerIndex}
                              onChange={() => updateCorrectAnswer(questionIndex, answerIndex)}
                              className="h-4 w-4"
                            />
                            <input
                              type="text"
                              value={answer}
                              onChange={(event) => updateAnswer(questionIndex, answerIndex, event.target.value)}
                              placeholder={`Respuesta ${answerIndex + 1}`}
                              required
                              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                            />
                          </div>
                        ))}
                        <p className="text-xs text-slate-500">Marca con el radio la opción correcta.</p>
                      </div>
                    </article>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={addQuestion}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    + Agregar pregunta
                  </button>
                  <button
                    type="submit"
                    disabled={savingExamen}
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {savingExamen ? 'Guardando...' : editingExamId ? 'Guardar cambios' : 'Guardar examen'}
                  </button>
                  {editingExamId && (
                    <button
                      type="button"
                      onClick={() => {
                        resetExamForm()
                        setExamenMessage('')
                      }}
                      className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      Cancelar edición
                    </button>
                  )}
                </div>

                {examenMessage && <p className="text-sm text-slate-600">{examenMessage}</p>}
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

            {view === 'lista-examenes' && (
              <ExamenesDataTable
                examenes={examenes}
                loading={examenesLoading}
                message={examenesMessage}
                deletingExamId={deletingExamId ?? undefined}
                onEdit={handleEditExam}
                onDelete={handleDeleteExam}
              />
            )}
          </section>
        </div>
      </section>
    </main>
  )
}
