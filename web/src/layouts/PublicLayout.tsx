import { Link, NavLink, Outlet } from 'react-router-dom'
import { Shield } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { HOME } from '../auth/Guards'

export function PublicLayout() {
  const { user } = useAuth()
  const lnk = ({ isActive }: { isActive: boolean }) => `rounded-md px-3 py-1.5 text-sm ${isActive ? 'font-semibold text-brand' : 'text-slate-600 hover:text-ink'}`
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-4 py-3">
          <Link to="/" className="flex items-center gap-2 font-bold text-ink"><Shield className="text-brand" /> Red Prometeo</Link>
          <nav className="ml-4 flex gap-1">
            <NavLink to="/" end className={lnk}>Inicio</NavLink>
            <NavLink to="/precios" className={lnk}>Precios</NavLink>
            <NavLink to="/autodiagnostico" className={lnk}>Autodiagnóstico</NavLink>
          </nav>
          <div className="ml-auto flex items-center gap-2 text-sm">
            {user ? (
              <Link to={HOME[user.rol]} className="rounded-md bg-brand px-4 py-2 font-semibold text-white">Ir a la app</Link>
            ) : (
              <>
                <Link to="/login" className="rounded-md px-3 py-2 text-slate-700 hover:bg-slate-100">Ingresar</Link>
                <Link to="/registro" className="rounded-md bg-brand px-4 py-2 font-semibold text-white">Crear cuenta</Link>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1"><Outlet /></main>
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-sm text-slate-500">
        Red de Ciberseguridad Comunitaria · Municipios, universidades y estudiantes supervisados
      </footer>
    </div>
  )
}
