'use client'

import { useState } from 'react'
import { CheckCircle, Car, AlertCircle, Loader2 } from 'lucide-react'

interface Props {
  corretoraId: string
  nomeCorretora: string
}

type FormData = {
  nome: string
  cpf: string
  email: string
  celular: string
  placaChassi: string
  cepPernoite: string
  enderecoCompleto: string
  estadoCivil: string
  tipoResidencia: string
  temGaragem: string
  tipoPortao: string
  usaTrabalho: string
  estacionamentoTrabalho: string
  usaEstudo: string
  estacionamentoEstudo: string
  usoVeiculo: string
  condutorESegurado: string
  condutorCpf: string
  condutorNascimento: string
  residente1825: string
  residente1825UsaVeiculo: string
  kmMensal: string
}

const INITIAL: FormData = {
  nome: '', cpf: '', email: '', celular: '', placaChassi: '',
  cepPernoite: '', enderecoCompleto: '', estadoCivil: '', tipoResidencia: '',
  temGaragem: '', tipoPortao: '', usaTrabalho: '', estacionamentoTrabalho: '',
  usaEstudo: '', estacionamentoEstudo: '', usoVeiculo: '',
  condutorESegurado: '', condutorCpf: '', condutorNascimento: '',
  residente1825: '', residente1825UsaVeiculo: '', kmMensal: '',
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
  if (d.length <= 6) return `(${d.slice(0,2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`
  return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`
}

function cepMask(v: string) {
  return v.replace(/\D/g, '').slice(0, 8).replace(/(\d{5})(\d)/, '$1-$2')
}

interface RadioGroupProps {
  label: string
  name: string
  options: { value: string; label: string }[]
  value: string
  onChange: (v: string) => void
  required?: boolean
  inline?: boolean
}

function RadioGroup({ label, name, options, value, onChange, required, inline }: RadioGroupProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-gray-700">
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </p>
      <div className={`flex flex-wrap gap-2 ${inline ? '' : 'flex-col sm:flex-row'}`}>
        {options.map((opt) => (
          <label
            key={opt.value}
            className={`flex-shrink-0 py-2 px-4 rounded-full border text-sm cursor-pointer transition-all select-none ${
              value === opt.value
                ? 'bg-blue-600 text-white border-blue-600 font-medium shadow-sm'
                : 'border-gray-300 text-gray-600 hover:border-blue-400 hover:text-blue-600 bg-white'
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
        <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
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

const inputCls = "w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"

export function CotacaoAutoForm({ corretoraId, nomeCorretora }: Props) {
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
      const res = await fetch('/api/leads/auto', {
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-lg p-8 max-w-sm w-full text-center space-y-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-9 h-9 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Dados enviados!</h2>
          <p className="text-gray-500 text-sm leading-relaxed">
            Recebemos suas informações. Em breve a corretora <strong>{nomeCorretora}</strong> entrará
            em contato com a sua cotação de seguro automóvel.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-blue-600 px-5 py-8 text-white">
        <div className="max-w-lg mx-auto flex items-start gap-4">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
            <Car className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold leading-tight">Cotação de Seguro Automóvel</h1>
            <p className="text-blue-100 text-sm mt-1">{nomeCorretora}</p>
            <p className="text-blue-200 text-xs mt-2">
              Preencha os dados abaixo para receber sua cotação personalizada.
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="max-w-lg mx-auto p-4 pb-10 space-y-4">

        {/* 1. Dados pessoais */}
        <Section number={1} title="Dados Pessoais">
          <InputField label="Nome completo" required>
            <input
              className={inputCls}
              placeholder="Digite seu nome completo"
              value={form.nome}
              onChange={(e) => set('nome')(e.target.value)}
              required
            />
          </InputField>
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
          <InputField label="E-mail">
            <input
              className={inputCls}
              type="email"
              placeholder="seu@email.com"
              value={form.email}
              onChange={(e) => set('email')(e.target.value)}
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
        </Section>

        {/* 2. Veículo */}
        <Section number={2} title="Veículo">
          <InputField label="Placa ou Chassi">
            <input
              className={inputCls}
              placeholder="Ex: ABC-1234 ou chassi completo"
              value={form.placaChassi}
              onChange={(e) => set('placaChassi')(e.target.value.toUpperCase())}
            />
          </InputField>
        </Section>

        {/* 3. Residência */}
        <Section number={3} title="Residência e Perfil do Condutor">
          <InputField label="CEP onde o veículo passa a noite">
            <input
              className={inputCls}
              placeholder="00000-000"
              value={form.cepPernoite}
              onChange={(e) => set('cepPernoite')(cepMask(e.target.value))}
              inputMode="numeric"
            />
          </InputField>
          <InputField label="Endereço completo (Rua, número, complemento, CEP)">
            <textarea
              className={`${inputCls} resize-none`}
              rows={2}
              placeholder="Rua das Flores, 123, Apto 45, São Paulo - SP, 01234-567"
              value={form.enderecoCompleto}
              onChange={(e) => set('enderecoCompleto')(e.target.value)}
            />
          </InputField>
          <RadioGroup
            label="Estado civil do condutor"
            name="estadoCivil"
            options={[
              { value: 'Solteiro', label: 'Solteiro(a)' },
              { value: 'Casado', label: 'Casado(a)' },
              { value: 'Viúvo', label: 'Viúvo(a)' },
            ]}
            value={form.estadoCivil}
            onChange={set('estadoCivil')}
            inline
          />
          <RadioGroup
            label="Tipo de residência"
            name="tipoResidencia"
            options={[
              { value: 'Casa', label: 'Casa' },
              { value: 'Apartamento', label: 'Apartamento' },
              { value: 'Condomínio', label: 'Condomínio' },
            ]}
            value={form.tipoResidencia}
            onChange={set('tipoResidencia')}
            inline
          />
          <RadioGroup
            label="Possui garagem na residência?"
            name="temGaragem"
            options={[
              { value: 'S', label: 'Sim' },
              { value: 'N', label: 'Não' },
            ]}
            value={form.temGaragem}
            onChange={(v) => setForm(prev => ({
              ...prev,
              temGaragem: v,
              tipoPortao: v === 'N' ? '' : prev.tipoPortao,
            }))}
            inline
          />
          {form.temGaragem === 'S' && (
            <RadioGroup
              label="Portão da garagem"
              name="tipoPortao"
              options={[
                { value: 'Manual', label: 'Manual' },
                { value: 'Automático', label: 'Automático' },
              ]}
              value={form.tipoPortao}
              onChange={set('tipoPortao')}
              inline
            />
          )}
        </Section>

        {/* 4. Uso do veículo */}
        <Section number={4} title="Uso do Veículo">
          <RadioGroup
            label="Utiliza o veículo para ir ao trabalho?"
            name="usaTrabalho"
            options={[
              { value: 'S', label: 'Sim' },
              { value: 'N', label: 'Não' },
            ]}
            value={form.usaTrabalho}
            onChange={(v) => setForm(prev => ({
              ...prev,
              usaTrabalho: v,
              estacionamentoTrabalho: v === 'N' ? '' : prev.estacionamentoTrabalho,
            }))}
            inline
          />
          {form.usaTrabalho === 'S' && (
            <RadioGroup
              label="No trabalho, o veículo fica"
              name="estacionamentoTrabalho"
              options={[
                { value: 'Rua', label: 'Na rua' },
                { value: 'Estacionamento', label: 'Em estacionamento' },
              ]}
              value={form.estacionamentoTrabalho}
              onChange={set('estacionamentoTrabalho')}
              inline
            />
          )}
          <RadioGroup
            label="Utiliza o veículo para estudar?"
            name="usaEstudo"
            options={[
              { value: 'S', label: 'Sim' },
              { value: 'N', label: 'Não' },
            ]}
            value={form.usaEstudo}
            onChange={(v) => setForm(prev => ({
              ...prev,
              usaEstudo: v,
              estacionamentoEstudo: v === 'N' ? '' : prev.estacionamentoEstudo,
            }))}
            inline
          />
          {form.usaEstudo === 'S' && (
            <RadioGroup
              label="Na escola/faculdade, o veículo fica"
              name="estacionamentoEstudo"
              options={[
                { value: 'Rua', label: 'Na rua' },
                { value: 'Estacionamento', label: 'Em estacionamento' },
              ]}
              value={form.estacionamentoEstudo}
              onChange={set('estacionamentoEstudo')}
              inline
            />
          )}
          <RadioGroup
            label="Uso do veículo"
            name="usoVeiculo"
            options={[
              { value: 'Particular', label: 'Particular' },
              { value: 'Comercial', label: 'Comercial' },
              { value: 'Uber/Similar', label: 'Uber / Similar' },
              { value: 'Táxi', label: 'Táxi' },
            ]}
            value={form.usoVeiculo}
            onChange={set('usoVeiculo')}
            inline
          />
          <RadioGroup
            label="Quilometragem média por mês"
            name="kmMensal"
            options={[
              { value: 'Até 500 km', label: 'Até 500 km' },
              { value: 'Até 1.500 km', label: 'Até 1.500 km' },
              { value: 'Mais de 1.500 km', label: 'Mais de 1.500 km' },
            ]}
            value={form.kmMensal}
            onChange={set('kmMensal')}
          />
        </Section>

        {/* 5. Condutor principal */}
        <Section number={5} title="Condutor Principal">
          <RadioGroup
            label="O condutor principal é o segurado?"
            name="condutorESegurado"
            options={[
              { value: 'S', label: 'Sim' },
              { value: 'N', label: 'Não' },
            ]}
            value={form.condutorESegurado}
            onChange={(v) => setForm(prev => ({
              ...prev,
              condutorESegurado: v,
              condutorCpf: v === 'S' ? '' : prev.condutorCpf,
              condutorNascimento: v === 'S' ? '' : prev.condutorNascimento,
            }))}
            inline
          />
          {form.condutorESegurado === 'N' && (
            <>
              <InputField label="CPF do condutor principal" required>
                <input
                  className={inputCls}
                  placeholder="000.000.000-00"
                  value={form.condutorCpf}
                  onChange={(e) => set('condutorCpf')(cpfMask(e.target.value))}
                  inputMode="numeric"
                  required
                />
              </InputField>
              <InputField label="Data de nascimento do condutor principal" required>
                <input
                  className={inputCls}
                  type="date"
                  value={form.condutorNascimento}
                  onChange={(e) => set('condutorNascimento')(e.target.value)}
                  required
                />
              </InputField>
            </>
          )}
        </Section>

        {/* 6. Condutor adicional */}
        <Section number={6} title="Condutor Adicional">
          <RadioGroup
            label="Reside com alguém entre 18 e 25 anos?"
            name="residente1825"
            options={[
              { value: 'S', label: 'Sim' },
              { value: 'N', label: 'Não' },
            ]}
            value={form.residente1825}
            onChange={(v) => setForm(prev => ({
              ...prev,
              residente1825: v,
              residente1825UsaVeiculo: v === 'N' ? '' : prev.residente1825UsaVeiculo,
            }))}
            inline
          />
          {form.residente1825 === 'S' && (
            <RadioGroup
              label="Essa pessoa utiliza o veículo?"
              name="residente1825UsaVeiculo"
              options={[
                { value: 'S', label: 'Sim' },
                { value: 'N', label: 'Não' },
              ]}
              value={form.residente1825UsaVeiculo}
              onChange={set('residente1825UsaVeiculo')}
              inline
            />
          )}
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
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-4 rounded-2xl text-base transition-colors flex items-center justify-center gap-2 shadow-md shadow-blue-200"
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
          Seus dados são tratados com sigilo e usados apenas para a cotação do seguro.
        </p>
      </form>
    </div>
  )
}
