import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '')

const MODEL_FALLBACKS = ['gemini-1.5-flash-latest', 'gemini-1.5-flash-8b-latest']
const MAX_RETRIES_PER_MODEL = 2

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function isRetryable(err: unknown) {
  const status = (err as { status?: number })?.status
  return status === 503 || status === 429
}

async function extractWithPrompt(pdfBase64: string, prompt: string): Promise<Record<string, unknown>> {
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
          await sleep(800 * attempt)
          continue
        }
        break
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Falha na extração do PDF')
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
  "seguradora": "nome da seguradora/empresa que emitiu a apólice (a empresa seguradora, não a corretora). Geralmente aparece próximo de 'Seguradora', 'CNPJ' ou no cabeçalho/logo do documento. Ignore o nome da corretora que intermediou a venda.",
  "tipo_seguro": "tipo de seguro coberto pela apólice (ex: Automóvel, Moto, Vida, Residencial, Empresarial, Saúde, Celular, Bike, Viagem, etc). Costuma aparecer no título do documento (ex: 'Seguro Celular', 'Seguro Auto') ou na descrição do bem/risco segurado. Use uma palavra curta no formato Capitalizado.",
  "premio_liquido": número com o prêmio líquido (apenas o número, sem R$),
  "premio_total": número com o prêmio total (apenas o número, sem R$)
}
Retorne apenas o JSON, sem explicações adicionais. Mesmo em documentos com layout fora do padrão (tabelas, cartões, colunas), procure cuidadosamente por cada campo antes de retornar null.`

  return extractWithPrompt(pdfBase64, prompt)
}

export async function extractEndossoData(pdfBase64: string): Promise<Record<string, unknown>> {
  const prompt = `Extraia os dados deste endosso de apólice de seguro e retorne APENAS um JSON válido com os seguintes campos (use null para campos não encontrados):
{
  "numero_endosso": "número do endosso",
  "tipo_endosso": "tipo do endosso (Inclusão, Exclusão, Alteração, Cancelamento, Renovação, etc)",
  "segurado": "nome completo do segurado",
  "data_emissao": "data de emissão do endosso no formato YYYY-MM-DD",
  "data_inicio": "data de início da vigência do endosso no formato YYYY-MM-DD",
  "data_fim": "data de fim da vigência do endosso no formato YYYY-MM-DD",
  "veiculo": "marca/fabricante do veículo segurado (ex: Volkswagen, Fiat, Honda), se houver",
  "ano": "ano do veículo (ano de fabricação/modelo, ex: 2022 ou 2022/2023), se houver",
  "modelo": "modelo do veículo (ex: Gol, Civic, Onix), se houver",
  "placa": "placa do veículo, se houver",
  "chassi": "número do chassi do veículo, se houver"
}
Retorne apenas o JSON, sem explicações adicionais. Os campos de veículo só existem em endossos de seguro automotivo; use null quando não se aplicar.`

  return extractWithPrompt(pdfBase64, prompt)
}
