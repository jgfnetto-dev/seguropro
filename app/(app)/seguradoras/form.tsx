'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Car, Bike, Heart, Home, Building2, MoreHorizontal, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast'
import { RAMOS_SEGURO } from '@/lib/utils'
import type { Seguradora } from '@/types'

const ramoIcons: Record<string, React.ReactNode> = {
  'Auto': <Car className="w-5 h-5" />,
  'Moto': <Bike className="w-5 h-5" />,
  'Vida': <Heart className="w-5 h-5" />,
  'Residencial': <Home className="w-5 h-5" />,
  'Empresarial': <Building2 className="w-5 h-5" />,
  'Outros': <MoreHorizontal className="w-5 h-5" />,
}

interface Props {
  seguradora?: Seguradora
  isEdit?: boolean
}

export function SeguradoraForm({ seguradora, isEdit }: Props) {
  const router = useRouter()
  const { showToast, ToastComponent } = useToast()
  const [nome, setNome] = useState(seguradora?.nome ?? '')
  const [ramos, setRamos] = useState<string[]>(seguradora?.ramos ?? [])
  const [novoRamo, setNovoRamo] = useState('')
  const [loading, setLoading] = useState(false)
  const [editMode, setEditMode] = useState(!isEdit)

  function toggleRamo(ramo: string) {
    setRamos((prev) => prev.includes(ramo) ? prev.filter((r) => r !== ramo) : [...prev, ramo])
  }

  function adicionarRamoCustom() {
    const nomeRamo = novoRamo.trim()
    if (!nomeRamo) return
    if (ramos.some((r) => r.toLowerCase() === nomeRamo.toLowerCase())) {
      showToast('Esse ramo já foi adicionado.', 'error')
      return
    }
    setRamos((prev) => [...prev, nomeRamo])
    setNovoRamo('')
  }

  function removerRamoCustom(ramo: string) {
    setRamos((prev) => prev.filter((r) => r !== ramo))
  }

  const ramosCustom = ramos.filter((r) => !RAMOS_SEGURO.includes(r))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!ramos.length) { showToast('Selecione ao menos um ramo.', 'error'); return }
    setLoading(true)
    const method = isEdit ? 'PUT' : 'POST'
    const body = isEdit ? { id: seguradora?.id, nome, ramos } : { nome, ramos }
    const res = await fetch('/api/seguradoras', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const data = await res.json()
    setLoading(false)
    if (res.ok) {
      showToast(isEdit ? 'Seguradora atualizada!' : 'Seguradora cadastrada!', 'success')
      setTimeout(() => {
        router.push('/seguradoras')
        router.refresh()
      }, 1000)
    } else {
      showToast(`Erro ao salvar: ${data.error ?? 'falha desconhecida'}`, 'error')
    }
  }

  return (
    <>
      {ToastComponent}
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-h1 text-on-surface">Cadastro de Seguradora</h1>
            <p className="text-body-sm text-secondary mt-1">Gerencie as informações básicas e ramos de atuação.</p>
          </div>
          {isEdit && (
            <Button variant="outline" size="sm" onClick={() => setEditMode(!editMode)}>
              {editMode ? 'Cancelar Edição' : '✏ Modo Edição'}
            </Button>
          )}
        </div>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="codigo">Código Interno</Label>
                  <div className="h-10 flex items-center px-3 rounded border border-outline-variant bg-surface-container-low text-body-sm text-on-surface-variant">
                    {seguradora?.codigo ?? 'Gerado automaticamente ao salvar'}
                  </div>
                </div>
                <div>
                  <Label htmlFor="nome">Nome da Seguradora</Label>
                  <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Porto Seguro Cia de Seguros Gerais" required disabled={!editMode} />
                </div>
              </div>

              <div>
                <Label>Ramos de Atuação</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {RAMOS_SEGURO.map((ramo) => {
                    const selected = ramos.includes(ramo)
                    return (
                      <button
                        key={ramo}
                        type="button"
                        disabled={!editMode}
                        onClick={() => toggleRamo(ramo)}
                        className={`flex flex-col items-center gap-1 px-4 py-3 rounded border text-xs font-medium transition-all
                          ${selected
                            ? 'bg-primary border-primary text-on-primary'
                            : 'bg-card border-outline-variant text-on-surface-variant hover:border-primary/50 hover:bg-primary/5'
                          } disabled:cursor-not-allowed disabled:opacity-60`}
                      >
                        {ramoIcons[ramo] ?? <MoreHorizontal className="w-5 h-5" />}
                        <span className="label-caps">{ramo}</span>
                      </button>
                    )
                  })}
                  {ramosCustom.map((ramo) => (
                    <div
                      key={ramo}
                      className="flex items-center gap-2 px-4 py-3 rounded border bg-primary border-primary text-on-primary text-xs font-medium"
                    >
                      <MoreHorizontal className="w-5 h-5" />
                      <span className="label-caps">{ramo}</span>
                      {editMode && (
                        <button
                          type="button"
                          onClick={() => removerRamoCustom(ramo)}
                          className="hover:opacity-70"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {editMode && (
                  <div className="flex gap-2 mt-3">
                    <Input
                      value={novoRamo}
                      onChange={(e) => setNovoRamo(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          adicionarRamoCustom()
                        }
                      }}
                      placeholder="Adicionar novo ramo (ex: Marítimo, Garantia Estendida...)"
                      className="flex-1"
                    />
                    <Button type="button" variant="outline" size="sm" onClick={adicionarRamoCustom} className="gap-1 shrink-0">
                      <Plus className="w-4 h-4" /> Adicionar
                    </Button>
                  </div>
                )}
              </div>

              <div className="rounded-lg bg-primary/5 border border-primary/20 p-4 flex gap-3">
                <div className="w-5 h-5 mt-0.5 shrink-0 text-primary">🛡️</div>
                <div>
                  <p className="text-body-sm font-semibold text-on-surface">Conformidade e Segurança</p>
                  <p className="text-body-sm text-on-surface-variant mt-0.5">
                    As informações desta seguradora serão integradas automaticamente aos módulos de cotação multicálculo e emissão de apólices, garantindo integridade nos dados transmitidos à SUSEP.
                  </p>
                </div>
              </div>

              {editMode && (
                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => router.push('/seguradoras')}>Cancelar</Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Salvando...' : '💾 Salvar Seguradora'}
                  </Button>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
