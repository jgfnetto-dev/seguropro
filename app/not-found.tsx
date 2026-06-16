import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-h1 text-on-surface">404</h1>
        <p className="text-body-md text-on-surface-variant">Página não encontrada</p>
        <Link href="/dashboard" className="text-secondary hover:underline text-body-sm">
          Voltar ao Dashboard
        </Link>
      </div>
    </div>
  )
}
