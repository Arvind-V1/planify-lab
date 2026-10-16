const MINUTES_PER_HOUR = 60;
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function parseTime(time: string): number {
  const match = TIME_PATTERN.exec(time);
  if (!match) {
    throw new Error(`Invalid time "${time}": expected format HH:MM`);
  }
  return Number(match[1]) * MINUTES_PER_HOUR + Number(match[2]);
}

function padTwoDigits(value: number): string {
  return String(value).padStart(2, '0');
}

export function formatTime(totalMinutes: number): string {
  if (!Number.isInteger(totalMinutes) || totalMinutes < 0) {
    throw new RangeError(`Invalid minute count: ${totalMinutes}`);
  }
  const hours = Math.floor(totalMinutes / MINUTES_PER_HOUR);
  const minutes = totalMinutes % MINUTES_PER_HOUR;
  return `${padTwoDigits(hours)}:${padTwoDigits(minutes)}`;
}