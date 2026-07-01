# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Comandos

```bash
npm run dev       # servidor de desarrollo (puerto 5173)
npm run build     # compilar para producción
npm run preview   # previsualizar build de producción
```

No hay linter ni test runner configurados aún.

## Arquitectura

Aplicación Vue 3 SPA con tres roles de usuario: `alumno`, `profesor`, `admin`. Cada rol tiene sus propias vistas y no puede acceder a rutas de otro rol.

### Autenticación y autorización

`src/stores/authStore.js` es el punto central. Persiste `token` y `user` en `localStorage`. El campo `user.rol` (`alumno` | `profesor` | `admin`) controla el acceso.

El guard `router.beforeEach` en `src/router/index.js` verifica:
1. Si la ruta es pública (`meta.public`) — deja pasar.
2. Si no hay token — redirige a `/login`.
3. Si `meta.rol` no coincide con `auth.userRole` — redirige a `/login`.

La raíz `/` redirige dinámicamente según el rol del usuario autenticado.

### HTTP

`src/services/api.js` exporta una instancia Axios preconfigurada con `baseURL: '/api'`. El proxy de Vite reescribe `/api/*` → `http://localhost:3000/*`. Todos los módulos que llamen a la API deben importar esta instancia, no crear nuevas. El interceptor de respuesta maneja el 401 automáticamente (logout + redirect).

### Datos mock

Actualmente todos los datos están hardcodeados en cada vista (sin API real). Al conectar el backend, reemplazar los `ref([...])` locales por llamadas a través de `src/services/api.js`.

### Quasar

El tema está definido en `src/assets/quasar-variables.sass`. Los plugins activos son `Notify` y `Loading` (registrados en `src/main.js`). Usar `useQuasar()` para acceder a `$q.notify()` y `$q.dialog()` dentro de los componentes.