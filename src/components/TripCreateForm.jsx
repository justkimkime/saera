import React, { useState } from "react";
import { createItinerary } from "../itineraries.js";
import { useApp } from "../state/AppContext.jsx";
export default function TripCreateForm({ onCreate, onCancel }) {
  const { t, lang } = useApp();
  const [error, setError] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const today = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  };
  const latestEnd = start
    ? new Date(Date.parse(`${start}T00:00:00Z`) + 6 * 86400000).toISOString().slice(0, 10)
    : "";
  return (
    <form
      className="trip-create"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        try {
          if (!start || start < today() || !end || end < start || end > latestEnd) throw new Error("dates");
          onCreate(
            createItinerary(
              form.get("name"),
              form.get("start"),
              form.get("end"),
              lang,
            ),
          );
        } catch {
          setError(t("TripCreateForm.enterANameAndAValidDateRangeOf"));
        }
      }}
    >
      <h2>{t("ItineraryManager.createItinerary")}</h2>
      <label>
        {t("TripCreateForm.itineraryName")}
        <input
          name="name"
          required
          maxLength={80}
          placeholder={t("TripCreateForm.eGBusanTrip")}
        />
      </label>
      <div className="trip-dates">
        <label>
          {t("TripCreateForm.startDate")}
          <input type="date" name="start" required min={today()} value={start}
            onChange={(event) => {
              setStart(event.target.value);
              setEnd("");
              setError("");
            }} />
        </label>
        <label>
          {t("TripCreateForm.endDate")}
          <input type="date" name="end" required disabled={!start} min={start || undefined} max={latestEnd || undefined}
            value={end} onChange={(event) => { setEnd(event.target.value); setError(""); }} />
        </label>
      </div>
      <p>{t("TripCreateForm.chooseDatesUsingTheCalendarMaximum7Days")}</p>
      {error && <p role="alert">{error}</p>}
      <div className="trip-actions">
        <button type="submit" className="primary">
          {t("TripCreateForm.create")}
        </button>
        <button type="button" className="secondary" onClick={onCancel}>
          {t("ItineraryManager.cancel")}
        </button>
      </div>
    </form>
  );
}
