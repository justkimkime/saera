import React, { useEffect, useRef, useState } from "react";
import { useApp } from "../state/AppContext.jsx";
import { addItineraryPlace } from "../itineraries.js";
import TripCreateForm from "./TripCreateForm.jsx";
export default function ItineraryAddDialog() {
  const {
    t,
    lang,
    trips,
    itineraryPlace,
    setItineraryPlace,
    commitTrip,
    itineraryStorageError,
  } = useApp();
  const dialog = useRef(null);
  const [tripId, setTripId] = useState(""),
    [date, setDate] = useState(""),
    [creating, setCreating] = useState(false),
    [newTrip, setNewTrip] = useState(null),
    [error, setError] = useState("");
  const choices = trips.filter((trip) => trip.lang === lang);
  const trip = newTrip || choices.find((v) => v.id === tripId);
  useEffect(() => {
    if (!itineraryPlace) return;
    const before = document.activeElement;
    setTripId("");
    setDate("");
    setCreating(false);
    setNewTrip(null);
    setError("");
    dialog.current.showModal();
    return () => {
      dialog.current?.close();
      if (before?.isConnected) before.focus();
    };
  }, [itineraryPlace]);
  if (!itineraryPlace) return null;
  return (
    <dialog
      className="itinerary-dialog"
      ref={dialog}
      aria-labelledby="itinerary-add-title"
      onCancel={() => setItineraryPlace(null)}
    >
      <h2 id="itinerary-add-title">{t("ItineraryAddDialog.addToItinerary")}</h2>
      <p>{itineraryPlace.title}</p>
      {creating ? (
        <TripCreateForm
          onCancel={() => setCreating(false)}
          onCreate={(value) => {
            setNewTrip(value);
            setDate(value.days[0].date);
            setCreating(false);
          }}
        />
      ) : (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            try {
              if (!trip || !date) throw new Error("selection");
              const updated = addItineraryPlace(trip, date, itineraryPlace);
              if (commitTrip(updated)) setItineraryPlace(null);
            } catch (e) {
              setError(
                e.message === "duplicate"
                  ? t("ItineraryAddDialog.thisPlaceIsAlreadyOnThisDay")
                  : t("ItineraryAddDialog.chooseAnItineraryAndDay"),
              );
            }
          }}
        >
          {newTrip ? (
            <p>{newTrip.name}</p>
          ) : (
            <label>
              {t("ItineraryAddDialog.itinerary")}
              <select
                required
                value={tripId}
                onChange={(e) => {
                  setTripId(e.target.value);
                  setDate("");
                  setError("");
                }}
              >
                <option value="">
                  {t("ItineraryAddDialog.chooseItinerary")}
                </option>
                {choices.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.days[0].date} ~ {v.days.at(-1).date})
                  </option>
                ))}
              </select>
            </label>
          )}
          {!choices.length && !newTrip && (
            <p>{t("ItineraryAddDialog.noItinerariesYetCreateOneFirst")}</p>
          )}
          <label>
            {t("ItineraryAddDialog.day")}
            <select
              required
              disabled={!trip}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            >
              <option value="">{t("ItineraryAddDialog.chooseDay")}</option>
              {trip?.days.map((d, i) => (
                <option key={d.date} value={d.date}>
                  {i + 1}
                  {t("ItineraryAddDialog.day2")} · {d.date}
                </option>
              ))}
            </select>
          </label>
          {(error || itineraryStorageError) && (
            <p role="alert">{error || itineraryStorageError}</p>
          )}
          <div className="trip-actions">
            <button type="submit" className="primary" disabled={!trip || !date}>
              {t("ItineraryAddDialog.addAndSave")}
            </button>
            <button
              type="button"
              className="secondary"
              onClick={() => {
                setNewTrip(null);
                setCreating(true);
              }}
            >
              {t("ItineraryAddDialog.newItinerary")}
            </button>
          </div>
        </form>
      )}
      <button
        type="button"
        className="secondary"
        onClick={() => setItineraryPlace(null)}
      >
        {t("ItineraryAddDialog.close")}
      </button>
    </dialog>
  );
}
