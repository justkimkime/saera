import { useEffect, useState } from "react";
import { readItineraries, itineraryStorageKey } from "../itineraries.js";
export function useItineraries({ t, setNotice }) {
  const [trips, setTrips] = useState(() => {
    try {
      return readItineraries(localStorage);
    } catch {
      return [];
    }
  });
  const [itineraryPlace, setItineraryPlace] = useState(null);
  const [collectionTab, setCollectionTab] = useState("favorites");
  const [storageError, setStorageError] = useState("");
  useEffect(() => {
    const sync = (e) => {
      if (e.key === itineraryStorageKey || e.key === null) {
        try {
          setTrips(readItineraries(localStorage));
        } catch {
          setStorageError(
            t("useItineraries.couldNotReadItinerariesCheckBrowserStorage"),
          );
        }
      }
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, [t]);
  const commitTrip = (trip) => {
    try {
      const saved = readItineraries(localStorage);
      const next = [
        ...saved.filter((v) => v.id !== trip.id),
        { ...trip, updatedAt: new Date().toISOString() },
      ];
      localStorage.setItem(itineraryStorageKey, JSON.stringify(next));
      setTrips(next);
      setStorageError("");
      setNotice(t("useItineraries.itinerarySavedInThisBrowser"));
      return true;
    } catch {
      setStorageError(
        t("useItineraries.couldNotSaveCheckBrowserStorageAndTryAgain"),
      );
      return false;
    }
  };
  const deleteTrip = (id) => {
    try {
      const next = readItineraries(localStorage).filter((t) => t.id !== id);
      localStorage.setItem(itineraryStorageKey, JSON.stringify(next));
      setTrips(next);
      setStorageError("");
      return true;
    } catch {
      setStorageError(t("useItineraries.couldNotDeleteItinerary"));
      return false;
    }
  };
  return {
    trips,
    commitTrip,
    deleteTrip,
    itineraryPlace,
    setItineraryPlace,
    collectionTab,
    setCollectionTab,
    itineraryStorageError: storageError,
  };
}
