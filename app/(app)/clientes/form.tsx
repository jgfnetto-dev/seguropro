'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast'
import type { Cliente } from '@/types'

interface Props {
  cliente?: Cliente
  isEdit?: boolean
}

export function ClienteForm({ cliente, isEdit }: Props) {
  const router = useRouter()
  const { showToast, ToastComponent } = useToast()
  const [pfPj, setPfPj] = useState<'PF' | 'PJ'>(cliente?.pf_pj ?? 'PF')
  const [segurado, setSegurado] = useState(cliente?.segurado ?? '')
  const [cpfCnpj, setCpfCnpj] = useState(cliente?.cpf_cnpj ?? '')
  const [email, setEmail] = useState(cliente?.email ?? '')
  const [telefone, setTelefone] = useState(cliente?.telefone ?? '')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const method = isEdit ? 'PUT' : 'POST'
    const body = isEdit
      ? { id: cliente?.id, segurado, cpf_cnpj: cpfCnpj, email, telefone, pf_pj: pfPj }
      : { segurado, cpf_cnpj: cpfCnpj, email, telefone, pf_pj: pfPj }
    const res = await fetch('/api/clientes', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    setLoading(false)
    if (res.ok) {
      showToast(isEdit ? 'Cliente atualizado!' : 'Cliente cadastrado!', 'success')
      setTimeout(() => {
        router.push('/clientes')
        router.refresh()
      }, 800)
    } else {
      showToast('Erro ao salvar cliente.', 'error')
    }
  }

  return (
    <>
      {ToastComponent}
      <div>
        <h1 className="text-h1 text-on-surface">Cadastro de Cliente</h1>
        <p className="text-body-sm text-secondary mt-1">Gerencie as informações pessoais e as apólices vinculadas a este segurado.</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <h3 className="text-h3 text-on-surface mb-4">Informações do Segurado</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Tipo de Pessoa</Label>
              <div className="flex gap-4 mt-2">
                {(['PF', 'PJ'] as const).map((tipo) => (
                  <label key={tipo} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="pf_pj"
                      value={tipo}
                      checked={pfPj === tipo}
                      onChange={() => setPfPj(tipo)}
                      className="accent-primary"
                    />
                    <span className="text-body-sm text-on-surface">
                      {tipo === 'PF' ? 'Pessoa Física (PF)' : 'Pessoa Jurídica (PJ)'}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="segurado">Nome Completo / Razão Social</Label>
              <Input
                id="segurado"
                value={segurado}
                onChange={(e) => setSegurado(e.target.value)}
                placeholder={pfPj === 'PF' ? 'Ex: Roberto Silva' : 'Ex: Roberto Silva S/A'}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cpf">{pfPj === 'PF' ? 'CPF' : 'CNPJ'}</Label>
                <Input
                  id="cpf"
                  value={cpfCnpj}
                  onChange={(e) => setCpfCnpj(e.target.value)}
                  placeholder={pfPj === 'PF' ? '000.000.000-00' : '00.000.000/0001-00'}
                  required
                />
              </div>
              <div>
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="cliente@email.com"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => router.push('/clientes')}>Cancelar</Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Salvando...' : 'Salvar Cadastro'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  )
}
