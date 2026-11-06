import React from "react";
import { useApp } from "../state/AppContext.jsx";
import Icon from "../components/Icon.jsx";
import Picture from "../components/Picture.jsx";

import DetailFields from "../components/DetailFields.jsx";
import TourMap from "../components/TourMap.jsx";

import { usePlaceDetail } from "../hooks/usePlaceDetail.js";
export default function PlaceDetailPage() {
  const {
    t,
    lang,
    path,
    favorites,
    selectedPlace,
    detailBackPath,
    navigate,
    toggle,
    isSaved,
    setItineraryPlace,
  } = useApp();
  const { detail, detailData, detailError } = usePlaceDetail({
    path,
    lang,
    favorites,
    selectedPlace,
    t,
  });
  return (
    <section className="detail-page">
      <button className="back-button" onClick={() => navigate(detailBackPath)}>
        <Icon name="back" size={20} />
        {detailBackPath === "/saved"
          ? t("PlaceDetailPage.backToSavedPlaces")
          : t("PlaceDetailPage.backToSearch")}
      </button>
      {detailError ? (
        <div className="empty-state" role="alert">
          {detailError}
        </div>
      ) : !detailData ? (
        <div className="empty-state" role="status">
          {t("PlaceDetailPage.loadingPlaceDetails")}
        </div>
      ) : (
        <>
          <div className="detail-heading">
            <div>
              <p className="eyebrow">PLACE DETAILS</p>
              <h1>{detail?.title}</h1>
              <p>{detail?.address}</p>
            </div>
            <div className="trip-actions">
              <button
                type="button"
                className="secondary"
                onClick={() => setItineraryPlace(detail)}
              >
                {t("ItineraryAddDialog.addToItinerary")}
              </button>
              <button className="secondary" onClick={() => toggle(detail)}>
                <Icon name="heart" filled={isSaved(detail)} />
                {isSaved(detail)
                  ? t("PlaceDetailPage.unsave")
                  : t("PlaceDetailPage.save")}
              </button>
            </div>
          </div>
          <div className="detail-photo">
            <div className="img">
              <Picture src={detail?.image} title={detail?.title} />
            </div>
          </div>
          {detail?.description && (
            <section className="detail-section">
              <h2>{t("PlaceDetailPage.aboutThisPlace")}</h2>
              <p>{detail.description}</p>
            </section>
          )}
          <section className="detail-section">
            <h2>{t("PlaceDetailPage.visitorInformation")}</h2>
            <DetailFields
              data={[detailData.common, ...(detailData.extra || [])]}
              service={detail.service}
              introLoaded={detailData.introLoaded}
              themeLoaded={detailData.themeLoaded}
              lang={lang}
            />
            {detailData.partial && (
              <p className="form-hint">
                {t("PlaceDetailPage.someVisitorInformationCouldNotBeLoaded")}
              </p>
            )}
          </section>
          {detail.lat && detail.lng && (
            <TourMap places={[detail]} lang={lang} />
          )}
        </>
      )}
    </section>
  );
}
