import { translate } from "../localization.js";
import React from "react";
function Arrow({ right = false, double = false }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={right ? { transform: "rotate(180deg)" } : undefined}
    >
      <path d={double ? "m13 6-6 6 6 6m6-12-6 6 6 6" : "m15 6-6 6 6 6"} />
    </svg>
  );
}
export default function Pagination({
  page,
  count,
  onChange,
  label,
  lang = "ko",
  disabled = false,
}) {
  if (count <= 1) return null;
  const start = Math.floor((page - 1) / 10) * 10 + 1;
  return (
    <nav className="pagination" aria-label={label}>
      <button
        type="button"
        disabled={disabled || page === 1}
        onClick={() => onChange(1)}
        aria-label={translate(lang, "Pagination.firstPage")}
      >
        <Arrow double />
      </button>
      <button
        type="button"
        disabled={disabled || page === 1}
        onClick={() => onChange(page - 1)}
        aria-label={translate(lang, "Pagination.previousPage")}
      >
        <Arrow />
      </button>
      {Array.from(
        { length: Math.min(10, count - start + 1) },
        (_, i) => start + i,
      ).map((n) => (
        <button
          type="button"
          key={n}
          disabled={disabled}
          aria-current={page === n ? "page" : undefined}
          onClick={() => onChange(n)}
        >
          {n}
        </button>
      ))}
      <button
        type="button"
        disabled={disabled || page === count}
        onClick={() => onChange(page + 1)}
        aria-label={translate(lang, "Pagination.nextPage")}
      >
        <Arrow right />
      </button>
      <button
        type="button"
        disabled={disabled || page === count}
        onClick={() => onChange(count)}
        aria-label={translate(lang, "Pagination.lastPage")}
      >
        <Arrow right double />
      </button>
    </nav>
  );
}
