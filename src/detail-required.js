export function missingDetailFields(
  data,
  service,
  { introLoaded = false, themeLoaded = false } = {},
) {
  const [common = {}, ...extra] = data;
  const merged = Object.assign({}, common, ...extra);
  const type = String(
    common.contentid ? common.contenttypeid : common.contentTypeId || "",
  );
  const required = [];
  const add = (keys, labelKey) => {
    const values = Object.entries(merged)
      .filter(([key]) => keys.includes(key.toLowerCase()))
      .map(([, value]) => value);
    if (!values.some((value) => value != null && String(value).trim()))
      required.push({ key: keys[0], labelKey });
  };
  if (introLoaded) {
    const suffix =
      {
        14: "culture",
        78: "culture",
        28: "leports",
        75: "leports",
        38: "shopping",
        79: "shopping",
        39: "food",
        82: "food",
      }[type] || "";
    if (type === "32" || type === "80") {
      add(["checkintime"], "detailLabels.check_in_time");
      add(["checkouttime"], "detailLabels.check_out_time");
    } else if (type === "15" || type === "85") {
      add(["playtime"], "detailLabels.performance_hours");
    } else if (type !== "25" && type !== "77") {
      add(
        [
          suffix === "shopping"
            ? "opentime"
            : suffix === "food"
              ? "opentimefood"
              : `usetime${suffix}`,
        ],
        "detailLabels.opening_hours",
      );
      add([`restdate${suffix}`], "detailLabels.closed_days");
    }
    if (service === "wellness")
      add(["expguide"], "detailLabels.experience_information");
  }
  if (themeLoaded && service === "access") {
    add(["route"], "detailLabels.access_route");
    add(["exit"], "detailLabels.entrance_access");
    // Use the accessibility response rather than the general restroom description.
    const theme = extra[extra.length - 1] || {};
    if (theme.restroom == null || !String(theme.restroom).trim())
      required.push({
        key: "accessible-restroom",
        labelKey: "detailLabels.accessible_restroom",
      });
  }
  if (themeLoaded && service === "pet") {
    add(["acmpypsblcpam"], "detailLabels.allowed_animals");
    add(["acmpytypecd"], "detailLabels.companion_policy");
    add(["acmpyneedmtr"], "detailLabels.companion_requirements");
  }
  return required;
}
