import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { CheckCircle2, Clock } from 'lucide-react'
import { useAuth } from '../../auth/AuthContext'
import { Badge, btnPrimary, btnSecondary, Campo, Card, ErrorMsg, ESTADO_ALERTA, inputCls, PageTitle, SEV_LABEL, Spinner, sevTone } from '../../components/ui'
import { api, fechaHora, patch, post } from '../../lib/api'
import { useAccion } from '../../lib/hooks'

export function AlertaDetalle() {
  const { id } = useParams()
  const { user } = useAuth()
  const escribe = user?.rol === 'referente' || user?.rol === 'analista'
  const analista = user?.rol === 'analista'
  const { data: a, isLoading, error } = useQuery({ queryKey: ['alerta', id], queryFn: () => api<any>(`/alertas/${id}`) })
  const inv = ['alerta', 'alertas', 'panel', 'soc', 'red']
  const paso = useAccion(({ p, hecho }: { p: number; hecho: boolean }) => post(`/alertas/${id}/pasos/${p}`, { hecho }), inv)
  const estado = useAccion((e: string) => patch(`/alertas/${id}`, { estado: e }), inv)
  const asignar = useAccion((v: boolean) => patch(`/alertas/${id}`, { asignada_a: v }), inv)
  const [nota, setNota] = useState('')
  const notaM = useAccion(() => post(`/alertas/${id}/notas`, { texto: nota }), inv)
  const [ind, setInd] = useState<{ tipo: string; valor: string; descripcion: string } | null>(null)
  const indM = useAccion(() => post(`/alertas/${id}/indicadores`, ind), inv)

  if (isLoading) return <Spinner />
  if (error) return <ErrorMsg error={error} />
  const hechos = a.pasos.filter((p: any) => p.hecho).length
  const abierta = ['nueva', 'en_investigacion'].includes(a.estado)

  return (
    <div>
      <PageTitle title={a.titulo} sub={`${a.org_nombre} · registrada ${fechaHora(a.creada)} · origen ${a.origen}`} />
      <Card className="mb-4">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <Badge tone={sevTone(a.severidad)}>{SEV_LABEL[a.severidad]}</Badge>
          <Badge tone={ESTADO_ALERTA[a.estado].tone}>{ESTADO_ALERTA[a.estado].label}</Badge>
          <span>IP de origen: <code className="rounded bg-slate-100 px-1">{a.ip_origen ?? '—'}</code></span>
          <span>{a.usuario_seudonimo ?? 'Usuario no identificado'}</span>
          <span className="text-slate-500">Asignada a: {a.asignada_nombre ?? 'nadie'}</span>
          {escribe && <div className="ml-auto flex gap-2">
            <button className={btnSecondary} onClick={() => asignar.mutate(!a.asignada_a)}>{a.asignada_a ? 'Quitar asignación' : 'Asignármela'}</button>
            <select className={inputCls + ' !w-44'} value={a.estado} onChange={(e) => estado.mutate(e.target.value)} aria-label="Estado">{Object.entries(ESTADO_ALERTA).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select>
          </div>}
        </div>
        <p className="mt-3 text-sm text-slate-700">{a.descripcion}</p>
        {a.minutos != null && <div className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-50 p-2 font-semibold text-emerald-800"><CheckCircle2 size={18} /> Contenida en {a.minutos} min{a.minutos <= 30 ? ' (dentro de la meta de 30 min)' : ''}</div>}
        {abierta && <div className="mt-3 flex items-center gap-1 text-sm text-slate-500"><Clock size={14} /> Incidente abierto. Preguntale al Asistente IA: <em>“Explicame esta alerta”</em>.</div>}
        {(estado.error || asignar.error || paso.error) && <ErrorMsg error={estado.error ?? asignar.error ?? paso.error} />}
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-bold text-ink">Checklist de contención <span className="text-sm font-normal text-slate-500">({hechos}/{a.pasos.length})</span></h2>
          <ul className="space-y-2">
            {a.pasos.map((p: any) => (
              <li key={p.id}>
                <label className={`flex items-start gap-3 rounded-md border border-slate-200 p-3 ${escribe ? 'cursor-pointer hover:bg-slate-50' : ''}`}>
                  <input type="checkbox" disabled={!escribe || paso.isPending} checked={!!p.hecho} onChange={(e) => paso.mutate({ p: p.id, hecho: e.target.checked })} className="mt-0.5 h-4 w-4" />
                  <span className="flex-1 text-sm"><span className={p.hecho ? 'text-slate-400 line-through' : ''}>{p.texto}</span>{p.hecho_en && <span className="block text-xs text-slate-400">{p.hecho_por_nombre} · {fechaHora(p.hecho_en)}</span>}</span>
                </label>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-slate-500">Al completar todos los pasos el incidente queda contenido y se registra el tiempo.</p>
        </Card>

        <Card>
          <h2 className="mb-3 font-bold text-ink">Línea de tiempo</h2>
          <ol className="space-y-3 border-l-2 border-slate-200 pl-4">
            {a.eventos.map((e: any, i: number) => <li key={i} className="text-sm"><span className="font-mono text-xs font-semibold text-brand">{fechaHora(e.ts)}</span> <span className="text-slate-500">· {e.autor}</span><div>{e.texto}</div></li>)}
          </ol>
          {escribe && (
            <form className="mt-4 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (nota.trim()) notaM.mutate(undefined, { onSuccess: () => setNota('') }) }}>
              <input className={inputCls} value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Agregar nota a la línea de tiempo…" />
              <button className={btnPrimary} disabled={notaM.isPending}>Agregar</button>
            </form>
          )}
        </Card>
      </div>

      <Card className="mt-4">
        <h2 className="mb-2 font-bold text-ink">Indicadores compartidos con la red</h2>
        {a.indicadores.length ? <ul className="mb-3 space-y-1 text-sm">{a.indicadores.map((i: any) => <li key={i.id}><Badge tone="blue">{i.tipo}</Badge> <code>{i.valor}</code></li>)}</ul> : <p className="mb-3 text-sm text-slate-500">Todavía no se publicó ningún indicador de esta alerta.</p>}
        {analista && (ind ? (
          <form className="grid gap-3 sm:grid-cols-3" onSubmit={(e) => { e.preventDefault(); indM.mutate(undefined, { onSuccess: () => setInd(null) }) }}>
            <Campo label="Tipo"><select className={inputCls} value={ind.tipo} onChange={(e) => setInd({ ...ind, tipo: e.target.value })}><option value="ip">IP</option><option value="dominio">Dominio</option></select></Campo>
            <Campo label="Valor"><input required className={inputCls} value={ind.valor} onChange={(e) => setInd({ ...ind, valor: e.target.value })} /></Campo>
            <Campo label="Descripción"><input className={inputCls} value={ind.descripcion} onChange={(e) => setInd({ ...ind, descripcion: e.target.value })} /></Campo>
            <div className="sm:col-span-3">{indM.error && <ErrorMsg error={indM.error} />}<button className={btnPrimary} disabled={indM.isPending}>Publicar en la red</button> <button type="button" className={btnSecondary} onClick={() => setInd(null)}>Cancelar</button></div>
          </form>
        ) : <button className={btnSecondary} onClick={() => setInd({ tipo: 'ip', valor: a.ip_origen ?? '', descripcion: a.titulo })}>Publicar indicador</button>)}
      </Card>
    </div>
  )
}
