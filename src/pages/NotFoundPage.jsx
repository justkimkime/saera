import React from "react";
import { useApp } from "../state/AppContext.jsx";
export default function NotFoundPage() {
  const { t, navigate } = useApp();
  return (
    <div className="empty-state">
      <h1>{t("NotFoundPage.pageNotFound")}</h1>
      <button className="secondary" onClick={() => navigate("/explore")}>
        {t("NotFoundPage.explorePlaces")}
      </button>
    </div>
  );
}
