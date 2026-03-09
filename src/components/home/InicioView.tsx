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
}

type Props = {
  examenes: ExamenListado[]
  loadingExamenes: boolean
  inicioMessage: string
  selectedExam: ExamenListado | null
  preguntasExamen: ExamenPregunta[]
  quizStarted: boolean
  quizFinished: boolean
  currentQuestion: ExamenPregunta | null
  currentQuestionIndex: number
  feedbackMessage: string
  feedbackIsCorrect: boolean | null
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
  selectedExam,
  preguntasExamen,
  quizStarted,
  quizFinished,
  currentQuestion,
  currentQuestionIndex,
  feedbackMessage,
  feedbackIsCorrect,
  savingResult,
  resultSummary,
  onSelectExam,
  onStartQuiz,
  onAnswer,
  onRestart,
}: Props) {
  return (
    <div className="grid gap-4">
      <div className="rounded-xl border border-slate-200 p-4">
        <h3 className="text-sm font-bold text-slate-900">Exámenes disponibles</h3>
        <p className="mt-1 text-xs text-slate-500">Selecciona un examen para comenzar.</p>

        {loadingExamenes && <p className="mt-3 text-sm text-slate-600">Cargando exámenes...</p>}

        {!loadingExamenes && examenes.length === 0 && (
          <p className="mt-3 text-sm text-slate-600">No hay exámenes disponibles por ahora.</p>
        )}

        {!loadingExamenes && examenes.length > 0 && (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {examenes.map((item) => {
              const isSelected = selectedExam?.id === item.id
              return (
                <article
                  key={item.id}
                  className={`rounded-xl border p-3 ${
                    isSelected ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 bg-white'
                  }`}
                >
                  <h4 className="text-sm font-bold text-slate-900">{item.titulo}</h4>
                  <p className="mt-1 text-xs text-slate-600">{item.descripcion || 'Sin descripción'}</p>
                  <p className="mt-2 text-xs font-semibold text-slate-500">Preguntas: {item.totalPreguntas}</p>
                  <button
                    type="button"
                    onClick={() => onSelectExam(item.id)}
                    className="mt-3 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
                  >
                    Seleccionar examen
                  </button>
                </article>
              )
            })}
          </div>
        )}
      </div>

      {selectedExam && preguntasExamen.length > 0 && !quizStarted && !quizFinished && (
        <div className="rounded-xl border border-slate-200 p-4">
          <h3 className="text-sm font-bold text-slate-900">Examen seleccionado: {selectedExam.titulo}</h3>
          <p className="mt-1 text-xs text-slate-600">Total de preguntas: {preguntasExamen.length}</p>
          <button
            type="button"
            onClick={onStartQuiz}
            className="mt-3 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Comenzar examen
          </button>
        </div>
      )}

      {quizStarted && currentQuestion && (
        <div className="rounded-xl border border-slate-200 p-4">
          <h3 className="text-sm font-bold text-slate-900">
            Pregunta {currentQuestionIndex + 1} de {preguntasExamen.length}
          </h3>
          <p className="mt-2 text-sm text-slate-800">{currentQuestion.texto}</p>

          <div className="mt-4 grid gap-2">
            {currentQuestion.respuestas.map((answer, answerIndex) => (
              <button
                key={`${currentQuestion.id}-${answerIndex}`}
                type="button"
                onClick={() => onAnswer(answerIndex)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-left text-sm text-slate-800 hover:bg-slate-50"
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
          </div>
          <p className="mt-2 text-xs text-slate-500">{savingResult ? 'Guardando calificación...' : 'Calificación procesada.'}</p>
          <button
            type="button"
            onClick={onRestart}
            className="mt-3 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
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
