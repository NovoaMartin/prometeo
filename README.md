# Red Prometeo

Plataforma web de la Red de Ciberseguridad Comunitaria (Desafío 4): una red de universidades, estudiantes supervisados y un SOC compartido que protege los datos sensibles de municipios y organizaciones sociales.

Es un **prototipo funcional sin integraciones**: toda la información vive en una base D1 (SQLite) y los datos de ejemplo son ficticios. El monitoreo real (Wazuh, MISP, DFIR-IRIS, Greenbone, Keycloak) no está conectado; las alertas se cargan a mano o con el generador de eventos de prueba.

## Estructura

| Carpeta | Contenido |
|---|---|
| `web/` | Front React + Vite + Tailwind (landing pública + app) |
| `worker/` | API en Cloudflare Worker (Hono + D1). Sirve también el front compilado |
| `shared/` | Lógica común: preguntas, puntaje de madurez, plantillas de alerta |
| `migrations/` | Esquema de D1 |
| `scripts/seed.ts` | Genera datos de ejemplo reproducibles |

## Cómo correrlo

```bash
npm run install:all   # solo la primera vez
npm run setup         # migraciones + datos de ejemplo en la D1 local
npm run dev           # front http://localhost:62467 + API http://localhost:3001
```

`npm run db:seed` borra y recarga los datos de ejemplo. Para activar el asistente con IA en local, copiar `.dev.vars.example` a `.dev.vars` y completar `DEEPSEEK_API_KEY`. Sin key, el asistente usa respuestas guionadas.

## Cuentas de demostración (contraseña `demo1234`)

| Email | Rol | Qué ve |
|---|---|---|
| `referente@villaejemplo.demo` | Referente | Todo lo de Villa Ejemplo (plan Escudo): panel, diagnóstico, plan, inventario, alertas, vulnerabilidades, red, capacitación, reporte, configuración |
| `intendente@villaejemplo.demo` | Intendente | Solo lectura: panel, plan, alertas, red y reporte |
| `referente@sanmarcos.demo` | Referente | Otra organización (para comprobar el aislamiento de datos) |
| `referente@escuela12.demo` | Referente de ONG | Plan Guardianes: sin monitoreo |
| `analista@red.demo` | Analista SOC | Consola SOC con alertas de todas las organizaciones, publica indicadores |
| `guardian1@red.demo` | Guardián digital | Sus tareas asignadas en distintas organizaciones |

También se puede crear una cuenta nueva desde `/registro` (organización + referente), opcionalmente guardando un autodiagnóstico hecho antes en `/autodiagnostico`.

## Qué hace

- **Público:** landing, precios con calculadora por población y autodiagnóstico gratuito (12 preguntas, puntaje 0–100, radar por área, top 5 acciones, plan recomendado).
- **Organización:** panel con indicadores calculados desde los datos (madurez y evolución, % MFA, tiempo medio de contención, alertas y vulnerabilidades abiertas, capacitación, última restauración); historial de diagnósticos; plan de mejora con tareas asignables a Guardianes; inventario de datos sensibles; reporte por período imprimible a PDF.
- **Incidentes:** alertas con checklist de contención, línea de tiempo, notas, estados y tiempo de contención. Al completar la checklist la alerta pasa a "contenida". Alta manual y **generador de eventos de prueba**.
- **Red de amenazas:** el analista publica indicadores (IP/dominio) y las organizaciones los bloquean.
- **Asistente:** responde según el rol y la alerta abierta. Guion local o DeepSeek (AI SDK) si hay `DEEPSEEK_API_KEY`.
- **Seguridad:** contraseñas con PBKDF2, sesiones en cookie HttpOnly, permisos por rol validados en el servidor y aislamiento por organización.

## Deploy en Cloudflare Workers

Un solo Worker sirve el front (assets estáticos) y la API en la misma URL.

```bash
npx wrangler login
npx wrangler d1 create red-prometeo          # copiar el database_id a wrangler.jsonc
npm run db:remote                            # migraciones en D1
npm run db:seed:remote                       # opcional: datos y cuentas de demostración
npx wrangler secret put DEEPSEEK_API_KEY     # opcional
npm run deploy                               # build del front + wrangler deploy
```

`db:seed:remote` borra las tablas y crea cuentas con contraseña conocida: usarlo solo en una base de demostración.
