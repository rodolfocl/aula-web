# Aula PDV — Frontend

Plataforma educativa del Ministerio Pan de Vida.

## Stack

- [Vue 3](https://vuejs.org/) con Composition API
- [Vite 6](https://vitejs.dev/)
- [Vue Router 4](https://router.vuejs.org/)
- [Pinia](https://pinia.vuejs.org/)
- [Quasar Framework 2](https://quasar.dev/)
- [Axios](https://axios-http.com/)

## Requisitos

- Node.js 18+
- API backend corriendo en `http://localhost:3000`

## Instalación

```bash
npm install
```

## Desarrollo

```bash
npm run dev
```

Las peticiones a `/api/*` se proxean automáticamente a `http://localhost:3000`.

## Producción

```bash
npm run build
npm run preview
```

## Cuentas de prueba (mock)

| Email | Contraseña | Rol |
|---|---|---|
| `alumno@pdv.cl` | `123456` | Alumno |
| `profesor@pdv.cl` | `123456` | Profesor |
| `admin@pdv.cl` | `123456` | Admin |

## Estructura

```
src/
├── stores/authStore.js        # JWT y datos de usuario (Pinia)
├── router/index.js            # Rutas y guard de navegación por rol
├── services/api.js            # Instancia Axios con interceptores
├── layouts/MainLayout.vue     # Layout con navegación lateral
└── views/
    ├── LoginView.vue
    ├── alumno/
    │   └── DashboardAlumno.vue
    ├── profesor/
    │   ├── DashboardProfesor.vue
    │   └── PasarAsistencia.vue
    └── admin/
        ├── AdminUsuarios.vue
        ├── AdminCursos.vue
        └── AdminInstancias.vue
```