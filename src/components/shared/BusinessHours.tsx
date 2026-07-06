import { BusinessHour } from '@/types';

interface BusinessHoursProps {
  hours: BusinessHour[];
  className?: string;
}

const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

/** Format a canonical 24-hour "HH:MM" value as 12-hour "8:00 AM". Leaves unrecognized input untouched. */
function formatTime(value: string): string {
  const m = /^(\d{1,2}):(\d{2})$/.exec((value || '').trim());
  if (!m) return value;
  let hour = parseInt(m[1], 10);
  const period = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12;
  if (hour === 0) hour = 12;
  return `${hour}:${m[2]} ${period}`;
}

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
              {hour.enabled
                ? (hour.open24 ? 'Open 24 hours' : `${formatTime(hour.open)} - ${formatTime(hour.close)}`)
                : 'Closed'}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
