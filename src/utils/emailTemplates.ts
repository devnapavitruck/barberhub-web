// src/utils/emailTemplates.ts

const BASE_URL = process.env.NEXTAUTH_URL;

export function welcomeTemplate(nombre: string, rol: string) {
  return `
    <div style="font-family: Montserrat, sans-serif; color: #333; margin:0; padding:0;">
      <table width="100%" cellspacing="0" cellpadding="0" style="max-width:600px; margin:auto; border-collapse:collapse;">
        <tr>
          <td style="background: #D4AF37; padding: 20px; text-align: center;">
            <img src="${BASE_URL}/images/logo.png" alt="BarberHub" width="120" />
          </td>
        </tr>
        <tr>
          <td style="background: #fff; padding: 30px;">
            <h1 style="color:#111; margin-top:0;">¡Bienvenido, ${nombre}!</h1>
            <p>Tu cuenta como <strong>${rol}</strong> se ha creado exitosamente.</p>
            <p>Puedes iniciar sesión <a href="${BASE_URL}/login">aquí</a>.</p>
            <p style="text-align:center; margin-top:30px;">
              <a href="${BASE_URL}/login"
                 style="display:inline-block; padding:12px 24px; background:#D4AF37; color:#000; text-decoration:none; border-radius:4px;">
                Iniciar Sesión
              </a>
            </p>
          </td>
        </tr>
        <tr>
          <td style="background: #111; color: #fff; padding: 20px; text-align: center;">
            <p style="margin:0;">© 2025 BarberHub</p>
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
  fechaFormateada: string;
  hora: string;
  direccion: string;
}) {
  const { nombre, barbero, servicio, fechaFormateada, hora, direccion } = params;
  return `
    <div style="font-family: Montserrat, sans-serif; color: #333; margin:0; padding:0;">
      <table width="100%" cellspacing="0" cellpadding="0" style="max-width:600px; margin:auto; border-collapse:collapse;">
        <tr>
          <td style="background: #D4AF37; padding: 20px; text-align: center;">
            <img src="${BASE_URL}/images/logo.png" alt="BarberHub" width="120" />
          </td>
        </tr>
        <tr>
          <td style="background: #fff; padding: 30px;">
            <h1 style="color:#111; margin-top:0;">Reserva Confirmada</h1>
            <p>Hola <strong>${nombre}</strong>,</p>
            <p>Tu cita con <strong>${barbero}</strong> ha sido confirmada:</p>
            <ul>
              <li>Servicio: ${servicio}</li>
              <li>Fecha: ${fechaFormateada}</li>
              <li>Hora: ${hora}</li>
              <li>Dirección: ${direccion}</li>
            </ul>
            <p style="text-align:center; margin-top:30px;">
              <a href="${BASE_URL}/dashboard/cliente"
                 style="display:inline-block; padding:12px 24px; background:#D4AF37; color:#000; text-decoration:none; border-radius:4px;">
                Ver mis Reservas
              </a>
            </p>
          </td>
        </tr>
        <tr>
          <td style="background: #111; color: #fff; padding: 20px; text-align: center;">
            <p style="margin:0;">© 2025 BarberHub</p>
          </td>
        </tr>
      </table>
    </div>
  `;
}
