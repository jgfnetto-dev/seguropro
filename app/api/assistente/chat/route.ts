import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic()

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('corretora_id')
    .eq('id', session.user.id)
    .single()

  if (!usuario?.corretora_id) return NextResponse.json({ error: 'Corretora não encontrada.' }, { status: 400 })

  const { messages, docId } = await req.json()
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: 'Mensagens inválidas.' }, { status: 400 })
  }

  let query = supabase
    .from('assistente_docs')
    .select('seguradora, nome, texto, paginas')
    .eq('corretora_id', usuario.corretora_id)

  if (docId) query = query.eq('id', docId)

  const { data: docs } = await query

  if (!docs?.length) {
    return NextResponse.json({
      reply: 'Nenhuma Condição Geral foi carregada ainda. Faça o upload de um documento PDF na seção "Documentos" para começar.',
    })
  }

  const contexto = docs
    .map((d) => `=== ${d.seguradora} — ${d.nome} (${d.paginas} páginas) ===\n${d.texto}`)
    .join('\n\n---\n\n')

  const system = `Você é um assistente especializado em seguros para corretores brasileiros.
Seu papel é ajudar o corretor a responder dúvidas sobre coberturas, sinistros e procedimentos com base nas Condições Gerais (CGs) dos produtos.

DOCUMENTOS CARREGADOS:
${contexto}

INSTRUÇÕES:
- Responda em português do Brasil de forma clara e objetiva
- Baseie suas respostas EXCLUSIVAMENTE no conteúdo dos documentos acima
- Mencione sempre o nome da seguradora e produto ao citar informações (ex: "Conforme as CGs da Porto Seguro Auto...")
- Em caso de sinistro, detalhe os passos que o segurado deve seguir conforme as CGs
- Se a informação não estiver nos documentos disponíveis, informe claramente: "Essa informação não consta nas CGs carregadas."
- Nunca invente coberturas, valores ou procedimentos que não estejam nos documentos`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      system,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    })

    const reply = response.content[0].type === 'text' ? response.content[0].text : ''
    return NextResponse.json({ reply })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro ao consultar a IA.'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
