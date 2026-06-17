import { Card } from '@/components/ui/card'
import { TableSkeleton } from '@/components/table-skeleton'

export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="h-7 w-64 bg-surface-container-high rounded" />
          <div className="h-4 w-80 bg-surface-container-high rounded mt-2" />
        </div>
        <div className="h-9 w-48 bg-surface-container-high rounded" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <div className="p-5 space-y-2">
              <div className="h-3 w-24 bg-surface-container-high rounded" />
              <div className="h-8 w-16 bg-surface-container-high rounded" />
            </div>
          </Card>
        ))}
      </div>

      <TableSkeleton cols={6} />
    </div>
  )
}
