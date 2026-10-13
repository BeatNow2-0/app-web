# BeatNow: auditoría de entrega beta

Fecha: 2026-10-13. Estado: en ejecución; no constituye aprobación de producción.

## Arquitectura comprobada

- `app-web` (este repositorio): React 18, TypeScript, Vite, Axios, React Router. Rama local `main`, base `2a4f387`; sin modificaciones iniciales. Ramas remotas de auditoría y upload, no fusionadas automáticamente.
- `../back`: FastAPI, Pydantic, Motor/MongoDB; almacenamiento local con FFmpeg, originales privados y previews públicos. Repositorio independiente con modificaciones previas: se preservan. Cambios nuevos se preparan y prueban en copia aislada antes de aplicarlos.
- `../movil-app`: cliente Flutter independiente. No es la tecnología de esta web. `../web` es otro proyecto; no se sustituye el frontend actual.
- Despliegue existente: Vercel para SPA, backend externo con TLS/Nginx. No existen tests frontend ni CI funcional de calidad inicial.

## Hallazgos iniciales priorizados

| Prioridad | Hallazgo verificable | Consecuencia |
|---|---|---|
| P0 | Tokens en localStorage; credenciales en estado de navegación | Persistencia de secretos accesible desde JS/historial |
| P0 | Interceptor sobrescribe bearer de verificación e ignora skipAuthRefresh | Verificación puede usar el token equivocado |
| P0 | Upload no envía rights_confirmed | Backend rechaza publicación |
| P0 | No hay rol productor servidor | Cualquier cuenta activa puede publicar |
| P0 | Sin licencia explícita ni despublicación | Condiciones de uso ambiguas |
| P0 | Búsqueda pagina antes de aplicar relevancia, no filtra texto | Resultados incorrectos y paginación engañosa |
| P0 | Letras ausentes en web; API lista sin ID y sin validar beat | CRUD incompleto |
| P0 | Saved posts devuelve ID de interacción como ID de beat | Reproducción/acciones apuntan al recurso incorrecto |
| P0 | Duplicados like/save/follow devuelven error; UI oculta fallos | Estados y contadores inconsistentes |
| P1 | Singleton usuario, errores de reproducción sin capturar, falta detener en logout | Estado frágil y audio residual |
| P1 | Feed aleatorio, paginación incompleta en perfiles, filtros ausentes | Descubrimiento limitado |
| P1 | Dominio real por defecto en configuración/CSP | Build acoplado a infraestructura externa |
| P1 | Sin pruebas frontend, sin evidencia E2E ni escaneo de artefactos | No se puede afirmar preparación para despliegue |

## Límites y decisiones

Se mantiene React/FastAPI/MongoDB. No se crean pagos ni compras ficticias. La cuenta de productor se concede por administración, nunca por datos enviados por registro. Acceso web de corta duración en memoria, renovación mediante cookie HttpOnly. La configuración y las pruebas deben ejecutarse sin cargar secretos de `.env` existentes. Ninguna operación de pruebas se dirige a producción.
