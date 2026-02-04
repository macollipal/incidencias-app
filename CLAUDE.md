# Gestión de Incidencias - MVP

Plataforma web para la gestión de incidencias en edificios residenciales.

## Stack Tecnológico

- **Frontend**: Next.js 16.1 (App Router), React 19, TypeScript 5, Tailwind CSS v4, shadcn/ui
- **Backend**: Next.js API Routes, Prisma v5.22 ORM
- **Base de datos**: PostgreSQL
- **Autenticación**: NextAuth.js v5 (Credentials Provider, bcryptjs)
- **Comunicaciones**: Resend (API de correo), templates en `src/lib/mail.ts`
- **Configuración**: Sistema de preferencias dinámicas (Branding, Colores, API Keys)
- **State Management**: TanStack Query v5.90, Zustand v5
- **Validación**: Zod, React Hook Form
- **UI**: Lucide React (iconos), Sonner (toasts), date-fns, react-day-picker (calendario)

## Requisitos

- Node.js 18+
- PostgreSQL (local o Docker)

## Configuración Inicial

1.  **Instalar dependencias**:
    ```bash
    npm install
    ```

2.  **Configurar base de datos**:

    Opción A - Docker:
    ```bash
    docker run --name postgres-incidencias -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=incidencias -p 5432:5432 -d postgres
    ```

    Opción B - PostgreSQL local instalado

3.  **Configurar variables de entorno**:
    - Copiar `.env.example` a `.env`
    - Ajustar `DATABASE_URL` si es necesario
    - Generar `AUTH_SECRET`: `openssl rand -base64 32`

4.  **Crear tablas y datos de prueba**:
    ```bash
    npm run db:push
    npm run db:seed
    ```

5.  **Iniciar servidor de desarrollo**:
    ```bash
    npm run dev
    ```

## Credenciales de Prueba

| Rol | Email | Password |
|-----|-------|----------|
| Admin Plataforma | admin@incidencias.cl | admin123 |
| Admin Edificio | admin.edificio@incidencias.cl | admin123 |
| Conserje | conserje@incidencias.cl | admin123 |
| Residente | residente@gmail.com | admin123 |

## Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run db:push` | Sincronizar schema con BD |
| `npm run db:seed` | Cargar datos de prueba |
| `npm run db:studio` | Abrir Prisma Studio |

---

## Estructura del Proyecto

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx           # Página de login
│   │   └── layout.tsx               # Layout auth
│   ├── (dashboard)/
│   │   ├── layout.tsx               # Layout con sidebar y header
│   │   ├── dashboard/page.tsx       # Dashboard principal (832 líneas)
│   │   ├── incidencias/page.tsx     # Gestión incidencias (898 líneas)
│   │   ├── edificios/page.tsx       # CRUD edificios
│   │   ├── empresas/page.tsx        # Catálogo empresas
│   │   ├── usuarios/page.tsx        # Gestión usuarios
│   │   ├── calendario/page.tsx      # Calendario visitas (con filtros y estados)
│   │   ├── configuracion/page.tsx   # Panel de administración (Branding, Email, DB)
│   │   ├── notificaciones/page.tsx  # Centro de notificaciones
│   │   └── inventario/page.tsx      # Gestión de stock y movimientos
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts
│   │   ├── config/                  # API de configuración del sistema
│   │   ├── notificaciones/          # API de notificaciones
│   │   ├── inventario/              # API de inventario y movimientos
│   │   ├── incidencias/
│   │   │   ├── route.ts             # GET (listar), POST (crear)
│   │   │   ├── [id]/route.ts        # GET, PATCH, DELETE
│   │   │   ├── [id]/asignar/route.ts
│   │   │   ├── [id]/resolver/route.ts
│   │   │   ├── [id]/escalar/route.ts
│   │   │   ├── [id]/rechazar/route.ts
│   │   │   ├── [id]/comentarios/route.ts
│   │   │   └── [id]/fotos/route.ts
│   │   ├── edificios/
│   │   │   ├── route.ts
│   │   │   └── [id]/zonas/route.ts
│   │   │   └── [id]/
│   │   │       ├── route.ts
│   │   │       └── conserjes/route.ts
│   │   ├── usuarios/route.ts & [id]/route.ts
│   │   ├── empresas/route.ts & [id]/route.ts
│   │   ├── visitas/route.ts & [id]/route.ts
│   │   ├── zonas/route.ts & [id]/route.ts
│   │   ├── productos/
│   │   │   ├── route.ts
│   │   │   ├── [id]/route.ts
│   │   │   └── recomendar/route.ts
│   │   ├── movimientos-stock/route.ts
│   │   └── stats/edificios/[id]/route.ts
│   ├── layout.tsx                   # Root layout
│   └── page.tsx                     # Redirect a login
├── components/
│   ├── ui/                          # 20+ componentes shadcn/ui
│   │   ├── button.tsx, input.tsx, card.tsx
│   │   ├── dialog.tsx, dropdown-menu.tsx
│   │   ├── table.tsx, tabs.tsx, badge.tsx
│   │   └── select.tsx, textarea.tsx, etc.
│   └── modules/
│       ├── sidebar.tsx              # Navegación con filtro por rol
│       └── header.tsx               # Selector de edificio
├── hooks/
│   ├── use-edificio.ts              # Zustand store para edificio activo
│   ├── use-edificios.ts             # 5 hooks: list, detail, stats, CRUD
│   ├── use-incidencias.ts           # 13 hooks: CRUD + workflow completo
│   ├── use-usuarios.ts              # 5 hooks: CRUD usuarios
│   ├── use-empresas.ts              # 5 hooks: CRUD empresas
│   ├── use-visitas.ts               # 5 hooks: CRUD visitas
│   └── use-inventario.ts            # 11 hooks: zonas, productos, movimientos
├── lib/
│   ├── auth.ts                      # NextAuth config
│   ├── prisma.ts                    # Singleton Prisma client
│   ├── api-utils.ts                 # requireAuth, requireRole, responses
│   ├── validations.ts               # 25+ schemas Zod
│   ├── providers.tsx                # QueryClient + SessionProvider
│   └── utils.ts                     # cn() para Tailwind
├── types/
│   ├── index.ts                     # Types y mapeo de labels
│   └── next-auth.d.ts               # Extensión tipos Session/JWT
└── middleware.ts                    # Protección de rutas
```

---

## Flujo de Incidencias

### Diagrama del Flujo

```
                                    ┌─────────────────┐
                                    │   RECHAZADA     │ (Terminal - No afecta métricas)
                                    │   [Admin only]  │
                                    └─────────────────┘
                                           ▲
                                           │ (motivo obligatorio)
                                           │
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  PENDIENTE  │────▶│  ASIGNADA   │────▶│  ESCALADA   │────▶│ PROGRAMADA  │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
       │                   │                                       │
       │                   │ (Conserje resuelve)                   │
       │                   ▼                                       ▼
       │            ┌─────────────┐                         ┌─────────────┐
       │            │  RESUELTA   │◀────────────────────────│ EN_PROGRESO │
       │            └─────────────┘                         └─────────────┘
       │                   │
       │                   ▼
       │            ┌─────────────┐
       └───────────▶│   CERRADA   │ (Terminal - Sí afecta métricas)
                    └─────────────┘
```

### Estados de Incidencia

| Estado | Descripción |
|--------|-------------|
| PENDIENTE | Recién creada, sin asignar |
| ASIGNADA | Asignada a conserje para verificación |
| ESCALADA | Conserje escaló a administrador |
| PROGRAMADA | Admin programó visita de empresa |
| EN_PROGRESO | Empresa trabajando |
| RESUELTA | Solucionada (por conserje o empresa) |
| CERRADA | Cerrada definitivamente |
| RECHAZADA | Rechazada por admin (duplicada, no aplica, error) |

### Estado RECHAZADA

**Propósito**: Distinguir incidencias inválidas de incidencias gestionadas correctamente.

| Regla | Descripción |
|-------|-------------|
| Transición válida | Solo desde `PENDIENTE` → `RECHAZADA` |
| Roles autorizados | `ADMIN_PLATAFORMA`, `ADMIN_EDIFICIO` |
| Motivo obligatorio | `motivoRechazo` mínimo 10 caracteres |
| Estado terminal | No permite transiciones posteriores |
| Métricas | Excluida de indicadores de gestión y tiempo de resolución |

**Casos de uso típicos**:
- Incidencia duplicada
- No aplica al edificio
- Creada por error
- Información insuficiente
- Solicitud fuera de alcance

### Flujo Detallado

1.  **Residente crea incidencia** → Estado: `PENDIENTE`
2.  **Admin asigna a conserje** → Estado: `ASIGNADA`
3.  **Conserje verifica en terreno**:
    - Si puede resolver → Estado: `RESUELTA` (tipo: CONSERJE)
    - Si requiere empresa → Estado: `ESCALADA`
4.  **Admin programa visita** → Estado: `PROGRAMADA`
5.  **Empresa trabaja** → Estado: `EN_PROGRESO`
6.  **Empresa termina** → Estado: `RESUELTA` (tipo: EMPRESA_EXTERNA)
7.  **Admin cierra** → Estado: `CERRADA`

---

## Roles y Permisos

### Admin Plataforma
- Gestiona todos los edificios
- Crea/edita/elimina usuarios
- Crea/edita/elimina empresas
- Acceso total a todas las funciones

### Admin Edificio
- Gestiona incidencias de sus edificios
- Asigna conserjes a incidencias
- Programa visitas técnicas
- Define prioridades

### Conserje
- Ve incidencias asignadas
- Verifica incidencias en terreno
- Resuelve incidencias simples
- Escala incidencias complejas

### Residente
- Crea incidencias
- Ve el estado de sus incidencias
- Agrega comentarios

---

## API Endpoints

### Incidencias

| Método | Endpoint | Descripción | Roles |
|--------|----------|-------------|-------|
| GET | `/api/incidencias` | Listar incidencias | Todos |
| POST | `/api/incidencias` | Crear incidencia | Todos |
| GET | `/api/incidencias/[id]` | Obtener detalle | Todos |
| PATCH | `/api/incidencias/[id]` | Actualizar | Admin, Conserje |
| DELETE | `/api/incidencias/[id]` | Eliminar | Admin |
| POST | `/api/incidencias/[id]/asignar` | Asignar a conserje | Admin |
| POST | `/api/incidencias/[id]/resolver` | Resolver | Conserje |
| POST | `/api/incidencias/[id]/escalar` | Escalar a admin | Conserje |
| POST | `/api/incidencias/[id]/rechazar` | Rechazar incidencia | Admin |
| GET | `/api/incidencias/[id]/comentarios` | Ver comentarios | Todos |
| POST | `/api/incidencias/[id]/comentarios` | Agregar comentario | Todos |

**Query params para GET /api/incidencias:**
- `edificioId` - Filtrar por edificio
- `estado` - Filtrar por estado
- `tipoServicio` - Filtrar por tipo de servicio

### Edificios

| Método | Endpoint | Descripción | Roles |
|--------|----------|-------------|-------|
| GET | `/api/edificios` | Listar edificios | Todos |
| POST | `/api/edificios` | Crear edificio | Admin Plataforma |
| GET | `/api/edificios/[id]` | Obtener detalle | Todos |
| PATCH | `/api/edificios/[id]` | Actualizar | Admin Plataforma |
| DELETE | `/api/edificios/[id]` | Eliminar | Admin Plataforma |
| GET | `/api/edificios/[id]/conserjes` | Listar conserjes | Admin |

### Usuarios

| Método | Endpoint | Descripción | Roles |
|--------|----------|-------------|-------|
| GET | `/api/usuarios` | Listar usuarios | Admin Plataforma |
| POST | `/api/usuarios` | Crear usuario | Admin Plataforma |
| GET | `/api/usuarios/[id]` | Obtener detalle | Admin Plataforma |
| PATCH | `/api/usuarios/[id]` | Actualizar | Admin Plataforma |
| DELETE | `/api/usuarios/[id]` | Eliminar | Admin Plataforma |

### Empresas

| Método | Endpoint | Descripción | Roles |
|--------|----------|-------------|-------|
| GET | `/api/empresas` | Listar empresas | Todos |
| POST | `/api/empresas` | Crear empresa | Admin |
| PATCH | `/api/empresas/[id]` | Actualizar | Admin |
| DELETE | `/api/empresas/[id]` | Eliminar | Admin |

### Visitas

| Método | Endpoint | Descripción | Roles |
|--------|----------|-------------|-------|
| GET | `/api/visitas` | Listar visitas | Todos |
| POST | `/api/visitas` | Programar visita | Admin |
| PATCH | `/api/visitas/[id]` | Actualizar | Admin |
| DELETE | `/api/visitas/[id]` | Cancelar | Admin |

### Stats

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/stats/edificios/[id]` | Estadísticas del dashboard |

---

## Módulo de Inventario

### Propósito
Gestionar productos de mantención y su disponibilidad para incidentes recurrentes (ampolletas, fusibles, materiales de limpieza, etc.).

### Modelos de Datos

| Modelo | Descripción |
|--------|-------------|
| ZonaEdificio | Zonas del edificio (pasillos, estacionamiento, etc.) |
| Producto | Productos con stock, categoría y proveedor |
| ProductoZona | Relación producto-zona (qué productos se usan en qué zonas) |
| MovimientoStock | Historial de entradas/salidas de inventario |

### Tipos de Zona
- PASILLO, AREA_COMUN, ESTACIONAMIENTO, BODEGA
- ASCENSOR, ENTRADA, JARDIN, PISCINA, GIMNASIO, OTRO

### Categorías de Producto
- ILUMINACION, ELECTRICIDAD, PLOMERIA
- LIMPIEZA, SEGURIDAD, FERRETERIA, OTRO

### Tipos de Movimiento
- ENTRADA: Reposición de stock
- SALIDA: Uso en incidencia
- AJUSTE: Corrección manual

### API Endpoints de Inventario

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/zonas?edificioId=xxx` | Listar zonas |
| POST | `/api/zonas` | Crear zona |
| PATCH | `/api/zonas/[id]` | Actualizar zona |
| DELETE | `/api/zonas/[id]` | Eliminar zona |
| GET | `/api/productos?edificioId=xxx` | Listar productos |
| GET | `/api/productos?stockBajo=true` | Productos con stock bajo |
| POST | `/api/productos` | Crear producto |
| PATCH | `/api/productos/[id]` | Actualizar producto |
| DELETE | `/api/productos/[id]` | Eliminar producto |
| GET | `/api/productos/recomendar` | Productos recomendados por zona/tipo |
| GET | `/api/movimientos-stock` | Historial de movimientos |
| POST | `/api/movimientos-stock` | Registrar movimiento |

### Hooks de Inventario

```typescript
// Zonas
useZonas(edificioId)
useCreateZona()
useUpdateZona()
useDeleteZona()

// Productos
useProductos({ edificioId, categoria?, stockBajo?, zonaId? })
useProductosRecomendados({ edificioId, zonaId?, tipoServicio? })
useCreateProducto()
useUpdateProducto()
useDeleteProducto()

// Movimientos
useMovimientosStock({ productoId?, edificioId? })
useRegistrarMovimiento()
```

---

## Base de Datos (Prisma)

### Enums Principales

```prisma
enum Rol { ADMIN_PLATAFORMA, ADMIN_EDIFICIO, CONSERJE, RESIDENTE }
enum TipoServicio { ELECTRICIDAD, AGUA_GAS, LIMPIEZA, SEGURIDAD, INFRAESTRUCTURA, AREAS_COMUNES }
enum EstadoIncidencia { PENDIENTE, ASIGNADA, ESCALADA, PROGRAMADA, EN_PROGRESO, RESUELTA, CERRADA, RECHAZADA }
enum Prioridad { NORMAL, URGENTE }
enum EstadoVisita { PROGRAMADA, EN_PROGRESO, COMPLETADA, CANCELADA }
enum TipoResolucion { CONSERJE, EMPRESA_EXTERNA }
```

### Modelos Principales

-   **Usuario** - Usuarios con roles y edificios asignados
-   **Edificio** - Edificios/propiedades
-   **UsuarioEdificio** - Relación muchos a muchos
-   **Empresa** - Empresas de servicio externo
-   **Incidencia** - Incidencias con workflow completo
-   **Visita** - Visitas técnicas programadas
-   **ComentarioIncidencia** - Comentarios en incidencias
-   **Notificacion** - Notificaciones de usuario
-   **ZonaEdificio**, **Producto**, **ProductoZona**, **MovimientoStock** - Inventario

---

## Patrones de Código

### Formato de Respuesta API

```typescript
// Éxito
{ success: true, data: T }

// Error
{ success: false, error: string }

// Error de validación
{ success: false, error: string, errors: Record<string, string[]> }
```

### Protección de Rutas API

```typescript
// Cualquier usuario autenticado
const { user, error } = await requireAuth();
if (error) return error;

// Roles específicos
const { user, error } = await requireRole(['ADMIN_PLATAFORMA']);
if (error) return error;
```

### Hidratación Zustand + Next.js

```typescript
// Evitar errores de hidratación
const { selectedEdificioId, isHydrated } = useEdificioStoreHydrated();
if (!isHydrated) return <Loading />;
```

---

## Módulos Implementados

- [x] Autenticación con roles (4 roles)
- [x] Selección de edificio activo (localStorage)
- [x] Dashboard con estadísticas (refresh 30s)
- [x] CRUD de incidencias con timeline
- [x] Flujo de conserje (asignar/resolver/escalar)
- [x] **UI de acciones del conserje** (resolver/escalar desde modal)
- [x] **Asignación de conserje por admin** (selector con carga de trabajo)
- [x] **Rechazo de incidencias** (estado RECHAZADA, solo admin, desde PENDIENTE)
- [x] Sistema de comentarios
- [x] Calendario de visitas
- [x] Catálogo de empresas
- [x] Gestión de usuarios
- [x] CRUD completo de edificios
- [x] API de inventario (zonas, productos, stock)
- [ ] UI de inventario (Fase 2)
- [ ] Notificaciones por email (Fase 2)
- [ ] Gestión de turnos de conserjes (Fase 2)
- [ ] Asignación automática por turno (Fase 2)

---

## UI/UX de Incidencias

### Tabla de Incidencias

Columnas ordenadas para escaneo rápido:
1.  **Fecha** - Día/mes + hora (formato compacto)
2.  **Descripción** - Texto truncado
3.  **Tipo** - Badge con categoría
4.  **Prioridad** - Normal/Urgente con icono
5.  **Estado** - Badge con icono y color
6.  **Reportado por** - Nombre del usuario
7.  **Acciones** - Botones según rol y estado

### Estados Visuales

| Estado | Color | Icono |
|--------|-------|-------|
| Pendiente | Gris | Clock |
| Asignada | Azul | UserCheck |
| Escalada | Naranja | AlertTriangle |
| Programada | Morado | Calendar |
| En Progreso | Amarillo | Wrench |
| Resuelta | Verde | CheckCircle2 |
| Cerrada | Gris | XCircle |
| Rechazada | Rojo | Ban |

### Modal de Detalle

Estructura con áreas fijas y scrollables:
-   **Header fijo**: Título + estado
-   **Contenido scrollable**: Info + Timeline + Comentarios
-   **Footer fijo**: Input de comentario + botón cerrar

### Acciones por Rol

| Rol | Estado | Acciones |
|-----|--------|----------|
| Admin | PENDIENTE | Asignar, Rechazar, Marcar urgente, Cerrar |
| Admin | ESCALADA | Asignar, Programar visita, Cerrar |
| Conserje | ASIGNADA (a él) | Resolver, Escalar |
| Residente | Cualquiera | Ver (solo lectura) |

### Panel de Acciones del Conserje

Cuando una incidencia está ASIGNADA al conserje logueado, se muestra:
-   Campo de verificación/análisis técnico
-   Campo de solución aplicada
-   Opción de marcar como urgente (al escalar)
-   Botones: "Resolver Incidencia" / "Escalar a Administrador"

---

## Despliegue en Producción

### Arquitectura de Producción

```
┌─────────────────┐      ┌─────────────────┐
│     Vercel      │      │      Neon       │
│  (App completa) │ ───▶ │  (PostgreSQL)   │
│  Next.js + API  │      │   Base datos    │
└─────────────────┘      └─────────────────┘
```

### URLs de Producción

-   **App**: https://incidencias-app.vercel.app (o tu dominio personalizado)
-   **Repositorio**: https://github.com/macollipal/incidencias-app
-   **Base de datos**: Neon PostgreSQL (us-east-1)

### Variables de Entorno en Vercel

| Variable | Descripción |
|----------|-------------|
| `DATABASE_URL` | Connection string de Neon PostgreSQL |
| `AUTH_SECRET` | Secret para NextAuth.js (generar con `openssl rand -base64 32`) |

### Despliegue Automático

-   Push a `main` → Vercel hace deploy automático
-   El build ejecuta `prisma generate && next build`

### Configuración de Neon

1.  Crear proyecto en https://neon.tech
2.  Copiar connection string (formato Prisma)
3.  Ejecutar migraciones:
    ```bash
    DATABASE_URL="postgresql://..." npx prisma db push
    DATABASE_URL="postgresql://..." npm run db:seed
    ```

### Notas de Despliegue

-   Las API routes usan `export const dynamic = "force-dynamic"` para evitar pre-rendering
-   Prisma Client se genera durante el build (`prisma generate`)
-   ESLint configurado con extensiones `.js` para compatibilidad con Vercel

---

## Notas Técnicas

### Hydration en Next.js
El store de Zustand usa `persist` para localStorage. Usar `useEdificioStoreHydrated()` en lugar de `useEdificioStore()`.

### Prisma
-   Schema en `prisma/schema.prisma`
-   Migraciones: `npm run db:push` (desarrollo)
-   Datos de prueba: `npm run db:seed`

### Validaciones
-   Zod para schemas en `src/lib/validations.ts`
-   Validación en cliente (React Hook Form) y servidor (API routes)

### Middleware
-   Protege todas las rutas excepto `/` y `/api/auth`
-   Redirige no autenticados a `/login`

### Navegación por Rol
El sidebar filtra items según rol:
-   **Admin Plataforma**: Todo (incluye Usuarios, Configuración, Inventario)
-   **Admin Edificio**: Dashboard, Edificios, Incidencias, Calendario, Empresas, Inventario
-   **Conserje**: Dashboard, Edificios, Incidencias, Calendario, Inventario
-   **Residente**: Dashboard, Incidencias, Notificaciones

### Sistema de Tema Dinámico
La aplicación permite personalizar el color primario desde el menú de Configuración.
- El componente `ThemeInitializer` lee el color de la DB y lo inyecta como la variable CSS `--primary`.
- El nombre de la aplicación también es dinámico y se refleja en el Sidebar y el título de la página.

### Notificaciones y Email
- Se integró **Resend** para notificaciones por correo electrónico.
- Eventos que disparan email: Nueva incidencia urgente, Asignación de técnico, Escalado a admin, Nuevos comentarios, Programación de visitas.
- Las notificaciones internas se marcan como leídas automáticamente al ver la incidencia relacionada.
