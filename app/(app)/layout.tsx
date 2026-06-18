export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase'
import { Sidebar } from '@/components/sidebar'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) redirect('/auth/login')

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('nome')
    .eq('id', session.user.id)
    .single()

  return (
    <div className="min-h-screen bg-background">
      <Sidebar userName={usuario?.nome} />
      <div className="md:pl-60">
        <main className="max-w-[1600px] mx-auto px-6 py-8 pb-20 md:pb-8">
          {children}
        </main>
      </div>
    </div>
  )
}
