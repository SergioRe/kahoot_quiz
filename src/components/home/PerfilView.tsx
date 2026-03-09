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
        value={email}
        disabled
        className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-900"
      />

      <div className="mt-2 grid gap-2 sm:flex">
        {!editing ? (
          <button
            type="button"
            onClick={onStartEdit}
            className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 sm:w-auto"
          >
            Editar
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
      </div>

      {statusMessage && <p className="text-sm text-slate-600">{statusMessage}</p>}
    </form>
  )
}
