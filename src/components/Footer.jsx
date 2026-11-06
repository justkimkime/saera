import React from "react";
import logo from "../../logo.svg";
import { useApp } from "../state/AppContext.jsx";
import { isPlainLinkClick } from "../link-navigation.js";
export default function Footer() {
  const { t, navigate } = useApp();
  return (
    <footer className="site-footer">
      <img
        className="footer-logo"
        src={logo}
        width="52"
        height="43"
        alt={t("Footer.sAERA")}
      />
      <div className="footer-information">
        <p>
          {t("Footer.tourismDataKoreaTourismOrganizationTourAPI")}
          <br />
          {t("Footer.pleaseVerifyOpeningHoursAndVisitorConditionsBeforeYour")}
        </p>
        <p>{t("Footer.savedPlacesAndItinerariesAreStoredInThisBrowser")}</p>
      </div>
    </footer>
  );
}
