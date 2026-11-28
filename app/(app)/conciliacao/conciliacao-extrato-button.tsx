'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { FileSearch, Loader2, CheckCircle2, AlertCircle, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useToast } from '@/components/ui/toast'
import { formatCurrency } from '@/lib/utils'

interface Encontrada {
  numero_apolice: string
  apolice_id: string
  cliente: string
  segurado_extrato: string
  comissao: number
}

interface NaoEncontrada {
  numero_apolice: string
  segurado: string
  comissao: number
}

type Etapa = 'upload' | 'preview' | 'confirmando'

export function ConciliacaoExtratoButton() {
  const router = useRouter()
  const { showToast, ToastComponent } = useToast()
  const [open, setOpen] = useState(false)
  const [etapa, setEtapa] = useState<Etapa>('upload')
  const [extraindo, setExtraindo] = useState(false)
  const [encontradas, setEncontradas] = useState<Encontrada[]>([])
  const [naoEncontradas, setNaoEncontradas] = useState<NaoEncontrada[]>([])
  const [dataConciliacao, setDataConciliacao] = useState(new Date().toISOString().split('T')[0])
  const fileRef = useRef<HTMLInputElement>(null)

  function resetar() {
    setEtapa('upload')
    setEncontradas([])
    setNaoEncontradas([])
    if (fileRef.current) fileRef.current.value = ''
  }

  function handleClose(v: boolean) {
    setOpen(v)
    if (!v) resetar()
  }

  async function handleUpload() {
    const file = fileRef.current?.files?.[0]
    if (!file) { showToast('Selecione um arquivo PDF.', 'error'); return }
    if (file.type !== 'application/pdf') { showToast('Apenas arquivos PDF são aceitos.', 'error'); return }

    setExtraindo(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/conciliacao/extrato-pdf', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) { showToast(data.error ?? 'Erro ao processar o extrato.', 'error'); return }
      setEncontradas(data.encontradas ?? [])
      setNaoEncontradas(data.nao_encontradas ?? [])
      setEtapa('preview')
    } catch {
      showToast('Erro ao enviar o arquivo.', 'error')
    } finally {
      setExtraindo(false)
    }
  }

  async function handleConfirmar() {
    if (!encontradas.length) return
    setEtapa('confirmando')
    let erros = 0
    const comentario = `Conciliação automática - Extrato ${dataConciliacao}`

    await Promise.all(encontradas.map(async (item) => {
      const res = await fetch('/api/conciliacao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apolice_id: item.apolice_id,
          numero_apolice: item.numero_apolice,
          data_conciliacao: dataConciliacao,
          valor_conciliar: item.comissao,
          comentario,
        }),
      })
      if (!res.ok) erros++
    }))

    if (erros === 0) {
      showToast(`${encontradas.length} conciliação(ões) registrada(s) com sucesso!`, 'success')
    } else {
      showToast(`${encontradas.length - erros} registradas, ${erros} com erro.`, 'error')
    }
    setOpen(false)
    resetar()
    router.refresh()
  }

  const totalEncontrado = encontradas.reduce((s, i) => s + i.comissao, 0)

  return (
    <>
      {ToastComponent}
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogTrigger asChild>
          <Button variant="outline" className="gap-2">
            <FileSearch className="w-4 h-4" />
            Conciliação por Extrato
          </Button>
        </DialogTrigger>

        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Conciliação Automática por Extrato</DialogTitle>
          </DialogHeader>

          {etapa === 'upload' && (
            <div className="space-y-4 py-2">
              <p className="text-body-sm text-on-surface-variant">
                Faça upload do extrato do corretor em PDF. O sistema vai identificar as apólices e os valores de comissão automaticamente.
              </p>
              <div className="space-y-3">
                <label className="block text-sm font-medium text-on-surface">Arquivo PDF do Extrato</label>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf"
                  className="flex h-10 w-full rounded border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface file:mr-2 file:text-on-surface-variant"
                />
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-on-surface">Data de Conciliação</label>
                  <input
                    type="date"
                    value={dataConciliacao}
                    onChange={(e) => setDataConciliacao(e.target.value)}
                    className="h-10 w-full px-3 rounded border border-outline-variant bg-surface-container-lowest text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button onClick={handleUpload} disabled={extraindo} className="gap-2">
                  {extraindo ? <><Loader2 className="w-4 h-4 animate-spin" /> Processando...</> : <><Upload className="w-4 h-4" /> Processar Extrato</>}
                </Button>
              </div>
            </div>
          )}

          {etapa === 'preview' && (
            <div className="flex flex-col gap-4 overflow-hidden py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-semibold text-green-700 dark:text-green-400">{encontradas.length} apólice(s) encontrada(s)</span>
                  </div>
                  <p className="text-xs text-green-600 dark:text-green-500">Total: {formatCurrency(totalEncontrado)}</p>
                </div>
                <div className={`rounded-lg border p-3 ${naoEncontradas.length > 0 ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800' : 'bg-surface-container-low border-outline-variant/30'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <AlertCircle className={`w-4 h-4 ${naoEncontradas.length > 0 ? 'text-amber-600' : 'text-on-surface-variant'}`} />
                    <span className={`text-sm font-semibold ${naoEncontradas.length > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-on-surface-variant'}`}>
                      {naoEncontradas.length} não encontrada(s)
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant">Tratar manualmente</p>
                </div>
              </div>

              <div className="overflow-y-auto flex-1 min-h-0 space-y-3">
                {encontradas.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-2">Serão conciliadas</p>
                    <div className="rounded border border-outline-variant/30 overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-surface-container-low border-b border-outline-variant/30">
                            <th className="text-left px-3 py-2 text-xs text-on-surface-variant font-medium">Apólice</th>
                            <th className="text-left px-3 py-2 text-xs text-on-surface-variant font-medium">Cliente</th>
                            <th className="text-right px-3 py-2 text-xs text-on-surface-variant font-medium">Comissão</th>
                          </tr>
                        </thead>
                        <tbody>
                          {encontradas.map((item) => (
                            <tr key={item.apolice_id} className="border-b border-outline-variant/20 last:border-0">
                              <td className="px-3 py-2 font-medium text-on-surface">{item.numero_apolice}</td>
                              <td className="px-3 py-2 text-on-surface-variant truncate max-w-[180px]">{item.cliente || item.segurado_extrato}</td>
                              <td className="px-3 py-2 text-right font-medium text-green-700 dark:text-green-400">{formatCurrency(item.comissao)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {naoEncontradas.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-2">Não encontradas no sistema</p>
                    <div className="rounded border border-amber-200 dark:border-amber-800 overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800">
                            <th className="text-left px-3 py-2 text-xs text-amber-700 dark:text-amber-400 font-medium">Apólice</th>
                            <th className="text-left px-3 py-2 text-xs text-amber-700 dark:text-amber-400 font-medium">Segurado (extrato)</th>
                            <th className="text-right px-3 py-2 text-xs text-amber-700 dark:text-amber-400 font-medium">Comissão</th>
                          </tr>
                        </thead>
                        <tbody>
                          {naoEncontradas.map((item) => (
                            <tr key={item.numero_apolice} className="border-b border-amber-100 dark:border-amber-900 last:border-0">
                              <td className="px-3 py-2 font-medium text-on-surface">{item.numero_apolice}</td>
                              <td className="px-3 py-2 text-on-surface-variant truncate max-w-[180px]">{item.segurado}</td>
                              <td className="px-3 py-2 text-right text-on-surface-variant">{formatCurrency(item.comissao)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-between gap-3 pt-2 border-t border-outline-variant/30">
                <Button variant="outline" onClick={resetar}>Voltar</Button>
                <Button onClick={handleConfirmar} disabled={encontradas.length === 0} className="gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Confirmar {encontradas.length} conciliação(ões)
                </Button>
              </div>
            </div>
          )}

          {etapa === 'confirmando' && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-body-sm text-on-surface-variant">Registrando conciliações...</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
