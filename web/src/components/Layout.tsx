import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { AlertTriangle, Play, RotateCcw, Shield, Presentation } from 'lucide-react'
import { useStore } from '../state/store'
import { ROLES, RUTA_LABEL, type Rol } from '../data/municipio'
import { AsistentePanel } from './AsistentePanel'
import { PresenterBar } from './PresenterBar'

export function Layout() {
  const { s, d } = useStore()
  const nav = useNavigate()
  const rutas = ROLES[s.rol].rutas

  function reset() {
    d({ type: 'RESET' })
    nav('/')
  }

  return (
    <div className="min-h-screen">
      <header className="no-print border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
          <div className="flex items-center gap-2 font-bold text-ink"><Shield className="text-brand" /> Red Prometeo</div>
          <nav className="flex flex-wrap gap-1 text-sm">
            {rutas.map((r) => (
              <NavLink key={r} to={r} end className={({ isActive }) => `rounded-md px-3 py-1.5 ${isActive ? 'bg-blue-50 font-semibold text-brand' : 'text-slate-600 hover:bg-slate-100'}`}>
                {RUTA_LABEL[r]}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex flex-wrap items-center gap-2 text-sm">
            <select value={s.rol} onChange={(e) => d({ type: 'SET_ROL', rol: e.target.value as Rol })} className="rounded-md border border-slate-300 px-2 py-1.5" aria-label="Rol">
              {(Object.keys(ROLES) as Rol[]).map((r) => <option key={r} value={r}>{ROLES[r].nombre}</option>)}
            </select>
            <button onClick={() => { d({ type: 'SIMULAR_ATAQUE' }); nav('/panel') }} className="flex items-center gap-1 rounded-md bg-red-600 px-3 py-1.5 font-semibold text-white hover:bg-red-700">
              <Play size={14} /> Simular ataque
            </button>
            <button onClick={() => d({ type: 'PRESENTADOR', on: !s.presentador })} className={`flex items-center gap-1 rounded-md border px-3 py-1.5 ${s.presentador ? 'border-brand bg-blue-50 text-brand' : 'border-slate-300'}`}>
              <Presentation size={14} /> Presentador
            </button>
            <button onClick={reset} className="flex items-center gap-1 rounded-md border border-slate-300 px-3 py-1.5 hover:bg-slate-100" title="Reiniciar demo">
              <RotateCcw size={14} /> Reiniciar
            </button>
          </div>
        </div>
        <div className="mx-auto max-w-6xl px-4 pb-2 text-xs text-slate-500">
          {ROLES[s.rol].nombre} · {ROLES[s.rol].descripcion}
        </div>
      </header>

      {s.alerta.activa && !s.alerta.contenida && (
        <button onClick={() => nav('/alertas/a-001')} className="no-print fixed right-4 top-16 z-50 flex max-w-sm items-start gap-3 rounded-xl border border-red-300 bg-red-50 p-4 text-left shadow-xl">
          <AlertTriangle className="mt-0.5 shrink-0 text-red-600" />
          <div>
            <div className="text-sm font-bold text-red-700">Alerta crítica · 22:40</div>
            <div className="text-sm text-red-900">Acceso masivo a carpetas desde cuenta de proveedor sin MFA</div>
            <div className="mt-1 text-xs text-red-700 underline">Ver detalle</div>
          </div>
        </button>
      )}

      <main className="mx-auto max-w-6xl px-4 py-6 pb-20">
        <Outlet />
      </main>
      <AsistentePanel />
      <PresenterBar />
    </div>
  )
}
