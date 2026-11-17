import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>{children}</div>
}

export function Kpi({ label, value, sub, tone = 'slate' }: { label: string; value: ReactNode; sub?: string; tone?: 'slate' | 'green' | 'red' | 'amber' }) {
  const c = { slate: 'text-ink', green: 'text-emerald-600', red: 'text-red-600', amber: 'text-amber-600' }[tone]
  return (
    <Card>
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
      <div className={`mt-1 text-3xl font-bold ${c}`}>{value}</div>
      {sub && <div className="mt-1 text-xs text-slate-500">{sub}</div>}
    </Card>
  )
}

export function PageTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-5">
      <h1 className="text-2xl font-bold text-ink">{title}</h1>
      {sub && <p className="mt-1 text-slate-600">{sub}</p>}
    </div>
  )
}

export function Badge({ children, tone }: { children: ReactNode; tone: 'red' | 'amber' | 'blue' | 'slate' | 'green' }) {
  const c = {
    red: 'bg-red-100 text-red-700', amber: 'bg-amber-100 text-amber-700', blue: 'bg-blue-100 text-blue-700',
    slate: 'bg-slate-100 text-slate-600', green: 'bg-emerald-100 text-emerald-700',
  }[tone]
  return <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${c}`}>{children}</span>
}

export const sevTone = (s: string) =>
  ({ critica: 'red', Crítica: 'red', alta: 'amber', Alta: 'amber', media: 'blue', Media: 'blue' } as Record<string, 'red' | 'amber' | 'blue'>)[s] ?? 'slate'

export function Spinner({ texto = 'Cargando…' }: { texto?: string }) {
  return <div className="py-10 text-center text-sm text-slate-500">{texto}</div>
}

export function ErrorMsg({ error }: { error: unknown }) {
  return <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error instanceof Error ? error.message : 'Ocurrió un error'}</div>
}

export function Upsell({ titulo = 'Monitoreo 24/7 con el Escudo Municipal', children }: { titulo?: string; children?: ReactNode }) {
  const { user } = useAuth()
  return (
    <Card className="border-teal-300 bg-teal-50">
      <h2 className="font-bold text-ink">{titulo}</h2>
      <p className="mt-1 text-sm text-slate-700">{children ?? 'Esta sección forma parte del plan Escudo Municipal: alertas, gestión de incidentes, vulnerabilidades y respuesta guiada del SOC compartido.'}</p>
      {user?.rol === 'referente'
        ? <Link to="/app/configuracion" className="mt-3 inline-block rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white">Ver plan en Configuración</Link>
        : <p className="mt-2 text-xs text-slate-500">Consultá con el referente de seguridad de tu organización.</p>}
    </Card>
  )
}

export const ESTADO_ALERTA: Record<string, { label: string; tone: 'red' | 'amber' | 'blue' | 'slate' | 'green' }> = {
  nueva: { label: 'Nueva', tone: 'red' },
  en_investigacion: { label: 'En investigación', tone: 'amber' },
  contenida: { label: 'Contenida', tone: 'green' },
  cerrada: { label: 'Cerrada', tone: 'slate' },
  falso_positivo: { label: 'Falso positivo', tone: 'slate' },
}

export const SEV_LABEL: Record<string, string> = { critica: 'Crítica', alta: 'Alta', media: 'Media', baja: 'Baja' }

export function Campo({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block text-sm"><span className="text-slate-600">{label}</span><div className="mt-1">{children}</div></label>
}

export const inputCls = 'w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand'
export const btnPrimary = 'rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50'
export const btnSecondary = 'rounded-md border border-slate-300 bg-white px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-50'
