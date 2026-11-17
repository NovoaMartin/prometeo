import { useEffect, useRef, useState } from 'react'
import { matchPath, useLocation } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Bot, Send, X } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { CHIPS, responderGuion, type CtxAlerta, type Perfil } from '../data/guionAsistente'
import { post, type AsistenteRes } from '../lib/api'
import { PLANTILLAS, type TipoAlerta } from '@shared/plantillas'

interface Msg { role: 'user' | 'assistant'; content: string; fuente?: 'ia' | 'guion' }

export function AsistentePanel() {
  const { user, org } = useAuth()
  const qc = useQueryClient()
  const loc = useLocation()
  const [open, setOpen] = useState(false)
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const end = useRef<HTMLDivElement>(null)

  const alertaId = matchPath('/app/alertas/:id', loc.pathname)?.params.id
  const pantalla = alertaId ? 'alerta' : loc.pathname.startsWith('/app/diagnostico') ? 'diagnostico' : 'default'
  const perfil: Perfil = user?.rol === 'referente' && org?.tipo === 'ong' ? 'ong' : user?.rol === 'guardian' ? 'analista' : ((user?.rol ?? 'referente') as Perfil)

  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs, typing])
  useEffect(() => { setMsgs([]) }, [user?.id])

  // Contexto de la alerta abierta (ya está en la caché de react-query)
  function ctxAlerta(): CtxAlerta | undefined {
    const a = alertaId ? qc.getQueryData<any>(['alerta', alertaId]) : undefined
    if (!a) return undefined
    const p = PLANTILLAS[a.tipo as TipoAlerta]
    return { simple: p.simple, tecnica: p.tecnica, pasosPendientes: a.pasos.filter((x: any) => !x.hecho).map((x: any) => x.texto) }
  }

  async function enviar(texto: string) {
    if (!texto.trim() || typing) return
    const historial: Msg[] = [...msgs, { role: 'user', content: texto }]
    setMsgs(historial); setInput(''); setTyping(true)
    let res: AsistenteRes = { texto: null, fuente: 'guion' }
    try {
      res = await post<AsistenteRes>('/asistente', { pantalla, alertaId: alertaId ? Number(alertaId) : undefined, mensajes: historial.map(({ role, content }) => ({ role, content })) })
    } catch { /* se usa el guion */ }
    if (!res.texto) await new Promise((r) => setTimeout(r, 600))
    setMsgs([...historial, { role: 'assistant', content: res.texto ?? responderGuion(texto, perfil, ctxAlerta()), fuente: res.texto ? 'ia' : 'guion' }])
    setTyping(false)
  }

  return (
    <div className="no-print">
      {!open && (
        <button onClick={() => setOpen(true)} className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-brand px-4 py-3 text-white shadow-lg hover:bg-blue-700">
          <Bot size={20} /> Asistente IA
        </button>
      )}
      {open && (
        <aside className="fixed bottom-0 right-0 top-0 z-40 flex w-full max-w-sm flex-col border-l border-slate-200 bg-white shadow-2xl">
          <header className="flex items-center justify-between bg-ink px-4 py-3 text-white">
            <div className="flex items-center gap-2 font-semibold"><Bot size={18} /> Asistente de Ciberseguridad</div>
            <button onClick={() => setOpen(false)} aria-label="Cerrar"><X size={18} /></button>
          </header>
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {msgs.length === 0 && <p className="text-sm text-slate-500">Hola, soy tu copiloto de seguridad. Elegí una pregunta o escribí la tuya.</p>}
            {msgs.map((m, i) => (
              <div key={i} className={m.role === 'user' ? 'text-right' : ''}>
                <div className={`inline-block max-w-[90%] whitespace-pre-line rounded-xl px-3 py-2 text-left text-sm ${m.role === 'user' ? 'bg-brand text-white' : 'bg-slate-100 text-slate-800'}`}>{m.content}</div>
                {m.fuente && <div className="mt-0.5 text-[10px] uppercase text-slate-400">{m.fuente === 'ia' ? 'IA' : 'Respuesta guionada'}</div>}
              </div>
            ))}
            {typing && <div className="text-sm text-slate-400">Escribiendo…</div>}
            <div ref={end} />
          </div>
          <div className="space-y-2 border-t border-slate-200 p-3">
            <div className="flex flex-wrap gap-2">
              {CHIPS[pantalla].map((c) => <button key={c} onClick={() => enviar(c)} className="rounded-full border border-brand px-3 py-1 text-xs text-brand hover:bg-blue-50">{c}</button>)}
            </div>
            <form onSubmit={(e) => { e.preventDefault(); enviar(input) }} className="flex gap-2">
              <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Escribí tu consulta…" className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              <button className="rounded-lg bg-brand px-3 text-white" aria-label="Enviar"><Send size={16} /></button>
            </form>
          </div>
        </aside>
      )}
    </div>
  )
}
