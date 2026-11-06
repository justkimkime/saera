import { supportedLanguages } from "./language-config.js";
export const itineraryStorageKey = "saera-itineraries:v1";
export const makeId = () => globalThis.crypto.randomUUID();
export function travelDates(start, end) {
  const parse = (value) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error("dates");
    const stamp = Date.parse(`${value}T00:00:00Z`);
    if (
      !Number.isFinite(stamp) ||
      new Date(stamp).toISOString().slice(0, 10) !== value
    )
      throw new Error("dates");
    return stamp;
  };
  const first = parse(start),
    last = parse(end),
    count = (last - first) / 86400000 + 1;
  if (count < 1 || count > 7) throw new Error("dates");
  return Array.from({ length: count }, (_, index) =>
    new Date(first + index * 86400000).toISOString().slice(0, 10),
  );
}
export function createItinerary(name, start, end, lang) {
  if (!name.trim()) throw new Error("name");
  return {
    id: makeId(),
    name: name.trim().slice(0, 80),
    lang,
    days: travelDates(start, end).map((date) => ({
      date,
      note: "",
      entries: [],
    })),
  };
}
export const placeIdentity = (p) => `${p.service}:${p.id}:${p.lang}`;
export function addItineraryPlace(trip, date, place, index) {
  const day = trip.days.find((d) => d.date === date);
  if (!day) throw new Error("day");
  if (day.entries.some((e) => placeIdentity(e.place) === placeIdentity(place)))
    throw new Error("duplicate");
  const entry = { id: makeId(), place: { ...place } };
  return {
    ...trip,
    days: trip.days.map((d) =>
      d !== day
        ? d
        : {
            ...d,
            entries: [
              ...d.entries.slice(0, index ?? d.entries.length),
              entry,
              ...d.entries.slice(index ?? d.entries.length),
            ],
          },
    ),
  };
}
export function moveItineraryEntry(trip, entryId, date, index) {
  const from = trip.days.find((d) => d.entries.some((e) => e.id === entryId));
  const target = trip.days.find((d) => d.date === date);
  const entry = from?.entries.find((e) => e.id === entryId);
  if (!entry || !target) throw new Error("day");
  if (
    from !== target &&
    target.entries.some(
      (e) => placeIdentity(e.place) === placeIdentity(entry.place),
    )
  )
    throw new Error("duplicate");
  const days = trip.days.map((d) => ({
    ...d,
    entries: d.entries.filter((e) => e.id !== entryId),
  }));
  const dest = days.find((d) => d.date === date);
  dest.entries.splice(
    Math.max(0, Math.min(index ?? dest.entries.length, dest.entries.length)),
    0,
    entry,
  );
  return { ...trip, days };
}
export function readItineraries(storage) {
  const raw = JSON.parse(storage.getItem(itineraryStorageKey) || "[]");
  if (!Array.isArray(raw)) throw new Error("storage");
  return raw.filter((t) => {
    try {
      if (
        !t ||
        typeof t.id !== "string" ||
        typeof t.name !== "string" ||
        !supportedLanguages.includes(t.lang) ||
        !Array.isArray(t.days) ||
        !t.days.length
      )
        return false;
      const dates = travelDates(t.days[0].date, t.days.at(-1).date);
      return (
        dates.length === t.days.length &&
        t.days.every(
          (d, i) =>
            d.date === dates[i] &&
            typeof d.note === "string" &&
            Array.isArray(d.entries) &&
            d.entries.every(
              (e) =>
                typeof e.id === "string" &&
                e.place &&
                typeof e.place.title === "string" &&
                e.place.id &&
                e.place.service,
            ),
        )
      );
    } catch {
      return false;
    }
  });
}
