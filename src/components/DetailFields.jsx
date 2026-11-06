import { translate } from "../localization.js";
import React from "react";
import { operationFor, wellnessThemeLabel } from "../tourism.js";
import { textValue } from "../response-data.js";
import { homepageLinks } from "../homepage-links.js";
import { missingDetailFields } from "../detail-required.js";
export default function DetailFields({
  data,
  service,
  lang = "ko",
  introLoaded,
  themeLoaded,
}) {
  const missing = missingDetailFields(data, service, {
    introLoaded,
    themeLoaded,
  });
  const fields = operationFor(service, "detailIntro")?.response || [];
  const all = [
    ...(operationFor(service, "detailCommon")?.response || []),
    ...fields,
    ...(operationFor(
      service,
      service === "access" ? "detailWithTour" : "detailPetTour",
    )?.response || []),
  ];
  const omit =
    /^(contentid|contenttypeid|title|overview|firstimage|firstimage2|orgImage|thumbImage|mapx|mapy|mlevel|createdtime|modifiedtime|addr1|addr2|baseAddr|detailAddr|resultCode|resultMsg|numOfRows|pageNo|totalCount|rnum|cat[123]|lDong.*|lcls.*|cpyrhtDivCd|heritage[123]|seminar|sports|sauna|beauty|beverage|karaoke|barbecue|campfire|bicycle|fitness|publicpc|publicbath|kidsfacility)$/i;
  const entries = Object.entries(Object.assign({}, ...data)).filter(
    ([key, value]) =>
      !omit.test(key) &&
      !/^(zipcode|zipcd|areacode|sigungucode)$/i.test(key) &&
      value != null &&
      String(value).trim(),
  );
  const merged = Object.assign({}, ...data);
  const address = textValue(
    [merged.addr1 || merged.baseAddr, merged.addr2 || merged.detailAddr]
      .filter(Boolean)
      .join(" "),
  );
  const postcode = textValue(merged.zipcode || merged.zipCd || "").trim();
  return entries.length || address || missing.length ? (
    <dl className="detail-fields">
      {address && (
        <div>
          <dt>{translate(lang, "DetailFields.address")}</dt>
          <dd>
            {address}
            {postcode ? ` (${postcode})` : ""}
          </dd>
        </div>
      )}
      {entries.map(([key, value]) => (
        <div key={key}>
          <dt>
            {key.toLowerCase() === "wellnessthemacd"
              ? translate(lang, "DetailFields.wellnessTheme")
              : key.toLowerCase() === "homepage"
                ? translate(lang, "DetailFields.website")
                : key.toLowerCase() === "chkcreditcardshopping"
                  ? translate(lang, "DetailFields.creditCardAcceptance")
                  : key.toLowerCase() === "restroom"
                    ? translate(lang, "DetailFields.restroom")
                    : all.find(
                        (f) => f.name.toLowerCase() === key.toLowerCase(),
                      )?.label || key}
          </dt>
          <dd>
            {key.toLowerCase() === "wellnessthemacd" ? (
              wellnessThemeLabel(value, lang)
            ) : ["homepage", "reservationurl"].includes(key.toLowerCase()) ? (
              <Homepage value={value} />
            ) : (
              textValue(value)
            )}
          </dd>
        </div>
      ))}
      {missing.map((field) => (
        <div key={`missing-${field.key}`}>
          <dt>{translate(lang, field.labelKey)}</dt>
          <dd>
            <strong className="detail-check-needed">
              {translate(lang, "DetailFields.checkRequired")}
            </strong>
            <p className="detail-missing-hint">
              {translate(
                lang,
                "DetailFields.informationHasNotBeenProvidedPleaseCheckWithThe",
              )}
            </p>
          </dd>
        </div>
      ))}
    </dl>
  ) : (
    <p>
      {translate(
        lang,
        "DetailFields.noAdditionalVisitorInformationIsAvailable",
      )}
    </p>
  );
}

function Homepage({ value }) {
  const links = homepageLinks(value);
  return links.length ? (
    <div className="homepage-links">
      {links.map((link) => (
        <a
          key={link.url}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          {link.label} ↗
        </a>
      ))}
    </div>
  ) : (
    textValue(value)
  );
}
