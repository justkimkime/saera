import React from "react";
import { useApp } from "../state/AppContext.jsx";
import Icon from "../components/Icon.jsx";

import PlaceCard from "../components/PlaceCard.jsx";
import Pagination from "../components/Pagination.jsx";

import { themes, favoriteKey, wellnessThemes } from "../tourism.js";
export default function SearchResults() {
  const {
    t,
    lang,
    english,
    theme,
    mode,
    result,
    submit,
    province,
    provinceOptions,
    keyword,
    busy,
    snapshot,
    error,
    hasSearched,
    load,
  } = useApp();
  if (!hasSearched) return null;
  return (
    <>
      <section
        className="results-section"
        aria-label={t("SearchResults.searchResults")}
        aria-busy={busy}
      >
        <div className="results-heading">
          <div>
            <p className="eyebrow">YOUR NEXT DESTINATION</p>
            <h2>
              {t("SearchResults.placesToDiscover")}
              {result && <span>{result.total.toLocaleString()}</span>}
            </h2>
          </div>
          <span className="result-note">
            {snapshot
              ? `${themes.find((a) => a.id === snapshot.theme)?.[lang] || ""} · ${snapshot.mode === "region" ? provinceOptions.find((a) => a[0] === snapshot.province)?.[english ? 2 : 1] || t("SearchFilters.allRegions") : snapshot.mode === "keyword" ? `“${snapshot.keyword}”` : t("SearchResults.selectedLocation")}`
              : t("SearchResults.chooseYourFiltersAndSearch")}
            {snapshot?.wellnessThemaCd &&
              ` · ${wellnessThemes.find((item) => item.code === snapshot.wellnessThemaCd)?.[lang] || snapshot.wellnessThemaCd}`}
          </span>
        </div>
        {error ? (
          <div className="empty-state" role="alert">
            <Icon name="search" size={32} />
            <h3>{t("SearchResults.unableToLoadPlaces")}</h3>
            <p>{error}</p>
            <button className="secondary" onClick={() => submit()}>
              {t("SearchResults.tryAgain")}
            </button>
          </div>
        ) : busy ? (
          <div className="empty-state" role="status">
            <span className="loading-mark" />
            <h3>{t("SearchResults.findingPlaces")}</h3>
          </div>
        ) : result?.places.length ? (
          <>
            <div className="result-list">
              {result.places.map((place, i) => (
                <PlaceCard key={favoriteKey(place)} place={place} index={i} />
              ))}
            </div>
            <Pagination
              lang={lang}
              disabled={busy}
              page={result.page}
              count={Math.ceil(result.total / 10)}
              onChange={(page) => {
                load(snapshot, page);
                document
                  .querySelector(".results-section")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
              label={t("SearchResults.pagination")}
            />
            <p className="list-note">
              {t(
                "SearchResults.10PlacesPerPageUnavailableInformationIsOmitted",
              )}
            </p>
          </>
        ) : (
          <div className="empty-state">
            <Icon name="search" size={32} />
            <h3>
              {result
                ? t("SearchResults.noPlacesFound")
                : t("SearchResults.findYourNextDestination")}
            </h3>
            <p>
              {hasSearched
                ? t("SearchResults.tryADifferentRegionOrKeyword")
                : t("SearchResults.chooseFiltersThenPressSearchOrEnter")}
            </p>
          </div>
        )}
      </section>
    </>
  );
}
