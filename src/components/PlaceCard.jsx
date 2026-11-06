import React from "react";
import { isPlainLinkClick } from "../link-navigation.js";
import { useApp } from "../state/AppContext.jsx";
import Icon from "../components/Icon.jsx";
import Picture from "../components/Picture.jsx";

import { types, themes } from "../tourism.js";
export default function PlaceCard({ place, showSavedSource = false }) {
  const { t, lang, openPlace, toggle, isSaved, setItineraryPlace } = useApp();
  const savedTheme = themes.find((item) => item.id === place.theme);
  const category = (types[place.lang] || types.ko).find(
    (a) => a[0] === place.type,
  )?.[1];
  return (
    <article className="place-card">
      <a
        className="card-link"
        href={`/places/${place.service}/${place.id}`}
        onClick={(event) => {
          if (isPlainLinkClick(event)) {
            event.preventDefault();
            openPlace(place);
          }
        }}
      >
        <div className="card-picture">
          <Picture src={place.image} title={place.title} />
        </div>
        <div className="card-copy">
          <div className="card-meta">
            <span>{category || t("PlaceCard.travelDestination")}</span>
            {showSavedSource && savedTheme && (
              <span className="card-saved-source">
                {savedTheme[lang] || savedTheme.ko}
              </span>
            )}
            {place.distance != null && (
              <span>{(place.distance / 1000).toFixed(1)} km</span>
            )}
          </div>
          <h3>{place.title}</h3>
          <p className="address">
            <Icon name="pin" size={16} />
            {place.address || t("ItineraryManager.addressUnavailable")}
          </p>
          {place.description && (
            <p className="card-description">{place.description}</p>
          )}
          <span className="text-link">{t("PlaceCard.viewDetails")} ↗</span>
        </div>
      </a>
      <button
        type="button"
        className="secondary card-itinerary-add"
        onClick={() => setItineraryPlace(place)}
      >
        {t("ItineraryAddDialog.addToItinerary")}
      </button>
      <button
        className={"heart-button " + (isSaved(place) ? "is-saved" : "")}
        onClick={() => toggle(place)}
        aria-label={
          isSaved(place)
            ? t("PlaceCard.unsaveValue", { place_title: place.title })
            : t("PlaceCard.saveValue", { place_title: place.title })
        }
        aria-pressed={isSaved(place)}
      >
        <Icon name="heart" filled={isSaved(place)} />
      </button>
    </article>
  );
}
