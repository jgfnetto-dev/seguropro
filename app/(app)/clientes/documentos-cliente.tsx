'use client'

import { useState } from 'react'
import { Download, X, Plus, Loader2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/toast'

interface DocumentoCliente {
  id: string
  nome_documento: string
  documento_url: string
}

interface ClienteData {
  id: string
  segurado: string
  nome_segurado?: string | null
  cpf_cnpj: string
  cpf_cnpj_segurado?: string | null
  pf_pj: 'PF' | 'PJ'
  email?: string | null
  telefone?: string | null
}

interface Props {
  clienteId: string
  documentosIniciais: DocumentoCliente[]
  clienteData: ClienteData
}

export function DocumentosCliente({ clienteId, documentosIniciais, clienteData }: Props) {
  const { showToast, ToastComponent } = useToast()
  const [documentos, setDocumentos] = useState<DocumentoCliente[]>(documentosIniciais)
  const [nomeDocumento, setNomeDocumento] = useState('')
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [confirmandoId, setConfirmandoId] = useState<string | null>(null)

  async function handleAdicionar() {
    if (!nomeDocumento.trim()) { showToast('Informe o nome do documento.', 'error'); return }
    if (!arquivo) { showToast('Selecione o arquivo.', 'error'); return }

    setSalvando(true)
    try {
      const fd = new FormData()
      fd.append('file', arquivo)
      const uploadRes = await fetch('/api/apolices/upload', { method: 'POST', body: fd })
      const uploadData = await uploadRes.json()
      if (!uploadRes.ok) {
        showToast(`Erro no upload: ${uploadData.error ?? 'falha desconhecida'}`, 'error')
        return
      }

      const saveRes = await fetch('/api/documentos-cliente', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cliente_id: clienteId, nome_documento: nomeDocumento.trim(), documento_url: uploadData.url }),
      })
      const saveData = await saveRes.json()
      if (!saveRes.ok) {
        showToast(`Erro ao salvar: ${saveData.error ?? 'falha desconhecida'}`, 'error')
        return
      }

      setDocumentos((prev) => [saveData, ...prev])
      setNomeDocumento('')
      setArquivo(null)

      // Salva o cliente automaticamente após adicionar o documento
      await fetch('/api/clientes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: clienteData.id,
          segurado: clienteData.segurado,
          nome_segurado: clienteData.nome_segurado ?? null,
          cpf_cnpj: clienteData.cpf_cnpj,
          cpf_cnpj_segurado: clienteData.cpf_cnpj_segurado ?? null,
          pf_pj: clienteData.pf_pj,
          email: clienteData.email ?? null,
          telefone: clienteData.telefone ?? null,
        }),
      })
      showToast('Documento adicionado e cliente salvo.', 'success')
    } finally {
      setSalvando(false)
    }
  }

  async function handleConfirmarExclusao(id: string) {
    const res = await fetch(`/api/documentos-cliente?id=${id}`, { method: 'DELETE' })
    if (res.ok) {
      setDocumentos((prev) => prev.filter((d) => d.id !== id))
      setConfirmandoId(null)
      showToast('Documento excluído.', 'success')
    } else {
      showToast('Erro ao excluir documento.', 'error')
    }
  }

  return (
    <>
      {ToastComponent}
      <div className="space-y-3">
        {documentos.length > 0 && (
          <div className="space-y-2">
            {documentos.map((doc) => (
              <div key={doc.id} className="rounded border border-outline-variant bg-surface-container-low overflow-hidden">
                <div className="flex items-center justify-between gap-2 px-3 py-2">
                  <span className="text-body-sm text-on-surface truncate">{doc.nome_documento}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    <a href={doc.documento_url} target="_blank" rel="noopener noreferrer" title="Baixar"
                      className="p-1.5 rounded hover:bg-surface-container text-on-surface-variant hover:text-on-surface">
                      <Download className="w-4 h-4" />
                    </a>
                    <button
                      type="button"
                      onClick={() => setConfirmandoId(confirmandoId === doc.id ? null : doc.id)}
                      title="Excluir"
                      className="p-1.5 rounded hover:bg-error/10 text-on-surface-variant hover:text-error"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {confirmandoId === doc.id && (
                  <div className="flex items-center justify-between gap-2 px-3 py-2 bg-error/5 border-t border-error/20">
                    <span className="text-body-sm text-error">Deseja realmente excluir este documento?</span>
                    <div className="flex gap-2 shrink-0">
                      <Button type="button" size="sm" variant="outline" onClick={() => setConfirmandoId(null)}>
                        Cancelar
                      </Button>
                      <Button type="button" size="sm" variant="destructive" onClick={() => handleConfirmarExclusao(doc.id)}>
                        <X className="w-3.5 h-3.5 mr-1" /> Excluir
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end">
          <div>
            <Label>Nome do Documento</Label>
            <Input
              value={nomeDocumento}
              onChange={(e) => setNomeDocumento(e.target.value)}
              placeholder="Ex: Contrato Social"
            />
          </div>
          <div>
            <Label>Arquivo</Label>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg"
              onChange={(e) => setArquivo(e.target.files?.[0] ?? null)}
              className="flex h-10 w-full rounded border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface file:mr-2 file:text-on-surface-variant"
            />
          </div>
          <Button type="button" variant="outline" onClick={handleAdicionar} disabled={salvando} className="gap-1">
            {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Adicionar
          </Button>
        </div>
        <p className="text-xs text-on-surface-variant">Formatos aceitos: PDF, Word ou JPEG.</p>
      </div>
    </>
  )
}
