import type { BusinessHour } from '@/types/index'

interface BusinessHoursProps {
  hours: BusinessHour[]
  className?: string
}

export function BusinessHours({ hours, className = '' }: BusinessHoursProps) {
  if (!hours || hours.length === 0) return null

  const daysMap: Record<string, string> = {
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    sunday: 'Sunday'
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {hours.map((hour) => (
        <div key={hour.day} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
          <span className="font-medium text-gray-900">{daysMap[hour.day] || hour.day}</span>
          <span className={hour.enabled ? 'text-gray-600' : 'text-gray-400 italic'}>
            {hour.enabled ? `${hour.open} - ${hour.close}` : 'Closed'}
          </span>
        </div>
      ))}
    </div>
  )
}
