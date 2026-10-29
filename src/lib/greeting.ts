export type GreetingPeriod = "pagi" | "siang" | "sore" | "malam";

export function getGreetingPeriod(date: Date): GreetingPeriod {
  const hour = date.getHours();
  if (hour >= 5 && hour < 11) return "pagi";
  if (hour >= 11 && hour < 15) return "siang";
  if (hour >= 15 && hour < 18) return "sore";
  return "malam";
}

export function getGreetingText(period: GreetingPeriod, name: string): string {
  const greetings: Record<GreetingPeriod, string> = {
    pagi: "Selamat pagi",
    siang: "Selamat siang",
    sore: "Selamat sore",
    malam: "Selamat malam",
  };
  return `${greetings[period]}, ${name}`;
}

export function formatDateTimeIndonesian(date: Date): string {
  return date.toLocaleString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}