import { translate } from "../localization.js";
import React, { useEffect, useRef, useState } from "react";
import { loadKakaoMap, validMapPoint } from "../kakao-map.js";

export default function TourMap({
  places = [],
  center,
  onPick,
  onOpen,
  lang,
  highlightKeys,
  caption,
}) {
  const container = useRef(null);
  const mapRef = useRef(null);
  const callbacks = useRef({ onPick, onOpen });
  const [status, setStatus] = useState("loading");
  callbacks.current = { onPick, onOpen };
  useEffect(() => {
    let disposed = false;
    let observer;
    let removeClick;
    loadKakaoMap(import.meta.env.VITE_KAKAO_MAP_APP_KEY)
      .then((maps) => {
        if (disposed) return;
        const map = new maps.Map(container.current, {
          center: new maps.LatLng(37.5665, 126.978),
          level: 8,
          scrollwheel: false,
        });
        mapRef.current = map;
        map.addControl(new maps.ZoomControl(), maps.ControlPosition.RIGHT);
        const click = (event) =>
          callbacks.current.onPick?.({
            lat: event.latLng.getLat(),
            lng: event.latLng.getLng(),
          });
        maps.event.addListener(map, "click", click);
        removeClick = () => maps.event.removeListener(map, "click", click);
        observer = new ResizeObserver(() => {
          const position = map.getCenter();
          map.relayout();
          map.setCenter(position);
        });
        observer.observe(container.current);
        setStatus("ready");
      })
      .catch((error) => {
        if (!disposed)
          setStatus(error.message === "missing-key" ? "missing-key" : "error");
      });
    return () => {
      disposed = true;
      observer?.disconnect();
      removeClick?.();
      mapRef.current = null;
      container.current?.replaceChildren();
    };
  }, []);
  useEffect(() => {
    if (status !== "ready" || !mapRef.current) return;
    const maps = window.kakao.maps;
    const map = mapRef.current;
    const overlays = [];
    const points = places
      .map((place, index) => ({ place, number: index + 1 }))
      .filter(({ place }) => validMapPoint(place));
    let popup;
    for (const { place, number } of points) {
      const position = new maps.LatLng(place.lat, place.lng);
      const button = document.createElement("button");
      button.type = "button";
      button.className =
        "place-pin" +
        (highlightKeys?.has(`${place.service}:${place.id}:${place.lang}`)
          ? " is-itinerary"
          : "");
      button.setAttribute("aria-label", `${number}. ${place.title}`);
      const shape = document.createElement("span");
      const label = document.createElement("b");
      label.textContent = number;
      shape.append(label);
      button.append(shape);
      button.onclick = () => {
        popup?.setMap(null);
        const content = document.createElement("button");
        content.type = "button";
        content.className = "map-place";
        content.textContent = place.title;
        content.onclick = () => callbacks.current.onOpen?.(place);
        popup = new maps.CustomOverlay({
          map,
          position,
          content,
          yAnchor: 2,
          zIndex: 10,
          clickable: true,
        });
      };
      overlays.push(
        new maps.CustomOverlay({
          map,
          position,
          content: button,
          yAnchor: 1,
          clickable: true,
        }),
      );
    }
    if (validMapPoint(center)) {
      const dot = document.createElement("span");
      dot.className = "map-center-dot";
      dot.setAttribute(
        "aria-label",
        translate(lang, "SearchFilters.searchLocation"),
      );
      overlays.push(
        new maps.CustomOverlay({
          map,
          position: new maps.LatLng(center.lat, center.lng),
          content: dot,
          yAnchor: 0.5,
          zIndex: 2,
        }),
      );
    }
    if (points.length === 1) {
      map.setCenter(new maps.LatLng(points[0].place.lat, points[0].place.lng));
      map.setLevel(5);
    } else if (points.length > 1) {
      const bounds = new maps.LatLngBounds();
      points.forEach(({ place }) =>
        bounds.extend(new maps.LatLng(place.lat, place.lng)),
      );
      map.setBounds(bounds, 48, 48, 48, 48);
    } else if (validMapPoint(center)) {
      map.setCenter(new maps.LatLng(center.lat, center.lng));
      map.setLevel(6);
    }
    return () => {
      popup?.setMap(null);
      overlays.forEach((overlay) => overlay.setMap(null));
    };
  }, [status, places, center, lang, highlightKeys]);
  return (
    <div className="map-wrap">
      <div
        ref={container}
        className="tour-map"
        aria-label={translate(lang, "TourMap.travelDestinationsMap")}
      />
      {status !== "ready" && (
        <div
          className="map-status"
          role={status === "loading" ? "status" : "alert"}
        >
          {status === "loading"
            ? translate(lang, "TourMap.loadingMap")
            : status === "missing-key"
              ? translate(lang, "TourMap.addVITEKAKAOMAPAPPKEYToEnvLocal")
              : translate(
                  lang,
                  "TourMap.mapCouldNotLoadCheckTheJavaScriptKeyRegistered",
                )}
        </div>
      )}
      {status === "ready" && (
        <span className="map-caption">
          {caption || translate(lang, "TourMap.mapShowsThisPageSResults")}
        </span>
      )}
    </div>
  );
}
