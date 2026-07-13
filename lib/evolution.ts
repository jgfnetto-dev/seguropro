function normalizePhoneNumber(value: string) {
  const digits = value.replace(/\D/g, '')
  if (!digits.startsWith('55') && (digits.length === 10 || digits.length === 11)) {
    return `55${digits}`
  }
  return digits
}

// Use global admin key when available — it works for all instances.
// Fall back to instance-level key for backwards compatibility.
function apiKey() {
  return process.env.EVOLUTION_ADMIN_KEY ?? process.env.EVOLUTION_API_KEY!
}

export async function sendWhatsAppMessage(to: string, text: string, instance?: string | null) {
  const instanceName = instance || process.env.EVOLUTION_INSTANCE
  const url = `${process.env.EVOLUTION_API_URL}/message/sendText/${instanceName}`
  const number = normalizePhoneNumber(to)

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: apiKey() },
    body: JSON.stringify({ number, text }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Evolution API error: ${err}`)
  }

  return res.json()
}

export async function sendWhatsAppDocument(to: string, base64: string, fileName: string, caption?: string, instance?: string | null) {
  const instanceName = instance || process.env.EVOLUTION_INSTANCE
  const url = `${process.env.EVOLUTION_API_URL}/message/sendMedia/${instanceName}`
  const number = normalizePhoneNumber(to)

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: apiKey() },
    body: JSON.stringify({
      number,
      mediatype: 'document',
      mimetype: 'application/pdf',
      fileName,
      caption,
      media: base64,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Evolution API error: ${err}`)
  }

  return res.json()
}
