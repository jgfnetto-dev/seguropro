import { Card } from '@/components/ui/card'

export function TableSkeleton({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-7 w-40 bg-surface-container-high rounded" />
          <div className="h-4 w-64 bg-surface-container-high rounded mt-2" />
        </div>
        <div className="h-10 w-36 bg-surface-container-high rounded" />
      </div>

      <div className="h-10 w-full bg-surface-container-high rounded" />

      <Card>
        <div className="p-4 space-y-3">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex gap-4">
              {Array.from({ length: cols }).map((_, j) => (
                <div key={j} className="h-5 flex-1 bg-surface-container-high rounded" />
              ))}
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
