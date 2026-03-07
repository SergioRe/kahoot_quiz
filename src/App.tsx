function App() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-blue-300 via-blue-500 to-indigo-900 p-6">
      <section
        className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl"
        aria-label="Formulario de inicio de sesión"
      >
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Iniciar sesión</h1>
          <p className="mt-1 text-sm text-slate-500">Accede para continuar con tu cuenta.</p>
        </div>

        <form className="mt-6 grid gap-3">
          <label htmlFor="email" className="text-sm font-semibold text-slate-700">
            Correo electrónico
          </label>
          <input
            id="email"
            type="email"
            placeholder="tu@correo.com"
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
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          />

          <div className="mt-1 flex items-center justify-between gap-3 max-sm:flex-col max-sm:items-start">
            <label className="inline-flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" />
              <span>Recordarme</span>
            </label>
            <a href="#" className="text-sm font-semibold text-indigo-600 hover:underline">
              ¿Olvidaste tu contraseña?
            </a>
          </div>

          <button
            type="submit"
            className="mt-1 rounded-lg bg-gradient-to-r from-indigo-600 to-blue-500 px-4 py-2.5 text-sm font-bold text-white transition hover:brightness-105"
          >
            Entrar
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-600">
          ¿No tienes cuenta?{' '}
          <a href="#" className="font-semibold text-indigo-600 hover:underline">
            Regístrate
          </a>
        </p>
      </section>
    </main>
  )
}

export default App
