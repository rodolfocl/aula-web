# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Comandos

```bash
npm run dev       # servidor de desarrollo (puerto 5173)
npm run build     # compilar para producción
npm run preview   # previsualizar build de producción
```

No hay linter ni test runner configurados.

## Arquitectura

Vue 3 SPA con Vite, Quasar UI v2 y Pinia. Backend Express en `http://localhost:3000` (no incluido en este repo). El proxy de Vite reescribe `/api/*` → `http://localhost:3000/*`.

### Autenticación y roles

`src/stores/authStore.js` es el punto central. Persiste `token` y `user` en `localStorage`. El usuario puede tener **múltiples roles simultáneos** — el campo es `user.roles` (array), no un string singular. Los valores posibles son `'alumno'`, `'profesor'`, `'administrador'`.

Nunca leer `user.rol` (singular) — siempre usar `auth.userRoles` (computed) o `auth.hasRole(rol)`.

### Router y guards

`src/router/index.js` define dos formatos de meta para proteger rutas:
- `meta: { rol: 'alumno' }` — acceso exclusivo para ese rol.
- `meta: { roles: ['administrador', 'profesor'] }` — acceso para cualquiera de los roles listados.

El guard `beforeEach` valida ambos. La raíz `/` redirige dinámicamente según los roles del usuario autenticado (prioridad: administrador → profesor → alumno).

### HTTP

`src/services/api.js` exporta una instancia Axios con `baseURL: '/api'`, interceptor de token Bearer en cada request, y logout automático en 401. Todos los módulos deben importar esta instancia.

### Permisos en UI

`src/composables/usePermissions.js` expone `{ isAdmin, isTeacher, isStudent }` como computed. Los botones de acción visibles para `profesor` pero reservados a `administrador` usan un patrón de wrapper con overlay para mostrar tooltip en estado deshabilitado, ya que Quasar bloquea `pointer-events` en botones con `disable`:

```html
<div style="position: relative; display: inline-flex;">
  <q-btn :style="isAdmin ? 'color: #C0392B;' : 'color: #AAAAAA; opacity: 0.5; pointer-events: none;'" />
  <div v-if="!isAdmin" style="position: absolute; inset: 0; cursor: not-allowed;">
    <q-tooltip class="pdv-tooltip">Solo los administradores pueden...</q-tooltip>
  </div>
</div>
```

### Layout y sidebar

`src/layouts/MainLayout.vue` envuelve todas las rutas autenticadas. El sidebar (`q-drawer`, ancho 64px) muestra íconos según roles activos del usuario. Íconos: Tabler Icons vía `<i class="ti ti-...">` (cargados desde CDN en `index.html`). Ícono activo en `#C9A96E`, inactivo en `#FFFFFF`.

El color de fondo del header y sidebar es `#0B1835`. El tooltip `.pdv-tooltip` debe estar en un bloque `<style>` **sin** `scoped` porque Quasar renderiza tooltips en un portal fuera del componente.

### Estilos globales

`src/assets/forms.css` se importa en `main.js` y define clases reutilizables para diálogos:
- `.pdv-dialog`, `.pdv-dialog-title`, `.pdv-dialog-body`, `.pdv-dialog-actions`
- `.pdv-btn-save`, `.pdv-btn-cancel`
- `.btn-disabled` — gris `#AAAAAA` con `pointer-events: none`

Para sobrescribir estilos internos de componentes Quasar desde un `<style scoped>`, usar `:deep(.clase-quasar)`.

### Paleta de colores

| Uso | Color |
|-----|-------|
| Fondo header/sidebar | `#0B1835` |
| Acento dorado | `#C9A96E` |
| Texto navy | `#0D1B3E` |
| Rojo acciones destructivas | `#C0392B` |
| Verde confirmación | `#2E7D32` / `#27AE60` |
| Naranja justificado | `#E67E22` |
| Deshabilitado | `#AAAAAA` |

### Vistas por rol

| Ruta | Vista | Roles con acceso |
|------|-------|-----------------|
| `/alumno/dashboard` | Mi Historial (inscripciones agrupadas) | alumno |
| `/profesor/dashboard` | Mis Clases (instancias + alumnos) | profesor |
| `/profesor/curso/:id/asistencia` | Pasar Asistencia | profesor |
| `/admin/usuarios` | Gestión de Usuarios | administrador, profesor |
| `/admin/cursos` | Gestión de Cursos | administrador, profesor |
| `/admin/instancias` | Gestión de Instancias | administrador, profesor |

Las vistas admin son visibles para `profesor` pero los botones de crear/editar/eliminar están deshabilitados — solo `administrador` puede ejecutar esas acciones.

### Endpoints de API consumidos

- `POST /auth/login`, `POST /auth/register`
- `GET/POST/PATCH /users`, `DELETE /users/:id`
- `GET/POST/PATCH /courses` (soporta `?includeInactive=true`)
- `GET/POST/PATCH /course-instances` (soporta `?teacher_id=`)
- `GET /enrollments/student/:id`, `GET /enrollments/instance/:id`
- `POST /sessions`, `POST /attendance`