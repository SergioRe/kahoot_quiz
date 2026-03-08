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
}

type Props = {
  showExamForm: boolean
  editingExamId: string | null
  examenTitulo: string
  examenDescripcion: string
  preguntas: ExamenPregunta[]
  savingExamen: boolean
  examenMessage: string
  examenes: ExamenListado[]
  examenesLoading: boolean
  examenesMessage: string
  deletingExamId: string | null
  onShowAdd: () => void
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

export default function ExamenesView({
  showExamForm,
  editingExamId,
  examenTitulo,
  examenDescripcion,
  preguntas,
  savingExamen,
  examenMessage,
  examenes,
  examenesLoading,
  examenesMessage,
  deletingExamId,
  onShowAdd,
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
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-700">Gestión de exámenes</h3>
        <button
          type="button"
          onClick={onShowAdd}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Agregar examen
        </button>
      </div>

      {showExamForm && (
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
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-bold text-slate-900">Pregunta {questionIndex + 1}</h3>
                  {preguntas.length > 1 && (
                    <button
                      type="button"
                      onClick={() => onRemoveQuestion(questionIndex)}
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
                  onChange={(event) => onQuestionTextChange(questionIndex, event.target.value)}
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

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onAddQuestion}
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
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Cancelar
            </button>
          </div>

          {examenMessage && <p className="text-sm text-slate-600">{examenMessage}</p>}
        </form>
      )}

      <ExamenesDataTable
        examenes={examenes}
        loading={examenesLoading}
        message={examenesMessage}
        deletingExamId={deletingExamId ?? undefined}
        onEdit={onEditExam}
        onDelete={onDeleteExam}
      />
    </div>
  )
}
