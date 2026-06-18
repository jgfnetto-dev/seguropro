'use client'
import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useDropzone } from 'react-dropzone'
import { FileUp, Loader2, Paperclip } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useToast } from '@/components/ui/toast'

interface Props {
  apoliceId: string
  numeroApolice: string
}

export function EndossoButton({ apoliceId, numeroApolice }: Props) {
  const router = useRouter()
  const { showToast, ToastComponent } = useToast()
  const [open, setOpen] = useState(false)
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [extracting, setExtracting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [numeroEndosso, setNumeroEndosso] = useState('')
  const [tipoEndosso, setTipoEndosso] = useState('')
  const [segurado, setSegurado] = useState('')
  const [dataEmissao, setDataEmissao] = useState('')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')

  function resetForm() {
    setPdfFile(null)
    setNumeroEndosso('')
    setTipoEndosso('')
    setSegurado('')
    setDataEmissao('')
    setDataInicio('')
    setDataFim('')
  }

  const onDrop = useCallback(async (files: File[]) => {
    const file = files[0]
    if (!file || file.type !== 'application/pdf') {
      showToast('Apenas arquivos PDF são aceitos.', 'error')
      return
    }
    setPdfFile(file)
    setExtracting(true)
    const reader = new FileReader()
    reader.onload = async (e) => {
      const base64 = (e.target?.result as string).split(',')[1]
      try {
        const res = await fetch('/api/endosso-extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pdf: base64 }),
        })
        const data = await res.json()
        if (!res.ok) {
          showToast(`Erro na extração: ${data.error ?? 'falha desconhecida'}`, 'error')
          return
        }
        if (data.numero_endosso) setNumeroEndosso(data.numero_endosso)
        if (data.tipo_endosso) setTipoEndosso(data.tipo_endosso)
        if (data.segurado) setSegurado(data.segurado)
        if (data.data_emissao) setDataEmissao(data.data_emissao)
        if (data.data_inicio) setDataInicio(data.data_inicio)
        if (data.data_fim) setDataFim(data.data_fim)
        showToast('Dados do endosso extraídos com sucesso! Confira antes de salvar.', 'success')
      } catch (err) {
        showToast(`Erro na extração do PDF: ${err instanceof Error ? err.message : 'desconhecido'}`, 'error')
      } finally {
        setExtracting(false)
      }
    }
    reader.readAsDataURL(file)
  }, [showToast])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!numeroEndosso) { showToast('Informe o número do endosso.', 'error'); return }
    if (!pdfFile) { showToast('Faça o upload do PDF do endosso.', 'error'); return }

    setSaving(true)
    try {
      const formData = new FormData()
      formData.append('file', pdfFile)
      const uploadRes = await fetch('/api/apolices/upload', { method: 'POST', body: formData })
      const uploadData = await uploadRes.json()
      if (!uploadRes.ok) {
        showToast(`Erro no upload do PDF: ${uploadData.error ?? 'falha desconhecida'}`, 'error')
        setSaving(false)
        return
      }

      const res = await fetch('/api/endossos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apolice_id: apoliceId,
          numero_apolice: numeroApolice,
          numero_endosso: numeroEndosso,
          tipo_endosso: tipoEndosso || null,
          segurado: segurado || null,
          data_emissao: dataEmissao || null,
          data_inicio: dataInicio || null,
          data_fim: dataFim || null,
          pdf_url: uploadData.url,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        showToast('Endosso incluído com sucesso!', 'success')
        resetForm()
        setOpen(false)
        router.refresh()
      } else {
        showToast(`Erro ao salvar endosso: ${data.error ?? 'falha desconhecida'}`, 'error')
      }
    } catch (err) {
      showToast(`Erro inesperado: ${err instanceof Error ? err.message : 'desconhecido'}`, 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      {ToastComponent}
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm() }}>
        <DialogTrigger asChild>
          <button
            title="Incluir endosso (upload de PDF)"
            className="p-1.5 rounded border border-outline-variant bg-card hover:bg-surface-container text-on-surface-variant hover:text-on-surface"
          >
            <Paperclip className="w-4 h-4" />
          </button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Incluir Endosso — Apólice Nº {numeroApolice}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                isDragActive ? 'border-primary bg-primary/5' : 'border-outline-variant hover:border-primary/50 hover:bg-surface-container-low'
              }`}
            >
              <input {...getInputProps()} />
              <FileUp className="w-6 h-6 mx-auto mb-2 text-on-surface-variant" />
              <p className="text-body-sm font-medium text-on-surface">
                {pdfFile ? pdfFile.name : 'Arraste o PDF do endosso ou clique para selecionar'}
              </p>
            </div>

            {extracting && (
              <div className="flex items-center justify-center gap-2 text-body-sm text-secondary">
                <Loader2 className="w-4 h-4 animate-spin" /> Extraindo informações do PDF...
              </div>
            )}

            <div>
              <Label htmlFor="numero-endosso">Número do Endosso</Label>
              <Input id="numero-endosso" value={numeroEndosso} onChange={(e) => setNumeroEndosso(e.target.value)} required />
            </div>

            <div>
              <Label htmlFor="tipo-endosso">Tipo de Endosso</Label>
              <Input id="tipo-endosso" value={tipoEndosso} onChange={(e) => setTipoEndosso(e.target.value)} placeholder="Ex: Inclusão, Alteração, Cancelamento..." />
            </div>

            <div>
              <Label htmlFor="segurado-endosso">Segurado</Label>
              <Input id="segurado-endosso" value={segurado} onChange={(e) => setSegurado(e.target.value)} />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label htmlFor="data-emissao-endosso">Data Emissão</Label>
                <Input id="data-emissao-endosso" type="date" value={dataEmissao} onChange={(e) => setDataEmissao(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="data-inicio-endosso">Data Início</Label>
                <Input id="data-inicio-endosso" type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="data-fim-endosso">Data Fim</Label>
                <Input id="data-fim-endosso" type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={saving || extracting}>{saving ? 'Salvando...' : 'Salvar Endosso'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
