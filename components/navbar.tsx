'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Shield, Search, Bell, User, LogOut, LayoutDashboard, Users, FileText, RefreshCw, Building2, UserCog } from 'lucide-react'
import { getSupabaseBrowser } from '@/lib/supabase-browser'
import { cn } from '@/lib/utils'
import { APP_VERSION } from '@/lib/version'

const navLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/clientes', label: 'Clientes', icon: Users },
  { href: '/apolices', label: 'Apólices', icon: FileText },
  { href: '/renovacoes', label: 'Renovações', icon: RefreshCw },
  { href: '/seguradoras', label: 'Seguradoras', icon: Building2 },
  { href: '/usuarios', label: 'Usuários', icon: UserCog },
]

export function Navbar({ userName: _userName }: { userName?: string }) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = getSupabaseBrowser()
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-40 w-full bg-card border-b border-outline-variant/30 shadow-card">
      <div className="max-w-[1280px] mx-auto px-6 flex items-center h-14 gap-4">
        <Link href="/dashboard" className="flex items-center gap-2 mr-6">
          <Shield className="w-5 h-5 text-primary" />
          <span className="font-semibold text-on-surface">SeguroPro</span>
          <span className="text-xs text-on-surface-variant">v{APP_VERSION}</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1 flex-1">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'px-3 py-1.5 rounded text-body-sm font-medium transition-colors',
                pathname?.startsWith(href) && href !== '/dashboard'
                  ? 'bg-primary/10 text-primary'
                  : pathname === href
                  ? 'bg-primary/10 text-primary'
                  : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
              )}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 ml-auto">
          <button className="p-2 rounded hover:bg-surface-container text-on-surface-variant">
            <Search className="w-4 h-4" />
          </button>
          <button className="p-2 rounded hover:bg-surface-container text-on-surface-variant">
            <Bell className="w-4 h-4" />
          </button>
          <Link
            href="/perfil"
            className="p-2 rounded hover:bg-surface-container text-on-surface-variant"
          >
            <User className="w-4 h-4" />
          </Link>
          <button
            onClick={handleLogout}
            className="p-2 rounded hover:bg-error/10 text-on-surface-variant hover:text-error"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

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
    </header>
  )
}
