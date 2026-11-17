import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth, type Rol } from './AuthContext'

export function RequireAuth() {
  const { user, loading } = useAuth()
  const loc = useLocation()
  if (loading) return <div className="p-10 text-center text-slate-500">Cargando…</div>
  if (!user) return <Navigate to="/login" state={{ from: loc.pathname }} replace />
  return <Outlet />
}

export const HOME: Record<Rol, string> = {
  referente: '/app/panel', intendente: '/app/panel', analista: '/app/soc', guardian: '/app/mis-tareas',
}

export function RequireRol({ roles }: { roles: Rol[] }) {
  const { user } = useAuth()
  if (!user) return null
  return roles.includes(user.rol) ? <Outlet /> : <Navigate to={HOME[user.rol]} replace />
}

export function HomeRedirect() {
  const { user } = useAuth()
  return <Navigate to={user ? HOME[user.rol] : '/login'} replace />
}
