type ExamenListado = {
  id: string
  titulo: string
  descripcion: string
  totalPreguntas: number
}

type ExamenPregunta = {
  id: string
  texto: string
  respuestas: [string, string, string, string]
  correctaIndex: number
  orden: number
}

type ResultadoResumen = {
  total: number
  correctas: number
  incorrectas: number
  porcentaje: number
  tiempoSegundos: number
  tiempoTexto: string
}

type Props = {
  examenes: ExamenListado[]
  loadingExamenes: boolean
  inicioMessage: string
  mode: 'lista' | 'comenzar' | 'rendir'
  selectedExam: ExamenListado | null
  preguntasExamen: ExamenPregunta[]
  quizFinished: boolean
  currentQuestion: ExamenPregunta | null
  currentQuestionIndex: number
  feedbackMessage: string
  feedbackIsCorrect: boolean | null
  answerLocked: boolean
  transitionProgress: number
  transitionSecondsLeft: number
  elapsedTimeText: string
  actionButtonClass: string
  progressBarClass: string
  savingResult: boolean
  resultSummary: ResultadoResumen | null
  onSelectExam: (examId: string) => void
  onStartQuiz: () => void
  onAnswer: (answerIndex: number) => void
  onRestart: () => void
}

export default function InicioView({
  examenes,
  loadingExamenes,
  inicioMessage,
  mode,
  selectedExam,
  preguntasExamen,
  quizFinished,
  currentQuestion,
  currentQuestionIndex,
  feedbackMessage,
  feedbackIsCorrect,
  answerLocked,
  transitionProgress,
  transitionSecondsLeft,
  elapsedTimeText,
  actionButtonClass,
  progressBarClass,
  savingResult,
  resultSummary,
  onSelectExam,
  onStartQuiz,
  onAnswer,
  onRestart,
}: Props) {
  const isLastQuestion = currentQuestionIndex + 1 === preguntasExamen.length

  return (
    <div className="grid gap-4">
      {mode === 'lista' && (
        <div className="rounded-xl border border-slate-200 p-4">
          <h3 className="text-sm font-bold text-slate-900">Rendir examen</h3>
          <p className="mt-1 text-xs text-slate-500">Selecciona un examen para iniciar la evaluación.</p>

          {loadingExamenes && <p className="mt-3 text-sm text-slate-600">Cargando exámenes...</p>}

          {!loadingExamenes && examenes.length === 0 && (
            <p className="mt-3 text-sm text-slate-600">No hay exámenes disponibles por ahora.</p>
          )}

          {!loadingExamenes && examenes.length > 0 && (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {examenes.map((item) => (
                <article key={item.id} className="rounded-xl border border-slate-200 bg-white p-3">
                  <h4 className="text-sm font-bold text-slate-900">{item.titulo}</h4>
                  <p className="mt-1 text-xs text-slate-600">{item.descripcion || 'Sin descripción'}</p>
                  <p className="mt-2 text-xs font-semibold text-slate-500">Preguntas: {item.totalPreguntas}</p>
                  <button
                    type="button"
                    onClick={() => onSelectExam(item.id)}
                    className={`mt-3 inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${actionButtonClass}`}
                  >
                    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
                      <path d="M8 5v14l11-7-11-7Z" />
                    </svg>
                    Seleccionar examen
                  </button>
                </article>
              ))}
            </div>
          )}
        </div>
      )}

      {mode === 'comenzar' && selectedExam && preguntasExamen.length > 0 && (
        <div className="rounded-xl border border-slate-200 p-4">
          <h3 className="text-sm font-bold text-slate-900">Examen seleccionado: {selectedExam.titulo}</h3>
          <p className="mt-1 text-xs text-slate-600">Total de preguntas: {preguntasExamen.length}</p>
          <button
            type="button"
            onClick={onStartQuiz}
            className={`mt-3 inline-flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-semibold transition ${actionButtonClass}`}
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
              <path d="M8 5v14l11-7-11-7Z" />
            </svg>
            Comenzar examen
          </button>
        </div>
      )}

      {mode === 'rendir' && !quizFinished && currentQuestion && (
        <div className="rounded-xl border border-slate-200 p-4">
          <div className="mb-2 inline-flex items-center rounded-lg border border-slate-300 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
            Tiempo: {elapsedTimeText}
          </div>
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Pregunta {currentQuestionIndex + 1} de {preguntasExamen.length}
            </h3>
            {isLastQuestion && <span className="text-xs font-semibold text-indigo-700">Última pregunta</span>}
          </div>
          <p className="mt-2 text-sm text-slate-800">{currentQuestion.texto}</p>

          <div className="mt-4 grid gap-2">
            {currentQuestion.respuestas.map((answer, answerIndex) => (
              <button
                key={`${currentQuestion.id}-${answerIndex}`}
                type="button"
                onClick={() => onAnswer(answerIndex)}
                disabled={answerLocked}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-left text-sm text-slate-800 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {answer}
              </button>
            ))}
          </div>

          {feedbackMessage && (
            <p className={`mt-3 text-sm font-semibold ${feedbackIsCorrect ? 'text-emerald-700' : 'text-rose-700'}`}>
              {feedbackMessage}
            </p>
          )}

          {answerLocked && (
            <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                <span>Cargando siguiente pregunta...</span>
                <span>{transitionProgress}%</span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className={`h-full rounded-full transition-[width] duration-100 ${progressBarClass}`}
                  style={{ width: `${transitionProgress}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-slate-500">Siguiente pregunta en {transitionSecondsLeft}s</p>
            </div>
          )}
        </div>
      )}

      {quizFinished && resultSummary && (
        <div className="rounded-xl border border-slate-200 p-4">
          <h3 className="text-base font-bold text-slate-900">Resultado final</h3>
          <div className="mt-3 grid gap-2 text-sm text-slate-700">
            <p>Total de preguntas: {resultSummary.total}</p>
            <p>Preguntas correctas: {resultSummary.correctas}</p>
            <p>Preguntas incorrectas: {resultSummary.incorrectas}</p>
            <p>Porcentaje de aprobado: {resultSummary.porcentaje}%</p>
            <p>Tiempo total: {resultSummary.tiempoTexto}</p>
          </div>
          <p className="mt-2 text-xs text-slate-500">{savingResult ? 'Guardando calificación...' : 'Calificación procesada.'}</p>
          <button
            type="button"
            onClick={onRestart}
            className={`mt-3 inline-flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-semibold transition ${actionButtonClass}`}
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
              <path d="M3 12a9 9 0 1 0 3-6.7" />
              <path d="M3 3v4h4" />
            </svg>
            Volver a exámenes
          </button>
        </div>
      )}

      {inicioMessage && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-sm text-slate-700">{inicioMessage}</p>
        </div>
      )}
    </div>
  )
}
