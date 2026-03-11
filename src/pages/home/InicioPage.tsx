import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { addDoc, collection, doc, getDoc, getDocs, query, serverTimestamp, where } from 'firebase/firestore'
import InicioView from '../../components/home/InicioView'
import { db } from '../../firebase'

type ExamenListado = {
  id: string
  titulo: string
  descripcion: string
  totalPreguntas: number
  estadoRevision?: 'pendiente' | 'aprobado' | 'rechazado'
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
  currentUid: string
  currentUserName: string
  currentUserEmail: string
  actionButtonClass: string
  progressBarClass: string
}

export default function InicioPage({
  currentUid,
  currentUserName,
  currentUserEmail,
  actionButtonClass,
  progressBarClass,
}: Props) {
  const TRANSITION_DURATION_MS = 5000
  const navigate = useNavigate()
  const location = useLocation()
  const [examenes, setExamenes] = useState<ExamenListado[]>([])
  const [loadingExamenes, setLoadingExamenes] = useState(false)
  const [inicioMessage, setInicioMessage] = useState('')
  const [selectedExam, setSelectedExam] = useState<ExamenListado | null>(null)
  const [preguntasExamen, setPreguntasExamen] = useState<ExamenPregunta[]>([])
  const [quizFinished, setQuizFinished] = useState(false)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [correctAnswers, setCorrectAnswers] = useState(0)
  const [incorrectAnswers, setIncorrectAnswers] = useState(0)
  const [feedbackMessage, setFeedbackMessage] = useState('')
  const [feedbackIsCorrect, setFeedbackIsCorrect] = useState<boolean | null>(null)
  const [answerLocked, setAnswerLocked] = useState(false)
  const [transitionProgress, setTransitionProgress] = useState(0)
  const [transitionSecondsLeft, setTransitionSecondsLeft] = useState(0)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [savingResult, setSavingResult] = useState(false)
  const [resultSummary, setResultSummary] = useState<ResultadoResumen | null>(null)
  const transitionIntervalRef = useRef<number | null>(null)
  const examTimerIntervalRef = useRef<number | null>(null)
  const elapsedSecondsRef = useRef(0)

  const comenzarMatch = location.pathname.match(/^\/inicio\/comenzar\/([^/]+)$/)
  const rendirMatch = location.pathname.match(/^\/inicio\/rendir\/([^/]+)$/)
  const selectedExamId = comenzarMatch?.[1] ?? rendirMatch?.[1] ?? null
  const mode: 'lista' | 'comenzar' | 'rendir' = rendirMatch ? 'rendir' : comenzarMatch ? 'comenzar' : 'lista'

  const clearTransitionInterval = () => {
    if (transitionIntervalRef.current !== null) {
      window.clearInterval(transitionIntervalRef.current)
      transitionIntervalRef.current = null
    }
  }

  const clearExamTimerInterval = () => {
    if (examTimerIntervalRef.current !== null) {
      window.clearInterval(examTimerIntervalRef.current)
      examTimerIntervalRef.current = null
    }
  }

  const formatElapsedTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return [hours, minutes, secs].map((value) => String(value).padStart(2, '0')).join(':')
  }

  useEffect(() => {
    return () => {
      clearTransitionInterval()
      clearExamTimerInterval()
    }
  }, [])

  useEffect(() => {
    elapsedSecondsRef.current = elapsedSeconds
  }, [elapsedSeconds])

  const loadExamenes = async () => {
    try {
      setLoadingExamenes(true)
      setInicioMessage('')

      const approvedExamsQuery = query(collection(db, 'examenes'), where('estadoRevision', '==', 'aprobado'))
      const snapshot = await getDocs(approvedExamsQuery)
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
    clearTransitionInterval()
    clearExamTimerInterval()
    setQuizFinished(false)
    setCurrentQuestionIndex(0)
    setCorrectAnswers(0)
    setIncorrectAnswers(0)
    setFeedbackMessage('')
    setFeedbackIsCorrect(null)
    setAnswerLocked(false)
    setTransitionProgress(0)
    setTransitionSecondsLeft(0)
    setElapsedSeconds(0)
    elapsedSecondsRef.current = 0
    setSavingResult(false)
    setResultSummary(null)
  }

  const handleSelectExam = async (examId: string) => {
    setInicioMessage('')
    resetQuizState()
    navigate(`/inicio/comenzar/${examId}`)
  }

  const handleStartQuiz = () => {
    if (!selectedExamId || !selectedExam || preguntasExamen.length === 0) {
      return
    }

    resetQuizState()
    navigate(`/inicio/rendir/${selectedExamId}`)
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
        tiempoSegundos: summary.tiempoSegundos,
        tiempoTexto: summary.tiempoTexto,
        createdAt: serverTimestamp(),
      })
      setInicioMessage('Resultado guardado correctamente en tus calificaciones.')
    } catch (error) {
      const firebaseError = error as { code?: string }
      const errorCode = firebaseError.code ?? 'unknown-error'
      setInicioMessage(`Finalizaste el examen, pero no se pudo guardar la calificación (${errorCode}).`)
    } finally {
      setSavingResult(false)
    }
  }

  const handleAnswer = (answerIndex: number) => {
    if (mode !== 'rendir' || quizFinished || answerLocked) {
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
    setTransitionProgress(0)
    setTransitionSecondsLeft(5)

    clearTransitionInterval()

    const startedAt = Date.now()
    transitionIntervalRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startedAt
      const nextProgress = Math.min(100, Math.round((elapsed / TRANSITION_DURATION_MS) * 100))
      const remainingSeconds = Math.max(0, Math.ceil((TRANSITION_DURATION_MS - elapsed) / 1000))

      setTransitionProgress(nextProgress)
      setTransitionSecondsLeft(remainingSeconds)

      if (elapsed < TRANSITION_DURATION_MS) {
        return
      }

      clearTransitionInterval()

      const isLastQuestion = currentQuestionIndex + 1 >= preguntasExamen.length

      if (isLastQuestion) {
        const total = preguntasExamen.length
        const porcentaje = total > 0 ? Math.round((nextCorrect / total) * 100) : 0
        const finalElapsedSeconds = elapsedSecondsRef.current
        const summary: ResultadoResumen = {
          total,
          correctas: nextCorrect,
          incorrectas: nextIncorrect,
          porcentaje,
          tiempoSegundos: finalElapsedSeconds,
          tiempoTexto: formatElapsedTime(finalElapsedSeconds),
        }

        clearExamTimerInterval()
        setResultSummary(summary)
        setQuizFinished(true)
        setFeedbackMessage('')
        setFeedbackIsCorrect(null)
        setAnswerLocked(false)
        setTransitionProgress(0)
        setTransitionSecondsLeft(0)
        void saveResult(summary)
        return
      }

      setCurrentQuestionIndex((prev) => prev + 1)
      setFeedbackMessage('')
      setFeedbackIsCorrect(null)
      setAnswerLocked(false)
      setTransitionProgress(0)
      setTransitionSecondsLeft(0)
    }, 100)
  }

  const handleRestart = () => {
    setInicioMessage('')
    resetQuizState()
    setSelectedExam(null)
    setPreguntasExamen([])
    navigate('/inicio')
  }

  useEffect(() => {
    if (mode !== 'rendir' || quizFinished) {
      clearExamTimerInterval()
      return
    }

    clearExamTimerInterval()
    examTimerIntervalRef.current = window.setInterval(() => {
      setElapsedSeconds((prev) => {
        const next = prev + 1
        elapsedSecondsRef.current = next
        return next
      })
    }, 1000)

    return () => {
      clearExamTimerInterval()
    }
  }, [mode, quizFinished])

  useEffect(() => {
    const loadSelectedExam = async () => {
      if (!selectedExamId || mode === 'lista') {
        setSelectedExam(null)
        setPreguntasExamen([])
        return
      }

      try {
        setInicioMessage('')
        const examDoc = await getDoc(doc(db, 'examenes', selectedExamId))
        if (!examDoc.exists()) {
          setInicioMessage('El examen seleccionado no existe.')
          navigate('/inicio', { replace: true })
          return
        }

        const examData = examDoc.data() as Partial<ExamenListado>
        if (examData.estadoRevision !== 'aprobado') {
          setInicioMessage('Solo puedes rendir exámenes aprobados por el admin.')
          navigate('/inicio', { replace: true })
          return
        }

        setSelectedExam({
          id: examDoc.id,
          titulo: examData.titulo ?? 'Sin título',
          descripcion: examData.descripcion ?? '',
          totalPreguntas: typeof examData.totalPreguntas === 'number' ? examData.totalPreguntas : 0,
        })

        const questionsSnapshot = await getDocs(collection(db, 'examenes', selectedExamId, 'preguntas'))
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
          if (mode === 'rendir') {
            navigate(`/inicio/comenzar/${selectedExamId}`, { replace: true })
          }
          return
        }

        setPreguntasExamen(questions)
      } catch {
        setInicioMessage('No se pudo cargar el examen seleccionado.')
      }
    }

    void loadSelectedExam()
  }, [selectedExamId, mode, navigate])

  const currentQuestion = preguntasExamen[currentQuestionIndex] ?? null

  return (
    <InicioView
      examenes={examenes}
      loadingExamenes={loadingExamenes}
      inicioMessage={inicioMessage}
      mode={mode}
      selectedExam={selectedExam}
      preguntasExamen={preguntasExamen}
      quizFinished={quizFinished}
      currentQuestion={currentQuestion}
      currentQuestionIndex={currentQuestionIndex}
      feedbackMessage={feedbackMessage}
      feedbackIsCorrect={feedbackIsCorrect}
      answerLocked={answerLocked}
      transitionProgress={transitionProgress}
      transitionSecondsLeft={transitionSecondsLeft}
      elapsedTimeText={formatElapsedTime(elapsedSeconds)}
      actionButtonClass={actionButtonClass}
      progressBarClass={progressBarClass}
      savingResult={savingResult}
      resultSummary={resultSummary}
      onSelectExam={handleSelectExam}
      onStartQuiz={handleStartQuiz}
      onAnswer={handleAnswer}
      onRestart={handleRestart}
    />
  )
}
