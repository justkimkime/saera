import React, { useMemo, useRef, useState } from "react";
import { useApp } from "../state/AppContext.jsx";
import {
  addItineraryPlace,
  moveItineraryEntry,
  placeIdentity,
} from "../itineraries.js";
import { placeCategory } from "../place-categories.js";
import { themes } from "../tourism.js";
import TourMap from "./TourMap.jsx";
import TripCreateForm from "./TripCreateForm.jsx";

function PlaceSummary({ place, lang, t }) {
  const theme = themes.find((v) => v.id === place.theme);
  return (
    <>
      <strong>{place.title}</strong>
      <p>{place.address || t("ItineraryManager.addressUnavailable")}</p>
      <div className="trip-place-tags">
        <span className="trip-category">
          {placeCategory(place, lang).label}
        </span>
        <span className="trip-theme">
          {theme?.[lang] || theme?.ko || t("ItineraryManager.allPlaces")}
        </span>
      </div>
    </>
  );
}
export default function ItineraryManager() {
  const {
    t,
    lang,
    favorites,
    trips,
    commitTrip,
    deleteTrip,
    itineraryStorageError,
    openPlace,
  } = useApp();
  const [creating, setCreating] = useState(false),
    [selected, setSelected] = useState(null),
    [draft, setDraft] = useState(null),
    [dayIndex, setDayIndex] = useState(0),
    [message, setMessage] = useState(""),
    [targets, setTargets] = useState({}),
    [showMap, setShowMap] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const pointerDrag = useRef(null);
  const dragging = useRef(null),
    touch = useRef(null),
    heading = useRef(null);
  const saved = trips.find((v) => v.id === selected && v.lang === lang),
    trip = draft || saved,
    editing = !!draft;
  const savedPlaces = useMemo(
    () => favorites.filter((v) => v.lang === lang),
    [favorites, lang],
  );
  const categoryOptions = useMemo(
    () => [
      ...new Map(
        savedPlaces.map((place) => {
          const category = placeCategory(place, lang);
          return [category.id, category];
        }),
      ).values(),
    ],
    [savedPlaces, lang],
  );
  const visibleSavedPlaces = useMemo(
    () =>
      savedPlaces.filter(
        (place) =>
          categoryFilter === "all" ||
          placeCategory(place, lang).id === categoryFilter,
      ),
    [savedPlaces, categoryFilter, lang],
  );
  const day = trip?.days[dayIndex] || trip?.days[0];
  const announceError = (e) =>
    setMessage(
      e.message === "duplicate"
        ? t("ItineraryAddDialog.thisPlaceIsAlreadyOnThisDay")
        : t("ItineraryManager.couldNotMovePlaceTryAgain"),
    );
  const add = (place, date) => {
    try {
      setDraft(addItineraryPlace(draft, date, place));
      setMessage(
        t("ItineraryManager.valueAddedToValue", {
          place_title: place.title,
          date: date,
        }),
      );
    } catch (e) {
      announceError(e);
    }
  };
  const move = (id, date, index) => {
    try {
      setDraft(moveItineraryEntry(draft, id, date, index));
      requestAnimationFrame(() => {
        const handle = document
          .getElementById(`trip-entry-${id}`)
          ?.querySelector(".trip-drag");
        (handle || heading.current)?.focus({ preventScroll: true });
      });
      setMessage(t("ItineraryManager.orderUpdatedConfirmToSave"));
    } catch (e) {
      announceError(e);
    }
  };
  const changeDay = (index) => {
    setDayIndex(Math.max(0, Math.min(trip.days.length - 1, index)));
  };
  const drop = (event, date, index) => {
    event.preventDefault();
    event.stopPropagation();
    if (!editing || !dragging.current) return;
    const payload = dragging.current;
    dragging.current = null;
    if (payload.place) {
      try {
        setDraft(addItineraryPlace(draft, date, payload.place, index));
        setMessage(t("ItineraryManager.placeAdded"));
      } catch (e) {
        announceError(e);
      }
    } else {
      const target = draft.days.find((d) => d.date === date),
        previous = target.entries.findIndex((e) => e.id === payload.id);
      move(
        payload.id,
        date,
        previous >= 0 && previous < index ? index - 1 : index,
      );
    }
  };
  // Pointer capture supports mouse dragging even when native HTML dragging is unavailable.
  const pointerHandlers = (payload) => ({
    onPointerDown(event) {
      if (event.pointerType !== "mouse" || event.button !== 0) return;
      event.preventDefault();
      event.currentTarget.focus();
      event.currentTarget.setPointerCapture(event.pointerId);
      pointerDrag.current = { x: event.clientX, y: event.clientY, payload };
    },
    onPointerUp(event) {
      const start = pointerDrag.current;
      pointerDrag.current = null;
      if (
        !start ||
        Math.hypot(event.clientX - start.x, event.clientY - start.y) < 8
      )
        return;
      const target = document
        .elementFromPoint(event.clientX, event.clientY)
        ?.closest("[data-trip-drop-date]");
      if (!target) return;
      dragging.current = start.payload;
      drop(
        event,
        target.dataset.tripDropDate,
        Number(target.dataset.tripDropIndex),
      );
    },
    onPointerCancel() {
      pointerDrag.current = null;
    },
  });
  const dragStart = (event, payload) => {
    dragging.current = payload;
    event.dataTransfer.effectAllowed = payload.place ? "copy" : "move";
    event.dataTransfer.setData(
      "text/plain",
      payload.place?.title || payload.id,
    );
  };
  const mapPlaces = useMemo(() => {
    const daily = day?.entries.map((e) => e.place) || [];
    return (editing ? [...visibleSavedPlaces, ...daily] : daily).filter(
      (v, i, all) =>
        all.findIndex((p) => placeIdentity(p) === placeIdentity(v)) === i,
    );
  }, [editing, visibleSavedPlaces, day?.entries]);
  const currentPlaces = useMemo(
    () => new Set(day?.entries.map((e) => placeIdentity(e.place)) || []),
    [day?.entries],
  );
  if (creating)
    return (
      <TripCreateForm
        onCancel={() => setCreating(false)}
        onCreate={(value) => {
          setDraft(value);
          setSelected(null);
          setDayIndex(0);
          setMessage("");
          setCreating(false);
        }}
      />
    );
  if (!trip)
    return (
      <section
        className="itinerary-manager"
        aria-label={t("ItineraryManager.itineraries")}
      >
        <div className="trip-toolbar">
          <h2>{t("ItineraryManager.myItineraries")}</h2>
          <button
            type="button"
            className="primary"
            onClick={() => setCreating(true)}
          >
            {t("ItineraryManager.createItinerary")}
          </button>
        </div>
        {itineraryStorageError && <p role="alert">{itineraryStorageError}</p>}
        <div className="trip-list">
          {trips
            .filter((v) => v.lang === lang)
            .map((v) => (
              <button
                type="button"
                className="trip-list-card"
                key={v.id}
                onClick={() => {
                  setSelected(v.id);
                  setDayIndex(0);
                  setMessage("");
                  setTargets({});
                }}
              >
                <strong>{v.name}</strong>
                <span>
                  {v.days[0].date} ~ {v.days.at(-1).date}
                </span>
                <span>
                  {v.days.length}
                  {t("ItineraryManager.days")} ·{" "}
                  {v.days.reduce((sum, d) => sum + d.entries.length, 0)}
                  {t("ItineraryManager.places")}
                </span>
              </button>
            ))}
        </div>
        {!trips.some((v) => v.lang === lang) && (
          <div className="empty-state">
            <h3>{t("ItineraryManager.noItinerariesYet")}</h3>
            <p>
              {t(
                "ItineraryManager.chooseYourTravelDatesToCreateYourFirstItinerary",
              )}
            </p>
          </div>
        )}
      </section>
    );
  return (
    <section
      className="itinerary-manager"
      aria-label={t("ItineraryManager.travelItinerary")}
    >
      <div className="trip-toolbar">
        <div>
          <h2>{trip.name}</h2>
          <p>
            {trip.days[0].date} ~ {trip.days.at(-1).date}
          </p>
        </div>
        <div className="trip-actions">
          {editing ? (
            <>
              <button
                type="button"
                className="primary"
                onClick={() => {
                  if (commitTrip(draft)) {
                    setSelected(draft.id);
                    setDraft(null);
                    setMessage("");
                  }
                }}
              >
                {t("ItineraryManager.confirmAndSave")}
              </button>
              <button
                type="button"
                className="secondary"
                onClick={() => {
                  setDraft(null);
                  setMessage("");
                }}
              >
                {t("ItineraryManager.cancel")}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="secondary"
                onClick={() => {
                  setDraft(structuredClone(saved));
                  setMessage("");
                }}
              >
                {t("ItineraryManager.edit")}
              </button>
              <button
                type="button"
                className="secondary"
                onClick={() => setSelected(null)}
              >
                {t("ItineraryManager.allItineraries")}
              </button>
              <button
                type="button"
                className="secondary"
                onClick={() => {
                  if (
                    window.confirm(t("ItineraryManager.deleteThisItinerary")) &&
                    deleteTrip(trip.id)
                  )
                    setSelected(null);
                }}
              >
                {t("ItineraryManager.delete")}
              </button>
            </>
          )}
        </div>
      </div>
      {editing && (
        <p className="saved-note">
          {t("ItineraryManager.confirmToSaveYourChangesCancelRestoresTheSaved")}
        </p>
      )}
      {itineraryStorageError && <p role="alert">{itineraryStorageError}</p>}
      <div className="trip-map-section">
        <button
          type="button"
          className="secondary"
          aria-expanded={showMap}
          aria-controls={showMap ? "itinerary-map" : undefined}
          onClick={() => setShowMap((v) => !v)}
        >
          {showMap
            ? t("ItineraryManager.hideMap")
            : t("ItineraryManager.showMap")}
        </button>
        {showMap && (
          <div id="itinerary-map">
            {mapPlaces.some(
              (p) => Number.isFinite(p.lat) && Number.isFinite(p.lng),
            ) ? (
              <TourMap
                places={mapPlaces}
                lang={lang}
                onOpen={editing ? undefined : openPlace}
                caption={
                  editing
                    ? t("ItineraryManager.savedPlacesSelectedDay")
                    : t("ItineraryManager.visitOrderForSelectedDay")
                }
                highlightKeys={editing ? currentPlaces : undefined}
              />
            ) : (
              <p className="trip-empty">
                {t("ItineraryManager.noPlacesWithCoordinatesToShowYet")}
              </p>
            )}
            <p className="form-hint">
              {editing
                ? t("ItineraryManager.showsSavedPlacesAndThisDaySPlacesThis")
                : t("ItineraryManager.showsThisDaySPlacesInVisitOrder")}
            </p>
          </div>
        )}
      </div>
      <div
        className={editing ? "trip-workspace" : "trip-workspace trip-readonly"}
      >
        {editing && (
          <aside
            className="trip-favorites"
            aria-label={t("ItineraryManager.savedPlaces")}
          >
            <h3>{t("ItineraryManager.savedPlaces")}</h3>
            <p>{t("ItineraryManager.dragIntoADayOrChooseADateAnd")}</p>
            <label className="trip-category-filter">
              {t("ItineraryManager.placeType")}
              <select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
              >
                <option value="all">{t("ItineraryManager.allTypes")}</option>
                {categoryOptions.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.label}
                  </option>
                ))}
              </select>
            </label>
            {savedPlaces.length > 0 && !visibleSavedPlaces.length && (
              <p>{t("ItineraryManager.noSavedPlacesOfThisType")}</p>
            )}
            {!savedPlaces.length && (
              <p>
                {t("ItineraryManager.noSavedPlacesSavePlacesFromSearchOrAdd")}
              </p>
            )}
            {visibleSavedPlaces.map((place) => (
              <article className="trip-place" key={placeIdentity(place)}>
                <div className="trip-place-heading">
                  <span
                    className="trip-order"
                    aria-label={t("ItineraryManager.mapNumber")}
                  >
                    {mapPlaces.findIndex(
                      (p) => placeIdentity(p) === placeIdentity(place),
                    ) + 1}
                  </span>
                  <button
                    type="button"
                    className="trip-drag"
                    draggable
                    onDragStart={(e) => dragStart(e, { place })}
                    {...pointerHandlers({ place })}
                    onDragEnd={() => {
                      dragging.current = null;
                    }}
                    aria-label={t(
                      "ItineraryManager.dragValueDateSelectionAndAddAreAlsoAvailable",
                      { place_title: place.title },
                    )}
                  >
                    ⠿ {t("ItineraryManager.dragToAdd")}
                  </button>
                </div>
                <PlaceSummary place={place} lang={lang} t={t} />
                <label>
                  {t("ItineraryManager.addToDay")}
                  <select
                    value={targets[placeIdentity(place)] || day.date}
                    onChange={(e) =>
                      setTargets((v) => ({
                        ...v,
                        [placeIdentity(place)]: e.target.value,
                      }))
                    }
                  >
                    {trip.days.map((d, i) => (
                      <option key={d.date} value={d.date}>
                        {i + 1}
                        {t("ItineraryAddDialog.day2")} · {d.date}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  className="secondary"
                  onClick={() =>
                    add(place, targets[placeIdentity(place)] || day.date)
                  }
                >
                  {t("ItineraryAddDialog.addToItinerary")}
                </button>
              </article>
            ))}
          </aside>
        )}
        <div className="trip-day-area">
          <div className="trip-slider-controls">
            <button
              type="button"
              className="secondary"
              disabled={dayIndex === 0}
              onClick={() => changeDay(dayIndex - 1)}
              aria-label={t("ItineraryManager.previousDay")}
            >
              ←
            </button>
            <label>
              {t("ItineraryManager.goToDay")}
              <select
                value={day.date}
                onChange={(e) =>
                  changeDay(
                    trip.days.findIndex((d) => d.date === e.target.value),
                  )
                }
              >
                {trip.days.map((d, i) => (
                  <option value={d.date} key={d.date}>
                    {i + 1}
                    {t("ItineraryAddDialog.day2")} · {d.date}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="secondary"
              disabled={dayIndex === trip.days.length - 1}
              onClick={() => changeDay(dayIndex + 1)}
              aria-label={t("ItineraryManager.nextDay")}
            >
              →
            </button>
          </div>
          <div
            className="trip-day-quick"
            aria-label={t("ItineraryManager.chooseDay")}
          >
            {trip.days.map((d, i) => (
              <button
                type="button"
                key={d.date}
                data-trip-drop-date={d.date}
                data-trip-drop-index={d.entries.length}
                aria-pressed={i === dayIndex}
                onClick={() => changeDay(i)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  drop(e, d.date, d.entries.length);
                  changeDay(i);
                }}
              >
                {i + 1}
                {t("ItineraryAddDialog.day2")}
              </button>
            ))}
          </div>
          <div
            className="trip-slide"
            role="region"
            aria-roledescription={t("ItineraryManager.slide")}
            aria-label={`${dayIndex + 1} / ${trip.days.length} · ${day.date}`}
            onTouchStart={(e) => {
              touch.current = {
                x: e.changedTouches[0].clientX,
                y: e.changedTouches[0].clientY,
              };
            }}
            onTouchEnd={(e) => {
              if (
                !touch.current ||
                e.target.closest("input,textarea,select,button,a")
              )
                return;
              const dx = e.changedTouches[0].clientX - touch.current.x,
                dy = e.changedTouches[0].clientY - touch.current.y;
              if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.5)
                changeDay(dayIndex + (dx < 0 ? 1 : -1));
              touch.current = null;
            }}
          >
            <h3 tabIndex={-1} ref={heading} aria-live="polite">
              {dayIndex + 1}
              {t("ItineraryAddDialog.day2")} · {day.date}
            </h3>
            <ol
              className="trip-day-list"
              data-trip-drop-date={day.date}
              data-trip-drop-index={day.entries.length}
              onDragOver={(e) => {
                if (editing) e.preventDefault();
              }}
              onDrop={(e) => drop(e, day.date, day.entries.length)}
            >
              {day.entries.map((entry, index) => (
                <li
                  className="trip-place"
                  key={entry.id}
                  id={`trip-entry-${entry.id}`}
                  data-trip-drop-date={day.date}
                  data-trip-drop-index={index}
                  onDragOver={(e) => {
                    if (editing) e.preventDefault();
                  }}
                  onDrop={(e) => drop(e, day.date, index)}
                >
                  <div className="trip-place-heading">
                    <span className="trip-order">{index + 1}</span>
                    {editing && (
                      <button
                        type="button"
                        className="trip-drag"
                        draggable
                        onDragStart={(e) => dragStart(e, { id: entry.id })}
                        {...pointerHandlers({ id: entry.id })}
                        onDragEnd={() => {
                          dragging.current = null;
                        }}
                        aria-label={t("ItineraryManager.moveValue", {
                          entry_place_title: entry.place.title,
                        })}
                      >
                        ⠿ {t("ItineraryManager.dragToMove")}
                      </button>
                    )}
                  </div>
                  <PlaceSummary place={entry.place} lang={lang} t={t} />
                  {editing && (
                    <>
                      <div className="trip-actions">
                        <button
                          type="button"
                          className="secondary"
                          disabled={index === 0}
                          aria-label={t("ItineraryManager.moveValueUp", {
                            entry_place_title: entry.place.title,
                          })}
                          onClick={() => move(entry.id, day.date, index - 1)}
                        >
                          {t("ItineraryManager.up")}
                        </button>
                        <button
                          type="button"
                          className="secondary"
                          disabled={index === day.entries.length - 1}
                          aria-label={t("ItineraryManager.moveValueDown", {
                            entry_place_title: entry.place.title,
                          })}
                          onClick={() => move(entry.id, day.date, index + 1)}
                        >
                          {t("ItineraryManager.down")}
                        </button>
                        <button
                          type="button"
                          className="secondary"
                          onClick={() =>
                            setDraft({
                              ...draft,
                              days: draft.days.map((d) => ({
                                ...d,
                                entries: d.entries.filter(
                                  (v) => v.id !== entry.id,
                                ),
                              })),
                            })
                          }
                        >
                          {t("ItineraryManager.remove")}
                        </button>
                      </div>
                      <label>
                        {t("ItineraryManager.moveToAnotherDay")}
                        <select
                          value=""
                          onChange={(e) => {
                            if (e.target.value) move(entry.id, e.target.value);
                          }}
                        >
                          <option value="">
                            {t("ItineraryManager.chooseDay")}
                          </option>
                          {trip.days
                            .filter((d) => d.date !== day.date)
                            .map((d) => (
                              <option key={d.date} value={d.date}>
                                {d.date}
                              </option>
                            ))}
                        </select>
                      </label>
                    </>
                  )}
                </li>
              ))}
              {!day.entries.length && (
                <li className="trip-empty">
                  {editing
                    ? t("ItineraryManager.dropPlacesHereOrUseAddInTheSaved")
                    : t("ItineraryManager.noPlacesForThisDayChooseEditToAdd")}
                </li>
              )}
            </ol>
            {editing ? (
              <label className="trip-note">
                {t("ItineraryManager.notesForThisDay")}
                <textarea
                  maxLength={3000}
                  value={day.note}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      days: draft.days.map((d) =>
                        d.date === day.date
                          ? { ...d, note: e.target.value }
                          : d,
                      ),
                    })
                  }
                  placeholder={t("ItineraryManager.addPackingRemindersOrPlans")}
                />
              </label>
            ) : (
              <section className="trip-note">
                <h4>{t("ItineraryManager.notesForThisDay")}</h4>
                <p>{day.note || t("ItineraryManager.noNotesYet")}</p>
              </section>
            )}
          </div>
        </div>
      </div>
      <p className="trip-feedback" role="status">
        {message}
      </p>
    </section>
  );
}
