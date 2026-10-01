import { useHealth } from '@/api/health'

export function ApiStatus() {
  const { data, isPending, isError } = useHealth()

  let label = 'checking…'
  if (isError) label = 'unreachable'
  else if (!isPending) label = data.status

  return (
    <p role="status" className="text-sm text-muted-foreground">
      API: {label}
    </p>
  )
}
