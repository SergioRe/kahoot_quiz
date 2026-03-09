import { useEffect, useState } from 'react'
import { addDoc, collection, getDocs, serverTimestamp } from 'firebase/firestore'
import InicioView from '../../components/home/InicioView'
import { db } from '../../firebase'

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
  currentUid: string
  currentUserName: string
  currentUserEmail: string
}

export default function InicioPage({ currentUid, currentUserName, currentUserEmail }: Props) {
  const [examenes, setExamenes] = useState<ExamenListado[]>([])
  const [loadingExamenes, setLoadingExamenes] = useState(false)
  const [inicioMessage, setInicioMessage] = useState('')
  const [selectedExam, setSelectedExam] = useState<ExamenListado | null>(null)
  const [preguntasExamen, setPreguntasExamen] = useState<ExamenPregunta[]>([])
  const [quizStarted, setQuizStarted] = useState(false)
  const [quizFinished, setQuizFinished] = useState(false)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [correctAnswers, setCorrectAnswers] = useState(0)
  const [incorrectAnswers, setIncorrectAnswers] = useState(0)
  const [feedbackMessage, setFeedbackMessage] = useState('')
  const [feedbackIsCorrect, setFeedbackIsCorrect] = useState<boolean | null>(null)
  const [answerLocked, setAnswerLocked] = useState(false)
  const [savingResult, setSavingResult] = useState(false)
  const [resultSummary, setResultSummary] = useState<ResultadoResumen | null>(null)

  const loadExamenes = async () => {
    try {
      setLoadingExamenes(true)
      setInicioMessage('')

      const snapshot = await getDocs(collection(db, 'examenes'))
      const list = snapshot.docs
        .map((docItem) => {
          const data = docItem.data() as Partial<ExamenListado> & { isSeed?: boolean }
          return {
            id: docItem.id,
            titulo: data.titulo ?? 'Sin título',
            descripcion: data.descripcion ?? '',
            totalPreguntas: typeof data.totalPreguntas === 'number' ? data.totalPreguntas : 0,
            isSeed: data.isSeed === true,
          }
        })
        .filter((item) => !item.isSeed)
        .map(({ isSeed: _, ...item }) => item)

      setExamenes(list)
    } catch {
      setInicioMessage('No se pudieron cargar los exámenes disponibles.')
    } finally {
      setLoadingExamenes(false)
    }
  }

  useEffect(() => {
    void loadExamenes()
  }, [])

  const resetQuizState = () => {
    setQuizStarted(false)
    setQuizFinished(false)
    setCurrentQuestionIndex(0)
    setCorrectAnswers(0)
    setIncorrectAnswers(0)
    setFeedbackMessage('')
    setFeedbackIsCorrect(null)
    setAnswerLocked(false)
    setSavingResult(false)
    setResultSummary(null)
  }

  const handleSelectExam = async (examId: string) => {
    const exam = examenes.find((item) => item.id === examId)
    if (!exam) {
      return
    }

    try {
      setInicioMessage('')
      resetQuizState()
      setSelectedExam(exam)

      const questionsSnapshot = await getDocs(collection(db, 'examenes', exam.id, 'preguntas'))
      const questions = questionsSnapshot.docs
        .map((questionDoc) => {
          const data = questionDoc.data() as Partial<ExamenPregunta>
          const answers = Array.isArray(data.respuestas) ? data.respuestas : []
          return {
            id: questionDoc.id,
            texto: data.texto ?? '',
            respuestas: [
              answers[0] ?? '',
              answers[1] ?? '',
              answers[2] ?? '',
              answers[3] ?? '',
            ] as [string, string, string, string],
            correctaIndex: typeof data.correctaIndex === 'number' ? data.correctaIndex : 0,
            orden: typeof data.orden === 'number' ? data.orden : 0,
          }
        })
        .sort((a, b) => a.orden - b.orden)

      if (questions.length === 0) {
        setPreguntasExamen([])
        setInicioMessage('Este examen no tiene preguntas disponibles todavía.')
        return
      }

      setPreguntasExamen(questions)
    } catch {
      setInicioMessage('No se pudo cargar el examen seleccionado.')
    }
  }

  const handleStartQuiz = () => {
    if (!selectedExam || preguntasExamen.length === 0) {
      return
    }

    resetQuizState()
    setQuizStarted(true)
  }

  const saveResult = async (summary: ResultadoResumen) => {
    if (!currentUid || !selectedExam) {
      return
    }

    try {
      setSavingResult(true)
      await addDoc(collection(db, 'calificaciones'), {
        uid: currentUid,
        nombre: currentUserName,
        email: currentUserEmail,
        examenId: selectedExam.id,
        examenTitulo: selectedExam.titulo,
        totalPreguntas: summary.total,
        correctas: summary.correctas,
        incorrectas: summary.incorrectas,
        porcentaje: summary.porcentaje,
        createdAt: serverTimestamp(),
      })
      setInicioMessage('Resultado guardado correctamente en tus calificaciones.')
    } catch {
      setInicioMessage('Finalizaste el examen, pero no se pudo guardar la calificación.')
    } finally {
      setSavingResult(false)
    }
  }

  const handleAnswer = (answerIndex: number) => {
    if (!quizStarted || quizFinished || answerLocked) {
      return
    }

    const currentQuestion = preguntasExamen[currentQuestionIndex]
    if (!currentQuestion) {
      return
    }

    const isCorrect = answerIndex === currentQuestion.correctaIndex
    const nextCorrect = correctAnswers + (isCorrect ? 1 : 0)
    const nextIncorrect = incorrectAnswers + (isCorrect ? 0 : 1)

    setCorrectAnswers(nextCorrect)
    setIncorrectAnswers(nextIncorrect)
    setFeedbackIsCorrect(isCorrect)
    setFeedbackMessage(isCorrect ? 'Correcto ✅' : 'Incorrecto ❌')
    setAnswerLocked(true)

    window.setTimeout(() => {
      const isLastQuestion = currentQuestionIndex + 1 >= preguntasExamen.length

      if (isLastQuestion) {
        const total = preguntasExamen.length
        const porcentaje = total > 0 ? Math.round((nextCorrect / total) * 100) : 0
        const summary: ResultadoResumen = {
          total,
          correctas: nextCorrect,
          incorrectas: nextIncorrect,
          porcentaje,
        }

        setResultSummary(summary)
        setQuizFinished(true)
        setQuizStarted(false)
        setFeedbackMessage('')
        setFeedbackIsCorrect(null)
        setAnswerLocked(false)
        void saveResult(summary)
        return
      }

      setCurrentQuestionIndex((prev) => prev + 1)
      setFeedbackMessage('')
      setFeedbackIsCorrect(null)
      setAnswerLocked(false)
    }, 700)
  }

  const handleRestart = () => {
    setSelectedExam(null)
    setPreguntasExamen([])
    resetQuizState()
  }

  const currentQuestion = preguntasExamen[currentQuestionIndex] ?? null

  return (
    <InicioView
      examenes={examenes}
      loadingExamenes={loadingExamenes}
      inicioMessage={inicioMessage}
      selectedExam={selectedExam}
      preguntasExamen={preguntasExamen}
      quizStarted={quizStarted}
      quizFinished={quizFinished}
      currentQuestion={currentQuestion}
      currentQuestionIndex={currentQuestionIndex}
      feedbackMessage={feedbackMessage}
      feedbackIsCorrect={feedbackIsCorrect}
      savingResult={savingResult}
      resultSummary={resultSummary}
      onSelectExam={handleSelectExam}
      onStartQuiz={handleStartQuiz}
      onAnswer={handleAnswer}
      onRestart={handleRestart}
    />
  )
}
