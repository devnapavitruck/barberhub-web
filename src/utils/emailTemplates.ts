// src/utils/emailTemplates.ts

const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.NEXTAUTH_URL ||
  'https://barberhub.app';

const logoURL = `${BASE_URL}/images/logo.png`;

const cardStyle =
  'max-width:600px;margin:auto;border-collapse:collapse;border-radius:12px;overflow:hidden;box-shadow:0 12px 36px rgba(0,0,0,.25)';
const headerStyle =
  'background:linear-gradient(90deg,#D4AF37,#B568C8);padding:24px;text-align:center';
const footerStyle =
  'background:#111;color:#fff;padding:16px;text-align:center';
const bodyStyle = 'background:#fff;padding:30px';
const h1Style = 'color:#111;margin:0 0 8px 0;font-family:Montserrat,Arial';
const pStyle = 'color:#333;line-height:1.6;margin:0 0 12px 0';
const ctaStyle =
  'display:inline-block;padding:12px 24px;background:#D4AF37;color:#000;text-decoration:none;border-radius:999px;font-weight:800';

export function welcomeTemplate(nombre: string, rol: string) {
  return `
  <div style="font-family:Montserrat,Arial,sans-serif;color:#333;margin:0;padding:24px;background:#0d0f12">
    <table width="100%" cellspacing="0" cellpadding="0" style="${cardStyle}">
      <tr>
        <td style="${headerStyle}">
          <img src="${logoURL}" alt="BarberHub" width="140" />
        </td>
      </tr>
      <tr>
        <td style="${bodyStyle}">
          <h1 style="${h1Style}">¡Bienvenido, ${nombre}!</h1>
          <p style="${pStyle}">Tu cuenta como <strong>${rol}</strong> se ha creado exitosamente.</p>
          <p style="${pStyle}">Puedes iniciar sesión aquí:</p>
          <p style="text-align:center;margin-top:20px">
            <a href="${BASE_URL}/login" style="${ctaStyle}">Iniciar sesión</a>
          </p>
        </td>
      </tr>
      <tr>
        <td style="${footerStyle}">
          <p style="margin:0">© ${new Date().getFullYear()} BarberHub</p>
        </td>
      </tr>
    </table>
  </div>
  `;
}

export function reservationTemplate(params: {
  nombre: string;
  barbero: string;
  servicio: string;
  fechaFormateada: string; // ej: martes 17 ago 2025
  hora: string;            // ej: 15:30
  direccion?: string;
  precio?: string;         // ej: $15.000
  duracion?: string;       // ej: 60 min
}) {
  const { nombre, barbero, servicio, fechaFormateada, hora, direccion, precio, duracion } = params;
  return `
  <div style="font-family:Montserrat,Arial,sans-serif;color:#333;margin:0;padding:24px;background:#0d0f12">
    <table width="100%" cellspacing="0" cellpadding="0" style="${cardStyle}">
      <tr>
        <td style="${headerStyle}">
          <img src="${logoURL}" alt="BarberHub" width="140" />
        </td>
      </tr>
      <tr>
        <td style="${bodyStyle}">
          <h1 style="${h1Style}">Reserva confirmada</h1>
          <p style="${pStyle}">Hola <strong>${nombre}</strong>, tu cita con <strong>${barbero}</strong> fue confirmada.</p>
          <ul style="line-height:1.7;color:#111;padding-left:18px">
            <li><strong>Servicio:</strong> ${servicio}${duracion ? ` · ${duracion}` : ''}</li>
            <li><strong>Fecha:</strong> ${fechaFormateada}</li>
            <li><strong>Hora:</strong> ${hora}</li>
            ${precio ? `<li><strong>Precio:</strong> ${precio}</li>` : ''}
            ${direccion ? `<li><strong>Ubicación:</strong> ${direccion}</li>` : ''}
          </ul>
          <p style="text-align:center;margin-top:20px">
            <a href="${BASE_URL}/dashboard/cliente" style="${ctaStyle}">Ver / gestionar mi cita</a>
          </p>
          <p style="${pStyle};font-size:13px;color:#666;margin-top:16px">Adjuntamos un archivo de calendario (.ics) para que no olvides tu cita.</p>
        </td>
      </tr>
      <tr>
        <td style="${footerStyle}">
          <p style="margin:0">© ${new Date().getFullYear()} BarberHub</p>
        </td>
      </tr>
    </table>
  </div>
  `;
}

/** NUEVO: recordatorio 2 horas antes */
export function reminder2hTemplate(params: {
  nombre: string;
  barbero: string;
  servicio: string;
  fechaFormateada: string;
  hora: string;
  direccion?: string;
}) {
  const { nombre, barbero, servicio, fechaFormateada, hora, direccion } = params;
  return `
  <div style="font-family:Montserrat,Arial,sans-serif;color:#333;margin:0;padding:24px;background:#0d0f12">
    <table width="100%" cellspacing="0" cellpadding="0" style="${cardStyle}">
      <tr>
        <td style="${headerStyle}">
          <img src="${logoURL}" alt="BarberHub" width="140" />
        </td>
      </tr>
      <tr>
        <td style="${bodyStyle}">
          <h1 style="${h1Style}">⏰ Recordatorio: tu cita es en 2 horas</h1>
          <p style="${pStyle}"><strong>${nombre}</strong>, te recordamos tu cita con <strong>${barbero}</strong>:</p>
          <ul style="line-height:1.7;color:#111;padding-left:18px">
            <li><strong>Servicio:</strong> ${servicio}</li>
            <li><strong>Fecha:</strong> ${fechaFormateada}</li>
            <li><strong>Hora:</strong> ${hora}</li>
            ${direccion ? `<li><strong>Ubicación:</strong> ${direccion}</li>` : ''}
          </ul>
          <p style="text-align:center;margin-top:20px">
            <a href="${BASE_URL}/dashboard/cliente" style="${ctaStyle}">Ver mi reserva</a>
          </p>
        </td>
      </tr>
      <tr>
        <td style="${footerStyle}">
          <p style="margin:0">© ${new Date().getFullYear()} BarberHub</p>
        </td>
      </tr>
    </table>
  </div>
  `;
}
