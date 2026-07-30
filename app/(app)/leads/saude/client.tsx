'use client'

import { useState } from 'react'
import { Heart, Copy, CheckCircle, Link2, ChevronDown, ChevronUp, User, Phone, Mail, MapPin, Calendar, Trash2, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface Lead {
  id: string
  cpf: string
  nome: string
  data_nascimento: string | null
  celular: string
  email: string | null
  tem_plano: string | null
  plano_vigente: string | null
  tempo_plano: string | null
  tipo_contratacao: string | null
  preferencia_hospital: string | null
  em_tratamento: string | null
  descricao_tratamento: string | null
  incluir_dependentes: string | null
  criado_em: string
}

interface Props {
  corretoraId: string
  leads: Lead[]
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function formatDateBR(iso: string | null) {
  if (!iso) return null
  return new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR')
}

function simNao(v: string | null) {
  if (v === 'S') return 'Sim'
  if (v === 'N') return 'Não'
  return null
}

function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null
  return (
    <div className="flex justify-between gap-4 py-1.5 border-b border-outline-variant/20 last:border-0">
      <span className="text-body-sm text-on-surface-variant shrink-0">{label}</span>
      <span className="text-body-sm text-on-surface text-right">{value}</span>
    </div>
  )
}

function LeadCard({ lead, onDelete }: { lead: Lead; onDelete: (id: string) => void }) {
  const [open, setOpen] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/leads/saude/${lead.id}`, { method: 'DELETE' })
      if (res.ok) onDelete(lead.id)
    } finally {
      setDeleting(false)
      setConfirming(false)
    }
  }

  return (
    <Card>
      <CardContent className="pt-4 pb-3">
        <button
          onClick={() => setOpen((o) => !o)}
          className="w-full flex items-start justify-between gap-3 text-left"
        >
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-secondary flex-shrink-0" />
              <span className="text-body-sm font-semibold text-on-surface">{lead.nome}</span>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-0.5 pl-6">
              <span className="text-xs text-on-surface-variant flex items-center gap-1">
                <Phone className="w-3 h-3" /> {lead.celular}
              </span>
              {lead.email && (
                <span className="text-xs text-on-surface-variant flex items-center gap-1">
                  <Mail className="w-3 h-3" /> {lead.email}
                </span>
              )}
              {lead.tem_plano && (
                <span className="text-xs text-on-surface-variant flex items-center gap-1">
                  <Heart className="w-3 h-3" /> Plano atual: {simNao(lead.tem_plano)}
                </span>
              )}
            </div>
            <div className="pl-6">
              <span className="text-xs text-on-surface-variant flex items-center gap-1">
                <Calendar className="w-3 h-3" /> {formatDate(lead.criado_em)}
              </span>
            </div>
          </div>
          {open ? (
            <ChevronUp className="w-4 h-4 text-on-surface-variant flex-shrink-0 mt-0.5" />
          ) : (
            <ChevronDown className="w-4 h-4 text-on-surface-variant flex-shrink-0 mt-0.5" />
          )}
        </button>

        {open && (
          <div className="mt-4 pt-4 border-t border-outline-variant/30 space-y-0">
            <p className="label-caps text-on-surface-variant mb-2">Dados pessoais</p>
            <DetailRow label="CPF" value={lead.cpf} />
            <DetailRow label="Data de nascimento" value={formatDateBR(lead.data_nascimento)} />
            <DetailRow label="Celular" value={lead.celular} />
            <DetailRow label="E-mail" value={lead.email} />

            <p className="label-caps text-on-surface-variant mt-4 mb-2">Plano de saúde atual</p>
            <DetailRow label="Possui plano" value={simNao(lead.tem_plano)} />
            <DetailRow label="Plano vigente" value={lead.plano_vigente} />
            <DetailRow label="Tempo no plano" value={lead.tempo_plano} />
            <DetailRow label="Tipo de contratação" value={lead.tipo_contratacao} />

            <p className="label-caps text-on-surface-variant mt-4 mb-2">Preferências e saúde</p>
            <DetailRow label="Preferência hospital" value={lead.preferencia_hospital} />
            <DetailRow label="Em tratamento" value={simNao(lead.em_tratamento)} />
            <DetailRow label="Descrição tratamento" value={lead.descricao_tratamento} />
            <DetailRow label="Incluir dependentes" value={simNao(lead.incluir_dependentes)} />

            <div className="mt-5 pt-4 border-t border-outline-variant/20">
              {confirming ? (
                <div className="flex items-center gap-2">
                  <span className="text-body-sm text-error flex-1">Excluir este lead?</span>
                  <button
                    onClick={() => setConfirming(false)}
                    className="px-3 py-1.5 rounded text-body-sm text-on-surface-variant border border-outline-variant/40 hover:bg-surface-container"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="px-3 py-1.5 rounded text-body-sm text-white bg-error hover:bg-error/90 disabled:opacity-60 flex items-center gap-1.5"
                  >
                    {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                    Excluir
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirming(true)}
                  className="flex items-center gap-2 text-body-sm text-error hover:text-error/80 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Excluir lead
                </button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function LeadsSaudeClient({ corretoraId, leads: initialLeads }: Props) {
  const [leads, setLeads] = useState(initialLeads)
  const [copied, setCopied] = useState(false)

  function handleDelete(id: string) {
    setLeads((prev) => prev.filter((l) => l.id !== id))
  }

  const link = typeof window !== 'undefined'
    ? `${window.location.origin}/cotacao/saude/${corretoraId}`
    : `/cotacao/saude/${corretoraId}`

  function handleCopy() {
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Heart className="w-5 h-5 text-primary" />
          <h1 className="text-h1 text-on-surface">Leads — Plano de Saúde</h1>
        </div>
        <p className="text-body-sm text-on-surface-variant">
          Clientes que preencheram o formulário de adesão a plano de saúde.
        </p>
      </div>

      {/* Link de cotação */}
      <Card>
        <CardContent className="pt-5 space-y-3">
          <div className="flex items-center gap-2">
            <Link2 className="w-4 h-4 text-secondary" />
            <h3 className="text-h3 text-on-surface">Link de cotação</h3>
          </div>
          <p className="text-body-sm text-on-surface-variant">
            Envie este link para seus clientes preencherem os dados para adesão ao plano de saúde.
          </p>
          <div className="flex items-center gap-2 bg-surface-container rounded-lg px-3 py-2 border border-outline-variant/30">
            <Link2 className="w-4 h-4 text-on-surface-variant flex-shrink-0" />
            <span className="text-xs text-on-surface-variant flex-1 font-mono truncate">
              {link}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-secondary/40 text-secondary text-body-sm font-medium hover:bg-secondary/5 transition-colors"
            >
              {copied ? <><CheckCircle className="w-4 h-4" />Link copiado!</> : <><Copy className="w-4 h-4" />Copiar link</>}
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de leads */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-h2 text-on-surface">
            Leads recebidos
            <span className="ml-2 text-body-sm font-normal text-on-surface-variant">({leads.length})</span>
          </h2>
        </div>

        {leads.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center space-y-2">
              <MapPin className="w-8 h-8 text-on-surface-variant mx-auto opacity-40" />
              <p className="text-body-sm text-on-surface-variant">
                Nenhum lead recebido ainda. Compartilhe o link acima com seus clientes.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {leads.map((lead) => (
              <LeadCard key={lead.id} lead={lead} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
