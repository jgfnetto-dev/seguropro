'use client'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

interface Props {
  vendedor: string
}

export function VendedorButton({ vendedor }: Props) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          title="Ver vendedor"
          className="px-2 py-1 rounded border border-outline-variant bg-card hover:bg-surface-container text-on-surface-variant hover:text-on-surface text-sm font-semibold leading-none"
        >
          (...)
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Vendedor</DialogTitle>
        </DialogHeader>
        <p className="text-body-sm text-on-surface">{vendedor}</p>
      </DialogContent>
    </Dialog>
  )
}
