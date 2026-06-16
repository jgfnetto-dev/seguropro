import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function extractPdfData(pdfBase64: string): Promise<Record<string, unknown>> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'document',
            source: {
              type: 'base64',
              media_type: 'application/pdf',
              data: pdfBase64,
            },
          },
          {
            type: 'text',
            text: `Extraia os dados desta apólice de seguro e retorne APENAS um JSON válido com os seguintes campos (use null para campos não encontrados):
{
  "segurado": "nome completo do segurado",
  "cpf_cnpj": "CPF ou CNPJ do segurado (apenas números e pontuação)",
  "email": "e-mail do segurado, se constar no documento",
  "telefone": "telefone/celular do segurado, se constar no documento",
  "numero_apolice": "número da apólice",
  "data_inicio": "data de início da vigência no formato YYYY-MM-DD",
  "data_fim": "data de fim da vigência no formato YYYY-MM-DD",
  "seguradora": "nome da seguradora",
  "tipo_seguro": "tipo de seguro (Automóvel, Vida, Residencial, etc)",
  "premio_liquido": número com o prêmio líquido (apenas o número, sem R$),
  "premio_total": número com o prêmio total (apenas o número, sem R$)
}
Retorne apenas o JSON, sem explicações adicionais.`,
          },
        ],
      },
    ],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('No JSON found in response')
  return JSON.parse(jsonMatch[0])
}
