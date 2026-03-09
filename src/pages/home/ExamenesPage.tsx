import type { FormEvent } from 'react'
import ExamenesView from '../../components/home/ExamenesView'

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

export default function ExamenesPage(props: Props) {
  return <ExamenesView {...props} />
}
