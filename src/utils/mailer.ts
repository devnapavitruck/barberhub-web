// src/utils/mailer.ts
import nodemailer from 'nodemailer'
import { Resend } from 'resend'

type Attachment = {
  filename: string
  content: string | Buffer
  contentType?: string
}

type SendArgs = {
  to: string | string[]
  subject: string
  html: string
  attachments?: Attachment[]
}

const FROM =
  process.env.EMAIL_FROM ||
  process.env.MAIL_FROM ||
  'BarberHub <no-reply@barberhub.local>'

/* ---------------- SMTP (Hostinger) ---------------- */
let smtpTransport: nodemailer.Transporter | null | undefined
function getSmtp() {
  if (smtpTransport !== undefined) return smtpTransport
  const host = process.env.EMAIL_HOST
  const port = Number(process.env.EMAIL_PORT || 587)
  const user = process.env.EMAIL_USER
  const pass = process.env.EMAIL_PASS

  if (host && user && pass) {
    smtpTransport = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // 465 = TLS, 587 = STARTTLS
      auth: { user, pass },
    })
  } else {
    smtpTransport = null
  }
  return smtpTransport
}

/* ---------------- Resend (opcional) ---------------- */
let resendClient: Resend | null | undefined
function getResend() {
  if (resendClient !== undefined) return resendClient
  const key = process.env.RESEND_API_KEY
  resendClient = key ? new Resend(key) : null
  if (!key) {
    console.warn('[mailer] RESEND_API_KEY no definido. Se usará SMTP si existe.')
  }
  return resendClient
}

/* ---------------- API pública ---------------- */
export async function sendHtmlEmail({
  to,
  subject,
  html,
  attachments,
}: SendArgs): Promise<{ ok?: true; skipped?: true; via?: 'smtp' | 'resend' }> {
  // 1) SMTP primero (lo tienes configurado)
  const smtp = getSmtp()
  if (smtp) {
    await smtp.sendMail({
      from: FROM,
      to,
      subject,
      html,
      attachments, // nodemailer acepta Buffer/string
    })
    return { ok: true, via: 'smtp' }
  }

  // 2) Si no hay SMTP, probar Resend
  const resend = getResend()
  if (resend) {
    await resend.emails.send({
      from: FROM,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      attachments: attachments?.map((a) => ({
        filename: a.filename,
        content: a.content,
        contentType: a.contentType,
      })),
    })
    return { ok: true, via: 'resend' }
  }

  // 3) Nada configurado → no romper el flujo
  console.warn('[mailer] Sin proveedor (SMTP/Resend). Correo omitido.')
  return { skipped: true }
}

/** Genera un ICS simple para adjuntar a la cita */
export function buildICS(opts: {
  uid: string
  title: string
  startISO: string
  endISO: string
  location?: string
  description?: string
}) {
  const { uid, title, startISO, endISO, location = '', description = '' } = opts
  const fmt = (iso: string) =>
    iso.replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z') // 2025-08-17T15:00:00.000Z → 20250817T150000Z

  const dtStart = fmt(startISO)
  const dtEnd = fmt(endISO)

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//BarberHub//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtStart}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${escapeICS(title)}`,
    location ? `LOCATION:${escapeICS(location)}` : '',
    description ? `DESCRIPTION:${escapeICS(description)}` : '',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .filter(Boolean)
    .join('\r\n')
}

function escapeICS(s: string) {
  return s
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
}
