'use client'

import { useState, useCallback } from 'react'
import { FileDown, Calculator, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

const REDUTORES = [0, 10, 15, 20, 25, 30, 35, 40, 45, 50]

interface Params {
  credito: string
  tipo: 'fisica' | 'juridica'
  parcelas: string
  redutor: number
  taxaAdmin: string
  fundoReserva: string
  seguroVida: string
  recursosProprios: string
  recursosCredito: string
  contemplacao: string
}

interface Estimativa {
  creditoLiberado: number
  novaParcela: number
  comPrazoDe: number
  somentePrazo: number | null
}

interface Resultado {
  credito: number
  saldoDevedor: number
  parcelaSemSeguro: number
  seguroPorParcela: number
  parcelaComSeguro: number
  valorParcelaNormal: number
  parcelaComRedutor: number
  economiaMensal: number
  recursosProprios: number
  recursosCredito: number
  representatividadeLance: number | null
  estimativa: Estimativa | null
}

const INITIAL: Params = {
  credito: '',
  tipo: 'fisica',
  parcelas: '',
  redutor: 0,
  taxaAdmin: '',
  fundoReserva: '',
  seguroVida: '',
  recursosProprios: '',
  recursosCredito: '',
  contemplacao: '',
}

function parseNum(s: string) {
  return parseFloat(s.replace(/\./g, '').replace(',', '.')) || 0
}

function calcular(p: Params): Resultado | null {
  const credito = parseNum(p.credito)
  const parcelas = parseInt(p.parcelas) || 0
  const taxaAdmin = parseNum(p.taxaAdmin)
  const fundoReserva = parseNum(p.fundoReserva)
  const seguroVida = parseNum(p.seguroVida)
  if (!credito || !parcelas) return null

  const saldoDevedor = credito * (1 + taxaAdmin / 100 + fundoReserva / 100)
  const parcelaSemSeguro = saldoDevedor / parcelas
  // Seguro mensal = valor fixo sobre o saldo devedor (não dividido por parcelas)
  const seguroPorParcela = p.tipo === 'fisica' ? saldoDevedor * (seguroVida / 100) : 0
  const parcelaComSeguro = parcelaSemSeguro + seguroPorParcela
  const valorParcelaNormal = p.tipo === 'fisica' ? parcelaComSeguro : parcelaSemSeguro
  // Redutor aplica apenas na parcela base; o seguro é somado de volta
  const parcelaComRedutor = p.redutor > 0
    ? parcelaSemSeguro * (1 - p.redutor / 100) + seguroPorParcela
    : valorParcelaNormal
  const economiaMensal = valorParcelaNormal - parcelaComRedutor

  const recursosProprios = parseNum(p.recursosProprios)
  const recursosCredito = parseNum(p.recursosCredito)
  const totalLance = recursosProprios + recursosCredito
  const representatividadeLance = totalLance > 0 && saldoDevedor > 0
    ? (totalLance / saldoDevedor) * 100
    : null

  // ── Estimativa Pós-Contemplação ─────────────────────────────────────
  const contemplacaoNum = parseInt(p.contemplacao) || 0
  let estimativa: Estimativa | null = null

  if (contemplacaoNum > 0 && contemplacaoNum < parcelas) {
    const usaReduzido = p.redutor > 0
    const lance = recursosProprios + recursosCredito

    // Só a parcela base (sem seguro) amortiza o saldo devedor
    const parcelaBaseReduzida = parcelaSemSeguro * (1 - p.redutor / 100)
    const sdReduzido = saldoDevedor - (parcelaBaseReduzida * contemplacaoNum) - lance
    const sdNormal   = saldoDevedor - (parcelaSemSeguro   * contemplacaoNum) - lance

    // Campo 2
    const creditoLiberado = credito - recursosCredito

    const parcelasRestantes = parcelas - contemplacaoNum
    const sdBase = usaReduzido ? sdReduzido : sdNormal

    // Campo 7 — Parcela Teórica PJ
    const parcelaTeóricaPJ = parcelasRestantes > 0 ? sdBase / parcelasRestantes : 0

    // Campo 8 — Novo Seguro (só PF)
    const novoSeguro = p.tipo === 'fisica' ? sdBase * (seguroVida / 100) : 0

    // Campo 9 — Parcela Teórica PF
    const parcelaTeóricaPF = parcelaTeóricaPJ + novoSeguro

    // Campo 3 — Nova Parcela
    const novaParcela = p.tipo === 'juridica' ? parcelaTeóricaPJ : parcelaTeóricaPF

    // Campo 4 — Com Prazo de (= SD/PJ = parcelasRestantes, pois PJ foi calculado assim)
    const comPrazoDe = parcelasRestantes

    // Campos 10 e 11
    const somentePrazoReduzido = parcelaSemSeguro > 0 ? sdReduzido / parcelaSemSeguro : 0
    const somentePrazoNormal   = parcelaSemSeguro > 0 ? sdNormal   / parcelaSemSeguro : 0

    // Campo 12 — Somente Prazo
    let somentePrazo: number | null = null
    if (representatividadeLance && representatividadeLance > 0) {
      const raw = usaReduzido ? somentePrazoReduzido : somentePrazoNormal
      somentePrazo = Math.round(raw)
    }

    estimativa = { creditoLiberado, novaParcela, comPrazoDe, somentePrazo }
  }

  return {
    credito, saldoDevedor, parcelaSemSeguro, seguroPorParcela, parcelaComSeguro,
    valorParcelaNormal, parcelaComRedutor, economiaMensal,
    recursosProprios, recursosCredito, representatividadeLance,
    estimativa,
  }
}

function moeda(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

function Row({ label, value, highlight, green, sub, boldLabel }: {
  label: string; value: string
  highlight?: boolean; green?: boolean; sub?: boolean; boldLabel?: boolean
}) {
  if (highlight) {
    return (
      <div className="flex items-center justify-between px-5 py-4 bg-blue-700 text-white">
        <span className="text-sm font-bold uppercase tracking-wide">{label}</span>
        <span className="text-xl font-bold">{value}</span>
      </div>
    )
  }
  if (green) {
    return (
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 dark:border-slate-700">
        <span className="text-sm text-slate-600 dark:text-slate-400">{label}</span>
        <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{value}</span>
      </div>
    )
  }
  return (
    <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 dark:border-slate-700">
      <span className={`text-sm ${sub ? 'text-slate-500 dark:text-slate-400 pl-3' : 'text-slate-700 dark:text-slate-300'} ${boldLabel ? 'font-semibold' : ''}`}>{label}</span>
      <span className={`text-sm ${sub ? 'text-slate-500 dark:text-slate-400' : 'font-medium text-slate-900 dark:text-slate-100'}`}>{value}</span>
    </div>
  )
}

function SectionLabel({ title }: { title: string }) {
  return (
    <div className="bg-white dark:bg-slate-900 px-5 pt-4 pb-1 border-t border-slate-200 dark:border-slate-700">
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">{title}</p>
    </div>
  )
}

const inputCls = 'w-full h-10 px-3 rounded border border-outline-variant bg-surface-container text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-ring'

export function SimuladorConsorcioClient() {
  const [params, setParams] = useState<Params>(INITIAL)
  const [gerandoPDF, setGerandoPDF] = useState(false)

  const set = useCallback((field: keyof Params, value: string | number) => {
    setParams(prev => ({ ...prev, [field]: value }))
  }, [])

  const resultado = calcular(params)

  async function handleGerarPDF() {
    if (!resultado) return
    setGerandoPDF(true)
    try {
      const res = await fetch('/api/simulador-consorcio/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ params, resultado }),
      })
      if (!res.ok) { alert('Erro ao gerar PDF.'); return }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'simulacao-consorcio.pdf'
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setGerandoPDF(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h1 text-on-surface">Simulador de Consórcio</h1>
          <p className="text-body-sm text-on-surface-variant mt-1">Preencha os parâmetros para visualizar a simulação.</p>
        </div>
        {resultado && (
          <Button onClick={handleGerarPDF} disabled={gerandoPDF} className="gap-2">
            {gerandoPDF ? <><RotateCcw className="w-4 h-4 animate-spin" /> Gerando...</> : <><FileDown className="w-4 h-4" /> Gerar PDF</>}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* ── FORM ─────────────────────────────────────────────────── */}
        <Card className="p-6 space-y-5">
          <h2 className="text-title-md text-on-surface font-semibold flex items-center gap-2">
            <Calculator className="w-5 h-5 text-primary" /> Parâmetros
          </h2>

          <div className="space-y-1.5">
            <label className="text-label-md text-on-surface-variant">Crédito Contratado (R$)</label>
            <input type="text" inputMode="decimal" value={params.credito} onChange={e => set('credito', e.target.value)} placeholder="Ex: 50.000,00" className={inputCls} />
          </div>

          <div className="space-y-1.5">
            <label className="text-label-md text-on-surface-variant">Tipo de Contratação</label>
            <div className="flex gap-3">
              {(['fisica', 'juridica'] as const).map(t => (
                <button key={t} type="button" onClick={() => set('tipo', t)}
                  className={`flex-1 h-10 rounded border text-sm font-medium transition-colors ${params.tipo === t ? 'bg-primary text-on-primary border-primary' : 'border-outline-variant bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}`}>
                  {t === 'fisica' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-label-md text-on-surface-variant">Quantidade de Parcelas</label>
            <input type="number" min="1" max="240" value={params.parcelas} onChange={e => set('parcelas', e.target.value)} placeholder="Ex: 60" className={inputCls} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-label-md text-on-surface-variant">Taxa Administrativa (%)</label>
              <input type="text" inputMode="decimal" value={params.taxaAdmin} onChange={e => set('taxaAdmin', e.target.value)} placeholder="Ex: 21" className={inputCls} />
            </div>
            <div className="space-y-1.5">
              <label className="text-label-md text-on-surface-variant">Fundo de Reserva (%)</label>
              <input type="text" inputMode="decimal" value={params.fundoReserva} onChange={e => set('fundoReserva', e.target.value)} placeholder="Ex: 1" className={inputCls} />
            </div>
          </div>

          {params.tipo === 'fisica' && (
            <div className="space-y-1.5">
              <label className="text-label-md text-on-surface-variant">Seguro de Vida (% sobre saldo devedor)</label>
              <input type="text" inputMode="decimal" value={params.seguroVida} onChange={e => set('seguroVida', e.target.value)} placeholder="Ex: 0,038" className={inputCls} />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-label-md text-on-surface-variant">Redutor do Grupo</label>
            <div className="grid grid-cols-5 gap-2">
              {REDUTORES.map(r => (
                <button key={r} type="button" onClick={() => set('redutor', r)}
                  className={`h-9 rounded border text-sm font-medium transition-colors ${params.redutor === r ? 'bg-primary text-on-primary border-primary' : 'border-outline-variant bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}`}>
                  {r}%
                </button>
              ))}
            </div>
          </div>

          {/* Oferta de Lance */}
          <div className="pt-2 border-t border-outline-variant/40 space-y-4">
            <h3 className="text-label-lg text-on-surface font-semibold">Oferta de Lance</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-label-md text-on-surface-variant">Recursos Próprios (R$)</label>
                <input type="text" inputMode="decimal" value={params.recursosProprios} onChange={e => set('recursosProprios', e.target.value)} placeholder="Ex: 10.000,00" className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <label className="text-label-md text-on-surface-variant">Recurso do Crédito (lance embutido)</label>
                <input type="text" inputMode="decimal" value={params.recursosCredito} onChange={e => set('recursosCredito', e.target.value)} placeholder="Ex: 5.000,00" className={inputCls} />
              </div>
            </div>
          </div>

          {/* Estimativa Pós-Contemplação */}
          <div className="pt-2 border-t border-outline-variant/40 space-y-4">
            <h3 className="text-label-lg text-on-surface font-semibold">Estimativa Pós-Contemplação</h3>
            <div className="space-y-1.5">
              <label className="text-label-md text-on-surface-variant">Contemplação na parcela (nº)</label>
              <input type="number" min="1" value={params.contemplacao} onChange={e => set('contemplacao', e.target.value)} placeholder="Ex: 12" className={inputCls} />
            </div>
          </div>

          <button type="button" onClick={() => setParams(INITIAL)} className="text-body-sm text-on-surface-variant hover:text-on-surface underline">
            Limpar campos
          </button>
        </Card>

        {/* ── RESULT ───────────────────────────────────────────────── */}
        {resultado ? (
          <div className="overflow-hidden rounded-xl shadow-md border border-slate-200 dark:border-slate-700">
            {/* Header */}
            <div className="bg-slate-900 px-5 py-4">
              <p className="text-xs text-slate-400 uppercase tracking-widest">SeguroPro</p>
              <h3 className="text-white font-bold text-lg mt-0.5">Simulação de Consórcio</h3>
            </div>
            <div className="h-1 bg-blue-700" />

            {/* Simulação principal */}
            <div className="bg-white dark:bg-slate-900">
              <Row label="Crédito Contratado" value={moeda(resultado.credito)} />
              <Row label="Tipo de Contratação" value={params.tipo === 'fisica' ? 'Pessoa Física' : 'Pessoa Jurídica'} />
              <Row label="Quantidade de Parcelas" value={`${params.parcelas} meses`} />
              <Row label="Taxa Administrativa" value={`${params.taxaAdmin || '0'}%`} sub />
              <Row label="Fundo de Reserva" value={`${params.fundoReserva || '0'}%`} sub />
              <Row label="Saldo Devedor" value={moeda(resultado.saldoDevedor)} />
              {params.tipo === 'fisica' && resultado.seguroPorParcela > 0 && (
                <Row label="Seguro de Vida (por parcela)" value={moeda(resultado.seguroPorParcela)} sub />
              )}
              <Row label="Redutor do Grupo" value={`${params.redutor}%`} />
              {params.redutor > 0 && (
                <Row label="Economia mensal com redutor" value={moeda(resultado.economiaMensal)} green />
              )}
              <Row label="Valor da Parcela normal" value={moeda(resultado.valorParcelaNormal)} />
            </div>

            <Row label="Valor da Parcela" value={moeda(resultado.parcelaComRedutor)} highlight />

            {/* Oferta de Lance */}
            {resultado.representatividadeLance !== null && (
              <>
                <SectionLabel title="Oferta de Lance" />
                {resultado.recursosProprios > 0 && (
                  <Row label="Recursos Próprios" value={moeda(resultado.recursosProprios)} sub />
                )}
                {resultado.recursosCredito > 0 && (
                  <Row label="Recurso do Crédito (lance embutido)" value={moeda(resultado.recursosCredito)} sub />
                )}
                <div className="flex items-center justify-between px-5 py-4 bg-amber-50 dark:bg-amber-950/30 border-t border-amber-200 dark:border-amber-800">
                  <span className="text-sm font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wide">Representatividade do Lance</span>
                  <span className="text-xl font-bold text-amber-700 dark:text-amber-400">
                    {resultado.representatividadeLance.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
                  </span>
                </div>
              </>
            )}

            {/* Estimativa Pós-Contemplação */}
            {resultado.estimativa && (
              <>
                <SectionLabel title="Estimativa Pós-Contemplação" />
                <Row label="Contemplação na parcela" value={params.contemplacao} sub />
                {/* Crédito Liberado — destaque azul */}
                <div className="flex items-center justify-between px-5 py-3 bg-blue-700 border-b border-blue-600">
                  <span className="text-sm font-bold text-white">Crédito liberado</span>
                  <span className="text-sm font-bold text-white">{moeda(resultado.estimativa.creditoLiberado)}</span>
                </div>
                <Row label="Nova parcela" value={moeda(resultado.estimativa.novaParcela)} />
                <Row label="Com prazo de" value={`${resultado.estimativa.comPrazoDe}`} />
                {resultado.estimativa.somentePrazo !== null && (
                  <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 dark:border-slate-700">
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      Se preferir reduzir <strong>somente o prazo</strong>
                    </span>
                    <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{resultado.estimativa.somentePrazo}</span>
                  </div>
                )}
              </>
            )}

            <div className="bg-white dark:bg-slate-900 px-5 py-3 text-xs text-slate-400 dark:text-slate-500">
              Simulação gerada em {new Date().toLocaleDateString('pt-BR')} — valores sujeitos a aprovação da administradora
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-outline-variant/50 bg-surface-container-low/30 min-h-[320px] gap-3 text-on-surface-variant">
            <Calculator className="w-10 h-10 opacity-30" />
            <p className="text-body-sm">Preencha os parâmetros para ver a simulação</p>
          </div>
        )}
      </div>
    </div>
  )
}
