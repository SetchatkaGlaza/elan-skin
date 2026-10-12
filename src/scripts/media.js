/**
 * ÉLAN SKIN — модуль «media».
 * Видео секции «Текстура»: переключение роликов, пауза, автозапуск только в зоне видимости.
 */

import { prefersReducedMotion } from "./ui.js";

export function initTextureVideo() {
  const stage = document.querySelector("[data-video-stage]");
  if (!stage) return;

  const videos = [...stage.querySelectorAll("[data-video]")];
  const buttons = [...document.querySelectorAll("[data-video-target]")];
  const toggle = stage.querySelector("[data-video-toggle]");
  if (!videos.length) return;

  const reduced = prefersReducedMotion();
  let userPaused = reduced; // при reduced motion ролик не стартует сам
  let inView = false;

  const active = () => videos.find((v) => v.classList.contains("is-active")) ?? videos[0];

  const setPausedUI = (paused) => {
    toggle?.classList.toggle("is-paused", paused);
    toggle?.setAttribute("aria-label", paused ? "Воспроизвести видео" : "Поставить видео на паузу");
  };

  const play = (video) => {
    const p = video.play();
    if (p && typeof p.catch === "function") {
      p.catch(() => {
        // автозапуск запрещён (экономия трафика и т. п.): показываем постер и состояние «пауза»
        setPausedUI(true);
        userPaused = true;
      });
    }
  };

  const sync = () => {
    const v = active();
    videos.forEach((other) => other !== v && other.pause());
    if (inView && !userPaused) {
      play(v);
      setPausedUI(false);
    } else {
      v.pause();
      setPausedUI(true);
    }
  };

  const select = (name) => {
    videos.forEach((v) => v.classList.toggle("is-active", v.dataset.video === name));
    buttons.forEach((b) => {
      const on = b.dataset.videoTarget === name;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    const v = active();
    if (v.preload === "none") v.preload = "auto";
    v.currentTime = 0;
    sync();
  };

  buttons.forEach((b) => b.addEventListener("click", () => select(b.dataset.videoTarget)));

  toggle?.addEventListener("click", () => {
    userPaused = !userPaused;
    const v = active();
    if (userPaused) v.pause();
    else {
      if (v.preload === "none") v.preload = "auto";
      play(v);
    }
    setPausedUI(userPaused);
  });

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        sync();
      },
      { threshold: 0.25 },
    ).observe(stage);
  } else {
    inView = true;
    sync();
  }

  // Вкладка скрыта — ставим на паузу
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) active().pause();
    else sync();
  });

  setPausedUI(userPaused);
}
