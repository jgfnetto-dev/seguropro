export function buildAdminFrom(nome: string | null, email: string | null): string | null {
  const configuredFrom = process.env.RESEND_FROM_EMAIL
  if (!configuredFrom) return null
  // Keep the verified sending domain but show the admin's name as display name
  const verifiedEmail = configuredFrom.match(/<(.+)>/)?.[1] ?? configuredFrom
  if (nome) return `${nome} <${verifiedEmail}>`
  if (email) return `${email.split('@')[0]} <${verifiedEmail}>`
  return null
}

interface EnviarEmailParams {
  to: string
  subject: string
  html: string
  from?: string
  replyTo?: string
  attachmentBase64?: string
  attachmentFilename?: string
}

export async function sendEmail({ to, subject, html, from, replyTo, attachmentBase64, attachmentFilename }: EnviarEmailParams) {
  const fromAddress = from ?? process.env.RESEND_FROM_EMAIL ?? 'SeguroPro <onboarding@resend.dev>'
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromAddress,
      to: [to],
      subject,
      html,
      ...(replyTo ? { reply_to: replyTo } : null),
      ...(attachmentBase64 && attachmentFilename
        ? { attachments: [{ filename: attachmentFilename, content: attachmentBase64 }] }
        : null),
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Resend API error: ${err}`)
  }

  return res.json()
}
