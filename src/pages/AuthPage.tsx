import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  fetchSignInMethodsForEmail,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
} from 'firebase/auth'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'

type Mode = 'login' | 'register'

function mapFirebaseError(code: string) {
  const errorMap: Record<string, string> = {
    'auth/invalid-email': 'Formato de correo inválido.',
    'auth/invalid-credential': 'Contraseña inválida.',
    'auth/user-not-found': 'Correo no registrado.',
    'auth/wrong-password': 'Contraseña inválida.',
    'auth/unauthorized-domain': 'Este dominio no está autorizado para iniciar sesión con Google. Contacta al administrador.',
    'auth/email-already-in-use': 'Usuario ya existe con este correo.',
    'auth/account-exists-with-different-credential': 'Usuario ya existe con este correo.',
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

    const normalizedEmail = email.trim().toLowerCase()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!emailRegex.test(normalizedEmail)) {
      setMessage('Formato de correo inválido.')
      return
    }

    if (mode === 'register' && password !== confirmPassword) {
      setMessage('Las contraseñas no coinciden.')
      return
    }

    try {
      setLoading(true)

      if (mode === 'login') {
        const methods = await fetchSignInMethodsForEmail(auth, normalizedEmail)
        if (!methods.includes('password')) {
          setMessage('Correo no registrado.')
          return
        }

        await signInWithEmailAndPassword(auth, normalizedEmail, password)
        navigate('/inicio', { replace: true })
      } else {
        const credentials = await createUserWithEmailAndPassword(auth, normalizedEmail, password)

        await setDoc(doc(db, 'usuarios', credentials.user.uid), {
          uid: credentials.user.uid,
          nombre: name,
          email: normalizedEmail,
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

  const handleLoginWithGoogle = async () => {
    try {
      setLoading(true)
      setMessage('')

      const provider = new GoogleAuthProvider()
      const { user } = await signInWithPopup(auth, provider)
      try {
        const userRef = doc(db, 'usuarios', user.uid)
        const userSnap = await getDoc(userRef)
        const googleName = (user.displayName ?? '').trim()
        const googleEmail = user.email ?? ''

        if (!userSnap.exists()) {
          await setDoc(userRef, {
            uid: user.uid,
            nombre: googleName,
            email: googleEmail,
            activo: true,
            rol: 'usuario',
            puedeGestionarExamenes: false,
            colorTheme: 'azul',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          })
        } else {
          const data = userSnap.data() as { nombre?: string; email?: string }
          const shouldUpdateName = Boolean(googleName) && (!data.nombre || data.nombre === data.email)
          const shouldUpdateEmail = Boolean(googleEmail) && data.email !== googleEmail

          if (shouldUpdateName || shouldUpdateEmail) {
            await setDoc(
              userRef,
              {
                ...(shouldUpdateName ? { nombre: googleName } : {}),
                ...(shouldUpdateEmail ? { email: googleEmail } : {}),
                updatedAt: serverTimestamp(),
              },
              { merge: true },
            )
          }
        }
      } catch {
        // Si falla la sincronización, HomePage normaliza/carga el perfil al entrar.
      }

      navigate('/inicio', { replace: true })
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
        <div className="text-center">
          <img src="/retocert.svg" alt="RetoCert" className="mx-auto mb-3 h-12 w-12 rounded-xl" />
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">RetoCert</p>
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
                maxLength={50}
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
            minLength={5}
            maxLength={50}
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
            minLength={5}
            maxLength={15}
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          />

          {mode === 'login' && (
            <button
              type="button"
              onClick={() => navigate('/recuperar-contrasena')}
              disabled={loading}
              className="justify-self-start text-xs font-semibold text-indigo-600 transition hover:underline disabled:cursor-not-allowed disabled:opacity-70"
            >
              ¿Olvidaste tu contraseña?
            </button>
          )}

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
                minLength={5}
                maxLength={15}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              />
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-blue-500 px-4 py-2.5 text-sm font-bold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? (
              'Procesando...'
            ) : mode === 'login' ? (
              <>
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                  <path d="M15 3h4a2 2 0 0 1 2 2v4" />
                  <path d="M10 14 21 3" />
                  <path d="M14 3H9a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" />
                </svg>
                <span>Entrar</span>
              </>
            ) : (
              <>
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="8.5" cy="7" r="4" />
                  <path d="M20 8v6" />
                  <path d="M17 11h6" />
                </svg>
                <span>Registrarme</span>
              </>
            )}
          </button>

          {mode === 'login' && (
            <button
              type="button"
              onClick={() => void handleLoginWithGoogle()}
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <svg aria-hidden="true" viewBox="0 0 48 48" className="h-5 w-5">
                <path
                  fill="#FFC107"
                  d="M43.611 20.083H42V20H24v8h11.303C33.655 32.657 29.199 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.955 3.045l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
                />
                <path
                  fill="#FF3D00"
                  d="M6.306 14.691l6.571 4.819C14.655 16.108 19.001 12 24 12c3.059 0 5.842 1.154 7.955 3.045l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
                />
                <path
                  fill="#4CAF50"
                  d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.172 35.091 26.715 36 24 36c-5.177 0-9.617-3.329-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
                />
                <path
                  fill="#1976D2"
                  d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.084 5.571l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
                />
              </svg>
              <span>Iniciar sesión con Google</span>
            </button>
          )}
        </form>

        {message && <p className="mt-4 text-center text-sm font-bold text-rose-600">{message}</p>}

        <div className="mt-5 text-sm text-slate-600">
          <span>{mode === 'login' ? '¿No tienes cuenta? ' : '¿Ya tienes cuenta? '}</span>
          <button type="button" onClick={toggleMode} className="font-semibold text-indigo-600 hover:underline">
            {mode === 'login' ? 'Regístrate' : 'Inicia sesión'}
          </button>
        </div>
      </section>
    </main>
  )
}
