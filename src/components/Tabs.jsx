import React from "react";

export default function Tabs({ id, label, items, value, onChange, className }) {
  const choose = (next) => {
    onChange(next);
    // Theme changes can replace the page component; focus the new tab node.
    requestAnimationFrame(() =>
      document.getElementById(`${id}-tab-${next}`)?.focus(),
    );
  };
  return (
    <div
      className={className}
      role="tablist"
      aria-label={label}
      onKeyDown={(event) => {
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key))
          return;
        const tabs = [...event.currentTarget.querySelectorAll('[role="tab"]')];
        const current = tabs.indexOf(document.activeElement);
        if (current < 0) return;
        event.preventDefault();
        const next =
          event.key === "Home"
            ? 0
            : event.key === "End"
              ? tabs.length - 1
              : (current +
                  (event.key === "ArrowRight" ? 1 : -1) +
                  tabs.length) %
                tabs.length;
        tabs[next].focus();
        choose(items[next].id);
      }}
    >
      {items.map((item) => (
        <button
          type="button"
          role="tab"
          key={item.id}
          id={`${id}-tab-${item.id}`}
          aria-controls={`${id}-panel`}
          aria-selected={value === item.id}
          tabIndex={value === item.id ? 0 : -1}
          className={value === item.id ? "active selected" : ""}
          onClick={() => choose(item.id)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
