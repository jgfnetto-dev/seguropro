import { Card } from '@/components/ui/card'

export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="h-7 w-64 bg-surface-container-high rounded" />
          <div className="h-4 w-80 bg-surface-container-high rounded mt-2" />
        </div>
        <div className="h-9 w-32 bg-surface-container-high rounded" />
      </div>
      <Card className="overflow-hidden">
        <div className="grid grid-cols-7 gap-px bg-outline-variant/20">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="bg-card min-h-[110px] p-2">
              <div className="h-3 w-5 bg-surface-container-high rounded" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
