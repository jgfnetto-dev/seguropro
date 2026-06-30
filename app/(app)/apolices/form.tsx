'use client'
import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useDropzone } from 'react-dropzone'
import { FileUp, Loader2, Plus, X, Download, Paperclip } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/toast'
import { TIPOS_SEGURO } from '@/lib/utils'
import type { Apolice, DocumentoApolice } from '@/types'

function onlyDigits(value: string) {
  return value.replace(/\D/g, '')
}

function normalizeNome(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
}

function matchSeguradora(nomeExtraido: string, seguradoras: { id: string; nome: string }[]) {
  const normalizado = normalizeNome(nomeExtraido)
  const primeiraPalavraExtraida = normalizado.split(' ')[0] ?? ''
  return seguradoras.find((s) => {
    const nomeCadastrado = normalizeNome(s.nome)
    if (nomeCadastrado.includes(normalizado) || normalizado.includes(nomeCadastrado)) return true
    // Seguradoras costumam variar o sufixo (Seguros, Seguradora, Cia de Seguros, S.A. etc),
    // mas a primeira palavra (a marca, ex: "Pier", "Porto") normalmente se mantém igual.
    const primeiraPalavraCadastrada = nomeCadastrado.split(' ')[0] ?? ''
    return primeiraPalavraExtraida.length >= 3 && primeiraPalavraExtraida === primeiraPalavraCadastrada
  })
}

interface PendingCliente {
  segurado: string
  cpf_cnpj: string
  pf_pj: 'PF' | 'PJ'
  email: string | null
  telefone: string | null
}

interface DocumentoPendente {
  nomeDocumento: string
  file: File
}

interface Props {
  apolice?: Apolice
  seguradoras: { id: string; nome: string; ramos?: string[] }[]
  clientes: { id: string; segurado: string; cpf_cnpj?: string }[]
  defaultClienteId?: string
  isEdit?: boolean
  documentosExistentes?: DocumentoApolice[]
}

export function ApoliceForm({ apolice, seguradoras, clientes, defaultClienteId, isEdit, documentosExistentes }: Props) {
  const router = useRouter()
  const { showToast, ToastComponent } = useToast()
  const [clientesList, setClientesList] = useState(clientes)
  const [numeroApolice, setNumeroApolice] = useState(apolice?.numero_apolice ?? '')
  const [seguradoraId, setSeguradoraId] = useState(apolice?.seguradora_id ?? '')
  const [clienteId, setClienteId] = useState(apolice?.cliente_id ?? defaultClienteId ?? '')
  const [tipoSeguro, setTipoSeguro] = useState(apolice?.tipo_seguro ?? '')
  const [tiposExtra, setTiposExtra] = useState<string[]>([])
  const [dataEmissao, setDataEmissao] = useState(apolice?.data_emissao ?? '')
  const [dataInicio, setDataInicio] = useState(apolice?.data_inicio ?? '')
  const [dataFim, setDataFim] = useState(apolice?.data_fim ?? '')
  const [premioLiquido, setPremioLiquido] = useState(apolice?.premio_liquido?.toString() ?? '0.00')
  const [premioTotal, setPremioTotal] = useState(apolice?.premio_total?.toString() ?? '0.00')
  const [comissao, setComissao] = useState(apolice?.comissao_percentual?.toString() ?? '15.00')
  const [vendedor, setVendedor] = useState(apolice?.vendedor ?? '')
  const [editingComissao, setEditingComissao] = useState(false) // highlight active inline-edit
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [extracting, setExtracting] = useState(false)
  const [loading, setLoading] = useState(false)
  const [pendingCliente, setPendingCliente] = useState<PendingCliente | null>(null)
  const [documentosAtuais, setDocumentosAtuais] = useState<DocumentoApolice[]>(documentosExistentes ?? [])
  const [documentosPendentes, setDocumentosPendentes] = useState<DocumentoPendente[]>([])
  const [novoNomeDocumento, setNovoNomeDocumento] = useState('')
  const [novoArquivoDocumento, setNovoArquivoDocumento] = useState<File | null>(null)

  const onDrop = useCallback(async (files: File[]) => {
    const file = files[0]
    if (!file || file.type !== 'application/pdf') {
      showToast('Apenas arquivos PDF são aceitos.', 'error')
      return
    }
    setPdfFile(file)
    setExtracting(true)
    const doExtract = async () => {
      const formDataPdf = new FormData()
      formDataPdf.append('file', file)
      try {
        const res = await fetch('/api/pdf-extract', {
          method: 'POST',
          body: formDataPdf,
        })
        const data = await res.json()
        if (!res.ok) {
          showToast(`Erro na extração: ${data.error ?? 'falha desconhecida'}`, 'error')
          return
        }
        if (data.numero_apolice) setNumeroApolice(data.numero_apolice)
        if (data.data_inicio) setDataInicio(data.data_inicio)
        if (data.data_fim) setDataFim(data.data_fim)
        if (data.data_emissao) setDataEmissao(data.data_emissao)
        else if (data.data_inicio) setDataEmissao(data.data_inicio)
        if (data.premio_liquido) setPremioLiquido(data.premio_liquido.toString())
        if (data.premio_total) setPremioTotal(data.premio_total.toString())
        let seguradoraEncontrada: { id: string; nome: string; ramos?: string[] } | undefined
        if (data.seguradora) {
          seguradoraEncontrada = matchSeguradora(data.seguradora, seguradoras)
          if (seguradoraEncontrada) {
            setSeguradoraId(seguradoraEncontrada.id)
          } else {
            showToast(`Seguradora "${data.seguradora}" não encontrada. Selecione manualmente.`, 'info')
          }
        } else {
          showToast('PDF não trouxe o nome da seguradora. Selecione manualmente.', 'info')
        }

        console.log('[PDF Extract] dados retornados:', data)

        if (data.tipo_seguro) {
          setTipoSeguro(data.tipo_seguro)
          const ramosDaSeguradora = seguradoraEncontrada?.ramos ?? []
          const jaExiste = TIPOS_SEGURO.includes(data.tipo_seguro) || ramosDaSeguradora.includes(data.tipo_seguro)
          if (!jaExiste) {
            setTiposExtra((prev) => prev.includes(data.tipo_seguro) ? prev : [...prev, data.tipo_seguro])
          }
        } else {
          showToast('PDF não trouxe o tipo de seguro. Selecione manualmente.', 'info')
        }

        if (data.segurado && data.cpf_cnpj) {
          const extractedDigits = onlyDigits(data.cpf_cnpj)
          const existing = clientesList.find((c) => onlyDigits(c.cpf_cnpj ?? '') === extractedDigits)
          if (existing) {
            setClienteId(existing.id)
            setPendingCliente(null)
          } else {
            const pfPj = extractedDigits.length > 11 ? 'PJ' : 'PF'
            setClienteId('')
            setPendingCliente({
              segurado: data.segurado,
              cpf_cnpj: data.cpf_cnpj,
              pf_pj: pfPj,
              email: data.email ?? null,
              telefone: data.telefone ?? null,
            })
            showToast(`Cliente "${data.segurado}" será criado automaticamente ao salvar a apólice.`, 'info')
          }
        } else {
          showToast('PDF não trouxe nome e CPF/CNPJ do segurado. Selecione o cliente manualmente.', 'info')
        }

        showToast('Dados extraídos com sucesso!', 'success')
      } catch (err) {
        showToast(`Erro na extração do PDF: ${err instanceof Error ? err.message : 'desconhecido'}`, 'error')
      } finally {
        setExtracting(false)
      }
    }
    doExtract()
  }, [showToast])

  function adicionarDocumentoPendente() {
    if (!novoNomeDocumento.trim()) { showToast('Informe o nome do documento.', 'error'); return }
    if (!novoArquivoDocumento) { showToast('Selecione o arquivo do documento.', 'error'); return }
    setDocumentosPendentes((prev) => [...prev, { nomeDocumento: novoNomeDocumento.trim(), file: novoArquivoDocumento }])
    setNovoNomeDocumento('')
    setNovoArquivoDocumento(null)
  }

  function removerDocumentoPendente(index: number) {
    setDocumentosPendentes((prev) => prev.filter((_, i) => i !== index))
  }

  async function excluirDocumentoExistente(id: string) {
    if (!confirm('Excluir este documento da apólice?')) return
    const res = await fetch(`/api/documentos-apolice?id=${id}`, { method: 'DELETE' })
    if (res.ok) {
      setDocumentosAtuais((prev) => prev.filter((d) => d.id !== id))
      showToast('Documento excluído.', 'success')
    } else {
      showToast('Erro ao excluir documento.', 'error')
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!clienteId && !pendingCliente) { showToast('Selecione um cliente.', 'error'); return }
    if (!seguradoraId) { showToast('Selecione uma seguradora.', 'error'); return }
    if (!tipoSeguro) { showToast('Selecione o tipo de seguro.', 'error'); return }
    if (!numeroApolice) { showToast('Informe o número da apólice.', 'error'); return }
    if (!dataInicio || !dataFim) { showToast('Informe a vigência (data início e fim).', 'error'); return }

    setLoading(true)

    let resolvedClienteId = clienteId
    let clienteCriadoNestaTentativa = false
    const pendingClienteOriginal = pendingCliente

    async function desfazerCriacaoCliente() {
      if (!clienteCriadoNestaTentativa) return
      await fetch(`/api/clientes?id=${resolvedClienteId}`, { method: 'DELETE' })
      setClientesList((prev) => prev.filter((c) => c.id !== resolvedClienteId))
      setClienteId('')
      setPendingCliente(pendingClienteOriginal)
    }

    try {
      if (!resolvedClienteId && pendingCliente) {
        const createRes = await fetch('/api/clientes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(pendingCliente),
        })
        const createData = await createRes.json()
        if (!createRes.ok) {
          showToast(`Erro ao criar cliente: ${createData.error ?? 'falha desconhecida'}`, 'error')
          setLoading(false)
          return
        }
        resolvedClienteId = createData.id
        clienteCriadoNestaTentativa = true
        setClientesList((prev) => [...prev, createData])
        setClienteId(createData.id)
        setPendingCliente(null)
      }

      const dupCheckRes = await fetch(`/api/apolices?cliente_id=${resolvedClienteId}&numero_apolice=${encodeURIComponent(numeroApolice)}`)
      if (dupCheckRes.ok) {
        const existentes = await dupCheckRes.json()
        const duplicada = existentes.find((a: { id: string }) => a.id !== apolice?.id)
        if (duplicada) {
          showToast(`A apólice nº ${numeroApolice} já está cadastrada para ${clienteNome ?? 'este cliente'}.`, 'error')
          await desfazerCriacaoCliente()
          setLoading(false)
          return
        }
      }

      let pdfUrl = apolice?.pdf_url
      if (pdfFile) {
        const formData = new FormData()
        formData.append('file', pdfFile)
        const uploadRes = await fetch('/api/apolices/upload', { method: 'POST', body: formData })
        const uploadData = await uploadRes.json()
        if (!uploadRes.ok) {
          showToast(`Erro no upload do PDF: ${uploadData.error ?? 'falha desconhecida'}`, 'error')
          await desfazerCriacaoCliente()
          setLoading(false)
          return
        }
        pdfUrl = uploadData.url
      }

      const method = isEdit ? 'PUT' : 'POST'
      const body = {
        ...(isEdit && { id: apolice?.id }),
        cliente_id: resolvedClienteId,
        seguradora_id: seguradoraId,
        numero_apolice: numeroApolice,
        tipo_seguro: tipoSeguro,
        data_emissao: dataEmissao || dataInicio,
        data_inicio: dataInicio,
        data_fim: dataFim,
        premio_liquido: parseFloat(premioLiquido),
        premio_total: parseFloat(premioTotal),
        comissao_percentual: parseFloat(comissao),
        pdf_url: pdfUrl,
        vendedor: vendedor || null,
      }

      const res = await fetch('/api/apolices', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await res.json()
      if (res.ok) {
        const apoliceIdFinal = isEdit ? apolice?.id : data.id

        if (apoliceIdFinal && documentosPendentes.length) {
          for (const doc of documentosPendentes) {
            const formDataDoc = new FormData()
            formDataDoc.append('file', doc.file)
            const uploadDocRes = await fetch('/api/apolices/upload', { method: 'POST', body: formDataDoc })
            const uploadDocData = await uploadDocRes.json()
            if (!uploadDocRes.ok) {
              showToast(`Erro no upload do documento "${doc.nomeDocumento}": ${uploadDocData.error ?? 'falha desconhecida'}`, 'error')
              continue
            }
            await fetch('/api/documentos-apolice', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                apolice_id: apoliceIdFinal,
                numero_apolice: numeroApolice,
                nome_documento: doc.nomeDocumento,
                documento_url: uploadDocData.url,
              }),
            })
          }
        }

        showToast(isEdit ? 'Apólice atualizada!' : 'Apólice salva!', 'success')
        setTimeout(() => {
          router.push('/apolices')
          router.refresh()
        }, 1000)
      } else {
        showToast(`Erro ao salvar apólice: ${data.error ?? 'falha desconhecida'}`, 'error')
        await desfazerCriacaoCliente()
      }
    } catch (err) {
      showToast(`Erro inesperado: ${err instanceof Error ? err.message : 'desconhecido'}`, 'error')
      await desfazerCriacaoCliente()
    } finally {
      setLoading(false)
    }
  }

  const clienteNome = clientesList.find(c => c.id === clienteId)?.segurado ?? (pendingCliente ? `${pendingCliente.segurado} (novo, será criado ao salvar)` : undefined)
  const seguradoraSelecionada = seguradoras.find(s => s.id === seguradoraId)
  const tiposDisponiveis = Array.from(new Set([
    ...TIPOS_SEGURO,
    ...(seguradoraSelecionada?.ramos ?? []),
    ...tiposExtra,
  ]))

  return (
    <>
      {ToastComponent}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h1 className="text-h1 text-on-surface">{isEdit ? 'Editar Apólice' : 'Nova Apólice'}</h1>
            <p className="text-body-sm text-on-surface-variant mt-1">Cadastre uma nova apólice ou edite as informações existentes.</p>
          </div>

          {extracting && (
            <div className="flex items-center justify-center gap-3 rounded-lg bg-secondary/10 border border-secondary/30 px-6 py-4 shadow-card">
              <Loader2 className="w-5 h-5 animate-spin text-secondary shrink-0" />
              <span className="text-h3 text-secondary">Extraindo informações do PDF automaticamente...</span>
            </div>
          )}

          <form id="apolice-form" onSubmit={handleSubmit} className="space-y-4">
            <Card>
              <CardContent className="pt-5 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-secondary">📋</span>
                  <h3 className="text-h3 text-on-surface">Identificação</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Nº Apólice</Label>
                    <Input value={numeroApolice} onChange={e => setNumeroApolice(e.target.value)} placeholder="Ex: 100962-X" required />
                  </div>
                  <div>
                    <Label>Seguradora</Label>
                    <Select value={seguradoraId} onValueChange={setSeguradoraId}>
                      <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                      <SelectContent>
                        {seguradoras.map(s => <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Tipo de Seguro</Label>
                    <Select key={tiposDisponiveis.join('|')} value={tipoSeguro} onValueChange={setTipoSeguro}>
                      <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                      <SelectContent>
                        {tiposDisponiveis.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Cliente (Vinculado)</Label>
                    {clienteNome ? (
                      <div className="h-10 flex items-center px-3 rounded border border-outline-variant bg-surface-container-low text-body-sm text-on-surface">
                        {clienteNome}
                      </div>
                    ) : (
                      <Select value={clienteId} onValueChange={setClienteId}>
                        <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                        <SelectContent>
                          {clientesList.map(c => <SelectItem key={c.id} value={c.id}>{c.segurado}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
                <div>
                  <Label>Vendedor</Label>
                  <Input value={vendedor} onChange={e => setVendedor(e.target.value)} placeholder="Ex: João Silva (opcional)" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-5 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-secondary">💰</span>
                  <h3 className="text-h3 text-on-surface">Valores e Prêmios</h3>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Prêmio Líquido</Label>
                    <Input value={premioLiquido} onChange={e => setPremioLiquido(e.target.value)} placeholder="R$ 0,00" type="number" step="0.01" />
                  </div>
                  <div>
                    <Label>Prêmio Total</Label>
                    <Input value={premioTotal} onChange={e => setPremioTotal(e.target.value)} placeholder="R$ 0,00" type="number" step="0.01" />
                  </div>
                  <div>
                    <Label>% Comissão (Editável)</Label>
                    <div className="relative">
                      <Input
                        value={comissao}
                        onChange={e => setComissao(e.target.value)}
                        onClick={() => setEditingComissao(true)}
                        onBlur={() => setEditingComissao(false)}
                        type="number"
                        step="0.01"
                        className={`pr-6 ${editingComissao ? 'ring-2 ring-ring' : ''}`}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-5 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-secondary">📅</span>
                  <h3 className="text-h3 text-on-surface">Vigência</h3>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Data Emissão</Label>
                    <Input type="date" value={dataEmissao} onChange={e => setDataEmissao(e.target.value)} />
                  </div>
                  <div>
                    <Label>Data Início</Label>
                    <Input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} required />
                  </div>
                  <div>
                    <Label>Data Fim</Label>
                    <Input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} required />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-5 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Paperclip className="w-4 h-4 text-secondary" />
                  <h3 className="text-h3 text-on-surface">Documentos</h3>
                </div>

                {documentosAtuais.length > 0 && (
                  <div className="space-y-2">
                    {documentosAtuais.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between gap-2 px-3 py-2 rounded border border-outline-variant bg-surface-container-low">
                        <span className="text-body-sm text-on-surface truncate">{doc.nome_documento}</span>
                        <div className="flex items-center gap-1 shrink-0">
                          <a href={doc.documento_url} target="_blank" rel="noopener noreferrer" title="Baixar" className="p-1.5 rounded hover:bg-surface-container text-on-surface-variant hover:text-on-surface">
                            <Download className="w-4 h-4" />
                          </a>
                          <button type="button" onClick={() => excluirDocumentoExistente(doc.id)} title="Excluir" className="p-1.5 rounded hover:bg-error/10 text-on-surface-variant hover:text-error">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {documentosPendentes.length > 0 && (
                  <div className="space-y-2">
                    {documentosPendentes.map((doc, i) => (
                      <div key={i} className="flex items-center justify-between gap-2 px-3 py-2 rounded border border-primary/30 bg-primary/5">
                        <span className="text-body-sm text-on-surface truncate">{doc.nomeDocumento} <span className="text-on-surface-variant">— {doc.file.name}</span></span>
                        <button type="button" onClick={() => removerDocumentoPendente(i)} title="Remover" className="p-1.5 rounded hover:bg-error/10 text-on-surface-variant hover:text-error shrink-0">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end">
                  <div>
                    <Label>Nome do Documento</Label>
                    <Input value={novoNomeDocumento} onChange={(e) => setNovoNomeDocumento(e.target.value)} placeholder="Ex: Proposta" />
                  </div>
                  <div>
                    <Label>Arquivo</Label>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg"
                      onChange={(e) => setNovoArquivoDocumento(e.target.files?.[0] ?? null)}
                      className="flex h-10 w-full rounded border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface file:mr-2 file:text-on-surface-variant"
                    />
                  </div>
                  <Button type="button" variant="outline" onClick={adicionarDocumentoPendente} className="gap-1">
                    <Plus className="w-4 h-4" /> Adicionar
                  </Button>
                </div>
                <p className="text-xs text-on-surface-variant">Formatos aceitos: PDF, Word ou JPEG. Os documentos só são enviados ao salvar a apólice.</p>
              </CardContent>
            </Card>
          </form>
        </div>

        <div className="space-y-4">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-primary bg-primary/5' : 'border-outline-variant hover:border-primary/50 hover:bg-surface-container-low'
            }`}
          >
            <input {...getInputProps()} />
            <FileUp className="w-8 h-8 mx-auto mb-3 text-on-surface-variant" />
            <p className="text-body-sm font-medium text-on-surface mb-1">
              {pdfFile ? pdfFile.name : 'Arraste a Apólice (PDF)'}
            </p>
            <p className="text-body-sm text-on-surface-variant mb-4">Ou clique para selecionar o arquivo</p>
            <Button type="button" variant="secondary" size="sm">Selecionar Arquivo</Button>
            <p className="text-xs text-on-surface-variant mt-3">Máximo 10MB • Apenas PDF</p>
          </div>

          <Button form="apolice-form" type="submit" className="w-full" disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar Apólice'}
          </Button>
          <Button type="button" variant="outline" className="w-full" onClick={() => router.back()}>Cancelar</Button>

          <div className="rounded-lg bg-tertiary/5 border border-tertiary/20 p-4">
            <div className="flex items-center gap-2 mb-1">
              <span>📍</span>
              <p className="text-body-sm font-semibold text-on-surface">Dica de Produtividade</p>
            </div>
            <p className="text-body-sm text-on-surface-variant">
              Ao subir o PDF, nossa IA já preenche automaticamente o número, valores e datas. Você só precisa conferir e salvar.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
