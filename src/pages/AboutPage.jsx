import React from "react";
import aboutLogo from "../img/logo.png";
import { useApp } from "../state/AppContext.jsx";
export default function AboutPage() {
  const { t } = useApp();
  return (
    <section className="about-page">
      <p className="eyebrow">ABOUT SAERA</p>
      <h1>{t("AboutPage.findYourKindOfTravelSAERA")}</h1>
      <div className="about-introduction">
        <div className="about-logo">
          <img
            src={aboutLogo}
            alt={t("AboutPage.sAERALogoMountainsAndARiverFormedFromThe")}
          />
        </div>
        <div className="about-description">
          <p>{t("AboutPage.sAERATakesItsNameFromTheKoreanWordFor")}</p>
          <p>
            {t("AboutPage.theLogoBringsTogetherTheKoreanConsonantsAndFrom")}
          </p>
          <p>
            {t(
              "AboutPage.alongsideGeneralDestinationGuidesSAERASharesInformationOnAccessible",
            )}
          </p>
          <p>{t("AboutPage.planYourTrip")}</p>
          <p>{t("AboutPage.mapAndNotes")}</p>
          <p>{t("AboutPage.newJourney")}</p>
          <p className="about-storage-notice"><small>{t("AboutPage.browserStorageNotice")}</small></p>
        </div>
      </div>
    </section>
  );
}
