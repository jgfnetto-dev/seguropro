'use client'

import { useState } from 'react'
import { CheckCircle, Heart, AlertCircle, Loader2 } from 'lucide-react'

interface Props {
  corretoraId: string
  nomeCorretora: string
}

type FormData = {
  cpf: string
  nome: string
  dataNascimento: string
  celular: string
  email: string
  temPlano: string
  planoVigente: string
  tempoPlano: string
  tipoContratacao: string
  preferenciaHospital: string
  emTratamento: string
  descricaoTratamento: string
  incluirDependentes: string
}

const INITIAL: FormData = {
  cpf: '', nome: '', dataNascimento: '', celular: '', email: '',
  temPlano: '', planoVigente: '', tempoPlano: '', tipoContratacao: '',
  preferenciaHospital: '', emTratamento: '', descricaoTratamento: '',
  incluirDependentes: '',
}

function field(form: FormData, set: (f: FormData) => void) {
  return (key: keyof FormData) => (value: string) => set({ ...form, [key]: value })
}

function cpfMask(v: string) {
  return v.replace(/\D/g, '').slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

function celularMask(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2) return d
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

interface RadioGroupProps {
  label: string
  name: string
  options: { value: string; label: string }[]
  value: string
  onChange: (v: string) => void
  required?: boolean
}

function RadioGroup({ label, name, options, value, onChange, required }: RadioGroupProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-gray-700">
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <label
            key={opt.value}
            className={`flex-shrink-0 py-2 px-4 rounded-full border text-sm cursor-pointer transition-all select-none ${
              value === opt.value
                ? 'bg-emerald-600 text-white border-emerald-600 font-medium shadow-sm'
                : 'border-gray-300 text-gray-600 hover:border-emerald-400 hover:text-emerald-600 bg-white'
            }`}
          >
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={value === opt.value}
              onChange={() => onChange(opt.value)}
              required={required && !value}
              className="sr-only"
            />
            {opt.label}
          </label>
        ))}
      </div>
    </div>
  )
}

function Section({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 bg-gray-50 border-b border-gray-100">
        <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
          {number}
        </div>
        <h2 className="font-semibold text-gray-800 text-base">{title}</h2>
      </div>
      <div className="p-5 space-y-5">{children}</div>
    </div>
  )
}

function InputField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-gray-700 block">
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
    </div>
  )
}

const inputCls = "w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all"

export function CotacaoSaudeForm({ corretoraId, nomeCorretora }: Props) {
  const [form, setForm] = useState<FormData>(INITIAL)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = field(form, setForm)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/leads/saude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ corretoraId, ...form }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erro ao enviar.')
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-lg p-8 max-w-sm w-full text-center space-y-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-9 h-9 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Dados enviados!</h2>
          <p className="text-gray-500 text-sm leading-relaxed">
            Recebemos suas informações. Em breve a corretora <strong>{nomeCorretora}</strong> entrará
            em contato com a sua cotação de plano de saúde.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
      {/* Header */}
      <div className="bg-emerald-600 px-5 py-8 text-white">
        <div className="max-w-lg mx-auto flex items-start gap-4">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
            <Heart className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold leading-tight">Adesão a Plano de Saúde</h1>
            <p className="text-emerald-100 text-sm mt-1">{nomeCorretora}</p>
            <p className="text-emerald-200 text-xs mt-2">
              Preencha os dados abaixo para receber sua cotação personalizada.
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="max-w-lg mx-auto p-4 pb-10 space-y-4">

        {/* 1. Dados pessoais */}
        <Section number={1} title="Dados Pessoais">
          <InputField label="CPF" required>
            <input
              className={inputCls}
              placeholder="000.000.000-00"
              value={form.cpf}
              onChange={(e) => set('cpf')(cpfMask(e.target.value))}
              required
              inputMode="numeric"
            />
          </InputField>
          <InputField label="Nome completo" required>
            <input
              className={inputCls}
              placeholder="Digite seu nome completo"
              value={form.nome}
              onChange={(e) => set('nome')(e.target.value)}
              required
            />
          </InputField>
          <InputField label="Data de nascimento" required>
            <input
              className={inputCls}
              type="date"
              value={form.dataNascimento}
              onChange={(e) => set('dataNascimento')(e.target.value)}
              required
            />
          </InputField>
          <InputField label="Celular" required>
            <input
              className={inputCls}
              placeholder="(11) 99999-9999"
              value={form.celular}
              onChange={(e) => set('celular')(celularMask(e.target.value))}
              required
              inputMode="numeric"
            />
          </InputField>
          <InputField label="E-mail">
            <input
              className={inputCls}
              type="email"
              placeholder="seu@email.com"
              value={form.email}
              onChange={(e) => set('email')(e.target.value)}
            />
          </InputField>
        </Section>

        {/* 2. Plano atual */}
        <Section number={2} title="Plano de Saúde Atual">
          <RadioGroup
            label="Já possui plano de saúde?"
            name="temPlano"
            options={[
              { value: 'S', label: 'Sim' },
              { value: 'N', label: 'Não' },
            ]}
            value={form.temPlano}
            onChange={(v) => setForm(prev => ({
              ...prev,
              temPlano: v,
              planoVigente: v === 'N' ? '' : prev.planoVigente,
              tempoPlano: v === 'N' ? '' : prev.tempoPlano,
              tipoContratacao: v === 'N' ? '' : prev.tipoContratacao,
            }))}
            required
          />
          {form.temPlano === 'S' && (
            <>
              <InputField label="Qual o plano vigente?" required>
                <input
                  className={inputCls}
                  placeholder="Ex: Unimed, Amil, SulAmérica..."
                  value={form.planoVigente}
                  onChange={(e) => set('planoVigente')(e.target.value)}
                  required
                />
              </InputField>
              <InputField label="Há quanto tempo possui esse plano?" required>
                <input
                  className={inputCls}
                  placeholder="Ex: 2 anos, 18 meses..."
                  value={form.tempoPlano}
                  onChange={(e) => set('tempoPlano')(e.target.value)}
                  required
                />
              </InputField>
              <RadioGroup
                label="Tipo de contratação atual?"
                name="tipoContratacao"
                options={[
                  { value: 'Adesão', label: 'Adesão' },
                  { value: 'PF', label: 'Pessoa Física (PF)' },
                  { value: 'CNPJ', label: 'Pessoa Jurídica (CNPJ)' },
                ]}
                value={form.tipoContratacao}
                onChange={set('tipoContratacao')}
                required
              />
            </>
          )}
        </Section>

        {/* 3. Preferências */}
        <Section number={3} title="Preferências e Saúde">
          <InputField label="Tem preferência por algum hospital?">
            <input
              className={inputCls}
              placeholder="Ex: Hospital Albert Einstein, Hospital das Clínicas..."
              value={form.preferenciaHospital}
              onChange={(e) => set('preferenciaHospital')(e.target.value)}
            />
          </InputField>
          <RadioGroup
            label="Está passando por algum tratamento clínico ou terapêutico?"
            name="emTratamento"
            options={[
              { value: 'S', label: 'Sim' },
              { value: 'N', label: 'Não' },
            ]}
            value={form.emTratamento}
            onChange={(v) => setForm(prev => ({
              ...prev,
              emTratamento: v,
              descricaoTratamento: v === 'N' ? '' : prev.descricaoTratamento,
            }))}
            required
          />
          {form.emTratamento === 'S' && (
            <InputField label="Descreva o tratamento" required>
              <textarea
                className={`${inputCls} resize-none`}
                rows={3}
                placeholder="Descreva brevemente o tratamento em andamento..."
                value={form.descricaoTratamento}
                onChange={(e) => set('descricaoTratamento')(e.target.value)}
                required
              />
            </InputField>
          )}
        </Section>

        {/* 4. Dependentes */}
        <Section number={4} title="Dependentes">
          <RadioGroup
            label="Deseja incluir dependentes no novo plano?"
            name="incluirDependentes"
            options={[
              { value: 'S', label: 'Sim' },
              { value: 'N', label: 'Não' },
            ]}
            value={form.incluirDependentes}
            onChange={set('incluirDependentes')}
            required
          />
        </Section>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold py-4 rounded-2xl text-base transition-colors flex items-center justify-center gap-2 shadow-md shadow-emerald-200"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Enviando…
            </>
          ) : (
            'Enviar dados para cotação'
          )}
        </button>

        <p className="text-center text-xs text-gray-400 pb-2">
          Seus dados são tratados com sigilo e usados apenas para a cotação do plano de saúde.
        </p>
      </form>
    </div>
  )
}
