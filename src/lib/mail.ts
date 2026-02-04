import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

interface EmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailParams) {
  if (!resend) {
    console.warn("Resend no inicializado (clave faltante). Correo no enviado:", { to, subject });
    return null;
  }

  try {
    const { data, error } = await resend.emails.send({
      from: "Incidencias App <onboarding@resend.dev>",
      to,
      subject,
      html,
    });

    if (error) {
      console.error("Error de Resend:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error al enviar email:", error);
    return null;
  }
}

// Templates predefinidos
export const emailTemplates = {
  nuevaIncidencia: (id: string, descripcion: string) => ({
    subject: `Nueva Incidencia Reportada #${id.slice(-6)}`,
    html: `
      <h2>Se ha reportado una nueva incidencia</h2>
      <p><strong>Descripción:</strong> ${descripcion}</p>
      <p>Haz clic abajo para ver los detalles:</p>
      <a href="${process.env.NEXTAUTH_URL}/incidencias?id=${id}">Ver Incidencia</a>
    `,
  }),
  incidenciaAsignada: (id: string, descripcion: string) => ({
    subject: `Te han asignado una nueva incidencia #${id.slice(-6)}`,
    html: `
      <h2>Tienes una nueva tarea asignada</h2>
      <p><strong>Incidencia:</strong> ${descripcion}</p>
      <p>Por favor, revisa los detalles y comienza la mantención:</p>
      <a href="${process.env.NEXTAUTH_URL}/incidencias?id=${id}">Ver Incidencia</a>
    `,
  }),
  incidenciaEscalada: (id: string, descripcion: string) => ({
    subject: `Incidencia Escalada #${id.slice(-6)}`,
    html: `
      <h2>Una incidencia requiere atención administrativa</h2>
      <p><strong>Incidencia:</strong> ${descripcion}</p>
      <p>Ha sido escalada por el personal de mantención.</p>
      <a href="${process.env.NEXTAUTH_URL}/incidencias?id=${id}">Ver Incidencia</a>
    `,
  }),
  nuevoComentario: (id: string, descripcion: string, comentario: string) => ({
    subject: `Nuevo comentario en incidencia #${id.slice(-6)}`,
    html: `
      <h2>Hay una nueva actualización</h2>
      <p><strong>Incidencia:</strong> ${descripcion}</p>
      <p><strong>Comentario:</strong> "${comentario}"</p>
      <a href="${process.env.NEXTAUTH_URL}/incidencias?id=${id}">Ver Incidencia</a>
    `,
  }),
  visitaProgramada: (id: string, fecha: string, empresa: string) => ({
    subject: `Visita técnica programada para su incidencia`,
    html: `
      <h2>Se ha programado una visita técnica</h2>
      <p><strong>Empresa:</strong> ${empresa}</p>
      <p><strong>Fecha y hora:</strong> ${fecha}</p>
      <p>Un técnico visitará su edificio para resolver la incidencia pendiente.</p>
      <a href="${process.env.NEXTAUTH_URL}/incidencias?id=${id}">Ver Detalles</a>
    `,
  }),
};
