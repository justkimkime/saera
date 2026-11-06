import { languagePolicy } from "../language-config.js";
import { useState, useEffect } from "react";
import { requestTour, normalizePlace } from "../tourism.js";
export function usePlaceDetail({ path, lang, favorites, selectedPlace, t }) {
  const [detail, setDetail] = useState(null),
    [detailData, setDetailData] = useState(null),
    [detailError, setDetailError] = useState("");
  useEffect(() => {
    if (!path.startsWith("/places/")) return;
    const parts = path.split("/"),
      sid = parts[2],
      id = parts[3];
    const p =
      selectedPlace?.id === id && selectedPlace.service === sid
        ? selectedPlace
        : favorites.find((a) => a.id === id && a.service === sid);
    const controller = new AbortController();
    setDetailData(null);
    setDetailError("");
    const params = {
      contentId: id,
      contentid: id,
      contentTypeId: p?.type,
      langDivCd: languagePolicy(p?.lang || (sid === "en" ? "en" : lang))
        .wellnessCode,
      defaultYN: "Y",
      firstImageYN: "Y",
      addrinfoYN: "Y",
      mapinfoYN: "Y",
      overviewYN: "Y",
    };
    requestTour(sid, "detailCommon", params, controller.signal)
      .then(async (r) => {
        if (!r.items[0])
          throw new Error(t("usePlaceDetail.noDetailsAvailable"));
        const item = r.items[0],
          place = normalizePlace(
            item,
            sid,
            p?.lang || lang,
            p?.theme || (["ko", "en"].includes(sid) ? "general" : sid),
          );
        setDetail(place);
        setDetailData({ common: item });
        const extra = await Promise.allSettled(
          [
            "detailIntro",
            ...(sid === "access"
              ? ["detailWithTour"]
              : sid === "pet"
                ? ["detailPetTour"]
                : []),
          ].map((prefix) =>
            requestTour(
              sid,
              prefix,
              { ...params, contentTypeId: place.type || p?.type },
              controller.signal,
            ),
          ),
        );
        if (!controller.signal.aborted)
          setDetailData({
            common: item,
            extra: extra.flatMap((v) =>
              v.status === "fulfilled" ? v.value.items : [],
            ),
            introLoaded: extra[0]?.status === "fulfilled",
            themeLoaded: extra[1]?.status === "fulfilled",
            partial: extra.some((v) => v.status === "rejected"),
          });
      })
      .catch((e) => {
        if (e.name !== "AbortError") setDetailError(e.message);
      });
    return () => controller.abort();
  }, [path]);
  return { detail, detailData, detailError };
}
