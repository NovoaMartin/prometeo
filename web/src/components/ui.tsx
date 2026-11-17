import type { ReactNode } from 'react'

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
