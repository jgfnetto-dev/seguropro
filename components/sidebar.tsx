'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { Shield, Search, Bell, User, LogOut, LayoutDashboard, Users, FileText, RefreshCw, Building2, UserCog, HandCoins, Archive, ListChecks, Car, Heart, ChevronDown, ContactRound, Calculator } from 'lucide-react'
import { getSupabaseBrowser } from '@/lib/supabase-browser'
import { cn } from '@/lib/utils'
import { APP_VERSION } from '@/lib/version'

const navLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/clientes', label: 'Clientes', icon: Users },
  { href: '/apolices', label: 'Apólices', icon: FileText },
  { href: '/renovacoes', label: 'Renovações', icon: RefreshCw },
  { href: '/seguradoras', label: 'Seguradoras', icon: Building2 },
  { href: '/conciliacao', label: 'Conciliação', icon: HandCoins },
  { href: '/historico-renovacao', label: 'Histórico', icon: Archive },
  { href: '/tarefas', label: 'Tarefas', icon: ListChecks },
]

const bottomNavLinks = [
  { href: '/usuarios', label: 'Usuários', icon: UserCog },
]

const simuladorSubItems = [
  { href: '/simulador-consorcio/automovel', label: 'Simula Automóvel', icon: Car },
]

const leadsSubItems = [
  { href: '/leads/auto', label: 'Automóvel', icon: Car },
  { href: '/leads/saude', label: 'Plano de Saúde', icon: Heart },
]

export function Sidebar({ userName }: { userName?: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const [leadsOpen, setLeadsOpen] = useState(() => !!pathname?.startsWith('/leads'))
  const [simuladorOpen, setSimuladorOpen] = useState(() => !!pathname?.startsWith('/simulador-consorcio'))

  async function handleLogout() {
    const supabase = getSupabaseBrowser()
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  const leadsActive = pathname?.startsWith('/leads')
  const simuladorActive = pathname?.startsWith('/simulador-consorcio')

  function SubMenu({
    icon: Icon, label, open, onToggle, active, items,
  }: {
    icon: React.ElementType; label: string; open: boolean
    onToggle: () => void; active: boolean
    items: { href: string; label: string; icon: React.ElementType }[]
  }) {
    return (
      <div>
        <button
          onClick={onToggle}
          className={cn(
            'flex items-center justify-between px-3 py-2 rounded text-body-sm font-medium w-full transition-colors',
            active
              ? 'bg-primary/10 text-primary'
              : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
          )}
        >
          <span className="flex items-center gap-3 min-w-0">
            <Icon className="w-4 h-4 shrink-0" />
            <span className="truncate">{label}</span>
          </span>
          <ChevronDown className={cn('w-3 h-3 shrink-0 ml-2 transition-transform duration-200', open && 'rotate-180')} />
        </button>
        {open && (
          <div className="mt-1 space-y-0.5">
            {items.map(({ href, label: itemLabel, icon: ItemIcon }) => {
              const itemActive = pathname === href
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'flex items-center gap-3 pl-9 pr-3 py-2 rounded text-body-sm font-medium transition-colors',
                    itemActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                  )}
                >
                  <ItemIcon className="w-4 h-4" />
                  {itemLabel}
                </Link>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      <aside className="hidden md:flex md:flex-col fixed top-0 left-0 h-screen w-60 bg-card border-r border-outline-variant/30 z-40">
        <Link href="/dashboard" className="flex items-center gap-2 px-5 h-16 border-b border-outline-variant/30 shrink-0">
          <Shield className="w-5 h-5 text-primary" />
          <span className="font-semibold text-on-surface">SeguroPro</span>
          <span className="text-xs text-on-surface-variant ml-auto">v{APP_VERSION}</span>
        </Link>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navLinks.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (pathname?.startsWith(href) && href !== '/dashboard')
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded text-body-sm font-medium transition-colors',
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            )
          })}

          {/* Simulador de Consórcio group */}
          <SubMenu
            icon={Calculator}
            label="Simulador Consórcio"
            open={simuladorOpen}
            onToggle={() => setSimuladorOpen(o => !o)}
            active={!!simuladorActive}
            items={simuladorSubItems}
          />

          {/* Novos Leads group */}
          <SubMenu
            icon={ContactRound}
            label="Novos Leads"
            open={leadsOpen}
            onToggle={() => setLeadsOpen(o => !o)}
            active={!!leadsActive}
            items={leadsSubItems}
          />

          {/* Bottom nav links (Usuários) */}
          {bottomNavLinks.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname?.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded text-body-sm font-medium transition-colors',
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-outline-variant/30 p-3 space-y-1 shrink-0">
          <button className="flex items-center gap-3 px-3 py-2 rounded text-body-sm font-medium w-full text-on-surface-variant hover:bg-surface-container hover:text-on-surface">
            <Search className="w-4 h-4" /> Buscar
          </button>
          <button className="flex items-center gap-3 px-3 py-2 rounded text-body-sm font-medium w-full text-on-surface-variant hover:bg-surface-container hover:text-on-surface">
            <Bell className="w-4 h-4" /> Notificações
          </button>
          <Link
            href="/perfil"
            className="flex items-center gap-3 px-3 py-2 rounded text-body-sm font-medium text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
          >
            <User className="w-4 h-4" /> {userName || 'Meu Perfil'}
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 rounded text-body-sm font-medium w-full text-on-surface-variant hover:bg-error/10 hover:text-error"
          >
            <LogOut className="w-4 h-4" /> Sair
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="md:hidden sticky top-0 z-40 w-full bg-card border-b border-outline-variant/30 shadow-card flex items-center h-14 px-4 gap-2">
        <Shield className="w-5 h-5 text-primary" />
        <span className="font-semibold text-on-surface">SeguroPro</span>
        <span className="text-xs text-on-surface-variant">v{APP_VERSION}</span>
        <button onClick={handleLogout} className="ml-auto p-2 rounded hover:bg-error/10 text-on-surface-variant hover:text-error">
          <LogOut className="w-4 h-4" />
        </button>
      </header>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-outline-variant/30 flex">
        {navLinks.slice(0, 4).map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium',
              pathname?.startsWith(href) ? 'text-primary' : 'text-on-surface-variant'
            )}
          >
            <Icon className="w-5 h-5" />
            {label}
          </Link>
        ))}
      </nav>
    </>
  )
}
