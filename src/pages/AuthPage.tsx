import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword } from 'firebase/auth'
import { doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'

type Mode = 'login' | 'register'

function mapFirebaseError(code: string) {
  const errorMap: Record<string, string> = {
    'auth/invalid-email': 'El correo no es válido.',
    'auth/invalid-credential': 'Correo o contraseña incorrectos.',
    'auth/user-not-found': 'No existe una cuenta con ese correo.',
    'auth/wrong-password': 'La contraseña es incorrecta.',
    'auth/email-already-in-use': 'Ese correo ya está registrado.',
    'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
  }

  return errorMap[code] ?? 'Ocurrió un error, inténtalo nuevamente.'
}

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        navigate('/inicio', { replace: true })
      }
    })

    return unsubscribe
  }, [navigate])

  const title = useMemo(() => (mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'), [mode])

  const clearForm = () => {
    setPassword('')
    setConfirmPassword('')
  }

  const toggleMode = () => {
    setMode((prevMode) => (prevMode === 'login' ? 'register' : 'login'))
    setMessage('')
    clearForm()
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setMessage('')

    if (mode === 'register' && password !== confirmPassword) {
      setMessage('Las contraseñas no coinciden.')
      return
    }

    try {
      setLoading(true)

      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, password)
        navigate('/inicio', { replace: true })
      } else {
        const credentials = await createUserWithEmailAndPassword(auth, email, password)

        await setDoc(doc(db, 'usuarios', credentials.user.uid), {
          uid: credentials.user.uid,
          nombre: name,
          email,
          activo: true,
          rol: 'usuario',
          puedeGestionarExamenes: false,
          colorTheme: 'azul',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })

        navigate('/inicio', { replace: true })
      }

      clearForm()
    } catch (error) {
      const errorCode = (error as { code?: string }).code
      setMessage(mapFirebaseError(errorCode ?? ''))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-blue-300 via-blue-500 to-indigo-900 p-6">
      <section className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl" aria-label="Formulario de autenticación">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {mode === 'login'
              ? 'Accede con tu correo y contraseña.'
              : 'Regístrate para crear una cuenta nueva.'}
          </p>
        </div>

        <form className="mt-6 grid gap-3" onSubmit={handleSubmit}>
          {mode === 'register' && (
            <>
              <label htmlFor="name" className="text-sm font-semibold text-slate-700">
                Nombre
              </label>
              <input
                id="name"
                type="text"
                placeholder="Tu nombre"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              />
            </>
          )}

          <label htmlFor="email" className="text-sm font-semibold text-slate-700">
            Correo electrónico
          </label>
          <input
            id="email"
            type="email"
            placeholder="tu@correo.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          />

          <label htmlFor="password" className="text-sm font-semibold text-slate-700">
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          />

          {mode === 'register' && (
            <>
              <label htmlFor="confirmPassword" className="text-sm font-semibold text-slate-700">
                Confirmar contraseña
              </label>
              <input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              />
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-lg bg-gradient-to-r from-indigo-600 to-blue-500 px-4 py-2.5 text-sm font-bold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? 'Procesando...' : mode === 'login' ? 'Entrar' : 'Registrarme'}
          </button>
        </form>

        {message && <p className="mt-4 text-center text-sm text-slate-600">{message}</p>}

        <p className="mt-5 text-center text-sm text-slate-600">
          {mode === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
          <button type="button" onClick={toggleMode} className="font-semibold text-indigo-600 hover:underline">
            {mode === 'login' ? 'Regístrate' : 'Inicia sesión'}
          </button>
        </p>
      </section>
    </main>
  )
}
