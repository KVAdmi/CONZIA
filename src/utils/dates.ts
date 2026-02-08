const DAY_MS = 24 * 60 * 60 * 1000;

function parseISODateOnlyLocal(value: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) throw new Error(`Fecha inválida: ${value}`);
  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const day = Number(match[3]);

  const date = new Date(year, monthIndex, day);
  const valid =
    date.getFullYear() === year && date.getMonth() === monthIndex && date.getDate() === day;
  if (!valid) throw new Error(`Fecha inválida: ${value}`);
  return date;
}

export function parseISODate(value: string): Date {
  // IMPORTANT: `new Date("YYYY-MM-DD")` se interpreta como UTC y puede caer en el día anterior
  // en husos horarios negativos. Para fechas “día-calendario” usamos parsing local.
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return parseISODateOnlyLocal(value);

  const dateTime = new Date(value);
  if (Number.isNaN(dateTime.getTime())) throw new Error(`Fecha inválida: ${value}`);
  return dateTime;
}

export function toISODateOnly(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function addDays(date: Date, days: number): Date {
  // Calendar-safe (evita problemas con DST al sumar milisegundos).
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function diffDays(from: Date, to: Date): number {
  // Diferencia en días-calendario (DST-safe).
  const fromUtc = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const toUtc = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((toUtc - fromUtc) / DAY_MS);
}

export function formatDateLongEsMX(value: string): string {
  const date = parseISODate(value);
  return new Intl.DateTimeFormat("es-MX", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(date);
}
