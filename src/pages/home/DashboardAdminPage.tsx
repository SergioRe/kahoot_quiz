import DashboardAdminView from '../../components/home/DashboardAdminView'

type UserRole = 'admin' | 'usuario'

type UsuarioPerfil = {
  rol: UserRole
}

type UsuarioAdmin = {
  uid: string
  nombre: string
  email: string
  activo: boolean
  rol: UserRole
}

type Props = {
  perfil: UsuarioPerfil
  totalUsers: number
  activeUsers: number
  inactiveUsers: number
  adminCount: number
  activeRate: number
  inactiveRate: number
  adminUsers: UsuarioAdmin[]
  adminLoading: boolean
  adminMessage: string
  currentUid: string
  onToggleActivo: (userId: string, nextValue: boolean) => Promise<void>
  onToggleRol: (userId: string, nextValue: UserRole) => Promise<void>
}

export default function DashboardAdminPage(props: Props) {
  return <DashboardAdminView {...props} />
}
