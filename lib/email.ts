interface EnviarEmailParams {
  to: string
  subject: string
  html: string
  attachmentBase64?: string
  attachmentFilename?: string
}

export async function sendEmail({ to, subject, html, attachmentBase64, attachmentFilename }: EnviarEmailParams) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL ?? 'SeguroPro <onboarding@resend.dev>',
      to: [to],
      subject,
      html,
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
