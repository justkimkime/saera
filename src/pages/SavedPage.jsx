import React from "react";
import ItineraryManager from "../components/ItineraryManager.jsx";
import Tabs from "../components/Tabs.jsx";
import { useApp } from "../state/AppContext.jsx";
import Icon from "../components/Icon.jsx";

import PlaceCard from "../components/PlaceCard.jsx";

import { favoriteKey } from "../tourism.js";

export default function SavedPage() {
  const { t, lang, favorites, navigate, collectionTab, setCollectionTab } =
    useApp();
  const saved = favorites.filter((p) => p.lang === lang);
  return (
    <>
      <div className="page-intro">
        <div>
          <p className="eyebrow">YOUR COLLECTION</p>
          <h1>{t("ItineraryManager.savedPlaces")}</h1>
          <p>{t("SavedPage.savePlacesAndPlanYourJourney")}</p>
        </div>
      </div>
      <Tabs
        id="collection"
        className="theme-tabs"
        label={t("SavedPage.savedPlacesAndItineraries")}
        value={collectionTab}
        onChange={setCollectionTab}
        items={[
          { id: "favorites", label: t("SavedPage.savedPlaces") },
          { id: "itineraries", label: t("ItineraryManager.itineraries") },
        ]}
      />
      <div
        id="collection-panel"
        role="tabpanel"
        aria-labelledby={`collection-tab-${collectionTab}`}
        tabIndex={0}
      >
        <p className="saved-note">
          {t("SavedPage.savedInThisBrowserOnlyClearingBrowserDataRemoves")}
        </p>
        <div hidden={collectionTab !== "itineraries"}>
          <ItineraryManager />
        </div>
        <div hidden={collectionTab !== "favorites"}>
          <div className="result-list">
            {saved.map((p) => (
              <PlaceCard key={favoriteKey(p)} place={p} showSavedSource />
            ))}
          </div>
          {!saved.length && (
            <div className="empty-state">
              <Icon name="heart" size={32} />
              <h3>{t("SavedPage.noSavedPlacesYet")}</h3>
              <button
                type="button"
                className="secondary"
                onClick={() => navigate("/explore")}
              >
                {t("SavedPage.explorePlaces")}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
