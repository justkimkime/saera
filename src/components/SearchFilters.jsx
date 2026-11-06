import React from "react";
import Tabs from "./Tabs.jsx";
import { useApp } from "../state/AppContext.jsx";
import Icon from "../components/Icon.jsx";

import TourMap from "../components/TourMap.jsx";
import { themes, types, operationFor, wellnessThemes } from "../tourism.js";
export default function SearchFilters() {
  const {
    t,
    lang,
    theme,
    available,
    mode,
    setMode,
    setError,
    result,
    coords,
    setCoords,
    setNotice,
    openPlace,
    submit,
    province,
    setProvince,
    provinceOptions,
    district,
    setDistrict,
    districts,
    keyword,
    setKeyword,
    locate,
    radius,
    setRadius,
    service,
    type,
    wellnessThemaCd,
    setWellnessThemaCd,
    setType,
    busy,
    codeError,
    codeStale,
    provinceCodeStatus,
    hasSearched,
    snapshot,
    mapOpen,
    setMapOpen,
  } = useApp();
  return (
    <>
      <section
        aria-label={t("SearchFilters.searchFilters")}
        className="search-section"
      >
        <div className="search-heading">
          <h2>{themes.find((a) => a.id === theme)?.[lang]}</h2>
        </div>
        <Tabs
          id="search-mode"
          className="mode-tabs"
          label={t("SearchFilters.searchMode")}
          value={mode}
          onChange={(value) => {
            setMode(value);
            setError("");
          }}
          items={[
            ["region", "search.byRegion", "pin"],
            ["nearby", "search.nearby", "location"],
            ["keyword", "search.byKeyword", "search"],
          ].map(([id, labelKey, icon]) => ({
            id,
            label: (
              <>
                <Icon name={icon} size={20} />
                {t(labelKey)}
              </>
            ),
          }))}
        />
        <div
          id="search-mode-panel"
          role="tabpanel"
          aria-labelledby={`search-mode-tab-${mode}`}
          tabIndex={0}
        >
          {hasSearched &&
            result &&
            snapshot?.mode !== "keyword" &&
            mode !== "keyword" && (
              <div className="search-map-section">
                <button
                  type="button"
                  className="search-map-toggle"
                  aria-expanded={mapOpen}
                  aria-controls={mapOpen ? "search-map-panel" : undefined}
                  onClick={() => setMapOpen((value) => !value)}
                >
                  <Icon name="pin" size={20} />
                  {mapOpen
                    ? t("ItineraryManager.hideMap")
                    : t("ItineraryManager.showMap")}
                  <span aria-hidden="true">{mapOpen ? "−" : "+"}</span>
                </button>
                {mapOpen && (
                  <div id="search-map-panel">
                    <TourMap
                      places={result?.places || []}
                      center={coords}
                      lang={lang}
                      onOpen={openPlace}
                      onPick={
                        mode === "nearby"
                          ? (point) => {
                              setCoords(point);
                              setNotice(
                                t("SearchFilters.locationSelectedPressSearch"),
                              );
                            }
                          : undefined
                      }
                    />
                  </div>
                )}
              </div>
            )}
          <form onSubmit={submit} className="search-form">
            {mode === "region" ? (
              <>
                <label>
                  {t("SearchFilters.provinceCity")}
                  <select
                    value={province}
                    disabled={
                      provinceCodeStatus === "loading" ||
                      !provinceOptions.length
                    }
                    onChange={(e) => setProvince(e.target.value)}
                  >
                    <option value="">{t("SearchFilters.allRegions")}</option>
                    {provinceOptions.map(([code, ko, en]) => (
                      <option value={code} key={code}>
                        {lang === "en" ? en : ko}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  {t("SearchFilters.district")}
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    disabled={!province || !districts.length}
                  >
                    <option value="">{t("SearchFilters.allDistricts")}</option>
                    {districts.map((a) => (
                      <option key={a.code} value={a.code}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </label>
              </>
            ) : mode === "keyword" ? (
              <div className="keyword-label">
                <label htmlFor="destination-keyword">
                  {t("SearchFilters.whatWouldYouLikeToDiscover")}
                </label>
                <div className="keyword-input">
                  <Icon name="search" size={20} />
                  <input
                    id="destination-keyword"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder={t("SearchFilters.enterAPlaceNameOrKeyword")}
                    maxLength={100}
                  />
                  {keyword && (
                    <button
                      type="button"
                      onClick={() => setKeyword("")}
                      aria-label={t("SearchFilters.clearKeyword")}
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div className="location-field">
                  <span>{t("SearchFilters.searchLocation")}</span>
                  <button type="button" className="secondary" onClick={locate}>
                    <Icon name="location" size={20} />
                    {t("SearchFilters.useMyLocation")}
                  </button>
                  <small>
                    {coords
                      ? `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`
                      : hasSearched
                        ? t("SearchFilters.orChooseAPointOnTheLoadedMap")
                        : t("SearchFilters.getYourLocationThenPressSearch")}
                  </small>
                </div>
                <label>
                  {t("SearchFilters.searchRadius")}
                  <select
                    value={radius}
                    onChange={(e) => setRadius(e.target.value)}
                  >
                    {[1000, 3000, 5000, 10000, 20000].map((v) => (
                      <option value={v} key={v}>
                        {v / 1000} km
                      </option>
                    ))}
                  </select>
                </label>
              </>
            )}
            {theme !== "wellness" &&
              operationFor(
                service,
                {
                  region: "areaBasedList",
                  keyword: "searchKeyword",
                  nearby: "locationBasedList",
                }[mode],
              )?.params.some((p) => p.name === "contentTypeId") && (
                <label>
                  {t("SearchFilters.category")}
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                  >
                    <option value="">{t("SearchFilters.allCategories")}</option>
                    {types[lang].map(([id, name]) => (
                      <option key={id} value={id}>
                        {name}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            {theme === "wellness" && (
              <label>
                {t("DetailFields.wellnessTheme")}
                <select
                  value={wellnessThemaCd}
                  onChange={(e) => setWellnessThemaCd(e.target.value)}
                >
                  <option value="">{t("SearchFilters.allThemes")}</option>
                  {wellnessThemes.map((item) => (
                    <option key={item.code} value={item.code}>
                      {item[lang]}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <button
              type="submit"
              className="primary search-button"
              disabled={busy}
            >
              <Icon name="search" size={20} />
              {busy ? t("SearchFilters.searching") : t("SearchFilters.search")}
            </button>
            <p className="form-hint">
              {mode === "keyword"
                ? t("SearchFilters.searchForPlacesByKeyword")
                : mode === "nearby"
                  ? t(
                      "SearchFilters.chooseALocationThenPressSearchMovingTheMap",
                    )
                  : t("SearchFilters.chooseYourFiltersThenPressSearch")}
              {codeError &&
                t("SearchFilters.regionOptionsCouldNotBeLoadedReopenThePage")}
              {codeStale &&
                t("SearchFilters.usingSavedRegionOptionsBecauseRefreshFailed")}
            </p>
          </form>
        </div>
      </section>
    </>
  );
}
