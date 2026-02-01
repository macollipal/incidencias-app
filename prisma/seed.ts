import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Clean existing data
  await prisma.movimientoStock.deleteMany();
  await prisma.productoZona.deleteMany();
  await prisma.producto.deleteMany();
  await prisma.comentarioIncidencia.deleteMany();
  await prisma.notificacion.deleteMany();
  await prisma.incidencia.deleteMany();
  await prisma.zonaEdificio.deleteMany();
  await prisma.visita.deleteMany();
  await prisma.empresaTipoServicio.deleteMany();
  await prisma.empresa.deleteMany();
  await prisma.usuarioEdificio.deleteMany();
  await prisma.usuario.deleteMany();
  await prisma.edificio.deleteMany();

  console.log("Database cleaned");

  // Create Edificios
  const edificio1 = await prisma.edificio.create({
    data: {
      nombre: "Torre Norte",
      direccion: "Av. Principal 123, Santiago",
    },
  });

  const edificio2 = await prisma.edificio.create({
    data: {
      nombre: "Torre Sur",
      direccion: "Av. Principal 125, Santiago",
    },
  });

  console.log("Edificios created");

  // Create Users
  const passwordHash = await bcrypt.hash("admin123", 10);

  const adminPlataforma = await prisma.usuario.create({
    data: {
      email: "admin@incidencias.cl",
      passwordHash,
      nombre: "Admin Principal",
      rol: "ADMIN_PLATAFORMA",
      edificios: {
        create: [{ edificioId: edificio1.id }, { edificioId: edificio2.id }],
      },
    },
  });

  const adminEdificio = await prisma.usuario.create({
    data: {
      email: "admin.edificio@incidencias.cl",
      passwordHash,
      nombre: "Carlos Administrador",
      rol: "ADMIN_EDIFICIO",
      edificios: {
        create: [{ edificioId: edificio1.id }],
      },
    },
  });

  const conserje1 = await prisma.usuario.create({
    data: {
      email: "conserje@incidencias.cl",
      passwordHash,
      nombre: "Juan Pérez",
      rol: "CONSERJE",
      edificios: {
        create: [{ edificioId: edificio1.id }],
      },
    },
  });

  const conserje2 = await prisma.usuario.create({
    data: {
      email: "conserje2@incidencias.cl",
      passwordHash,
      nombre: "Pedro Soto",
      rol: "CONSERJE",
      edificios: {
        create: [{ edificioId: edificio1.id }],
      },
    },
  });

  const residente1 = await prisma.usuario.create({
    data: {
      email: "residente@gmail.com",
      passwordHash,
      nombre: "María González",
      rol: "RESIDENTE",
      edificios: {
        create: [{ edificioId: edificio1.id }],
      },
    },
  });

  const residente2 = await prisma.usuario.create({
    data: {
      email: "residente2@gmail.com",
      passwordHash,
      nombre: "Luis Martínez",
      rol: "RESIDENTE",
      edificios: {
        create: [{ edificioId: edificio1.id }],
      },
    },
  });

  console.log("Users created");

  // Create Empresas
  const empresa1 = await prisma.empresa.create({
    data: {
      nombre: "Servicios Eléctricos SpA",
      telefono: "+56 9 1234 5678",
      email: "contacto@electricospa.cl",
      tiposServicio: {
        create: [{ tipoServicio: "ELECTRICIDAD" }],
      },
    },
  });

  const empresa2 = await prisma.empresa.create({
    data: {
      nombre: "Limpieza Total Ltda",
      telefono: "+56 9 8765 4321",
      email: "info@limpiezatotal.cl",
      tiposServicio: {
        create: [{ tipoServicio: "LIMPIEZA" }, { tipoServicio: "AREAS_COMUNES" }],
      },
    },
  });

  const empresa3 = await prisma.empresa.create({
    data: {
      nombre: "Mantención Integral",
      telefono: "+56 2 2345 6789",
      email: "contacto@mantencionintegral.cl",
      tiposServicio: {
        create: [
          { tipoServicio: "AGUA_GAS" },
          { tipoServicio: "INFRAESTRUCTURA" },
        ],
      },
    },
  });

  const empresa4 = await prisma.empresa.create({
    data: {
      nombre: "Seguridad 24/7",
      telefono: "+56 9 5555 1234",
      email: "contacto@seguridad247.cl",
      tiposServicio: {
        create: [{ tipoServicio: "SEGURIDAD" }],
      },
    },
  });

  console.log("Empresas created");

  // Create Incidencias with different states

  // 1. Incidencia PENDIENTE (nueva, sin asignar)
  const inc1 = await prisma.incidencia.create({
    data: {
      edificioId: edificio1.id,
      usuarioId: residente1.id,
      tipoServicio: "ELECTRICIDAD",
      descripcion: "Ampolleta quemada en pasillo del piso 2",
      prioridad: "NORMAL",
      estado: "PENDIENTE",
    },
  });

  // 2. Incidencia PENDIENTE urgente
  const inc2 = await prisma.incidencia.create({
    data: {
      edificioId: edificio1.id,
      usuarioId: residente2.id,
      tipoServicio: "AGUA_GAS",
      descripcion: "Fuga de agua en baño común del primer piso, está mojando todo",
      prioridad: "URGENTE",
      estado: "PENDIENTE",
    },
  });

  // 3. Incidencia ASIGNADA a conserje
  const inc3 = await prisma.incidencia.create({
    data: {
      edificioId: edificio1.id,
      usuarioId: residente1.id,
      tipoServicio: "LIMPIEZA",
      descripcion: "Manchas en alfombra del hall de entrada",
      prioridad: "NORMAL",
      estado: "ASIGNADA",
      asignadoAId: conserje1.id,
      asignadoEl: new Date(Date.now() - 2 * 60 * 60 * 1000), // hace 2 horas
    },
  });

  // Comentario del admin al asignar
  await prisma.comentarioIncidencia.create({
    data: {
      incidenciaId: inc3.id,
      usuarioId: adminEdificio.id,
      contenido: "Juan, por favor verificar el estado de la alfombra y evaluar si necesita limpieza profesional.",
    },
  });

  // 4. Incidencia ASIGNADA urgente
  const inc4 = await prisma.incidencia.create({
    data: {
      edificioId: edificio1.id,
      usuarioId: residente2.id,
      tipoServicio: "SEGURIDAD",
      descripcion: "Citófono del departamento 302 no funciona",
      prioridad: "URGENTE",
      estado: "ASIGNADA",
      asignadoAId: conserje1.id,
      asignadoEl: new Date(Date.now() - 1 * 60 * 60 * 1000), // hace 1 hora
    },
  });

  // 5. Incidencia ESCALADA (conserje verificó y requiere empresa)
  const inc5 = await prisma.incidencia.create({
    data: {
      edificioId: edificio1.id,
      usuarioId: residente1.id,
      tipoServicio: "INFRAESTRUCTURA",
      descripcion: "Ascensor hace ruido extraño al subir",
      prioridad: "NORMAL",
      estado: "ESCALADA",
      asignadoAId: conserje1.id,
      asignadoEl: new Date(Date.now() - 24 * 60 * 60 * 1000), // hace 1 día
      verificadoEl: new Date(Date.now() - 23 * 60 * 60 * 1000),
      descripcionVerificada: "Verificado: El ascensor emite ruido metálico entre pisos 3 y 4. Parece ser problema de poleas o cables. Requiere técnico especializado.",
      escaladaEl: new Date(Date.now() - 23 * 60 * 60 * 1000),
    },
  });

  await prisma.comentarioIncidencia.create({
    data: {
      incidenciaId: inc5.id,
      usuarioId: conserje1.id,
      contenido: "Incidencia escalada a administrador. Verificación: El ascensor emite ruido metálico entre pisos 3 y 4. Parece ser problema de poleas o cables. Requiere técnico especializado.",
    },
  });

  // 6. Incidencia ESCALADA urgente
  const inc6 = await prisma.incidencia.create({
    data: {
      edificioId: edificio1.id,
      usuarioId: residente2.id,
      tipoServicio: "ELECTRICIDAD",
      descripcion: "Cortocircuito en tablero eléctrico del subterráneo",
      prioridad: "URGENTE",
      estado: "ESCALADA",
      asignadoAId: conserje2.id,
      asignadoEl: new Date(Date.now() - 5 * 60 * 60 * 1000),
      verificadoEl: new Date(Date.now() - 4 * 60 * 60 * 1000),
      descripcionVerificada: "URGENTE: Tablero presenta marcas de quemadura y olor a cable quemado. Corté el suministro de esa sección por seguridad. Requiere electricista certificado URGENTE.",
      escaladaEl: new Date(Date.now() - 4 * 60 * 60 * 1000),
    },
  });

  await prisma.comentarioIncidencia.create({
    data: {
      incidenciaId: inc6.id,
      usuarioId: conserje2.id,
      contenido: "URGENTE: Tablero presenta marcas de quemadura. Corté el suministro por seguridad. Requiere electricista certificado.",
    },
  });

  // Crear una visita programada
  const visita1 = await prisma.visita.create({
    data: {
      edificioId: edificio1.id,
      empresaId: empresa3.id,
      fechaProgramada: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // en 2 días
      notas: "Revisión de ascensor - ruido metálico reportado",
      estado: "PROGRAMADA",
    },
  });

  // 7. Incidencia PROGRAMADA (con visita agendada)
  const inc7 = await prisma.incidencia.create({
    data: {
      edificioId: edificio1.id,
      usuarioId: residente1.id,
      tipoServicio: "INFRAESTRUCTURA",
      descripcion: "Portón del estacionamiento se traba al abrir",
      prioridad: "NORMAL",
      estado: "PROGRAMADA",
      asignadoAId: conserje1.id,
      asignadoEl: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      verificadoEl: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      descripcionVerificada: "El motor del portón hace esfuerzo al abrir. Posible problema con el riel o el motor.",
      escaladaEl: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      visitaId: visita1.id,
    },
  });

  await prisma.comentarioIncidencia.create({
    data: {
      incidenciaId: inc7.id,
      usuarioId: adminEdificio.id,
      contenido: "Visita programada con Mantención Integral para el viernes. Se revisará junto con el ascensor.",
    },
  });

  // 8. Incidencia RESUELTA por conserje
  const inc8 = await prisma.incidencia.create({
    data: {
      edificioId: edificio1.id,
      usuarioId: residente2.id,
      tipoServicio: "ELECTRICIDAD",
      descripcion: "Luz del pasillo del piso 5 parpadeando",
      prioridad: "NORMAL",
      estado: "RESUELTA",
      asignadoAId: conserje1.id,
      asignadoEl: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      verificadoEl: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      tipoResolucion: "CONSERJE",
      comentarioCierre: "Se cambió la ampolleta fluorescente por una nueva LED. Problema resuelto.",
      closedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.comentarioIncidencia.create({
    data: {
      incidenciaId: inc8.id,
      usuarioId: conserje1.id,
      contenido: "Incidencia resuelta por conserje: Se cambió la ampolleta fluorescente por una nueva LED. Problema resuelto.",
    },
  });

  // 9. Incidencia RESUELTA por empresa externa
  const inc9 = await prisma.incidencia.create({
    data: {
      edificioId: edificio1.id,
      usuarioId: residente1.id,
      tipoServicio: "LIMPIEZA",
      descripcion: "Grafiti en muro exterior del edificio",
      prioridad: "NORMAL",
      estado: "RESUELTA",
      asignadoAId: conserje2.id,
      asignadoEl: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      verificadoEl: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      descripcionVerificada: "Grafiti de aproximadamente 2x1 metros en la pared lateral. Requiere limpieza profesional.",
      escaladaEl: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      tipoResolucion: "EMPRESA_EXTERNA",
      comentarioCierre: "Limpieza Total realizó la remoción del grafiti. Muro quedó en perfectas condiciones.",
      closedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
  });

  // 10. Incidencia CERRADA
  const inc10 = await prisma.incidencia.create({
    data: {
      edificioId: edificio1.id,
      usuarioId: residente2.id,
      tipoServicio: "AREAS_COMUNES",
      descripcion: "Silla rota en sala de reuniones",
      prioridad: "NORMAL",
      estado: "CERRADA",
      asignadoAId: conserje1.id,
      asignadoEl: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      verificadoEl: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      tipoResolucion: "CONSERJE",
      comentarioCierre: "Se retiró la silla dañada y se reemplazó con una del bodega. Se solicitará compra de repuesto.",
      closedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    },
  });

  // Incidencias en Torre Sur
  await prisma.incidencia.create({
    data: {
      edificioId: edificio2.id,
      usuarioId: adminPlataforma.id,
      tipoServicio: "SEGURIDAD",
      descripcion: "Cámara de seguridad del lobby no funciona",
      prioridad: "URGENTE",
      estado: "PENDIENTE",
    },
  });

  console.log("Incidencias created with different states");
  console.log("Comentarios created");
  console.log("Visita programada created");

  // ============ INVENTARIO ============

  // Create Zonas for Edificio 1
  const zonaPasillo1 = await prisma.zonaEdificio.create({
    data: {
      edificioId: edificio1.id,
      nombre: "Pasillo Piso 1",
      tipo: "PASILLO",
      descripcion: "Pasillo principal del primer piso",
    },
  });

  const zonaPasillo2 = await prisma.zonaEdificio.create({
    data: {
      edificioId: edificio1.id,
      nombre: "Pasillo Piso 2",
      tipo: "PASILLO",
      descripcion: "Pasillo principal del segundo piso",
    },
  });

  const zonaEntrada = await prisma.zonaEdificio.create({
    data: {
      edificioId: edificio1.id,
      nombre: "Hall de Entrada",
      tipo: "ENTRADA",
      descripcion: "Recepción y área de espera",
    },
  });

  const zonaEstacionamiento = await prisma.zonaEdificio.create({
    data: {
      edificioId: edificio1.id,
      nombre: "Estacionamiento Subterráneo",
      tipo: "ESTACIONAMIENTO",
      descripcion: "Estacionamiento -1 y -2",
    },
  });

  const zonaGimnasio = await prisma.zonaEdificio.create({
    data: {
      edificioId: edificio1.id,
      nombre: "Gimnasio",
      tipo: "GIMNASIO",
      descripcion: "Área de ejercicios del edificio",
    },
  });

  const zonaBodega = await prisma.zonaEdificio.create({
    data: {
      edificioId: edificio1.id,
      nombre: "Bodega Principal",
      tipo: "BODEGA",
      descripcion: "Bodega de almacenamiento de materiales",
    },
  });

  console.log("Zonas created");

  // Create Productos for Edificio 1
  const ampolleta1 = await prisma.producto.create({
    data: {
      edificioId: edificio1.id,
      nombre: "Ampolleta LED E27 9W Luz Fría",
      categoria: "ILUMINACION",
      especificaciones: "LED 9W, 6500K, Rosca E27, 220V",
      stockActual: 15,
      stockMinimo: 5,
      proveedorNombre: "Sodimac",
      proveedorTelefono: "+56 2 2738 1000",
      proveedorUrl: "https://www.sodimac.cl",
      zonas: {
        create: [
          { zonaId: zonaPasillo1.id },
          { zonaId: zonaPasillo2.id },
        ],
      },
    },
  });

  const ampolleta2 = await prisma.producto.create({
    data: {
      edificioId: edificio1.id,
      nombre: "Ampolleta LED E27 12W Luz Cálida",
      categoria: "ILUMINACION",
      especificaciones: "LED 12W, 3000K, Rosca E27, 220V",
      stockActual: 8,
      stockMinimo: 3,
      proveedorNombre: "Easy",
      proveedorTelefono: "+56 2 2200 1000",
      proveedorUrl: "https://www.easy.cl",
      zonas: {
        create: [
          { zonaId: zonaEntrada.id },
          { zonaId: zonaGimnasio.id },
        ],
      },
    },
  });

  const tuboFluorescente = await prisma.producto.create({
    data: {
      edificioId: edificio1.id,
      nombre: "Tubo LED T8 18W 120cm",
      categoria: "ILUMINACION",
      especificaciones: "LED T8, 18W, 120cm, 6500K, 220V",
      stockActual: 4,
      stockMinimo: 4,
      proveedorNombre: "MKT Iluminación",
      proveedorTelefono: "+56 9 8765 4321",
      zonas: {
        create: [{ zonaId: zonaEstacionamiento.id }],
      },
    },
  });

  const fusible1 = await prisma.producto.create({
    data: {
      edificioId: edificio1.id,
      nombre: "Fusible NH00 32A",
      categoria: "ELECTRICIDAD",
      especificaciones: "NH00, 32A, 500V",
      stockActual: 6,
      stockMinimo: 2,
      proveedorNombre: "Coval",
      proveedorTelefono: "+56 2 2555 1234",
    },
  });

  const interruptor = await prisma.producto.create({
    data: {
      edificioId: edificio1.id,
      nombre: "Interruptor Automático 16A",
      categoria: "ELECTRICIDAD",
      especificaciones: "Curva C, 16A, 1 polo",
      stockActual: 3,
      stockMinimo: 2,
      proveedorNombre: "Coval",
      proveedorTelefono: "+56 2 2555 1234",
    },
  });

  const limpiavidrios = await prisma.producto.create({
    data: {
      edificioId: edificio1.id,
      nombre: "Limpiavidrios 5L",
      categoria: "LIMPIEZA",
      especificaciones: "Bidón 5 litros, uso profesional",
      stockActual: 2,
      stockMinimo: 1,
      proveedorNombre: "Pronto Copec",
      zonas: {
        create: [
          { zonaId: zonaEntrada.id },
          { zonaId: zonaGimnasio.id },
        ],
      },
    },
  });

  const sensorMovimiento = await prisma.producto.create({
    data: {
      edificioId: edificio1.id,
      nombre: "Sensor de Movimiento PIR",
      categoria: "SEGURIDAD",
      especificaciones: "PIR, 180°, 12m alcance, 220V",
      stockActual: 0,
      stockMinimo: 2,
      proveedorNombre: "Seguridad Total SpA",
      proveedorTelefono: "+56 9 1234 5678",
      zonas: {
        create: [
          { zonaId: zonaEstacionamiento.id },
          { zonaId: zonaPasillo1.id },
        ],
      },
    },
  });

  console.log("Productos created");

  // Create some stock movements
  await prisma.movimientoStock.create({
    data: {
      productoId: ampolleta1.id,
      tipo: "ENTRADA",
      cantidad: 20,
      stockAnterior: 0,
      stockNuevo: 20,
      notas: "Stock inicial",
    },
  });

  await prisma.movimientoStock.create({
    data: {
      productoId: ampolleta1.id,
      incidenciaId: inc8.id, // Incidencia resuelta de ampolleta
      tipo: "SALIDA",
      cantidad: 1,
      stockAnterior: 20,
      stockNuevo: 19,
      notas: "Cambio de ampolleta piso 5",
    },
  });

  await prisma.movimientoStock.create({
    data: {
      productoId: ampolleta1.id,
      tipo: "SALIDA",
      cantidad: 4,
      stockAnterior: 19,
      stockNuevo: 15,
      notas: "Cambio de ampolletas pasillos varios",
    },
  });

  await prisma.movimientoStock.create({
    data: {
      productoId: tuboFluorescente.id,
      tipo: "ENTRADA",
      cantidad: 10,
      stockAnterior: 0,
      stockNuevo: 10,
      notas: "Compra inicial",
    },
  });

  await prisma.movimientoStock.create({
    data: {
      productoId: tuboFluorescente.id,
      tipo: "SALIDA",
      cantidad: 6,
      stockAnterior: 10,
      stockNuevo: 4,
      notas: "Reemplazo en estacionamiento",
    },
  });

  console.log("Movimientos de stock created");

  console.log("\n✅ Seed completed!");
  console.log("\n📋 Resumen de datos creados:");
  console.log("- 2 Edificios");
  console.log("- 6 Usuarios (1 Admin Plataforma, 1 Admin Edificio, 2 Conserjes, 2 Residentes)");
  console.log("- 4 Empresas de servicio");
  console.log("- 11 Incidencias en diferentes estados");
  console.log("- 1 Visita programada");
  console.log("- Varios comentarios");
  console.log("- 6 Zonas del edificio");
  console.log("- 7 Productos de mantención");
  console.log("- 5 Movimientos de stock");

  console.log("\n🔑 Credenciales de prueba:");
  console.log("------------------------");
  console.log("Admin Plataforma: admin@incidencias.cl / admin123");
  console.log("Admin Edificio: admin.edificio@incidencias.cl / admin123");
  console.log("Conserje 1: conserje@incidencias.cl / admin123");
  console.log("Conserje 2: conserje2@incidencias.cl / admin123");
  console.log("Residente 1: residente@gmail.com / admin123");
  console.log("Residente 2: residente2@gmail.com / admin123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
