import { BusinessHour } from '@/types';

interface BusinessHoursProps {
  hours: BusinessHour[];
  className?: string;
}

const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export function BusinessHours({ hours, className = '' }: BusinessHoursProps) {
  if (!hours || hours.length === 0) return null;

  // Sort hours by logical day order
  const sortedHours = [...hours].sort((a, b) => dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day));

  return (
    <table className={`w-full text-sm ${className}`}>
      <tbody>
        {sortedHours.map((hour) => (
          <tr key={hour.day} className="border-b border-[var(--tribe-border)] last:border-0">
            <td className="py-2 capitalize font-medium text-[var(--tribe-text)]">{hour.day}</td>
            <td className="py-2 text-right text-[var(--tribe-text-muted)]">
              {hour.enabled ? `${hour.open} - ${hour.close}` : 'Closed'}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
