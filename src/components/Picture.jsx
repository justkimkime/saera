import React, { useState, useEffect } from "react";
import { useApp } from "../state/AppContext.jsx";
import Icon from "./Icon.jsx";
export default function Picture({ src, title }) {
  const { t } = useApp();
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  return src && !failed ? (
    <img src={src} alt={title} loading="lazy" onError={() => setFailed(true)} />
  ) : (
    <div className="photo-empty">
      <Icon name="image" />
      <span>{t("picture.unavailable")}</span>
    </div>
  );
}
