const colours: Record<string, string> = {
  'Planning':       'bg-blue-100 text-blue-800',
  'In Progress':    'bg-cyan-100 text-cyan-800',
  'Implementation': 'bg-indigo-100 text-indigo-800',
  'On Hold':        'bg-yellow-100 text-yellow-800',
  'Complete':       'bg-green-100 text-green-800',
  'At Risk':        'bg-red-100 text-red-800',
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colours[status] ?? 'bg-gray-100 text-gray-700'}`}>
      {status}
    </span>
  )
}
