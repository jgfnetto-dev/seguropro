import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '')

const TEXT_LIMIT = 12000
const MODEL_FALLBACKS = ['gemini-flash-lite-latest', 'gemini-flash-latest']
const MAX_RETRIES_PER_MODEL = 2

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function isRetryable(err: unknown) {
  const status = (err as { status?: number })?.status
  return status === 503 || status === 429
}

async function extractWithText(text: string, prompt: string, maxChars = TEXT_LIMIT): Promise<unknown> {
  const truncated = text.length > maxChars ? text.slice(0, maxChars) : text
  let lastError: unknown

  for (const modelName of MODEL_FALLBACKS) {
    const model = genAI.getGenerativeModel({ model: modelName })

    for (let attempt = 1; attempt <= MAX_RETRIES_PER_MODEL; attempt++) {
      try {
        const result = await model.generateContent([
          { text: `${prompt}\n\n--- TEXTO DO DOCUMENTO ---\n${truncated}` },
        ])

        const raw = result.response.text()
        // Tenta array primeiro, depois objeto
        const arrayMatch = raw.match(/\[[\s\S]*\]/)
        const objMatch = raw.match(/\{[\s\S]*\}/)
        const jsonStr = arrayMatch ?? objMatch
        if (!jsonStr) throw new Error('No JSON found in response')
        return JSON.parse(jsonStr[0])
      } catch (err) {
        lastError = err
        if (isRetryable(err) && attempt < MAX_RETRIES_PER_MODEL) {
          await sleep(500 * attempt)
          continue
        }
        break
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Falha na extração do PDF')
}

export async function extractPdfData(pdfText: string, tiposDisponiveis?: string[]): Promise<Record<string, unknown>> {
  const tipoInstruction = tiposDisponiveis?.length
    ? `"tipo_seguro": "DEVE ser exatamente um dos seguintes valores (escolha o mais apropriado para o bem/risco segurado): ${tiposDisponiveis.join(', ')}. Não invente um valor fora dessa lista."`
    : `"tipo_seguro": "tipo de seguro coberto pela apólice (ex: Automóvel, Moto, Vida, Residencial, Empresarial, Saúde, Celular, Bike, Viagem, etc). Use uma palavra curta no formato Capitalizado."`

  const prompt = `Extraia os dados desta apólice de seguro e retorne APENAS um JSON válido com os seguintes campos (use null para campos não encontrados):
{
  "tomador": "nome completo do TOMADOR do seguro, se aparecer explicitamente rotulado como 'Tomador', 'Dados do Tomador' ou 'Tomador do Seguro'. Use null se não encontrar essa distinção.",
  "cpf_cnpj_tomador": "CPF ou CNPJ do TOMADOR — copie EXATAMENTE o documento que está na seção 'Dados do Tomador'. Use null se não houver seção de Tomador.",
  "segurado": "nome completo do SEGURADO — copie EXATAMENTE o nome da seção 'Dados do Segurado'. Se não houver distinção Tomador/Segurado, extraia o nome do contratante principal.",
  "cpf_cnpj": "CPF ou CNPJ do SEGURADO — copie EXATAMENTE o documento que está na seção 'Dados do Segurado'. Se não houver seção de Segurado, use o documento do contratante principal.",
  "email": "e-mail do segurado, se constar no documento",
  "telefone": "telefone/celular do segurado, se constar no documento",
  "numero_apolice": "número da apólice",
  "data_emissao": "data de emissão da apólice no formato YYYY-MM-DD",
  "data_inicio": "data de início da vigência no formato YYYY-MM-DD",
  "data_fim": "data de fim da vigência no formato YYYY-MM-DD",
  "seguradora": "nome da seguradora/empresa que emitiu a apólice (a empresa seguradora, não a corretora). Procure em: (1) cabeçalho do documento, (2) frases como 'Este seguro é garantido pela [X]', 'emitido por [X]', 'garantido pela Seguradora [X] S.A.', 'seguro garantido por [X]', (3) próximo ao código SUSEP ou CNPJ da seguradora emissora, (4) assinaturas de diretores/representantes da seguradora. Ignore o nome da corretora intermediária.",
  ${tipoInstruction},
  "premio_liquido": número com o prêmio líquido — pode aparecer como "Prêmio líquido", "Prêmio Líquido", "Premio Liquido", "Prêmio líquido total", "Prêmio coberturas + adicionais". Use apenas o número sem R$. Se houver somente um valor total de prêmio sem discriminar líquido/total, use-o aqui,
  "premio_total": número com o prêmio total — pode aparecer como "Prêmio Total", "Total do Seguro", "Total do Prêmio", "Valor Total", "Total a Pagar" (geralmente inclui IOF e encargos). Use apenas o número sem R$.
}
Retorne apenas o JSON, sem explicações adicionais. Mesmo em documentos com layout fora do padrão (tabelas, cartões, colunas), procure cuidadosamente por cada campo antes de retornar null. Priorize valores monetários que aparecem explicitamente rotulados como prêmio ou total do seguro.`

  return extractWithText(pdfText, prompt) as Promise<Record<string, unknown>>
}

export interface ExtratoItem {
  numero_apolice: string
  comissao: number
  segurado: string
  tipo: string
}

export async function extractExtratoPdf(pdfText: string): Promise<ExtratoItem[]> {
  const prompt = `Extraia TODOS os itens de comissão deste extrato do corretor e retorne APENAS um array JSON.
Cada linha da tabela de segurados deve virar um objeto:
{"numero_apolice": "valor exato da coluna Apolice / Bilhete (string)", "comissao": número da coluna Comissão (R$) sem R$, "segurado": "nome da coluna Segurado", "tipo": "valor da coluna Tipo"}
Inclua TODAS as linhas (COMISSAO, COMISSAO ANTECIPADA, GANHO EXTRA, etc).
Retorne apenas o array JSON, sem texto adicional.
Exemplo: [{"numero_apolice":"161497","comissao":110.00,"segurado":"CONSTRUTORA BRUMANA LTDA","tipo":"COMISSAO"}]`

  // Extratos têm cabeçalho pesado repetido por página — limite bem maior que o de apólices individuais
  const result = await extractWithText(pdfText, prompt, 60000)
  if (Array.isArray(result)) return result as ExtratoItem[]
  const values = Object.values(result as Record<string, unknown>)
  if (values.length === 1 && Array.isArray(values[0])) return values[0] as ExtratoItem[]
  throw new Error('Formato de resposta inesperado da IA')
}

export async function extractEndossoData(pdfText: string): Promise<Record<string, unknown>> {
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

  return extractWithText(pdfText, prompt) as Promise<Record<string, unknown>>
}
