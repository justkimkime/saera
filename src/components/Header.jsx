import {
  languageConfig,
  languagePolicy,
  supportedLanguages,
} from "../language-config.js";
import { translate } from "../localization.js";
import React, { useEffect, useRef, useState } from "react";
import logo from "../../logo.svg";
import { themes } from "../tourism.js";
import { themePaths } from "../routing/routes.js";
import { isPlainLinkClick } from "../link-navigation.js";

// CSS 작업용: false로 바꾸면 일반 드롭다운 동작으로 돌아갑니다.
const PREVIEW_DROPDOWNS = false;

export default function Header({
  lang,
  theme,
  path,
  onNavigate,
  onTheme,
  onLanguage,
}) {
  const [open, setOpen] = useState(null);
  const ref = useRef(null);
  const mobileDialog = useRef(null);
  const mobileTrigger = useRef(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileLanguageOpen, setMobileLanguageOpen] = useState(false);
  const closeMobile = () => mobileDialog.current?.close();
  useEffect(() => {
    const query = window.matchMedia("(max-width: 560px)");
    const resized = () => { if (!query.matches) mobileDialog.current?.close(); };
    query.addEventListener("change", resized);
    return () => query.removeEventListener("change", resized);
  }, []);
  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [mobileOpen]);
  const themeMenuOpen = PREVIEW_DROPDOWNS || open === "theme";
  const languageMenuOpen = PREVIEW_DROPDOWNS || open === "language";
  const detailService = path.startsWith("/places/") ? path.split("/")[2] : null;
  const currentTheme =
    detailService && !["ko", "en"].includes(detailService)
      ? detailService
      : theme;
  const themeActive =
    path.startsWith("/themes/") ||
    (detailService && !["ko", "en"].includes(detailService));
  const generalActive =
    (path === "/" || path === "/explore") && theme === "general";
  useEffect(() => {
    const outside = (event) => {
      if (!ref.current?.contains(event.target)) setOpen(null);
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, []);
  const go = (event, action) => {
    if (isPlainLinkClick(event)) {
      event.preventDefault();
      setOpen(null);
      closeMobile();
      action();
    }
  };
  const blur = (event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) setOpen(null);
  };
  const moveFocus = (event, selector) => {
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const items = [...event.currentTarget.querySelectorAll(selector)];
    const current = items.indexOf(document.activeElement);
    const next =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? items.length - 1
          : (current + (event.key === "ArrowUp" ? -1 : 1) + items.length) %
            items.length;
    items[next]?.focus();
  };
  const openWithKey = (event, name, selector) => {
    if (!["ArrowDown", "ArrowUp"].includes(event.key)) return;
    event.preventDefault();
    setOpen(name);
    requestAnimationFrame(() => {
      const items = [...ref.current.querySelectorAll(selector)];
      (event.key === "ArrowUp" ? items.at(-1) : items[0])?.focus();
    });
  };
  return (
    <header
      className="site-header"
      ref={ref}
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) {
          event.preventDefault();
          ref.current
            .querySelector(`[data-dropdown-trigger="${open}"]`)
            ?.focus();
          setOpen(null);
        }
      }}
    >
      <div className="header-inner">
        <a
          href="/explore"
          className="wordmark"
          aria-label={translate(lang, "Header.sAERATravelSearch")}
          onClick={(event) => go(event, () => onNavigate("/explore"))}
        >
          <img src={logo} width="52" height="43" alt="SAERA" />
        </a>
        <nav
          className="header-nav"
          aria-label={translate(lang, "Header.mainNavigation")}
        >
          <a
            href="/explore"
            className={generalActive ? "active" : ""}
            aria-current={generalActive ? "page" : undefined}
            onClick={(event) => go(event, () => onTheme("general"))}
          >
            {translate(lang, "Header.explore")}
          </a>
          <div
            className="header-dropdown theme-dropdown"
            onMouseEnter={() => setOpen("theme")}
            onMouseLeave={(event) => {
              if (!event.currentTarget.contains(document.activeElement))
                setOpen((v) => (v === "theme" ? null : v));
            }}
            onBlur={blur}
          >
            <button
              type="button"
              data-dropdown-trigger="theme"
              className={themeActive ? "active" : ""}
              aria-expanded={themeMenuOpen}
              aria-controls={themeMenuOpen ? "header-theme-menu" : undefined}
              onClick={() => setOpen((v) => (v === "theme" ? null : "theme"))}
              onKeyDown={(event) =>
                openWithKey(event, "theme", "#header-theme-menu a")
              }
            >
              {translate(lang, "Header.themes")}
            </button>
            {themeMenuOpen && (
              <div
                id="header-theme-menu"
                className="header-dropdown-panel theme-options"
                onKeyDown={(event) => moveFocus(event, "a")}
              >
                {themes
                  .filter(
                    (a) =>
                      a.id !== "general" &&
                      languagePolicy(lang).themes.includes(a.id),
                  )
                  .map((a) => (
                    <a
                      key={a.id}
                      href={themePaths[a.id]}
                      className={
                        themeActive && currentTheme === a.id ? "is-current" : ""
                      }
                      aria-current={
                        themeActive && currentTheme === a.id
                          ? "page"
                          : undefined
                      }
                      onClick={(event) => go(event, () => onTheme(a.id))}
                    >
                      <span>{a[lang]}</span>
                    </a>
                  ))}
              </div>
            )}
          </div>
          <a
            href="/about"
            className={path === "/about" ? "active" : ""}
            aria-current={path === "/about" ? "page" : undefined}
            onClick={(event) => go(event, () => onNavigate("/about"))}
          >
            {translate(lang, "Header.about")}
          </a>
        </nav>
        <div className="language header-dropdown" onBlur={blur}>
          <button
            type="button"
            data-dropdown-trigger="language"
            className="language-trigger"
            aria-label={translate(lang, "Header.language")}
            aria-expanded={languageMenuOpen}
            aria-controls={
              languageMenuOpen ? "header-language-menu" : undefined
            }
            aria-haspopup="menu"
            onClick={() =>
              setOpen((v) => (v === "language" ? null : "language"))
            }
            onKeyDown={(event) =>
              openWithKey(event, "language", "#header-language-menu button")
            }
          >
            {languagePolicy(lang).label}
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
            >
              <path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>
          {languageMenuOpen && (
            <div
              id="header-language-menu"
              className="header-dropdown-panel language-options"
              role="menu"
              aria-label={translate(lang, "Header.language")}
              onKeyDown={(event) => moveFocus(event, "button")}
            >
              {supportedLanguages
                .map((id) => [id, languageConfig[id].label])
                .map(([id, label]) => (
                  <button
                    type="button"
                    role="menuitemradio"
                    aria-checked={lang === id}
                    key={id}
                    onClick={() => {
                      ref.current
                        .querySelector('[data-dropdown-trigger="language"]')
                        ?.focus();
                      setOpen(null);
                      onLanguage(id);
                    }}
                  >
                    <span>{label}</span>
                  </button>
                ))}
            </div>
          )}
        </div>
        <button type="button" className="mobile-menu-trigger" ref={mobileTrigger}
          aria-label={translate(lang, "Header.openMenu")} aria-haspopup="dialog" aria-expanded={mobileOpen} aria-controls="mobile-navigation"
          onClick={() => { setOpen(null); mobileDialog.current.showModal(); setMobileOpen(true); }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" /></svg>
        </button>
      </div>
      <dialog id="mobile-navigation" className="mobile-menu" ref={mobileDialog} aria-label={translate(lang, "Header.mainNavigation")}
        onClose={() => { setMobileOpen(false); setMobileLanguageOpen(false); mobileTrigger.current?.focus(); }}>
        <div className="mobile-menu-top"><button type="button" className="mobile-menu-close" aria-label={translate(lang, "Header.closeMenu")} onClick={closeMobile}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" /></svg>
        </button></div>
        <nav className="mobile-navigation" aria-label={translate(lang, "Header.mainNavigation")}>
          <a href="/explore" aria-current={generalActive ? "page" : undefined} onClick={event => go(event, () => onTheme("general"))}>{translate(lang, "Header.explore")}</a>
          <div className="mobile-theme-heading">{translate(lang, "Header.themes")}</div>
          <div className="mobile-theme-links">{themes.filter(item => item.id !== "general" && languagePolicy(lang).themes.includes(item.id)).map(item =>
            <a key={item.id} href={themePaths[item.id]} aria-current={themeActive && currentTheme === item.id ? "page" : undefined} onClick={event => go(event, () => onTheme(item.id))}>{item[lang]}</a>
          )}</div>
          <a href="/about" aria-current={path === "/about" ? "page" : undefined} onClick={event => go(event, () => onNavigate("/about"))}>{translate(lang, "Header.about")}</a>
        </nav>
        <div className="mobile-language">
          <button type="button" className="mobile-language-trigger" aria-expanded={mobileLanguageOpen} aria-controls="mobile-language-options" onClick={() => setMobileLanguageOpen(value => !value)}>{translate(lang, "Header.language")} · {languagePolicy(lang).label}<span aria-hidden="true">{mobileLanguageOpen ? "⌄" : "⌃"}</span></button>
          {mobileLanguageOpen && <div id="mobile-language-options" className="mobile-language-options">{supportedLanguages.map(id =>
            <button type="button" key={id} aria-pressed={lang === id} onClick={() => { closeMobile(); onLanguage(id); }}>{languageConfig[id].label}</button>
          )}</div>}
        </div>
      </dialog>
    </header>
  );
}
