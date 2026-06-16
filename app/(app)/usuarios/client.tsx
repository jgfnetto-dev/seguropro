'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useToast } from '@/components/ui/toast'
import { getInitials } from '@/lib/utils'

interface Usuario {
  id: string
  nome: string
  email: string
  telefone_whatsapp?: string
  adm: string
  criado_em: string
}

interface Props {
  usuarios: Usuario[]
  usuarioAtualId: string
  isAdmin: boolean
}

export function UsuariosClient({ usuarios, usuarioAtualId, isAdmin }: Props) {
  const router = useRouter()
  const { showToast, ToastComponent } = useToast()
  const [open, setOpen] = useState(false)
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [loading, setLoading] = useState(false)
  const [excluindoId, setExcluindoId] = useState<string | null>(null)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res = await fetch('/api/usuarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, email, senha }),
    })
    const data = await res.json()
    setLoading(false)
    if (res.ok) {
      showToast(`Usuário "${nome}" criado com sucesso!`, 'success')
      setNome('')
      setEmail('')
      setSenha('')
      setOpen(false)
      router.push('/usuarios')
      router.refresh()
    } else {
      showToast(`Erro ao criar usuário: ${data.error ?? 'falha desconhecida'}`, 'error')
    }
  }

  async function handleDelete(id: string, nomeUsuario: string) {
    if (!confirm(`Excluir o usuário "${nomeUsuario}"? Ele perderá o acesso ao sistema imediatamente.`)) return
    setExcluindoId(id)
    const res = await fetch(`/api/usuarios?id=${id}`, { method: 'DELETE' })
    const data = await res.json()
    setExcluindoId(null)
    if (res.ok) {
      showToast('Usuário excluído.', 'success')
      router.push('/usuarios')
      router.refresh()
    } else {
      showToast(`Erro ao excluir: ${data.error ?? 'falha desconhecida'}`, 'error')
    }
  }

  return (
    <>
      {ToastComponent}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-h1 text-on-surface">Usuários</h1>
            <p className="text-body-sm text-on-surface-variant mt-1">Gerencie os usuários com acesso à sua corretora.</p>
          </div>
          {isAdmin && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2"><Plus className="w-4 h-4" /> Novo Usuário</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2"><UserPlus className="w-5 h-5" /> Novo Usuário</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div>
                    <Label htmlFor="nome">Nome Completo</Label>
                    <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Maria Souza" required />
                  </div>
                  <div>
                    <Label htmlFor="email">E-mail</Label>
                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="maria@empresa.com" required />
                  </div>
                  <div>
                    <Label htmlFor="senha">Senha</Label>
                    <Input id="senha" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="Mínimo 6 caracteres" required minLength={6} />
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                    <Button type="submit" disabled={loading}>{loading ? 'Criando...' : 'Criar Usuário'}</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <Card>
          <table className="w-full">
            <thead>
              <tr className="border-b border-outline-variant/30">
                <th className="label-caps text-on-surface-variant text-left px-4 py-3">Usuário</th>
                <th className="label-caps text-on-surface-variant text-left px-4 py-3">E-mail</th>
                <th className="label-caps text-on-surface-variant text-left px-4 py-3">Telefone</th>
                <th className="label-caps text-on-surface-variant text-right px-4 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u, i) => (
                <tr key={u.id} className={`border-b border-outline-variant/20 hover:bg-surface-container-low ${i % 2 === 0 ? '' : 'bg-surface-container-low/40'}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary text-xs font-bold shrink-0">
                        {getInitials(u.nome)}
                      </div>
                      <span className="text-body-sm font-medium text-on-surface flex items-center gap-2">
                        {u.nome} {u.id === usuarioAtualId && <span className="text-on-surface-variant">(você)</span>}
                        {u.adm === 'S' && <Badge variant="default" className="text-xs">Administrador</Badge>}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-body-sm text-on-surface-variant">{u.email}</td>
                  <td className="px-4 py-3 text-body-sm text-on-surface-variant">{u.telefone_whatsapp || '—'}</td>
                  <td className="px-4 py-3 text-right">
                    {isAdmin && u.id !== usuarioAtualId && (
                      <button
                        onClick={() => handleDelete(u.id, u.nome)}
                        disabled={excluindoId === u.id}
                        className="p-1.5 rounded hover:bg-error/10 text-on-surface-variant hover:text-error disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {!usuarios.length && (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-body-sm text-on-surface-variant">
                    Nenhum usuário cadastrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {usuarios.length > 0 && (
            <div className="px-4 py-3 border-t border-outline-variant/20 text-body-sm text-on-surface-variant">
              Exibindo {usuarios.length} usuário{usuarios.length !== 1 ? 's' : ''}
            </div>
          )}
        </Card>
      </div>
    </>
  )
}
