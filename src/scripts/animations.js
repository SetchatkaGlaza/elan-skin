/**
 * ÉLAN SKIN — модуль «animations».
 * Анимации: появление при скролле, мягкий параллакс, наклон изображения при наведении. Всё отключается при prefers-reduced-motion.
 */

import { prefersReducedMotion } from "./ui.js";

/* ---------- Появление элементов ---------- */

export function initReveal() {
  const items = [...document.querySelectorAll("[data-reveal]")];
  if (!items.length) return;

  // Без IntersectionObserver или при reduced motion показываем всё сразу
  if (!("IntersectionObserver" in window) || prefersReducedMotion()) {
    items.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        io.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
  );
  items.forEach((el) => io.observe(el));

  // Страховка: если что-то осталось скрытым (например, быстрый переход по якорю), показываем через 4 с после загрузки
  window.addEventListener("load", () => {
    setTimeout(() => items.forEach((el) => el.classList.add("is-visible")), 4000);
  });
}

/* ---------- Параллакс ---------- */

export function initParallax() {
  if (prefersReducedMotion()) return;
  const nodes = [...document.querySelectorAll("[data-parallax]")];
  if (!nodes.length) return;

  const state = new Map(); // el -> видим ли
  let ticking = false;

  const update = () => {
    ticking = false;
    const vh = window.innerHeight;
    state.forEach((visible, el) => {
      if (!visible) return;
      const rect = el.parentElement.getBoundingClientRect();
      const factor = parseFloat(el.dataset.parallax) || 0.06;
      // смещение относительно центра окна, ограничено, чтобы не вылезать за кадр масштабирования
      const offset = (rect.top + rect.height / 2 - vh / 2) * factor * -1;
      const limit = Math.min(48, rect.height * 0.03); // меньше запаса масштабирования (scale ≥ 1.08), чтобы не открывался фон
      const py = Math.max(-limit, Math.min(limit, offset));
      el.style.setProperty("--py", `${py.toFixed(1)}px`);
    });
  };

  const request = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  };

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => state.set(e.target, e.isIntersecting));
      request();
    },
    { rootMargin: "20% 0px 20% 0px" },
  );
  nodes.forEach((el) => {
    state.set(el, false);
    io.observe(el);
  });

  window.addEventListener("scroll", request, { passive: true });
  window.addEventListener("resize", request);
}

/* ---------- Наклон при наведении (только мышь/тачпад) ---------- */

export function initTilt() {
  if (prefersReducedMotion()) return;
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

  document.querySelectorAll("[data-tilt]").forEach((el) => {
    let raf = 0;
    const MAX = 2.2; // градусы

    el.style.transition = "transform 700ms cubic-bezier(0.16, 1, 0.3, 1)";
    el.style.transformStyle = "preserve-3d";

    el.addEventListener("pointermove", (event) => {
      const r = el.getBoundingClientRect();
      const x = (event.clientX - r.left) / r.width - 0.5;
      const y = (event.clientY - r.top) / r.height - 0.5;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.transform = `perspective(1100px) rotateY(${(x * MAX).toFixed(2)}deg) rotateX(${(-y * MAX).toFixed(2)}deg)`;
      });
    });
    el.addEventListener("pointerleave", () => {
      cancelAnimationFrame(raf);
      el.style.transform = "";
    });
  });
}
