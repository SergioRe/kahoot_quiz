import type { FormEvent } from 'react'
import PerfilView from '../../components/home/PerfilView'

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

export default function PerfilPage(props: Props) {
  return <PerfilView {...props} />
}
