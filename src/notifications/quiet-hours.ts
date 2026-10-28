export const NOTIFICATION_TIME_ZONE = 'Asia/Kolkata';

// Notifications go out from 09:00 up to (not including) 21:00 IST.
export const SEND_WINDOW_START_HOUR = 9;
export const SEND_WINDOW_END_HOUR = 21;

const hourFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: NOTIFICATION_TIME_ZONE,
  hour: '2-digit',
  hourCycle: 'h23',
});

export function hourInKolkata(date: Date): number {
  const hour = hourFormatter
    .formatToParts(date)
    .find((part) => part.type === 'hour')?.value;

  return Number(hour);
}

export function isWithinSendingHours(date: Date): boolean {
  const hour = hourInKolkata(date);

  return hour >= SEND_WINDOW_START_HOUR && hour < SEND_WINDOW_END_HOUR;
}
