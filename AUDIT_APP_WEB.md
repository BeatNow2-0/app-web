# AUDITORÍA APP-WEB

## 1. Resumen ejecutivo

- Estado inicial: la aplicación compilaba, pero mezclaba código moderno con legado no usado, llamadas HTTP directas y Axios repartido, media reconstruida desde rutas antiguas, auth sin refresh automático, logout solo local, borrado contra un endpoint inexistente, upload incompatible con los límites del backend y varios flujos sociales ausentes.
- Principales problemas: URLs físicas legacy para avatar/cover/audio; sesión perdida o expirada sin rotación segura; múltiples 401 capaces de provocar varios refresh; reproductor aislado dentro de un modal; formatos/tamaños de upload incorrectos; IDs y errores no normalizados; navegación móvil débil; estilos duplicados y 55 vulnerabilidades npm iniciales.
- Cambios: cliente API único, refresh mutex, logout con revocación, tipos comunes, normalización de IDs/media, reproductor global, feed, Explore, Library, perfil público/follow, paginación, upload validado, sistema visual oscuro unificado, navegación responsive, CSP y limpieza de dependencias/código muerto.
- Estado final del frontend: build y lint pasan, `npm audit` devuelve 0 vulnerabilidades, el OpenAPI de producción coincide con todas las rutas consumidas, health/readiness y CORS están correctos. No se declara listo por el bloqueo backend de activación de cuentas y por faltar E2E manual autenticado.

## 2. P0

### Media construida desde rutas físicas legacy

Problema: avatar, covers y audio se reconstruían con `/beatnow/{user}/posts/...` y `photo_profile.png`.

Archivo: `src/Model/UserSingleton.tsx`, `Dashboard.tsx`, `BeatsPage.tsx`, `Stats.tsx`.

Causa: contrato histórico anterior a Media V2.

Impacto: imágenes/audio rotos con la estructura actual `avatars/` y `beats/`; URLs inválidas cuando faltaba ID.

Corrección: toda media procede de `profile_image_url`, `cover_image_url`/`caratula` temporal y `audio_url`; fallbacks locales para avatar y cover.

Estado: CORREGIDO.

### Borrado de beat incompatible

Problema: el frontend llamaba `DELETE /v1/api/posts/delete/{id}`.

Archivo: `src/Model/api/posts.ts`.

Causa: endpoint legacy inexistente en el OpenAPI actual.

Impacto: los beats no podían eliminarse.

Corrección: `DELETE /v1/api/posts/{post_id}`.

Estado: CORREGIDO.

### Upload incompatible

Problema: permitía FLAC/GIF y 200 MB de audio; el backend acepta MP3/M4A/WAV, JPEG/PNG/WEBP, 50 MB/10 MB.

Archivo: `src/Screens/UploadScreens/Upload.tsx`, `src/Model/api/posts.ts`.

Causa: límites y tipos antiguos.

Impacto: uploads rechazados tarde con 413/415 y mala experiencia.

Corrección: validación por MIME/extensión/tamaño, FormData alineado, timeout de 10 minutos, progreso, AbortController, prevención de doble submit, limpieza y navegación post-éxito.

Estado: CORREGIDO.

### Sesión sin refresh/logout real

Problema: las llamadas usaban tokens manuales, no rotaban refresh y logout solo borraba localStorage.

Archivo: `src/Model/api/client.ts`, `src/Model/api/auth.ts`, `ProtectedRoute.tsx`, `Header.tsx`.

Causa: ausencia de cliente central e interceptor.

Impacto: expiraciones bruscas, riesgo de refresh duplicado y refresh token no revocado.

Corrección: Axios único, Bearer automático, una promesa de refresh compartida, retry único, evento de sesión expirada, `POST /users/logout` y limpieza garantizada.

Estado: CORREGIDO.

### Reproductor no global

Problema: el audio vivía en un modal y cada instancia podía competir con otra.

Archivo: `src/contexts/PlayerContext.tsx`, `src/components/Player/GlobalPlayer.tsx`.

Causa: reproductor por componente.

Impacto: reproducción simultánea, pérdida al navegar y controles incompletos.

Corrección: un único `HTMLAudioElement` persistente con play/pause, seek, duración, loading, error, volumen, cleanup, vista deduplicada por sesión y UI móvil.

Estado: CORREGIDO.

### Registro/activación imposible con el contrato actual

Problema: `POST /register` crea `is_active=false`; `POST /login` rechaza usuarios inactivos; `POST /mail/confirmation` exige Bearer access token.

Archivo backend auditado: `back/routes/users_routes.py`, `back/routes/mail_routes.py`, `back/config/security.py`.

Causa: circularidad en el contrato de activación.

Impacto: un usuario nuevo recibe un código que no puede enviar desde ningún cliente sin un token que el login se niega a emitir.

Corrección frontend: se evita el falso auto-login y se informa de la activación pendiente.

Estado: **REQUIERE CAMBIO BACKEND**.

## 3. P1

### API y errores dispersos

Problema: Axios/fetch por componentes, mensajes técnicos y timeouts inconsistentes.

Archivo: `src/Model/api/client.ts`, `auth.ts`, `posts.ts`, `discovery.ts`.

Causa: ausencia de capa de transporte.

Impacto: lógica duplicada y UX inconsistente.

Corrección: cliente, timeout y mapeo 400/401/403/404/409/413/415/422/429/500/503/network/timeout centralizados.

Estado: CORREGIDO.

### IDs propagados

Problema: consumidores dependían de `_id` directamente.

Archivo: `src/utils/entities.ts`.

Causa: coexistencia `_id`, `id`, `post_id`, `beat_id`.

Impacto: acciones y keys podían fallar con respuestas legacy.

Corrección: `getBeatId`, `getUserId` y normalización al entrar en la capa API.

Estado: CORREGIDO.

### Likes, saves, follow y views

Problema: faltaban flujos sociales reutilizables y deduplicación de vistas.

Archivo: `BeatCard.tsx`, `PlayerContext.tsx`, `ProfilePage.tsx`.

Causa: UI centrada solo en catálogo propio.

Impacto: producto poco social y riesgo de doble request/contador negativo.

Corrección: optimistic UI con rollback, bloqueo durante request, `Math.max(0)`, follow protegido y views una vez por beat/sesión en inicio de reproducción.

Estado: CORREGIDO.

### Search y paginación

Problema: no existía Explore y los listados cargaban una página implícita.

Archivo: `ExplorePage`, `LibraryPage`, `BeatsPage`, `Dashboard`.

Causa: consumidores mínimos del backend.

Impacto: sin descubrimiento y pérdida silenciosa después de 50 elementos.

Corrección: debounce 350 ms, AbortController, protección contra races, estados loading/error/empty, `limit/skip`, “load more” y exclusión de IDs en feed.

Estado: CORREGIDO.

### Seguridad y deuda de dependencias

Problema: Firebase no usado con configuración pública, console logs, dependencias muertas y 55 vulnerabilidades npm.

Archivo: `package.json`, `package-lock.json`, `vercel.json` y código eliminado.

Causa: prototipos abandonados y toolchain antiguo.

Impacto: superficie de ataque y bundle innecesarios.

Corrección: eliminación de Firebase/código demo/librerías sin consumidor; Axios, Router, Vite, plugin React y TypeScript actualizados; CSP y headers de Vercel; audit final 0.

Estado: CORREGIDO.

## 4. Legacy eliminado

- `/beatnow/`: ELIMINAR/BUG; eliminado por completo del frontend.
- `photo_profile.png` / `.jpg`: ELIMINAR/BUG; eliminado.
- `photo_profile`: LEGACY únicamente como campo de respuesta fallback y CORRECTA dentro de los nombres contractuales `change_photo_profile`/`delete_photo_profile`.
- `caratula`: LEGACY conservado solo como fallback central `cover_image_url ?? caratula`.
- URLs de cover/audio/avatar construidas manualmente: ELIMINAR/BUG; eliminadas.
- `/srv/`, `/var/www/html`: ELIMINAR; cero apariciones.
- `api.beatnow.app`: CORRECTA en la configuración central/default y `.env.example`.
- `res.beatnow.app`: ya no aparece en código; no se necesita `VITE_MEDIA_URL`.
- `localhost`/`127.0.0.1`: CORRECTA solo en documentación de desarrollo local.
- Endpoints `/posts/*`: CORRECTA; se mantienen por contrato legacy del backend.

## 5. API audit

| Endpoint | Método | Archivo | Estado | Cambio |
|---|---:|---|---|---|
| `/v1/api/users/login` | POST | `auth.ts` | OK | Form URL encoded centralizado |
| `/v1/api/users/register` | POST | `auth.ts` | OK / backend bloqueado | Payload alineado, sin `is_active` |
| `/v1/api/users/refresh` | POST | `client.ts` | OK | Rotación con mutex |
| `/v1/api/users/logout` | POST | `auth.ts` | OK | Revocación antes de limpiar |
| `/v1/api/users/users/me` | GET/PUT | `auth.ts` | OK | Perfil centralizado |
| `/v1/api/users/change_photo_profile` | PUT | `auth.ts` | OK | FormData `file` |
| `/v1/api/users/delete_photo_profile` | DELETE | `auth.ts` | OK | Refetch posterior |
| `/v1/api/users/delete` | DELETE | `auth.ts` | OK | Cliente central |
| `/v1/api/users/profile/{user_id}` | GET | `auth.ts` | OK | Perfil público |
| `/v1/api/users/posts/{username}` | GET | `posts.ts` | OK | `limit/skip` |
| `/v1/api/users/saved-posts` | GET | `discovery.ts` | OK | Library paginada |
| `/v1/api/posts/feed` | GET | `posts.ts` | OK | `limit/exclude_ids` |
| `/v1/api/posts/upload` | POST | `posts.ts` | OK | FormData/progreso/cancelación |
| `/v1/api/posts/update/{post_id}` | PUT | `posts.ts` | OK | Metadata/cover |
| `/v1/api/posts/{post_id}` | DELETE | `posts.ts` | CORREGIDO | Reemplaza ruta inexistente `/delete/{id}` |
| `/v1/api/search/search_posts` | GET | `discovery.ts` | OK | Debounce/cancelación/paginación |
| `/v1/api/search/user/` | GET | `discovery.ts` | OK | Search de creadores |
| `/v1/api/interactions/like|unlike/{post_id}` | POST/DELETE | `posts.ts` | OK | Optimistic UI segura |
| `/v1/api/interactions/save|unsave/{post_id}` | POST/DELETE | `posts.ts` | OK | Optimistic UI segura |
| `/v1/api/interactions/view/{post_id}` | POST | `posts.ts` | OK | Deduplicado en player |
| `/v1/api/follows/follow|unfollow/{user_id}` | POST/DELETE | `discovery.ts` | OK | Estado pending/rollback |
| `/v1/api/mail/send-password-reset` | POST | `auth.ts` | OK | Mensaje no enumerable |
| `/v1/api/mail/password-change` | POST | `auth.ts` | OK | Ruta pública `/reset-password` añadida |
| `/v1/api/mail/send-confirmation` | POST | `auth.ts` | INCOMPATIBLE para alta | Requiere token imposible de obtener |
| `/v1/api/mail/confirmation` | POST | `auth.ts` | INCOMPATIBLE para alta | Requiere token imposible de obtener |

## 6. Auth

- Login: formulario `application/x-www-form-urlencoded`, mensajes específicos para credenciales incorrectas/cuenta inactiva y limpieza si el bootstrap de perfil falla.
- Registro: JSON ajustado al esquema; ya no envía `is_active` ni promete una sesión que el backend no puede entregar.
- Access token: inyectado desde una única capa.
- Refresh: rotación en `/refresh`, una sola promesa para múltiples 401, un retry máximo y sin loops sobre login/refresh/logout.
- Logout: revoca refresh token en backend; las credenciales se eliminan incluso con fallo de red.
- 401: refresh si existe; si falla, limpia y notifica a `ProtectedRoute`.
- Persistencia: sigue en localStorage porque el backend no emite cookies HttpOnly. Una migración a cookies requiere backend.

## 7. Media

- Avatar: `profile_image_url ?? photo_profile ?? /avatar-fallback.svg`; nunca se usa un path físico.
- Cover: `cover_image_url ?? caratula ?? /cover-fallback.svg` desde un único helper.
- Audio: solo `audio_url`; el player no reconstruye extensiones/rutas.
- Upload: JPEG/PNG/WEBP ≤10 MB; MP3/M4A/WAV ≤50 MB; errores 413/415 legibles.
- URLs: no se añadió `VITE_MEDIA_URL` porque la API devuelve URLs completas.

## 8. Diseño

- Sistema anterior: múltiples fondos, radios, gradientes y nombres globales incompatibles; navegación desplegable de 80 px; modales y spinners sobredimensionados; vistas con estilos no relacionados.
- Nuevo sistema: tokens de fondo/superficie/border/texto/acento/estado/radio/sombra/transición; profundidad por superficies, acento violeta único y contraste alto.
- Componentes: `AppShell`, `BeatCard`, `GlobalPlayer`, `EmptyState`, `ErrorState`, `CardSkeleton`, selects y modales coherentes.
- Navegación: sidebar desktop y bottom navigation mobile con estado activo; Home, Explore, Upload, Library, My beats y Stats.
- Player: persistente, compacto, cover/beat/productor/progreso/tiempos/volumen/error; móvil simplificado.
- Feed: portada protagonista, play, productor, BPM, tags, plays, like y save.
- Perfil: avatar, nombre, bio, followers/following/beats y follow con rollback.
- Upload: drag/drop, previews, tamaño/nombre, metadata, derechos, progreso/cancelación y estados claros.
- Login/register/reset: composición unificada, labels, autocomplete, visibilidad de password, loading y enlaces legales.
- Mobile: grids adaptativos, bottom nav, player sobre navegación, formularios/filas apilables y touch targets.
- Accesibilidad: focus visible, aria labels, labels de formulario, modal con Escape/backdrop, alt/fallback, reduced motion y semántica de navegación.

## 9. Antes / después

- Antes: dashboard administrativo aislado; después: home social con métricas y feed comunitario.
- Antes: audio solo en modal y por instancia; después: reproducción persistente global.
- Antes: menú lateral oculto y sin estado; después: navegación estable desktop/mobile.
- Antes: upload aceptaba archivos que backend rechazaba; después: validación previa y progreso cancelable.
- Antes: portadas/avatares dependían de rutas físicas; después: media V2 con fallback central.
- Antes: sin Explore/Library/perfil público; después: búsqueda race-safe, guardados y follow.
- Antes: 918 paquetes, 55 vulnerabilidades y JS ~579 kB; después: 125 paquetes, 0 vulnerabilidades y JS ~407 kB (~133 kB gzip).

## 10. Archivos modificados

- `src/Model/api/client.ts`: transporte, tokens, refresh mutex y errores.
- `src/Model/api/auth.ts`, `posts.ts`, `discovery.ts`: contratos API por dominio.
- `src/types/api.ts`, `src/utils/entities.ts`: tipos, IDs y media.
- `src/contexts/PlayerContext.tsx`, `components/Player/*`: audio global.
- `components/AppShell/*`, `Layout/Header/*`, `Layout/LeftSlide/*`: shell y navegación.
- `components/BeatCard/*`, `components/States/*`: UI reutilizable.
- `Screens/DashboardPage/*`, `ExplorePage/*`, `LibraryPage/*`, `ProfilePage/*`: producto social.
- `Screens/BeatsPage/*`, `StatsPage/*`, `UploadScreens/*`: catálogo, métricas y publicación.
- `Screens/Login Page/*`, `Sign Up Page/*`, `ForgotPwd Page/*`, `components/AuthLayout/*`: auth UX.
- `components/Profile/*`, `Popup/*`, `Loading/*`, `Select/*`, `BeatEditor/*`: componentes coherentes y accesibles.
- `src/App.tsx`, `main.tsx`, `styles/global.css`: routing, providers y tokens.
- `public/avatar-fallback.svg`, `public/cover-fallback.svg`: fallbacks locales.
- `.env.example`, `README.md`, `vite.config.ts`, `vercel.json`: entorno, documentación, build y headers.
- `package.json`, `package-lock.json`, `tsconfig*.json`: dependencias/toolchain.
- Eliminados por no usarse: Firebase, CardDetails/player duplicado, VerifyPopup inaccesible, BeatsFrame, Message/ListGroup, CSS/select legacy y `apiConfig.json`.

## 11. Build y tests

- Install: `npm install` → up to date, 125 packages, 0 vulnerabilities.
- Build: `npm run build` → PASS; Vite 8.3.2, 1748 módulos, JS 406.86 kB (132.74 kB gzip), CSS 42.98 kB (8.58 kB gzip).
- Lint: `npm run lint` → PASS (`tsc --noEmit`).
- Tests: no existe script ni suite de tests en el repositorio; no se inventó un resultado.
- Audit: `npm audit` → PASS, 0 vulnerabilities.
- Servidor local: rutas públicas/protegidas/deep links devuelven HTTP 200 mediante SPA fallback.
- Backend producción: `/healthz` OK, `/readyz` ready, CORS para `https://app.beatnow.app` OK.
- OpenAPI: las rutas frontend auditadas existen en `https://api.beatnow.app/openapi.json`.

## 12. Pendiente backend

- **REQUIERE CAMBIO BACKEND — P0:** resolver activación circular. Opciones válidas: emitir un token de activación limitado al registrar/login inactivo, o hacer `/mail/confirmation` aceptar un challenge firmado independiente del access token.
- **REQUIERE CAMBIO BACKEND/configuración:** `PUBLIC_BASE_URL` debe producir enlaces a `https://app.beatnow.app/reset-password?token=...`; si hoy apunta a API, el email aterriza en una ruta sin UI.
- **REQUIERE CAMBIO BACKEND — mejora de seguridad futura:** cookies Secure/HttpOnly/SameSite para refresh si se quiere retirar el refresh token de localStorage.
- **REQUIERE CAMBIO BACKEND — opcional:** endpoint autenticado de cambio de contraseña si se quiere ofrecer desde perfil sin pasar por recuperación.

## 13. Pendiente manual

- Vercel: definir `VITE_API_URL=https://api.beatnow.app` y redeploy; no definir `VITE_MEDIA_URL`.
- Backend: fijar `PUBLIC_BASE_URL=https://app.beatnow.app` para reset; corregir activación; mantener CORS actual.
- DNS: sin cambios previstos; verificar que `app`, `api` y `res` mantienen TLS válido.
- QA manual: no hubo navegador conectado en la sesión. Probar login real, refresh tras 15 min, logout/revocación, registro después del fix backend, upload de archivos límite, Range Requests/seek, like/save/follow, edición/borrado, Safari iOS/Chrome Android y CSP desplegada.

## 14. Deuda técnica restante

- Alta: falta una suite E2E/integración para auth, upload e interacciones; activación backend bloqueada.
- Media: tokens en localStorage mientras backend no soporte cookies HttpOnly; estadísticas dependen de agregados limitados incluidos en posts.
- Media: el frontend usa inferencia `hasMore = page.length === limit` porque las respuestas no incluyen total/cursor.
- Baja: añadir code splitting por ruta si el producto crece; el bundle actual está por debajo del warning de Vite.
- Baja: internacionalización; la interfaz nueva es consistente en inglés mientras partes legales permanecen en español.

## 15. Estado final

El frontend está estabilizado y listo para QA técnico, pero el producto completo no puede declararse listo mientras el alta de usuarios permanezca circular y no se ejecute el E2E manual autenticado.

APP-WEB NOT READY
