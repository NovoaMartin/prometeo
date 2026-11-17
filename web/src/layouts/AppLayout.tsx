import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { BookOpen, Bug, ClipboardCheck, Database, FileText, GraduationCap, LayoutDashboard, ListChecks, ListTodo, LogOut, Menu, Settings, Share2, Shield, Siren, ShieldAlert } from 'lucide-react'
import type { ComponentType } from 'react'
import { useAuth, type Rol } from '../auth/AuthContext'
import { AsistentePanel } from '../components/AsistentePanel'
import { Badge } from '../components/ui'

interface Item { to: string; label: string; icon: ComponentType<{ size?: number }> }
const NAV: Record<Rol, Item[]> = {
  referente: [
    { to: 'panel', label: 'Panel', icon: LayoutDashboard }, { to: 'diagnostico', label: 'Diagnóstico', icon: ClipboardCheck },
    { to: 'plan', label: 'Plan de mejora', icon: ListChecks }, { to: 'inventario', label: 'Inventario de datos', icon: Database },
    { to: 'alertas', label: 'Alertas', icon: Siren }, { to: 'vulnerabilidades', label: 'Vulnerabilidades', icon: Bug },
    { to: 'red', label: 'Red de amenazas', icon: Share2 }, { to: 'capacitacion', label: 'Capacitación', icon: GraduationCap },
    { to: 'reporte', label: 'Reporte', icon: FileText }, { to: 'configuracion', label: 'Configuración', icon: Settings },
  ],
  intendente: [
    { to: 'panel', label: 'Panel', icon: LayoutDashboard }, { to: 'plan', label: 'Plan de mejora', icon: ListChecks },
    { to: 'alertas', label: 'Alertas', icon: Siren }, { to: 'red', label: 'Red de amenazas', icon: Share2 }, { to: 'reporte', label: 'Reporte', icon: FileText },
  ],
  analista: [{ to: 'soc', label: 'Consola SOC', icon: ShieldAlert }, { to: 'alertas', label: 'Alertas', icon: Siren }, { to: 'red', label: 'Red de amenazas', icon: Share2 }],
  guardian: [{ to: 'mis-tareas', label: 'Mis tareas', icon: ListTodo }],
}
const ROL_LABEL: Record<Rol, string> = { referente: 'Referente', intendente: 'Intendente', analista: 'Analista SOC', guardian: 'Guardián digital' }
const PLAN_LABEL = { free: 'Plan Free', guardianes: 'Guardianes', escudo: 'Escudo Municipal' }

export function AppLayout() {
  const { user, org, logout } = useAuth()
  const nav = useNavigate()
  const [abierto, setAbierto] = useState(false)
  if (!user) return null

  return (
    <div className="flex min-h-screen">
      <aside className={`no-print fixed inset-y-0 left-0 z-30 w-60 shrink-0 border-r border-slate-200 bg-white p-3 transition-transform md:static md:translate-x-0 ${abierto ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="mb-4 flex items-center gap-2 px-2 pt-1 font-bold text-ink"><Shield className="text-brand" /> Red Prometeo</div>
        <nav className="space-y-1" onClick={() => setAbierto(false)}>
          {NAV[user.rol].map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={`/app/${to}`} className={({ isActive }) => `flex items-center gap-2 rounded-md px-3 py-2 text-sm ${isActive ? 'bg-blue-50 font-semibold text-brand' : 'text-slate-600 hover:bg-slate-100'}`}>
              <Icon size={16} /> {label}
            </NavLink>
          ))}
        </nav>
        <a href="/" className="mt-6 flex items-center gap-2 px-3 text-xs text-slate-400 hover:text-slate-600"><BookOpen size={13} /> Sitio público</a>
      </aside>
      {abierto && <div className="fixed inset-0 z-20 bg-black/30 md:hidden" onClick={() => setAbierto(false)} />}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="no-print flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3">
          <button className="md:hidden" onClick={() => setAbierto(true)} aria-label="Menú"><Menu /></button>
          <div className="min-w-0">
            <div className="truncate font-semibold text-ink">{org?.nombre ?? 'Red de Ciberseguridad Comunitaria'}</div>
            {org && <Badge tone={org.plan === 'escudo' ? 'green' : 'slate'}>{PLAN_LABEL[org.plan]}</Badge>}
          </div>
          <div className="ml-auto flex items-center gap-3 text-sm">
            <div className="hidden text-right sm:block"><div className="font-medium">{user.nombre}</div><div className="text-xs text-slate-500">{ROL_LABEL[user.rol]}</div></div>
            <button onClick={async () => { await logout(); nav('/login') }} className="flex items-center gap-1 rounded-md border border-slate-300 px-3 py-1.5 hover:bg-slate-100"><LogOut size={14} /> Salir</button>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 pb-20"><Outlet /></main>
      </div>
      <AsistentePanel />
    </div>
  )
}
