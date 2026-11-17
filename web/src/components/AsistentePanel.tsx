import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Bot, Send, X } from 'lucide-react'
import { useStore } from '../state/store'
import { CHIPS, responderGuion } from '../data/guionAsistente'
import { postAsistente } from '../lib/api'

interface Msg { role: 'user' | 'assistant'; content: string; fuente?: 'ia' | 'guion' }

export function AsistentePanel() {
  const { s } = useStore()
  const loc = useLocation()
  const [open, setOpen] = useState(false)
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const end = useRef<HTMLDivElement>(null)

  const pantalla = loc.pathname.startsWith('/alertas') ? 'alerta' : loc.pathname.startsWith('/diagnostico') ? 'diagnostico' : 'default'
  const chips = CHIPS[pantalla]

  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs, typing])
  // Al cambiar de rol se reinicia la conversación (el tono cambia)
  useEffect(() => { setMsgs([]) }, [s.rol])

  async function enviar(texto: string) {
    if (!texto.trim() || typing) return
    const historial: Msg[] = [...msgs, { role: 'user', content: texto }]
    setMsgs(historial)
    setInput('')
    setTyping(true)
    const res = await postAsistente({
      rol: s.rol,
      pantalla,
      alertaId: pantalla === 'alerta' ? 'a-001' : undefined,
      mensajes: historial.map(({ role, content }) => ({ role, content })),
    })
    const texto2 = res.texto ?? responderGuion(texto, s.rol)
    // pequeño retraso para el efecto "escribiendo…" cuando responde el guion
    if (!res.texto) await new Promise((r) => setTimeout(r, 700))
    setMsgs([...historial, { role: 'assistant', content: texto2, fuente: res.texto ? 'ia' : 'guion' }])
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
                <div className={`inline-block max-w-[90%] whitespace-pre-line rounded-xl px-3 py-2 text-left text-sm ${m.role === 'user' ? 'bg-brand text-white' : 'bg-slate-100 text-slate-800'}`}>
                  {m.content}
                </div>
                {m.fuente && <div className="mt-0.5 text-[10px] uppercase text-slate-400">{m.fuente === 'ia' ? 'IA' : 'Respuesta guionada'}</div>}
              </div>
            ))}
            {typing && <div className="text-sm text-slate-400">Escribiendo…</div>}
            <div ref={end} />
          </div>
          <div className="space-y-2 border-t border-slate-200 p-3">
            <div className="flex flex-wrap gap-2">
              {chips.map((c) => (
                <button key={c} onClick={() => enviar(c)} className="rounded-full border border-brand px-3 py-1 text-xs text-brand hover:bg-blue-50">{c}</button>
              ))}
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
