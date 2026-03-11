import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { sendPasswordResetEmail } from 'firebase/auth'
import { auth } from '../firebase'

function mapResetError(code: string) {
  const errorMap: Record<string, string> = {
    'auth/invalid-email': 'Formato de correo inválido.',
    'auth/user-not-found': 'Correo no registrado.',
  }

  return errorMap[code] ?? 'No se pudo enviar el correo de recuperación. Inténtalo nuevamente.'
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setMessage('')
    setIsSuccess(false)

    const normalizedEmail = email.trim().toLowerCase()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!emailRegex.test(normalizedEmail)) {
      setMessage('Formato de correo inválido.')
      return
    }

    try {
      setLoading(true)
      await sendPasswordResetEmail(auth, normalizedEmail)
      setMessage('Enviado.')
      setIsSuccess(true)
    } catch (error) {
      const errorCode = (error as { code?: string }).code
      setMessage(mapResetError(errorCode ?? ''))
      setIsSuccess(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-blue-300 via-blue-500 to-indigo-900 p-6">
      <section className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl" aria-label="Formulario de recuperación de contraseña">
        <div className="text-center">
          <img src="/retocert.svg" alt="RetoCert" className="mx-auto mb-3 h-12 w-12 rounded-xl" />
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">RetoCert</p>
          <h1 className="text-3xl font-bold text-slate-900">Recuperar contraseña</h1>
          <p className="mt-1 text-sm text-slate-500">Ingresa tu correo y te enviaremos un enlace de recuperación.</p>
        </div>

        <form className="mt-6 grid gap-3" onSubmit={handleSubmit}>
          <label htmlFor="resetEmail" className="text-sm font-semibold text-slate-700">
            Correo electrónico
          </label>
          <input
            id="resetEmail"
            type="email"
            placeholder="tu@correo.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            minLength={5}
            maxLength={50}
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          />

          <button
            type="submit"
            disabled={loading}
            className="mt-2 inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-blue-500 px-4 py-2.5 text-sm font-bold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? (
              'Enviando...'
            ) : (
              <>
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                  <path d="M22 2 11 13" />
                  <path d="M22 2 15 22l-4-9-9-4Z" />
                </svg>
                <span>Enviar enlace</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
              <path d="M15 3h4a2 2 0 0 1 2 2v4" />
              <path d="M10 14 21 3" />
              <path d="M14 3H9a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" />
            </svg>
            <span>Volver a iniciar sesión</span>
          </button>
        </form>

        {message && (
          <p className={`mt-4 text-center text-sm font-bold ${isSuccess ? 'text-emerald-600' : 'text-rose-600'}`}>{message}</p>
        )}
      </section>
    </main>
  )
}
