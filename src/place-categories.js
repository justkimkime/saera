import { translate } from "./localization.js";
const categories = [
  ["attraction", ["12", "76"]],
  ["culture", ["14", "78"]],
  ["festival", ["15", "85"]],
  ["course", ["25"]],
  ["leisure", ["28", "75"]],
  ["lodging", ["32", "80"]],
  ["shopping", ["38", "79"]],
  ["food", ["39", "82"]],
  ["transport", ["77"]],
];
export function placeCategory(place, lang = "ko") {
  const row = categories.find(([, codes]) =>
    codes.includes(String(place.type)),
  );
  return row
    ? { id: row[0], label: translate(lang, `placeTypes.${row[0]}`) }
    : { id: "other", label: translate(lang, "place-categories.other") };
}
