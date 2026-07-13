'use client'

import { useState } from 'react'
import { Car, Copy, CheckCircle, Link2, ChevronDown, ChevronUp, User, Phone, Mail, MapPin, Calendar } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface Lead {
  id: string
  nome: string
  cpf: string
  email: string | null
  celular: string
  placa_chassi: string | null
  cep_pernoite: string | null
  endereco_completo: string | null
  estado_civil: string | null
  tipo_residencia: string | null
  tem_garagem: string | null
  tipo_portao: string | null
  usa_trabalho: string | null
  estacionamento_trabalho: string | null
  usa_estudo: string | null
  estacionamento_estudo: string | null
  uso_veiculo: string | null
  condutor_e_segurado: string | null
  condutor_cpf: string | null
  condutor_nascimento: string | null
  residente_18_25: string | null
  residente_usa_veiculo: string | null
  km_mensal: string | null
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

function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null
  return (
    <div className="flex justify-between gap-4 py-1.5 border-b border-outline-variant/20 last:border-0">
      <span className="text-body-sm text-on-surface-variant shrink-0">{label}</span>
      <span className="text-body-sm text-on-surface text-right">{value}</span>
    </div>
  )
}

function LeadCard({ lead }: { lead: Lead }) {
  const [open, setOpen] = useState(false)

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
              {lead.placa_chassi && (
                <span className="text-xs text-on-surface-variant flex items-center gap-1">
                  <Car className="w-3 h-3" /> {lead.placa_chassi}
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
            <DetailRow label="E-mail" value={lead.email} />
            <DetailRow label="Celular" value={lead.celular} />
            <DetailRow label="Estado civil" value={lead.estado_civil} />

            <p className="label-caps text-on-surface-variant mt-4 mb-2">Veículo e residência</p>
            <DetailRow label="Placa / Chassi" value={lead.placa_chassi} />
            <DetailRow label="CEP pernoite" value={lead.cep_pernoite} />
            <DetailRow label="Endereço" value={lead.endereco_completo} />
            <DetailRow label="Tipo residência" value={lead.tipo_residencia} />
            <DetailRow label="Garagem" value={lead.tem_garagem === 'S' ? 'Sim' : lead.tem_garagem === 'N' ? 'Não' : null} />
            <DetailRow label="Portão" value={lead.tipo_portao} />

            <p className="label-caps text-on-surface-variant mt-4 mb-2">Condutor principal</p>
            <DetailRow label="Condutor é o segurado" value={lead.condutor_e_segurado === 'S' ? 'Sim' : lead.condutor_e_segurado === 'N' ? 'Não' : null} />
            <DetailRow label="CPF do condutor" value={lead.condutor_cpf} />
            <DetailRow label="Nascimento do condutor" value={lead.condutor_nascimento ? new Date(lead.condutor_nascimento + 'T12:00:00').toLocaleDateString('pt-BR') : null} />

            <p className="label-caps text-on-surface-variant mt-4 mb-2">Uso do veículo</p>
            <DetailRow label="Uso" value={lead.uso_veiculo} />
            <DetailRow label="Vai ao trabalho" value={lead.usa_trabalho === 'S' ? 'Sim' : lead.usa_trabalho === 'N' ? 'Não' : null} />
            <DetailRow label="Estac. trabalho" value={lead.estacionamento_trabalho} />
            <DetailRow label="Vai estudar" value={lead.usa_estudo === 'S' ? 'Sim' : lead.usa_estudo === 'N' ? 'Não' : null} />
            <DetailRow label="Estac. estudo" value={lead.estacionamento_estudo} />
            <DetailRow label="KM mensal" value={lead.km_mensal} />

            <p className="label-caps text-on-surface-variant mt-4 mb-2">Condutor adicional</p>
            <DetailRow label="Reside 18-25 anos" value={lead.residente_18_25 === 'S' ? 'Sim' : lead.residente_18_25 === 'N' ? 'Não' : null} />
            <DetailRow label="Utiliza veículo" value={lead.residente_usa_veiculo === 'S' ? 'Sim' : lead.residente_usa_veiculo === 'N' ? 'Não' : null} />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function LeadsAutoClient({ corretoraId, leads }: Props) {
  const [copied, setCopied] = useState(false)
  const link = typeof window !== 'undefined'
    ? `${window.location.origin}/cotacao/auto/${corretoraId}`
    : `/cotacao/auto/${corretoraId}`

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
          <Car className="w-5 h-5 text-primary" />
          <h1 className="text-h1 text-on-surface">Leads — Automóvel</h1>
        </div>
        <p className="text-body-sm text-on-surface-variant">
          Clientes que preencheram o formulário de cotação de seguro auto.
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
            Envie este link para seus clientes preencherem os dados para cotação de automóvel.
          </p>
          <div className="flex items-center gap-2 bg-surface-container rounded-lg px-3 py-2 border border-outline-variant/30">
            <Link2 className="w-4 h-4 text-on-surface-variant flex-shrink-0" />
            <span className="text-xs text-on-surface-variant flex-1 font-mono truncate">
              {link}
            </span>
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-secondary/40 text-secondary text-body-sm font-medium hover:bg-secondary/5 transition-colors"
          >
            {copied ? (
              <>
                <CheckCircle className="w-4 h-4" />
                Link copiado!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copiar link
              </>
            )}
          </button>
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
              <LeadCard key={lead.id} lead={lead} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
