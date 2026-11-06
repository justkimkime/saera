import { languagePolicy } from "../language-config.js";
import { useState, useEffect, useRef } from "react";
import { serviceFor, normalizePlace, operationFor } from "../tourism.js";
import { getRegionCodes, getSearchResults } from "../api-cache.js";
const initial = () => ({
  mode: "region",
  province: "11",
  provinceOptions: [],
  district: "",
  districts: [],
  provinceCodeStatus: "idle",
  districtCodeStatus: "idle",
  keyword: "",
  type: "",
  wellnessThemaCd: "",
  coords: null,
  radius: "5000",
  snapshot: null,
  result: null,
  busy: false,
  error: "",
  hasSearched: false,
  mapOpen: false,
  mapInitialized: false,
});
export function useSearch({ theme, lang, t, english, setNotice, active }) {
  const key = `${lang}/${theme}`,
    service = serviceFor(theme, lang);
  const [cache, setCache] = useState({});
  const state = cache[key] || initial();
  const requestIds = useRef({});
  const update = (field, value) =>
    setCache((all) => {
      const previous = all[key] || initial();
      return {
        ...all,
        [key]: {
          ...previous,
          [field]: typeof value === "function" ? value(previous[field]) : value,
        },
      };
    });
  const {
    mode,
    province,
    provinceOptions,
    district,
    districts,
    provinceCodeStatus,
    districtCodeStatus,
    keyword,
    type,
    wellnessThemaCd,
    coords,
    radius,
    snapshot,
    result,
    busy,
    error,
  } = state;
  const setMode = (value) => update("mode", value);
  const setProvince = (value) => update("province", value);
  const setProvinceOptions = (value) => update("provinceOptions", value);
  const setDistrict = (value) => update("district", value);
  const setDistricts = (value) => update("districts", value);
  const setMapOpen = (value) => update("mapOpen", value);
  const setKeyword = (value) => update("keyword", value);
  const setType = (value) => update("type", value);
  const setWellnessThemaCd = (value) => update("wellnessThemaCd", value);
  const setCoords = (value) => update("coords", value);
  const setRadius = (value) => update("radius", value);
  const setSnapshot = (value) => update("snapshot", value);
  const setResult = (value) => update("result", value);
  const setBusy = (value) => update("busy", value);
  const setError = (value) => update("error", value);
  useEffect(() => {
    if (!active || mode !== "region") return;
    let current = true;
    update("provinceCodeStatus", "loading");
    getRegionCodes(service, lang)
      .then(({ items, stale }) => {
        if (!current) return;
        setProvinceOptions(items.map((a) => [String(a.code), a.name, a.name]));
        update("provinceCodeStatus", stale ? "stale" : "ready");
      })
      .catch(() => {
        if (current) update("provinceCodeStatus", "error");
      });
    return () => {
      current = false;
    };
  }, [service, lang, active, mode]);
  useEffect(() => {
    if (!active || mode !== "region") return;
    let current = true;
    setDistricts([]);
    if (!province) {
      update("districtCodeStatus", "idle");
      return;
    }
    update("districtCodeStatus", "loading");
    getRegionCodes(service, lang, province)
      .then(({ items, stale }) => {
        if (!current) return;
        setDistricts(items);
        update("districtCodeStatus", stale ? "stale" : "ready");
      })
      .catch(() => {
        if (current) update("districtCodeStatus", "error");
      });
    return () => {
      current = false;
    };
  }, [province, service, lang, active, mode]);
  async function load(criteria, page = 1) {
    const id = (requestIds.current[key] || 0) + 1;
    requestIds.current[key] = id;
    setBusy(true);
    update("hasSearched", true);
    setError("");
    try {
      const prefix = {
        region: "areaBasedList",
        keyword: "searchKeyword",
        nearby: "locationBasedList",
      }[criteria.mode];
      const r = await getSearchResults(criteria.service, prefix, {
        numOfRows: 10,
        pageNo: page,
        langDivCd: languagePolicy(criteria.lang).wellnessCode,
        lDongRegnCd: criteria.mode === "region" ? criteria.province : "",
        lDongSignguCd: criteria.mode === "region" ? criteria.district : "",
        keyword: criteria.mode === "keyword" ? criteria.keyword : "",
        contentTypeId: criteria.type,
        wellnessThemaCd:
          criteria.theme === "wellness" ? criteria.wellnessThemaCd : "",
        mapX: criteria.mode === "nearby" ? criteria.coords?.lng : "",
        mapY: criteria.mode === "nearby" ? criteria.coords?.lat : "",
        radius: criteria.mode === "nearby" ? criteria.radius : "",
        arrange: criteria.mode === "nearby" ? "E" : "A",
      });
      if (id !== requestIds.current[key]) return;
      setResult({
        ...r,
        page,
        places: r.items.map((item) =>
          normalizePlace(item, criteria.service, criteria.lang, criteria.theme),
        ),
      });
      setSnapshot(criteria);
      if (criteria.mode !== "keyword")
        setCache((all) => {
          const previous = all[key] || initial();
          return {
            ...all,
            [key]: {
              ...previous,
              mapOpen: previous.mapInitialized ? previous.mapOpen : true,
              mapInitialized: true,
            },
          };
        });
    } catch (e) {
      if (id === requestIds.current[key]) {
        setError(e.message);
        setResult(null);
      }
    } finally {
      if (id === requestIds.current[key]) setBusy(false);
    }
  }
  function submit(e) {
    e?.preventDefault();
    if (busy) return;
    if (mode === "keyword" && !keyword.trim()) {
      setError(t("useSearch.pleaseEnterAKeyword"));
      return;
    }
    if (mode === "nearby" && !coords) {
      setError(
        hasSearched && result && snapshot?.mode !== "keyword"
          ? t("useSearch.useYourLocationOrChooseAPointOnThe")
          : t("useSearch.getYourLocationBeforeSearching"),
      );
      return;
    }
    load({
      mode,
      service,
      lang,
      theme,
      province,
      district,
      keyword: keyword.trim(),
      type: operationFor(
        service,
        {
          region: "areaBasedList",
          keyword: "searchKeyword",
          nearby: "locationBasedList",
        }[mode],
      )?.params.some((p) => p.name === "contentTypeId")
        ? type
        : "",
      coords,
      radius,
      wellnessThemaCd,
    });
  }
  function locate() {
    if (!navigator.geolocation) {
      setError(t("useSearch.locationIsUnavailableTryRegionOrKeywordSearch"));
      return;
    }
    setNotice(t("useSearch.findingYourLocation"));
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setCoords({ lat: p.coords.latitude, lng: p.coords.longitude });
        setNotice(t("useSearch.locationSelectedPressSearch"));
      },
      () =>
        setError(t("useSearch.unableToAccessYourLocationTryRegionOrKeyword")),
      { timeout: 10000, maximumAge: 60000 },
    );
  }

  return {
    ...state,
    service,
    load,
    submit,
    locate,
    setMode,
    setProvinceOptions,
    setDistrict,
    setDistricts,
    setMapOpen,
    codeError: provinceCodeStatus === "error" || districtCodeStatus === "error",
    codeStale: provinceCodeStatus === "stale" || districtCodeStatus === "stale",
    setKeyword,
    setType,
    setWellnessThemaCd,
    setCoords,
    setRadius,
    setSnapshot,
    setResult,
    setBusy,
    setError,
    setProvince: (value) => {
      setProvince(value);
      setDistrict("");
    },
  };
}
