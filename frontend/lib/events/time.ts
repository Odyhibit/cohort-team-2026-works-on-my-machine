export const eventTimeFallbackZone = "America/Chicago";

const formatters = new Map<string, Intl.DateTimeFormat>();

export function formatEventTime(value: string, timeZone = eventTimeFallbackZone): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  let formatter = formatters.get(timeZone);
  if (!formatter) {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric", month: "short", day: "numeric",
      hour: "numeric", minute: "2-digit", timeZoneName: "short",
    };
    try { formatter = new Intl.DateTimeFormat("en-US", { ...options, timeZone }); }
    catch { formatter = new Intl.DateTimeFormat("en-US", { ...options, timeZone: eventTimeFallbackZone }); }
    formatters.set(timeZone, formatter);
  }
  return formatter.format(date);
}
