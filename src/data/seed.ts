import raw from "./seeds.json";
import { addDays, diffDays, parseISODate, toISODateOnly } from "../utils/dates";
import type { ConziaSeedData } from "../types/models";

function maxDateISO(values: Array<{ date: string }>): string {
  return values
    .map((v) => v.date)
    .reduce((acc, cur) => (parseISODate(cur) > parseISODate(acc) ? cur : acc));
}

function shiftISODateOnly(iso: string, days: number): string {
  const shifted = addDays(parseISODate(iso), days);
  return toISODateOnly(shifted);
}

export function loadSeedData(): ConziaSeedData {
  const seed = raw as unknown as ConziaSeedData;

  const dates = [
    ...seed.checkIns,
    ...seed.entries,
    ...seed.intentions,
    ...seed.readings,
    ...seed.vaultNotes,
  ];

  const seedMax = maxDateISO(dates);
  const today = toISODateOnly(new Date());
  const deltaDays = diffDays(parseISODate(seedMax), parseISODate(today));

  if (deltaDays === 0) return seed;

  return {
    ...seed,
    checkIns: seed.checkIns.map((c) => ({ ...c, date: shiftISODateOnly(c.date, deltaDays) })),
    entries: seed.entries.map((e) => ({ ...e, date: shiftISODateOnly(e.date, deltaDays) })),
    intentions: seed.intentions.map((i) => ({ ...i, date: shiftISODateOnly(i.date, deltaDays) })),
    readings: seed.readings.map((r) => ({ ...r, date: shiftISODateOnly(r.date, deltaDays) })),
    vaultNotes: seed.vaultNotes.map((v) => ({ ...v, date: shiftISODateOnly(v.date, deltaDays) })),
    mirrorStories: seed.mirrorStories,
  };
}
