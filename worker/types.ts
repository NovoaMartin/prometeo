export interface Env {
  DB: D1Database
  ASSETS: Fetcher
  DEEPSEEK_API_KEY?: string
  DEEPSEEK_MODEL?: string
}

export type Rol = 'referente' | 'intendente' | 'analista' | 'guardian'

export interface Usuario {
  id: number
  org_id: number | null
  email: string
  nombre: string
  rol: Rol
}

export type HonoEnv = { Bindings: Env; Variables: { user: Usuario } }
