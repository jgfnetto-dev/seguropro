'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Bot, Send, Upload, Trash2, FileText, Loader2, ChevronDown, X, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface Doc {
  id: string
  seguradora: string
  nome: string
  paginas: number | null
  criado_em: string
}

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface Props {
  docs: Doc[]
  isAdmin: boolean
}

function MarkdownText({ text }: { text: string }) {
  const lines = text.split('\n')
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        if (line.startsWith('### ')) return <p key={i} className="font-semibold text-body-sm mt-2">{line.slice(4)}</p>
        if (line.startsWith('## ')) return <p key={i} className="font-semibold text-body-sm mt-2">{line.slice(3)}</p>
        if (line.startsWith('**') && line.endsWith('**')) return <p key={i} className="font-semibold text-body-sm">{line.slice(2, -2)}</p>
        if (line.startsWith('- ') || line.startsWith('• ')) return (
          <div key={i} className="flex gap-2 text-body-sm">
            <span className="text-on-surface-variant flex-shrink-0">•</span>
            <span>{line.slice(2)}</span>
          </div>
        )
        if (line.trim() === '') return <div key={i} className="h-1" />
        return <p key={i} className="text-body-sm">{line}</p>
      })}
    </div>
  )
}

export function AssistenteClient({ docs: initialDocs, isAdmin }: Props) {
  const router = useRouter()
  const [docs, setDocs] = useState(initialDocs)
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [uploadLoading, setUploadLoading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [seguradora, setSeguradora] = useState('')
  const [nomeDoc, setNomeDoc] = useState('')
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function handleSend() {
    const text = input.trim()
    if (!text || loading) return

    const newMessages: Message[] = [...messages, { role: 'user', content: text }]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/assistente/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, docId: selectedDocId }),
      })
      const data = await res.json()
      if (data.reply) {
        setMessages([...newMessages, { role: 'assistant', content: data.reply }])
      } else {
        setMessages([...newMessages, { role: 'assistant', content: `Erro: ${data.error ?? 'Falha desconhecida.'}` }])
      }
    } catch {
      setMessages([...newMessages, { role: 'assistant', content: 'Erro de conexão. Tente novamente.' }])
    } finally {
      setLoading(false)
    }
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    if (!pdfFile || !seguradora || !nomeDoc) return
    setUploadLoading(true)
    setUploadError('')
    const form = new FormData()
    form.append('pdf', pdfFile)
    form.append('seguradora', seguradora)
    form.append('nome', nomeDoc)

    try {
      const res = await fetch('/api/assistente/upload', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) {
        setUploadError(data.error ?? 'Erro ao fazer upload.')
      } else {
        setDocs((prev) => [...prev, data])
        setShowUpload(false)
        setSeguradora('')
        setNomeDoc('')
        setPdfFile(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
        router.refresh()
      }
    } catch {
      setUploadError('Erro de conexão.')
    } finally {
      setUploadLoading(false)
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      await fetch(`/api/assistente/docs/${id}`, { method: 'DELETE' })
      setDocs((prev) => prev.filter((d) => d.id !== id))
      if (selectedDocId === id) setSelectedDocId(null)
    } finally {
      setDeletingId(null)
    }
  }

  const selectedDoc = docs.find((d) => d.id === selectedDocId)

  return (
    <div className="flex gap-4 h-[calc(100vh-160px)] min-h-[500px]">
      {/* Left panel — documents */}
      <div className="w-64 shrink-0 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-h3 text-on-surface">Documentos</h2>
          {isAdmin && (
            <button
              onClick={() => setShowUpload((v) => !v)}
              className="flex items-center gap-1 text-xs text-secondary hover:text-secondary/80 font-medium"
            >
              {showUpload ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              {showUpload ? 'Cancelar' : 'Adicionar'}
            </button>
          )}
        </div>

        {showUpload && isAdmin && (
          <Card>
            <CardContent className="pt-4 pb-3">
              <form onSubmit={handleUpload} className="space-y-2.5">
                <div>
                  <Label className="text-xs">Seguradora</Label>
                  <Input
                    value={seguradora}
                    onChange={(e) => setSeguradora(e.target.value)}
                    placeholder="Porto Seguro"
                    required
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs">Nome do documento</Label>
                  <Input
                    value={nomeDoc}
                    onChange={(e) => setNomeDoc(e.target.value)}
                    placeholder="CG Auto 2024"
                    required
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs">Arquivo PDF</Label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)}
                    required
                    className="w-full text-xs mt-1 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-surface-container file:text-on-surface-variant cursor-pointer"
                  />
                </div>
                {uploadError && <p className="text-xs text-error">{uploadError}</p>}
                <Button type="submit" size="sm" className="w-full h-8 text-xs gap-1.5" disabled={uploadLoading}>
                  {uploadLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                  {uploadLoading ? 'Processando...' : 'Fazer upload'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-col gap-1.5 overflow-y-auto flex-1">
          <button
            onClick={() => setSelectedDocId(null)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded text-body-sm font-medium text-left transition-colors',
              !selectedDocId
                ? 'bg-primary/10 text-primary'
                : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
            )}
          >
            <Bot className="w-4 h-4 flex-shrink-0" />
            Todos os documentos
          </button>

          {docs.length === 0 && (
            <p className="text-xs text-on-surface-variant px-3 py-2">
              {isAdmin ? 'Clique em "Adicionar" para carregar uma CG.' : 'Nenhum documento carregado ainda.'}
            </p>
          )}

          {docs.map((doc) => (
            <div
              key={doc.id}
              className={cn(
                'group flex items-start gap-2 px-3 py-2 rounded transition-colors',
                selectedDocId === doc.id
                  ? 'bg-primary/10'
                  : 'hover:bg-surface-container'
              )}
            >
              <button
                onClick={() => setSelectedDocId(doc.id)}
                className="flex items-start gap-2 flex-1 text-left min-w-0"
              >
                <FileText className={cn('w-4 h-4 flex-shrink-0 mt-0.5', selectedDocId === doc.id ? 'text-primary' : 'text-on-surface-variant')} />
                <div className="min-w-0">
                  <p className={cn('text-body-sm font-medium truncate', selectedDocId === doc.id ? 'text-primary' : 'text-on-surface')}>
                    {doc.seguradora}
                  </p>
                  <p className="text-xs text-on-surface-variant truncate">{doc.nome}</p>
                  {doc.paginas && <p className="text-xs text-on-surface-variant">{doc.paginas} págs.</p>}
                </div>
              </button>
              {isAdmin && (
                <button
                  onClick={() => handleDelete(doc.id)}
                  disabled={deletingId === doc.id}
                  className="opacity-0 group-hover:opacity-100 flex-shrink-0 p-1 rounded text-on-surface-variant hover:text-error hover:bg-error/10 transition-all"
                >
                  {deletingId === doc.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — chat */}
      <div className="flex-1 flex flex-col">
        <Card className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-outline-variant/30 shrink-0">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-body-sm font-semibold text-on-surface">Assistente de Seguros</p>
              <p className="text-xs text-on-surface-variant">
                {selectedDoc ? `${selectedDoc.seguradora} — ${selectedDoc.nome}` : `${docs.length} documento(s) carregado(s)`}
              </p>
            </div>
            {selectedDocId && (
              <button
                onClick={() => setSelectedDocId(null)}
                className="ml-auto flex items-center gap-1 text-xs text-on-surface-variant hover:text-on-surface"
              >
                <ChevronDown className="w-3 h-3" /> Todos
              </button>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-body-sm font-medium text-on-surface">Assistente de Sinistros</p>
                  <p className="text-xs text-on-surface-variant mt-1 max-w-xs">
                    Tire dúvidas sobre coberturas e procedimentos de sinistro com base nas Condições Gerais carregadas.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 justify-center mt-2">
                  {[
                    'O que fazer em caso de colisão?',
                    'Quais documentos preciso para acionar o seguro?',
                    'Qual é a cobertura de roubo?',
                  ].map((sugestao) => (
                    <button
                      key={sugestao}
                      onClick={() => setInput(sugestao)}
                      className="text-xs px-3 py-1.5 rounded-full border border-outline-variant/40 text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
                    >
                      {sugestao}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                {msg.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5 text-primary" />
                  </div>
                )}
                <div
                  className={cn(
                    'max-w-[80%] rounded-2xl px-4 py-2.5',
                    msg.role === 'user'
                      ? 'bg-primary text-on-primary rounded-tr-sm'
                      : 'bg-surface-container text-on-surface rounded-tl-sm'
                  )}
                >
                  {msg.role === 'assistant' ? (
                    <MarkdownText text={msg.content} />
                  ) : (
                    <p className="text-body-sm">{msg.content}</p>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5 text-primary" />
                </div>
                <div className="bg-surface-container rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-on-surface-variant animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-on-surface-variant animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-on-surface-variant animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-outline-variant/30 shrink-0">
            <form
              onSubmit={(e) => { e.preventDefault(); handleSend() }}
              className="flex gap-2"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={docs.length === 0 ? 'Carregue um documento para começar...' : 'Faça uma pergunta sobre coberturas ou sinistros...'}
                disabled={loading || docs.length === 0}
                className="flex-1"
              />
              <Button type="submit" disabled={loading || !input.trim() || docs.length === 0} className="px-3">
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </div>
  )
}
