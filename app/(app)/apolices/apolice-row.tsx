'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Download, ChevronDown, Trash2, Files } from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils'
import { useToast } from '@/components/ui/toast'
import { DeleteApoliceButton } from './delete-button'
import { EndossoButton } from './endosso-button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

interface DocumentoApolice {
  id: string
  nome_documento: string
  documento_url: string
}

function DocumentosButton({ documentos }: { documentos: DocumentoApolice[] }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          title="Ver documentos da apólice"
          className="p-1.5 rounded border border-outline-variant bg-card hover:bg-surface-container text-on-surface-variant hover:text-on-surface"
        >
          <Files className="w-4 h-4" />
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Documentos da Apólice</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          {documentos.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between gap-2 px-3 py-2 rounded border border-outline-variant bg-surface-container-low">
              <span className="text-body-sm text-on-surface truncate">{doc.nome_documento}</span>
              <a
                href={doc.documento_url}
                target="_blank"
                rel="noopener noreferrer"
                title="Baixar"
                className="p-1.5 rounded hover:bg-surface-container text-on-surface-variant hover:text-on-surface shrink-0"
              >
                <Download className="w-4 h-4" />
              </a>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface Endosso {
  id: string
  numero_endosso: string
  tipo_endosso?: string | null
  segurado?: string | null
  data_emissao?: string | null
  data_inicio?: string | null
  data_fim?: string | null
  veiculo?: string | null
  ano?: string | null
  modelo?: string | null
  placa?: string | null
  chassi?: string | null
  pdf_url?: string | null
}

interface ApoliceRowData {
  id: string
  cliente_id: string
  numero_apolice: string
  data_emissao?: string | null
  data_inicio: string
  data_fim: string
  tipo_seguro: string
  premio_liquido: number
  premio_total: number
  pdf_url?: string | null
  cliente?: { segurado?: string }
  seguradora?: { nome?: string }
}

interface Props {
  apolice: ApoliceRowData
  index: number
  isUltimaApoliceDoCliente: boolean
  endossos: Endosso[]
  documentos: DocumentoApolice[]
  statusBadge: React.ReactNode
}

export function ApoliceRow({ apolice: a, index, isUltimaApoliceDoCliente, endossos, documentos, statusBadge }: Props) {
  const router = useRouter()
  const { showToast, ToastComponent } = useToast()
  const [expanded, setExpanded] = useState(false)
  const [excluindoId, setExcluindoId] = useState<string | null>(null)
  const temEndosso = endossos.length > 0
  const zebra = index % 2 === 0 ? '' : 'bg-surface-container-low/40'

  async function handleExcluirEndosso(endosso: Endosso) {
    if (!confirm(`Excluir o endosso nº ${endosso.numero_endosso}?`)) return

    setExcluindoId(endosso.id)
    const res = await fetch(`/api/endossos?id=${endosso.id}`, { method: 'DELETE' })
    const data = await res.json()
    setExcluindoId(null)

    if (!res.ok) {
      showToast(`Erro ao excluir endosso: ${data.error ?? 'falha desconhecida'}`, 'error')
      return
    }
    showToast('Endosso excluído.', 'success')
    router.refresh()
  }

  return (
    <>
      {ToastComponent}
      <tr className={`border-b border-outline-variant/20 hover:bg-surface-container-low ${zebra}`}>
        <td className="px-1.5 py-3">
          {temEndosso && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              title={expanded ? 'Ocultar endossos' : 'Ver endossos desta apólice'}
              className="w-6 h-6 flex items-center justify-center rounded-full border border-primary text-primary hover:bg-primary/10"
            >
              {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <span className="text-sm leading-none font-bold">+</span>}
            </button>
          )}
        </td>
        <td className="px-2 py-3">
          <Link href={`/apolices/${a.id}`} className="text-body-sm font-medium text-secondary hover:underline">
            {a.numero_apolice}
          </Link>
        </td>
        <td className="px-2 py-3 text-body-sm text-on-surface">{a.cliente?.segurado}</td>
        <td className="px-1.5 py-3 text-body-sm text-on-surface-variant">{a.data_emissao ? formatDate(a.data_emissao) : '—'}</td>
        <td className="px-1.5 py-3 text-body-sm text-on-surface-variant">{formatDate(a.data_inicio)}</td>
        <td className="px-1.5 py-3 text-body-sm text-on-surface-variant">{a.tipo_seguro}</td>
        <td className="px-1.5 py-3 text-body-sm text-on-surface-variant">{a.seguradora?.nome}</td>
        <td className="px-1.5 py-3 text-body-sm text-on-surface">{formatCurrency(a.premio_liquido)}</td>
        <td className="px-1.5 py-3 text-body-sm text-on-surface">{formatCurrency(a.premio_total)}</td>
        <td className="px-1.5 py-3 text-body-sm text-on-surface">{formatDate(a.data_fim)}</td>
        <td className="px-1.5 py-3">{statusBadge}</td>
        <td className="px-1.5 py-3 text-right">
          <div className="flex items-center justify-end gap-1">
            {a.pdf_url && (
              <a
                href={a.pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                title="Baixar PDF da apólice"
                className="p-1.5 rounded border border-outline-variant bg-card hover:bg-surface-container text-on-surface-variant hover:text-on-surface"
              >
                <Download className="w-4 h-4" />
              </a>
            )}
            {documentos.length > 0 && <DocumentosButton documentos={documentos} />}
            <EndossoButton apoliceId={a.id} numeroApolice={a.numero_apolice} />
            <DeleteApoliceButton
              id={a.id}
              numeroApolice={a.numero_apolice}
              clienteNome={a.cliente?.segurado ?? ''}
              isUltimaApoliceDoCliente={isUltimaApoliceDoCliente}
            />
          </div>
        </td>
      </tr>
      {expanded && temEndosso && (
        <tr className={`border-b border-outline-variant/20 ${zebra}`}>
          <td colSpan={12} className="px-4 py-3 bg-surface-container-low/60">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-outline-variant/30">
                    <th className="label-caps text-on-surface-variant text-left px-2 py-2">Apólice</th>
                    <th className="label-caps text-on-surface-variant text-left px-2 py-2">Endosso</th>
                    <th className="label-caps text-on-surface-variant text-left px-2 py-2">Tipo de Endosso</th>
                    <th className="label-caps text-on-surface-variant text-left px-2 py-2">Segurado</th>
                    <th className="label-caps text-on-surface-variant text-left px-2 py-2">Data Emissão</th>
                    <th className="label-caps text-on-surface-variant text-left px-2 py-2">Início Vigência</th>
                    <th className="label-caps text-on-surface-variant text-left px-2 py-2">Fim Vigência</th>
                    <th className="label-caps text-on-surface-variant text-left px-2 py-2">Veículo</th>
                    <th className="label-caps text-on-surface-variant text-left px-2 py-2">Ano</th>
                    <th className="label-caps text-on-surface-variant text-left px-2 py-2">Modelo</th>
                    <th className="label-caps text-on-surface-variant text-left px-2 py-2">Placa</th>
                    <th className="label-caps text-on-surface-variant text-left px-2 py-2">Chassi</th>
                    <th className="label-caps text-on-surface-variant text-right px-2 py-2">PDF</th>
                    <th className="label-caps text-on-surface-variant text-right px-2 py-2">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {endossos.map((e) => (
                    <tr key={e.id} className="border-b border-outline-variant/10 last:border-0">
                      <td className="px-2 py-2 text-body-sm text-on-surface">{a.numero_apolice}</td>
                      <td className="px-2 py-2 text-body-sm font-medium text-on-surface">{e.numero_endosso}</td>
                      <td className="px-2 py-2 text-body-sm text-on-surface-variant">{e.tipo_endosso || '—'}</td>
                      <td className="px-2 py-2 text-body-sm text-on-surface-variant">{e.segurado || '—'}</td>
                      <td className="px-2 py-2 text-body-sm text-on-surface-variant">{e.data_emissao ? formatDate(e.data_emissao) : '—'}</td>
                      <td className="px-2 py-2 text-body-sm text-on-surface-variant">{e.data_inicio ? formatDate(e.data_inicio) : '—'}</td>
                      <td className="px-2 py-2 text-body-sm text-on-surface-variant">{e.data_fim ? formatDate(e.data_fim) : '—'}</td>
                      <td className="px-2 py-2 text-body-sm text-on-surface-variant">{e.veiculo || '—'}</td>
                      <td className="px-2 py-2 text-body-sm text-on-surface-variant">{e.ano || '—'}</td>
                      <td className="px-2 py-2 text-body-sm text-on-surface-variant">{e.modelo || '—'}</td>
                      <td className="px-2 py-2 text-body-sm text-on-surface-variant">{e.placa || '—'}</td>
                      <td className="px-2 py-2 text-body-sm text-on-surface-variant">{e.chassi || '—'}</td>
                      <td className="px-2 py-2 text-right">
                        {e.pdf_url ? (
                          <a
                            href={e.pdf_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Baixar PDF do endosso"
                            className="inline-flex p-1.5 rounded border border-outline-variant bg-card hover:bg-surface-container text-on-surface-variant hover:text-on-surface"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        ) : '—'}
                      </td>
                      <td className="px-2 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => handleExcluirEndosso(e)}
                          disabled={excluindoId === e.id}
                          title="Excluir endosso"
                          className="p-1.5 rounded hover:bg-error/10 text-on-surface-variant hover:text-error disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}
