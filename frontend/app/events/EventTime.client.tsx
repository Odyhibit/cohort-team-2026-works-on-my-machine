"use client";

import { useSyncExternalStore } from "react";
import { eventTimeFallbackZone, formatEventTime } from "@/lib/events/time";

const subscribe = () => () => {};
const serverTimeZone = () => eventTimeFallbackZone;
const browserTimeZone = () => {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || eventTimeFallbackZone; }
  catch { return eventTimeFallbackZone; }
};

export default function EventTime({ value }: { value: string }) {
  // The server and hydration render agree on Central; then use the viewer's zone.
  const timeZone = useSyncExternalStore(subscribe, browserTimeZone, serverTimeZone);
  return <time dateTime={value}>{formatEventTime(value, timeZone)}</time>;
}
