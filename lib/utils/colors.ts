export const colorMap: Record<string, string> = {
  'bg-primary': '#3B82F6',    // Blue
  'bg-accent': '#8B5CF6',     // Purple
  'bg-chart-1': '#10B981',    // Green
  'bg-chart-2': '#F59E0B',    // Orange
  'bg-chart-3': '#EF4444',    // Red
  'bg-chart-4': '#EC4899',    // Pink
  'bg-chart-5': '#14B8A6',    // Teal
}

export function getColorHex(colorClass: string): string {
  return colorMap[colorClass] || '#3B82F6' // Default to blue if color not found
}

export function getColorName(colorClass: string): string {
  const nameMap: Record<string, string> = {
    'bg-primary': 'Primary',
    'bg-accent': 'Accent',
    'bg-chart-1': 'Chart 1',
    'bg-chart-2': 'Chart 2',
    'bg-chart-3': 'Chart 3',
    'bg-chart-4': 'Chart 4',
    'bg-chart-5': 'Chart 5',
  }
  return nameMap[colorClass] || 'Primary'
}
