export function VenueAvailabilityCalendar({ month, unavailableDates, onSelect, selectedDate }: { month: string; unavailableDates: string[]; onSelect: (date: string) => void; selectedDate?: string }) {
  const start = new Date(`${month}-01T00:00:00`);
  const days = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
  return <div className="availability-calendar" role="group" aria-label={`Availability for ${month}`}>
    {Array.from({ length: days }, (_, index) => {
      const date = `${month}-${String(index + 1).padStart(2, '0')}`;
      const unavailable = unavailableDates.includes(date);
      return <button key={date} type="button" disabled={unavailable} aria-pressed={selectedDate === date} onClick={() => onSelect(date)}>{index + 1}</button>;
    })}
  </div>;
}
