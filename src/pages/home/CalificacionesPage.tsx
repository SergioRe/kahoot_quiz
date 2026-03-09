import { useEffect, useState } from 'react'
import { collection, getDocs, query, where } from 'firebase/firestore'
import CalificacionesView from './CalificacionesView'
import { db } from '../../firebase'

type CalificacionItem = {
  id: string
  examenTitulo: string
  totalPreguntas: number
  correctas: number
  incorrectas: number
  porcentaje: number
  fechaLabel: string
  timestampMs: number
}

type Props = {
  currentUid: string
}

export default function CalificacionesPage({ currentUid }: Props) {
  const [calificaciones, setCalificaciones] = useState<CalificacionItem[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const loadCalificaciones = async () => {
      if (!currentUid) {
        return
      }

      try {
        setLoading(true)
        setMessage('')

        const calificacionesQuery = query(collection(db, 'calificaciones'), where('uid', '==', currentUid))
        const snapshot = await getDocs(calificacionesQuery)

        const items = snapshot.docs
          .map((docItem) => {
            const data = docItem.data() as {
              examenTitulo?: string
              totalPreguntas?: number
              correctas?: number
              incorrectas?: number
              porcentaje?: number
              createdAt?: { seconds?: number; nanoseconds?: number }
            }

            const seconds = data.createdAt?.seconds ?? 0
            const nanoseconds = data.createdAt?.nanoseconds ?? 0
            const timestampMs = seconds * 1000 + Math.floor(nanoseconds / 1000000)
            const fecha = timestampMs > 0 ? new Date(timestampMs) : null

            return {
              id: docItem.id,
              examenTitulo: data.examenTitulo ?? 'Examen',
              totalPreguntas: typeof data.totalPreguntas === 'number' ? data.totalPreguntas : 0,
              correctas: typeof data.correctas === 'number' ? data.correctas : 0,
              incorrectas: typeof data.incorrectas === 'number' ? data.incorrectas : 0,
              porcentaje: typeof data.porcentaje === 'number' ? data.porcentaje : 0,
              fechaLabel: fecha ? fecha.toLocaleString('es-PE') : 'Sin fecha',
              timestampMs,
            }
          })
          .sort((a, b) => b.timestampMs - a.timestampMs)

        setCalificaciones(items)
      } catch {
        setMessage('No se pudieron cargar tus calificaciones.')
      } finally {
        setLoading(false)
      }
    }

    void loadCalificaciones()
  }, [currentUid])

  return <CalificacionesView calificaciones={calificaciones} loading={loading} message={message} />
}
