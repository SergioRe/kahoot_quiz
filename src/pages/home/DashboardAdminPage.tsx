import DashboardAdminView from '../../components/home/DashboardAdminView'

type UserRole = 'admin' | 'usuario'

type UsuarioPerfil = {
  rol: UserRole
}

type EstadoSolicitudPermiso = 'pendiente' | 'aprobada' | 'rechazada'
type EstadoRevisionExamen = 'pendiente' | 'aprobado' | 'rechazado'

type UsuarioAdmin = {
  uid: string
  nombre: string
  email: string
  activo: boolean
  rol: UserRole
}

type SolicitudPermisoExamen = {
  id: string
  uid: string
  nombre: string
  email: string
  estado: EstadoSolicitudPermiso
  revisadoPorUid?: string
}

type SolicitudAprobacionExamen = {
  id: string
  titulo: string
  creadoPorUid: string
  creadoPorNombre: string
  estadoRevision: EstadoRevisionExamen
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
  examAccessRequests: SolicitudPermisoExamen[]
  examAccessRequestsLoading: boolean
  examApprovalRequests: SolicitudAprobacionExamen[]
  examApprovalRequestsLoading: boolean
  onToggleActivo: (userId: string, nextValue: boolean) => Promise<void>
  onToggleRol: (userId: string, nextValue: UserRole) => Promise<void>
  onApproveExamAccess: (requestId: string, userId: string) => Promise<void>
  onRejectExamAccess: (requestId: string, userId: string) => Promise<void>
  onApproveExam: (examId: string) => Promise<void>
  onRejectExam: (examId: string) => Promise<void>
}

export default function DashboardAdminPage(props: Props) {
  return <DashboardAdminView {...props} />
}
