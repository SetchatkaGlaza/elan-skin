/**
 * ÉLAN SKIN — модуль «ui».
 * Общие помощники интерфейса: уведомления, форматирование цен, диалоги, блокировка прокрутки, форма подписки.
 */

const rubFormatter = new Intl.NumberFormat("ru-RU");

/** 2490 -> «2 490 ₽» (с неразрывными пробелами) */
export function formatPrice(value) {
  return `${rubFormatter.format(value).replace(/\s/g, " ")} ₽`;
}

export const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- Блокировка прокрутки (счётчик, чтобы страница не «залипала») ---------- */

let lockCount = 0;
export function lockScroll() {
  lockCount += 1;
  document.documentElement.classList.add("is-locked");
}
export function unlockScroll() {
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) document.documentElement.classList.remove("is-locked");
}

/* ---------- Toast ---------- */

let toastEl;
let toastTimer;
let toastHideTimer;

export function toast(message, { duration = 4200 } = {}) {
  toastEl ??= document.querySelector("[data-toast]");
  if (!toastEl) return;

  clearTimeout(toastTimer);
  clearTimeout(toastHideTimer);

  const canPopover = typeof toastEl.showPopover === "function";
  if (canPopover) {
    toastEl.setAttribute("popover", "manual");
    // Перепоказываем, чтобы уведомление оказалось над только что открытым dialog
    try {
      if (toastEl.matches(":popover-open")) toastEl.hidePopover();
      toastEl.showPopover();
    } catch {
      /* popover недоступен — остаёмся на обычном позиционировании */
    }
  }

  toastEl.textContent = message;
  // перезапуск transition
  toastEl.classList.remove("is-visible");
  void toastEl.offsetWidth;
  toastEl.classList.add("is-visible");

  toastTimer = setTimeout(() => {
    toastEl.classList.remove("is-visible");
    toastHideTimer = setTimeout(() => {
      try {
        if (canPopover && toastEl.matches(":popover-open")) toastEl.hidePopover();
      } catch {
        /* ignore */
      }
    }, 500);
  }, duration);
}

/* ---------- Модальные dialog ---------- */

export function initDialogs() {
  document.querySelectorAll("[data-dialog-open]").forEach((trigger) => {
    trigger.addEventListener("click", () => {
      const dialog = document.getElementById(`dialog-${trigger.dataset.dialogOpen}`);
      if (dialog) openDialog(dialog);
    });
  });

  document.querySelectorAll("dialog.dialog").forEach((dialog) => {
    dialog.querySelectorAll("[data-dialog-close]").forEach((btn) => btn.addEventListener("click", () => dialog.close()));
    wireDialogLifecycle(dialog);
  });
}

export function openDialog(dialog) {
  if (dialog.open) return;
  if (typeof dialog.showModal === "function") {
    dialog.showModal();
  } else {
    dialog.setAttribute("open", "");
  }
  lockScroll();
}

/** Закрытие по клику на подложку; блокировка прокрутки снимается на любое закрытие (Esc, кнопка, подложка) */
export function wireDialogLifecycle(dialog) {
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener("close", unlockScroll);
}

/* ---------- Подписка ---------- */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function initSubscribe() {
  const form = document.querySelector("[data-subscribe]");
  if (!form) return;
  const input = form.querySelector("input[type=email]");
  const error = form.querySelector("[data-subscribe-error]");

  const setError = (message) => {
    error.textContent = message;
    input.setAttribute("aria-invalid", message ? "true" : "false");
  };

  input.addEventListener("input", () => {
    if (input.getAttribute("aria-invalid") === "true") setError("");
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const value = input.value.trim();
    if (!value) {
      setError("Введите адрес электронной почты.");
      input.focus();
      return;
    }
    if (!EMAIL_RE.test(value)) {
      setError("Проверьте адрес: он должен выглядеть как name@example.com.");
      input.focus();
      return;
    }
    setError("");
    form.reset();
    toast("Демо-режим: адрес не сохранён и никуда не отправлен.");
  });
}
