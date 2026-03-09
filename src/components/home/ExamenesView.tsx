import type { FormEvent } from 'react'
import ExamenesDataTable from '../ExamenesDataTable'

type ExamenPregunta = {
  texto: string
  respuestas: [string, string, string, string]
  correctaIndex: number
}

type ExamenListado = {
  id: string
  titulo: string
  descripcion: string
  totalPreguntas: number
  estadoRevision?: 'pendiente' | 'aprobado' | 'rechazado'
}

type Props = {
  showExamForm: boolean
  showExamList: boolean
  editingExamId: string | null
  examenTitulo: string
  examenDescripcion: string
  preguntas: ExamenPregunta[]
  savingExamen: boolean
  examenMessage: string
  examenes: ExamenListado[]
  examenesLoading: boolean
  examenesMessage: string
  canManageExams: boolean
  requestAccessMessage: string
  requestingAccess: boolean
  deletingExamId: string | null
  onShowAdd: () => void
  onRequestAccess: () => void
  onExamTitleChange: (value: string) => void
  onExamDescriptionChange: (value: string) => void
  onAddQuestion: () => void
  onRemoveQuestion: (index: number) => void
  onQuestionTextChange: (index: number, value: string) => void
  onAnswerChange: (questionIndex: number, answerIndex: number, value: string) => void
  onCorrectAnswerChange: (questionIndex: number, correctIndex: number) => void
  onCancel: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onEditExam: (examId: string) => void
  onDeleteExam: (examId: string) => Promise<void>
}

const MAX_QUESTIONS_PER_EXAM = 5

export default function ExamenesView({
  showExamForm,
  showExamList,
  editingExamId,
  examenTitulo,
  examenDescripcion,
  preguntas,
  savingExamen,
  examenMessage,
  examenes,
  examenesLoading,
  examenesMessage,
  canManageExams,
  requestAccessMessage,
  requestingAccess,
  deletingExamId,
  onShowAdd,
  onRequestAccess,
  onExamTitleChange,
  onExamDescriptionChange,
  onAddQuestion,
  onRemoveQuestion,
  onQuestionTextChange,
  onAnswerChange,
  onCorrectAnswerChange,
  onCancel,
  onSubmit,
  onEditExam,
  onDeleteExam,
}: Props) {
  return (
    <div className="grid gap-4">
      {showExamList && canManageExams && (
        <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
          <h3 className="text-sm font-semibold text-slate-700">Gestión de exámenes</h3>
          <button
            type="button"
            onClick={onShowAdd}
            className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            <span aria-hidden="true">＋</span>
            <span>Agregar examen</span>
          </button>
        </div>
      )}

      {showExamList && !canManageExams && (
        <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <h3 className="text-sm font-semibold text-slate-900">Permiso requerido</h3>
          <p className="mt-1 text-sm text-slate-600">
            Necesitas aprobación del super admin para agregar, editar o eliminar exámenes.
          </p>
          <button
            type="button"
            onClick={onRequestAccess}
            disabled={requestingAccess}
            className="mt-3 inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
              <path d="M12 5v14" />
              <path d="M5 12h14" />
            </svg>
            <span>{requestingAccess ? 'Enviando...' : 'Solicitar permiso'}</span>
          </button>
          {requestAccessMessage && <p className="mt-2 text-sm text-slate-600">{requestAccessMessage}</p>}
        </section>
      )}

      {showExamForm && canManageExams && (
        <form className="grid gap-4 rounded-xl border border-slate-200 p-4" onSubmit={onSubmit}>
          <div className="grid gap-2">
            <label htmlFor="examTitle" className="text-sm font-semibold text-slate-700">
              Título del examen
            </label>
            <input
              id="examTitle"
              type="text"
              value={examenTitulo}
              onChange={(event) => onExamTitleChange(event.target.value)}
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
              onChange={(event) => onExamDescriptionChange(event.target.value)}
              rows={3}
              placeholder="Describe brevemente el examen"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            />
          </div>

          <div className="grid gap-4">
            {preguntas.map((question, questionIndex) => (
              <article key={questionIndex} className="rounded-xl border border-slate-200 p-4">
                <div className="mb-3 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                  <h3 className="text-sm font-bold text-slate-900">Pregunta {questionIndex + 1}</h3>
                  {preguntas.length > 1 && (
                    <button
                      type="button"
                      onClick={() => onRemoveQuestion(questionIndex)}
                      className="inline-flex w-full items-center justify-center gap-1 rounded-lg border border-rose-300 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 sm:w-auto"
                    >
                      <span aria-hidden="true">－</span>
                      <span>Eliminar</span>
                    </button>
                  )}
                </div>

                <label className="text-xs font-semibold uppercase text-slate-500">Texto de la pregunta</label>
                <input
                  type="text"
                  value={question.texto}
                  onChange={(event) => onQuestionTextChange(questionIndex, event.target.value)}
                  placeholder="Escribe la pregunta"
                  required
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                />

                <div className="mt-4 grid gap-2">
                  {question.respuestas.map((answer, answerIndex) => (
                    <div key={answerIndex} className="flex items-start gap-2">
                      <input
                        type="radio"
                        name={`correct-${questionIndex}`}
                        checked={question.correctaIndex === answerIndex}
                        onChange={() => onCorrectAnswerChange(questionIndex, answerIndex)}
                        className="h-4 w-4"
                      />
                      <input
                        type="text"
                        value={answer}
                        onChange={(event) => onAnswerChange(questionIndex, answerIndex, event.target.value)}
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

          <div className="grid gap-2 sm:flex sm:flex-wrap sm:items-center">
            <button
              type="button"
              onClick={onAddQuestion}
              disabled={preguntas.length >= MAX_QUESTIONS_PER_EXAM}
              className="inline-flex w-full items-center justify-center gap-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
            >
              <span aria-hidden="true">＋</span>
              <span>Agregar pregunta</span>
            </button>
            <button
              type="submit"
              disabled={savingExamen}
              className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
            >
              {savingExamen ? 'Guardando...' : editingExamId ? 'Guardar cambios' : 'Guardar examen'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 sm:w-auto"
            >
              Cancelar
            </button>
          </div>

          <p className="text-xs text-slate-500">
            Preguntas: {preguntas.length}/{MAX_QUESTIONS_PER_EXAM}
          </p>

          {examenMessage && <p className="text-sm text-slate-600">{examenMessage}</p>}
        </form>
      )}

      {showExamList && (
        <ExamenesDataTable
          examenes={examenes}
          loading={examenesLoading}
          message={examenesMessage}
          showActions={canManageExams}
          deletingExamId={deletingExamId ?? undefined}
          onEdit={onEditExam}
          onDelete={onDeleteExam}
        />
      )}
    </div>
  )
}
