import type { FormEvent } from 'react'

type Props = {
  nombre: string
  email: string
  editing: boolean
  saving: boolean
  statusMessage: string
  onNombreChange: (value: string) => void
  onStartEdit: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onRequestPasswordChange: () => void
}

export default function PerfilView({
  nombre,
  email,
  editing,
  saving,
  statusMessage,
  onNombreChange,
  onStartEdit,
  onSubmit,
  onRequestPasswordChange,
}: Props) {
  return (
    <form className="grid gap-3 rounded-xl border border-slate-200 p-4" onSubmit={onSubmit}>
      <label htmlFor="profileName" className="text-sm font-semibold text-slate-700">
        Nombre
      </label>
      <input
        id="profileName"
        type="text"
        value={nombre}
        onChange={(event) => onNombreChange(event.target.value)}
        required
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
      />

      <label htmlFor="profileEmail" className="text-sm font-semibold text-slate-700">
        Correo electrónico
      </label>
      <input
        id="profileEmail"
        type="email"
        value={email}
        disabled
        className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-900"
      />

      <div className="mt-2 grid gap-2 sm:flex">
        {!editing ? (
          <button
            type="button"
            onClick={onStartEdit}
            className="inline-flex w-full items-center justify-center gap-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 sm:w-auto"
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
            <span>Editar</span>
          </button>
        ) : (
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        )}

        <button
          type="button"
          onClick={onRequestPasswordChange}
          disabled={saving}
          className="inline-flex w-full items-center justify-center gap-1 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-4 w-4"
          >
            <rect x="3" y="11" width="18" height="10" rx="2" />
            <path d="M7 11V8a5 5 0 0 1 10 0v3" />
          </svg>
          <span>Cambiar contraseña</span>
        </button>
      </div>

      {statusMessage && <p className="text-sm text-slate-600">{statusMessage}</p>}
    </form>
  )
}
