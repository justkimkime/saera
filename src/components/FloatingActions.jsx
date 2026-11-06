import React from "react";
import Icon from "./Icon.jsx";
import { useApp } from "../state/AppContext.jsx";
import { isPlainLinkClick } from "../link-navigation.js";
export default function FloatingActions() {
  const { t, navigate, favorites, lang, notice } = useApp();
  return (
    <>
      <a
        href="/saved"
        className="saved-float"
        aria-label={t("FloatingActions.viewSavedPlaces")}
        onClick={(event) => {
          if (isPlainLinkClick(event)) {
            event.preventDefault();
            navigate("/saved");
          }
        }}
      >
        <div>
          <Icon name="heart" filled />
          {/* <span>{favorites.filter((p) => p.lang === lang).length}</span> */}
        </div>
      </a>
      <button
        className="top-button secondary"
        aria-label={t("FloatingActions.backToTop")}
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      >
        <Icon name="arrow" />
      </button>
      {notice && (
        <div className="toast" role="status">
          {notice}
        </div>
      )}
    </>
  );
}
