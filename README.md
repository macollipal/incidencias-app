# 🏥 Gestión de Incidencias Residenciales

Plataforma integral para la administración de edificios, gestión de mantenimientos e inventario técnico.

## 🚀 Características Principales

- **Gestión de Incidencias**: Workflow completo desde el reporte del residente hasta la resolución técnica.
- **Calendario Técnico**: Agenda de visitas con filtros avanzados y estados visuales (Programado, Completado, Cancelado).
- **Módulo de Inventario**: Control de stock por zonas, seguimiento de movimientos y alertas de stock bajo.
- **Notificaciones Inteligentes**: Avisos en tiempo real y correos automáticos (Resend) para residentes y conserjes.
- **Panel de Configuración**: Personalización de marca (Branding) y ajustes técnicos sin tocar código.
- **Acceso por Roles**: Permisos específicos para Administradores de Plataforma, Administradores de Edificio, Conserjes y Residentes.

## 🛠️ Stack Tecnológico

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Base de Datos**: PostgreSQL + Prisma ORM
- **Estilos**: Tailwind CSS + shadcn/ui
- **Autenticación**: NextAuth.js
- **Emails**: Resend API

## 🏁 Inicio Rápido

1. **Instalar dependencias**:
   ```bash
   npm install
   ```

2. **Configurar variables**:
   Renombra `.env.example` a `.env` y completa las claves necesarias (Database, NextAuth, Resend).

3. **Preparar Base de Datos**:
   ```bash
   npx prisma db push
   npm run db:seed
   ```

4. **Correr en desarrollo**:
   ```bash
   npm run dev
   ```

---
*Para más detalles técnicos, guías de estilo y estructura interna, consulta el archivo [CLAUDE.md](./CLAUDE.md).*
