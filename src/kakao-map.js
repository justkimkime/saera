let loading;

// Share one SDK load across search/detail maps and React effect remounts.
export function loadKakaoMap(key) {
  if (!key?.trim()) return Promise.reject(new Error("missing-key"));
  if (window.kakao?.maps?.Map) return Promise.resolve(window.kakao.maps);
  if (loading) return loading;
  loading = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    let settled = false;
    const fail = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      script.remove();
      loading = undefined;
      reject(new Error("sdk-load-failed"));
    };
    const timer = setTimeout(fail, 15000);
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(key.trim())}&autoload=false`;
    script.async = true;
    script.onerror = fail;
    script.onload = () => {
      if (settled) return;
      if (!window.kakao?.maps?.load) return fail();
      window.kakao.maps.load(() => {
        if (settled) return;
        if (!window.kakao.maps.Map) return fail();
        settled = true;
        clearTimeout(timer);
        resolve(window.kakao.maps);
      });
    };
    document.head.appendChild(script);
  });
  return loading;
}

export function validMapPoint(point) {
  return (
    point &&
    Number.isFinite(point.lat) &&
    Number.isFinite(point.lng) &&
    Math.abs(point.lat) <= 90 &&
    Math.abs(point.lng) <= 180
  );
}
