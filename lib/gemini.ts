import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '')

const MODEL_FALLBACKS = ['gemini-flash-latest', 'gemini-flash-lite-latest']
const MAX_RETRIES_PER_MODEL = 3

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function isRetryable(err: unknown) {
  const status = (err as { status?: number })?.status
  return status === 503 || status === 429
}

export async function extractPdfData(pdfBase64: string): Promise<Record<string, unknown>> {
  const prompt = `Extraia os dados desta apólice de seguro e retorne APENAS um JSON válido com os seguintes campos (use null para campos não encontrados):
{
  "segurado": "nome completo do segurado",
  "cpf_cnpj": "CPF ou CNPJ do segurado (apenas números e pontuação)",
  "email": "e-mail do segurado, se constar no documento",
  "telefone": "telefone/celular do segurado, se constar no documento",
  "numero_apolice": "número da apólice",
  "data_emissao": "data de emissão da apólice no formato YYYY-MM-DD",
  "data_inicio": "data de início da vigência no formato YYYY-MM-DD",
  "data_fim": "data de fim da vigência no formato YYYY-MM-DD",
  "seguradora": "nome da seguradora",
  "tipo_seguro": "tipo de seguro (Automóvel, Vida, Residencial, etc)",
  "premio_liquido": número com o prêmio líquido (apenas o número, sem R$),
  "premio_total": número com o prêmio total (apenas o número, sem R$)
}
Retorne apenas o JSON, sem explicações adicionais.`

  let lastError: unknown

  for (const modelName of MODEL_FALLBACKS) {
    const model = genAI.getGenerativeModel({ model: modelName })

    for (let attempt = 1; attempt <= MAX_RETRIES_PER_MODEL; attempt++) {
      try {
        const result = await model.generateContent([
          {
            inlineData: {
              mimeType: 'application/pdf',
              data: pdfBase64,
            },
          },
          { text: prompt },
        ])

        const text = result.response.text()
        const jsonMatch = text.match(/\{[\s\S]*\}/)
        if (!jsonMatch) throw new Error('No JSON found in response')
        return JSON.parse(jsonMatch[0])
      } catch (err) {
        lastError = err
        if (isRetryable(err) && attempt < MAX_RETRIES_PER_MODEL) {
          await sleep(1500 * attempt)
          continue
        }
        break
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Falha na extração do PDF')
}
