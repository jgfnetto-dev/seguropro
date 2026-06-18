'use client'
import { useState } from 'react'
import { ChevronDown, Download } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { formatDate, formatCurrency, formatCpfCnpj } from '@/lib/utils'
import type { HistoricoRenovacao } from '@/types'

interface Props {
  registro: HistoricoRenovacao
  index: number
}

export function HistoricoRow({ registro: h, index }: Props) {
  const [expanded, setExpanded] = useState(false)
  const zebra = index % 2 === 0 ? '' : 'bg-surface-container-low/40'
  const temDetalhes = h.conciliacoes.length > 0 || h.endossos.length > 0 || h.status_renovacoes.length > 0

  return (
    <>
      <tr className={`border-b border-outline-variant/20 hover:bg-surface-container-low ${zebra}`}>
        <td className="px-2 py-3">
          {temDetalhes && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              title={expanded ? 'Ocultar detalhes' : 'Ver detalhes'}
              className="w-6 h-6 flex items-center justify-center rounded-full border border-primary text-primary hover:bg-primary/10"
            >
              {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <span className="text-sm leading-none font-bold">+</span>}
            </button>
          )}
        </td>
        <td className="px-3 py-3 text-body-sm font-medium text-on-surface">{h.numero_apolice}</td>
        <td className="px-3 py-3 text-body-sm text-on-surface">{h.cliente?.segurado}</td>
        <td className="px-2 py-3 text-body-sm text-on-surface-variant">{h.cliente?.cpf_cnpj ? formatCpfCnpj(h.cliente.cpf_cnpj) : '—'}</td>
        <td className="px-2 py-3 text-body-sm text-on-surface-variant">{h.seguradora?.nome ?? '—'}</td>
        <td className="px-2 py-3 text-body-sm text-on-surface-variant">{h.apolice?.tipo_seguro}</td>
        <td className="px-2 py-3 text-body-sm text-on-surface-variant">{h.apolice?.data_fim ? formatDate(h.apolice.data_fim) : '—'}</td>
        <td className="px-2 py-3">
          <Badge variant={h.status_final === 'Renovada' ? 'success' : 'destructive'} className="text-xs">{h.status_final}</Badge>
        </td>
        <td className="px-2 py-3 text-body-sm text-on-surface-variant">{formatDate(h.arquivado_em.split('T')[0])}</td>
        <td className="px-2 py-3 text-right">
          {h.apolice?.pdf_url && (
            <a
              href={h.apolice.pdf_url}
              target="_blank"
              rel="noopener noreferrer"
              title="Baixar PDF da apólice"
              className="inline-flex p-1.5 rounded border border-outline-variant bg-card hover:bg-surface-container text-on-surface-variant hover:text-on-surface"
            >
              <Download className="w-4 h-4" />
            </a>
          )}
        </td>
      </tr>
      {expanded && temDetalhes && (
        <tr className={`border-b border-outline-variant/20 ${zebra}`}>
          <td colSpan={10} className="px-4 py-3 bg-surface-container-low/60">
            <div className="space-y-4">
              {h.status_renovacoes.length > 0 && (
                <div>
                  <p className="label-caps text-on-surface-variant mb-2">Histórico de Status</p>
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-outline-variant/30">
                        <th className="label-caps text-on-surface-variant text-left px-2 py-1">Data</th>
                        <th className="label-caps text-on-surface-variant text-left px-2 py-1">Status</th>
                        <th className="label-caps text-on-surface-variant text-left px-2 py-1">Observação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {h.status_renovacoes.map((s) => (
                        <tr key={s.id} className="border-b border-outline-variant/10 last:border-0">
                          <td className="px-2 py-1 text-body-sm text-on-surface">{formatDate(s.data)}</td>
                          <td className="px-2 py-1 text-body-sm text-on-surface-variant">{s.status}</td>
                          <td className="px-2 py-1 text-body-sm text-on-surface-variant">{s.observacao || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {h.conciliacoes.length > 0 && (
                <div>
                  <p className="label-caps text-on-surface-variant mb-2">Conciliações</p>
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-outline-variant/30">
                        <th className="label-caps text-on-surface-variant text-left px-2 py-1">Data</th>
                        <th className="label-caps text-on-surface-variant text-left px-2 py-1">Valor Conciliado</th>
                        <th className="label-caps text-on-surface-variant text-left px-2 py-1">Comentário</th>
                      </tr>
                    </thead>
                    <tbody>
                      {h.conciliacoes.map((c) => (
                        <tr key={c.id} className="border-b border-outline-variant/10 last:border-0">
                          <td className="px-2 py-1 text-body-sm text-on-surface">{formatDate(c.data_conciliacao)}</td>
                          <td className="px-2 py-1 text-body-sm text-on-surface">{formatCurrency(c.valor_conciliar)}</td>
                          <td className="px-2 py-1 text-body-sm text-on-surface-variant">{c.comentario || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {h.endossos.length > 0 && (
                <div>
                  <p className="label-caps text-on-surface-variant mb-2">Endossos</p>
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-outline-variant/30">
                        <th className="label-caps text-on-surface-variant text-left px-2 py-1">Endosso</th>
                        <th className="label-caps text-on-surface-variant text-left px-2 py-1">Tipo</th>
                        <th className="label-caps text-on-surface-variant text-left px-2 py-1">Emissão</th>
                        <th className="label-caps text-on-surface-variant text-left px-2 py-1">Início</th>
                        <th className="label-caps text-on-surface-variant text-left px-2 py-1">Fim</th>
                        <th className="label-caps text-on-surface-variant text-right px-2 py-1">PDF</th>
                      </tr>
                    </thead>
                    <tbody>
                      {h.endossos.map((e) => (
                        <tr key={e.id} className="border-b border-outline-variant/10 last:border-0">
                          <td className="px-2 py-1 text-body-sm font-medium text-on-surface">{e.numero_endosso}</td>
                          <td className="px-2 py-1 text-body-sm text-on-surface-variant">{e.tipo_endosso || '—'}</td>
                          <td className="px-2 py-1 text-body-sm text-on-surface-variant">{e.data_emissao ? formatDate(e.data_emissao) : '—'}</td>
                          <td className="px-2 py-1 text-body-sm text-on-surface-variant">{e.data_inicio ? formatDate(e.data_inicio) : '—'}</td>
                          <td className="px-2 py-1 text-body-sm text-on-surface-variant">{e.data_fim ? formatDate(e.data_fim) : '—'}</td>
                          <td className="px-2 py-1 text-right">
                            {e.pdf_url ? (
                              <a
                                href={e.pdf_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Baixar PDF do endosso"
                                className="inline-flex p-1 rounded border border-outline-variant bg-card hover:bg-surface-container text-on-surface-variant hover:text-on-surface"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </a>
                            ) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}
