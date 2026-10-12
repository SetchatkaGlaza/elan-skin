/**
 * ÉLAN SKIN — модуль «navigation».
 * Шапка: состояние при прокрутке, мобильное меню, подсветка текущего раздела, логотип.
 */

import { prefersReducedMotion } from "./ui.js";

export function initNavigation() {
  const header = document.querySelector("[data-header]");
  const nav = document.querySelector("[data-nav]");
  const burger = document.querySelector("[data-burger]");
  if (!header || !nav || !burger) return;

  /* --- Фон шапки при скролле --- */
  const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 24);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* --- Мобильное меню --- */
  const mq = window.matchMedia("(max-width: 899px)");

  const setMenu = (open, { restoreFocus = false } = {}) => {
    nav.classList.toggle("is-open", open);
    header.classList.toggle("is-menu-open", open);
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Закрыть меню" : "Открыть меню");
    // Прокрутка страницы блокируется только пока меню открыто
    document.documentElement.classList.toggle("is-locked", open);
    if (!open && restoreFocus) burger.focus();
  };

  burger.addEventListener("click", () => setMenu(!nav.classList.contains("is-open")));

  // Закрываем меню при переходе по ссылке, по Esc и при переходе на десктопную ширину
  nav.addEventListener("click", (event) => {
    if (event.target.closest("a")) setMenu(false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && nav.classList.contains("is-open")) setMenu(false, { restoreFocus: true });
  });
  mq.addEventListener("change", () => setMenu(false));

  // Клик вне меню
  document.addEventListener("click", (event) => {
    if (!nav.classList.contains("is-open")) return;
    if (!event.target.closest("[data-header]")) setMenu(false);
  });

  /* --- Логотип возвращает в начало --- */
  document.querySelectorAll("[data-logo]").forEach((logo) => {
    logo.addEventListener("click", (event) => {
      event.preventDefault();
      window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" });
      history.replaceState(null, "", location.pathname + location.search);
    });
  });

  /* --- Текущий раздел в навигации --- */
  const links = [...nav.querySelectorAll('.nav__link[href^="#"]')];
  const targets = links.map((a) => document.querySelector(a.getAttribute("href"))).filter(Boolean);
  if (!("IntersectionObserver" in window) || !targets.length) return;

  const visible = new Map();
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => visible.set(entry.target.id, entry.isIntersecting ? entry.intersectionRatio : 0));
      let bestId = null;
      let best = 0;
      visible.forEach((ratio, id) => {
        if (ratio > best) {
          best = ratio;
          bestId = id;
        }
      });
      links.forEach((a) => {
        const active = bestId && a.getAttribute("href") === `#${bestId}`;
        if (active) a.setAttribute("aria-current", "true");
        else a.removeAttribute("aria-current");
      });
    },
    { rootMargin: "-35% 0px -45% 0px", threshold: [0, 0.1, 0.4, 0.8] },
  );
  targets.forEach((t) => io.observe(t));
}
