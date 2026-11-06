import React from "react";
import Tabs from "../components/Tabs.jsx";
import { useApp } from "../state/AppContext.jsx";

import { themes } from "../tourism.js";
import SearchFilters from "../components/SearchFilters.jsx";
import SearchResults from "../components/SearchResults.jsx";
export default function SearchPage() {
  const { t, lang, theme, available, changeTheme } = useApp();
  return (
    <>
      <div className="page-intro">
        <div>
          <p className="eyebrow">EXPLORE KOREA</p>
          <h1>{t("SearchPage.whereWillYouGo")}</h1>
          <p>{t("SearchPage.discoverPlacesThatFitYourJourney")}</p>
        </div>
      </div>
      <Tabs
        id="travel-theme"
        className="theme-tabs"
        label={t("SearchPage.travelThemes")}
        value={theme}
        onChange={changeTheme}
        items={available.map((a) => ({ id: a.id, label: a[lang] }))}
      />
      <div
        id="travel-theme-panel"
        role="tabpanel"
        aria-labelledby={`travel-theme-tab-${theme}`}
        tabIndex={0}
      >
        <SearchFilters />
        <SearchResults />
      </div>
    </>
  );
}
