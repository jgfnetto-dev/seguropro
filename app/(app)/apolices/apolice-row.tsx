'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Download, ChevronDown } from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils'
import { DeleteApoliceButton } from './delete-button'
import { EndossoButton } from './endosso-button'

interface Endosso {
  id: string
  numero_endosso: string
  tipo_endosso?: string | null
  segurado?: string | null
  data_emissao?: string | null
  data_inicio?: string | null
  data_fim?: string | null
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
  vendedor?: string | null
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
  statusBadge: React.ReactNode
}

export function ApoliceRow({ apolice: a, index, isUltimaApoliceDoCliente, endossos, statusBadge }: Props) {
  const [expanded, setExpanded] = useState(false)
  const temEndosso = endossos.length > 0
  const zebra = index % 2 === 0 ? '' : 'bg-surface-container-low/40'

  return (
    <>
      <tr className={`border-b border-outline-variant/20 hover:bg-surface-container-low ${zebra}`}>
        <td className="px-2 py-3">
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
        <td className="px-3 py-3">
          <Link href={`/apolices/${a.id}`} className="text-body-sm font-medium text-secondary hover:underline">
            {a.numero_apolice}
          </Link>
        </td>
        <td className="px-3 py-3 text-body-sm text-on-surface">{a.cliente?.segurado}</td>
        <td className="px-2 py-3 text-body-sm text-on-surface-variant">{a.data_emissao ? formatDate(a.data_emissao) : '—'}</td>
        <td className="px-2 py-3 text-body-sm text-on-surface-variant">{formatDate(a.data_inicio)}</td>
        <td className="px-2 py-3 text-body-sm text-on-surface-variant">{a.tipo_seguro}</td>
        <td className="px-2 py-3 text-body-sm text-on-surface-variant">{a.seguradora?.nome}</td>
        <td className="px-2 py-3 text-body-sm text-on-surface-variant">{a.vendedor || '—'}</td>
        <td className="px-2 py-3 text-body-sm text-on-surface">{formatCurrency(a.premio_liquido)}</td>
        <td className="px-2 py-3 text-body-sm text-on-surface">{formatCurrency(a.premio_total)}</td>
        <td className="px-2 py-3 text-body-sm text-on-surface">{formatDate(a.data_fim)}</td>
        <td className="px-2 py-3">{statusBadge}</td>
        <td className="px-2 py-3 text-right">
          <div className="flex items-center justify-end gap-2">
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
          <td colSpan={13} className="px-4 py-3 bg-surface-container-low/60">
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
                  <th className="label-caps text-on-surface-variant text-right px-2 py-2">PDF</th>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </td>
        </tr>
      )}
    </>
  )
}
